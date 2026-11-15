# Чеклисты ЮKassa

## Приёмка

Скопируй и отмечай:

```
- [ ] 1. Без PaymentConfig и PAYMENT_PROVIDER=mock кнопка оплаты открывает доступ (заглушка).
- [ ] 2. Сохранённая ЮKassa без shopId/ключа не откатывается на mock — create падает с ошибкой.
- [ ] 3. Сумма в форме клиента не влияет на Order.amountKop (считает сервер).
- [ ] 4. Повтор «Оплатить» по тому же товару/сумме переиспользует pending Order и тот же Idempotence-Key.
- [ ] 5. Webhook с IP вне списка ЮKassa в production → 403, заказ не меняется.
- [ ] 6. Тело webhook со status=succeeded, но GET API с другой суммой/заказом → доступ не открывается.
- [ ] 7. Повтор того же события (WebhookEvent) не выдаёт товар / доступ второй раз.
- [ ] 8. Возврат на страницу return URL до webhook сам запрашивает статус; неоплаченный остаётся pending.
- [ ] 9. Секретный ключ не попадает в HTML, логи и снимок ревизии.
```

## Перед merge (код)

```
- [ ] Нет полей карты / PAN / CVC в UI и API.
- [ ] Деньги только int копейки; float нигде.
- [ ] createPayment + GET status в одном адаптере; страницы не ходят в ЮKassa напрямую.
- [ ] Webhook: IP check → id из тела → GET → сверка → WebhookEvent → fulfill.
- [ ] Return path вызывает settle (GET), не доверяет query «paid=1».
- [ ] PaymentConfig перекрывает env; пустой ключ в форме не затирает секрет.
- [ ] Нет NEXT_PUBLIC_ для shop/secret; нет секретов в git.
- [ ] Тестовые PAN не захардкожены — ссылка на доки ЮKassa.
- [ ] Тело webhook не логируется целиком (PII).
```

## Prod / nginx

```
- [ ] SITE_URL=https://example.com (совпадает с публичным origin).
- [ ] TRUSTED_PROXY_HOPS=1 (или N по числу прокси).
- [ ] Webhook URL в кабинете: https://example.com/api/payments/yookassa , порт 443 или 8443.
- [ ] Событие payment.succeeded подписано в кабинете.
- [ ] TLS на прокси; autoindex off; приложение не слушает публично без прокси без нужды.
- [ ] Боевые ключи только в PaymentConfig (шифротекст) или секретах хоста — не в репо.
- [ ] CIDR allowlist сверен с актуальной докой ЮKassa.
```

## Живой тест (тестовый магазин)

Сценарии и правила: [testing.md](testing.md).

Номера карт — только: https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data

```
- [ ] Успех без 3-D Secure
- [ ] Успех с 3-D Secure
- [ ] Отказ 3d_secure_failed
- [ ] Отказ insufficient_funds
- [ ] Отказ general_decline
- [ ] В объекте платежа test: true
- [ ] Срок — будущая дата; CVC и код 3-DS — любые
- [ ] Настоящая карта в тест-магазин отклоняется
- [ ] Return-URL settle без webhook на localhost — заказ закрывается после успеха
```

Live verification: матрица тестовых карт **6/6**; return-URL settle без webhook на localhost — OK.
