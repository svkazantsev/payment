---
name: yookassa
description: >-
  YooKassa (ЮKassa) online payments for Next.js apps: redirect one-stage checkout,
  kopecks-only amounts, PaymentConfig vs env, webhooks with IP allowlist, return-URL
  settle without webhook on localhost, Idempotence-Key=orderId, encrypted secrets,
  test-card matrix and 3DS flows. Use when working on payment, YooKassa, ЮKassa,
  oplata, webhooks, checkout, billing, PaymentConfig, or test cards.
---

# ЮKassa — приём оплаты

Публичный skill для vibe-coding: подключить ЮKassa к Next.js (App Router) без сбора карты на своём сайте.

Официальные доки: [формат API](https://yookassa.ru/developers/using-api/interaction-format) · [create_payment](https://yookassa.ru/developers/api#create_payment) · [webhooks](https://yookassa.ru/developers/using-api/webhooks) · [тестовые карты](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data).

Подробности: [reference.md](reference.md) · [checklists.md](checklists.md) · [testing.md](testing.md).

## Незыблемые правила

1. **Только редирект**, одностадийный (`capture: true`). Карту на своём сайте не собирать. Нет полей PAN/CVC/срока, нет встроенного виджета без крайней нужды.
2. **Суммы — целые копейки** (`amountKop`). Float запрещён. В API ЮKassa строка `"199.00"` — только через `kopecksToYookassa` в адаптере провайдера.
3. **Не доверять телу вебхука.** Из уведомления брать только `object.id` (и `event`). Статус, сумму, `orderId` — только из `GET /v3/payments/{id}` своим ключом магазина.
4. **Секреты** — шифротекст в БД (`secretKeyEnc`) или server env. Никогда `NEXT_PUBLIC_*`, никогда в HTML/логах/git/ревизиях (в журнале — `[masked]`).
5. **Нет PAN в приложении и репозитории.** Тестовые номера — только со [страницы ЮKassa](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data); в skill/код/README не копировать.
6. **Не логировать тело webhook целиком** — там может быть email/PII покупателя.

## Поток (happy path)

```
Клиент (без суммы в форме)
  → сервер считает amountKop из товара/тарифа
  → Order(pending) создать или переиспользовать (user + product + amount + provider)
  → createPayment: Idempotence-Key = orderId
  → клиенту только confirmation_url → редирект на ЮKassa
  → финал: webhook (prod) ИЛИ return-URL settle (local/dev)
  → GET payment → сверка orderId + RUB + сумма → mark paid / fulfill
```

- `return_url` **сам по себе статус не меняет** — на странице возврата сервер сам дергает GET и settle.
- Повтор «Оплатить» по тому же товару/сумме → тот же pending-заказ и тот же Idempotence-Key.

## Адаптер провайдера

Один модуль (`providers`): `createPayment` + `fetchYookassaPayment`. Страницы/компоненты API ЮKassa не вызывают.

| Поле | Значение |
|------|----------|
| Endpoint | `POST https://api.yookassa.ru/v3/payments` |
| Auth | Basic `shopId:secretKey` (плейсхолдеры: `YOUR_SHOP_ID` / env) |
| Idempotence-Key | `orderId` (< 64 символов) |
| amount | `{ value: kopecksToYookassa(kop), currency: "RUB" }` |
| confirmation | `{ type: "redirect", return_url }` |
| metadata | `{ orderId }` |
| receipt | только если флаг 54-ФЗ включён |

Провайдеры: `mock` | `yookassa`. Сохранённая ЮKassa **без** shopId/ключа **не** откатывается на mock — create падает с ошибкой.

### `kopecksToYookassa`

```ts
function kopecksToYookassa(amountKop: number): string {
  if (!Number.isInteger(amountKop) || amountKop < 0) throw new Error("bad amount");
  const rub = Math.floor(amountKop / 100);
  const kop = amountKop % 100;
  return `${rub}.${String(kop).padStart(2, "0")}`;
}
```

## Настройки: PaymentConfig vs env

1. Пока строки `PaymentConfig` нет → `PAYMENT_PROVIDER`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_SEND_RECEIPT`.
2. Первое сохранение в админке оплаты создаёт строку и **перекрывает** env.
3. Пустое поле ключа при сохранении **не стирает** уже сохранённый секрет.
4. Если в БД ключа ещё нет, а он в env — первое сохранение забирает его в шифротекст.

## Webhook

- URL кабинета: `{SITE_URL}/api/payments/yookassa`, событие **`payment.succeeded`**.
- HTTPS, порт **443 или 8443**.
- Подписи у ЮKassa нет → **IP allowlist** (сети из [доки webhooks](https://yookassa.ru/developers/using-api/webhooks)); образец логики — `yookassaIp.ts` в reference.
- Production: чужой IP → **403**, заказ не трогать.
- Local: пустой IP / loopback допустимы (туннель); подлинность даёт повторный GET.
- Идемпотентность: `WebhookEvent.id` = `{event}:{paymentId}`; повтор не выдаёт товар/доступ второй раз.
- **200** если разобрано; **503** если API ЮKassa недоступен (чтобы ЮKassa повторила доставку).

## Return-URL settle (local / без webhook)

На localhost webhook часто недоступен. Страница возврата:

1. Берёт `order` из query (не доверять `paid=1` в query).
2. `settleYookassaOrder` → GET payment → та же сверка, что у webhook.
3. Неоплаченный заказ остаётся `pending`.

Проверено на живом тестовом магазине: return-URL settle без webhook на localhost работает.

## Prod / nginx

- `SITE_URL=https://example.com` (не http за TLS-прокси — иначе cookies/HSTS/return_url ломаются).
- `TRUSTED_PROXY_HOPS=1` за одним nginx/балансировщиком — иначе `X-Forwarded-For` не доверяется и IP webhook пустой → 403 в production.
- `return_url` строить от origin покупателя, если хост доверенный (localhost / LAN в dev); иначе `SITE_URL` — иначе cookie сессии не приедет после редиректа с ЮKassa.

## Тесты (кратко)

- Юнит: resolve settings, amount match, IP allowlist, чужой IP в prod.
- Живой тестовый магазин: матрица сценариев в [testing.md](testing.md) — success ± 3-DS, `3d_secure_failed`, `insufficient_funds`, `general_decline`. Срок — любая будущая дата; CVC и 3-DS код — любые. Настоящая карта в тест-магазин не проходит. В ответе `test: true`.
- E2E/prepare: перед UI-тестами можно выставить `PaymentConfig.provider=mock` **не стирая** сохранённые ключи.

## Типичные ловушки

| Симптом | Причина |
|---------|---------|
| Webhook 403 в prod | Нет IP allowlist или `TRUSTED_PROXY_HOPS` |
| Оплата прошла, заказ pending на localhost | Нет settle на return URL |
| Cookie пропала после ЮKassa | `return_url` на другой host, чем сессия |
| Двойная выдача товара | Нет `WebhookEvent` / повтор fulfill |
| Create падает при «ЮKassa» в UI | Нет shopId/ключа, а fallback на mock запрещён |
| Сумма «плывёт» | Float вместо int копеек |

## Запрещено (кратко)

- PAN / CVC / срок в формах, логах, БД, git, skill.
- Помечать заказ paid по JSON вебхука без GET.
- Секреты в клиенте / `NEXT_PUBLIC_*` / plaintext в ревизиях.
- Float для денег; вызов ЮKassa из React-компонентов.
- Реальные shopId / secret / домены проекта в публичном skill или примерах — только плейсхолдеры.
