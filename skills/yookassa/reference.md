# ЮKassa — справочник

Переносимые паттерны для Next.js + ЮKassa. Примеры путей (`/oplata`, `/admin/oplata`, `src/lib/billing/*`) — ориентир; в своём проекте назови как удобно.

## Модель данных (минимум)

| Сущность | Роль |
|----------|------|
| `Order` | `amountKop` (int), `provider` (`mock`\|`yookassa`), `status` `pending`→`paid`, `providerId` |
| `Payment` | Фискальный след после оплаты (опционально) |
| `PaymentConfig` | Эквайер + shopId + `secretKeyEnc` + флаг чека; id обычно `default` |
| `WebhookEvent` | Уникальный id события → повтор не fulfill'ит снова |

Владелец заказа проверяется **до** `createPayment`.

## Сверка уведомления / settle

Псевдологика `decideYookassaNotice` (после GET API, не из тела webhook):

1. `status === "succeeded"`
2. `metadata.orderId` совпадает с заказом
3. `currency === "RUB"`
4. `amount.value` совпадает с `order.amountKop` через разбор `"рубли.копейки"` → int (не float)

Иначе — не менять заказ, ответить 200 (webhook) / оставить pending (return).

```ts
function yookassaAmountMatches(amountKop: number, apiValue: string | undefined): boolean {
  if (!Number.isInteger(amountKop) || amountKop < 0 || !apiValue) return false;
  const m = /^(\d+)\.(\d{2})$/.exec(apiValue);
  if (!m) return false;
  const rub = Number(m[1]);
  const kop = Number(m[2]);
  return rub * 100 + kop === amountKop;
}
```

## IP allowlist

Актуальный список сетей — только в [доке ЮKassa webhooks](https://yookassa.ru/developers/using-api/webhooks). В коде держать константу рядом с проверкой (`YOOKASSA_NOTIFICATION_NETS`); при расхождении с докой — обновить код.

Ориентир (сверить с докой перед продом; не считать skill единственным источником):

```
185.71.76.0/27
185.71.77.0/27
77.75.153.0/25
77.75.156.11/32
77.75.156.35/32
77.75.154.128/25
2a02:5180::/32
```

`clientIp` обязан учитывать `TRUSTED_PROXY_HOPS`: без hops клиентский XFF не доверять.

```ts
function allowYookassaWebhook(ip: string | null, production: boolean): boolean {
  if (ip && isYookassaNotificationIp(ip)) return true;
  if (!production && (ip == null || ip === "127.0.0.1" || ip === "::1")) return true;
  return false;
}
```

## Return origin

`return_url` строить от реального origin покупателя, если он совпадает с доверенным хостом; иначе `SITE_URL`. Иначе на LAN (`192.168.x`) при `SITE_URL=localhost` cookie сессии не приедет после редиректа с ЮKassa.

## Проверенные уроки (live)

- Матрица тестовых карт **6/6** по официальной странице (номера в репо не класть) — см. [testing.md](testing.md).
- **Return-URL settle** закрывает заказ без webhook на localhost.
- **E2E prepare**: переключить провайдер на `mock`, ключи в БД сохранить.
- **Idempotence-Key = orderId** — повтор create безопасен.
- Production webhook без allowlist / без hops ломается (403 или пустой IP).
- `PaymentConfig` с шифрованием секрета; в UI — password field + hint/mask.
- Приложение **никогда** не видит PAN покупателя (редирект на хост ЮKassa).
- Полное логирование тела webhook — риск утечки email/PII.

## Карта модулей (ориентир при портировании)

```
billing/
  providers.ts       createPayment, fetchYookassaPayment, mock
  settle.ts          return-path GET + fulfill
  fulfill.ts         markOrderPaid, rememberWebhook
  paymentSettings.ts resolve DB vs env, amount match, decide notice
  paymentConfig.ts   load/decrypt PaymentConfig
  yookassaIp.ts      CIDR allowlist + allowYookassaWebhook
  returnOrigin.ts    безопасный base для return_url
api/payments/yookassa/route.ts   POST webhook
checkout/*                       checkout + return page
admin/payments/*                 PaymentConfig UI
```

## Env (server-only)

```
PAYMENT_PROVIDER=mock|yookassa
YOOKASSA_SHOP_ID=YOUR_SHOP_ID
YOOKASSA_SECRET_KEY=YOUR_SECRET_KEY
YOOKASSA_SEND_RECEIPT=0|1
SITE_URL=https://example.com
TRUSTED_PROXY_HOPS=1
```

Не коммитить реальные значения. Не дублировать в `NEXT_PUBLIC_*`.
