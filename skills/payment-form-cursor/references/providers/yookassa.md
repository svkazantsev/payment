# ЮKassa

Документация: виджет https://yookassa.ru/developers/payment-acceptance/integration-scenarios/widget/basics · формат API https://yookassa.ru/developers/using-api/interaction-format · уведомления https://yookassa.ru/developers/using-api/webhooks · тесты https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing

## Создание платежа (сервер)
- `POST https://api.yookassa.ru/v3/payments`, HTTP Basic: `shopId:secretKey`.
- Заголовок `Idempotence-Key` (≤64 символов, UUID v4) для POST/DELETE; действует 24 ч; тот же ключ + те же данные → результат первого запроса.
- Тело: `amount: { value: "1990.00", currency: "RUB" }` (value — строка с двумя знаками), `capture: true` для одностадийной, `confirmation: { type: "embedded" }` для виджета, `description`, `metadata: { orderId }`, при 54-ФЗ — `receipt`.
- Клиенту отдаётся `confirmation.confirmation_token`.

## Фронтенд (виджет)
```html
<script src="https://yookassa.ru/checkout-widget/v1/checkout-widget.js"></script>
<div id="payment-form"></div>
<script>
const checkout = new window.YooMoneyCheckoutWidget({
  confirmation_token: TOKEN, return_url: RETURN_URL,
  customization: { colors: { control_primary: '#00BF96' } },
  error_callback(error) { /* ошибка инициализации */ }
});
checkout.on('complete', () => { checkout.destroy(); /* перейти к опросу статуса */ });
checkout.render('payment-form');
</script>
```
- Событие `complete` и `return_url` — не доказательство оплаты: статус проверяется на сервере.

## Уведомления
- Настройка: ЛК → Интеграция → HTTP-уведомления (Basic Auth) или объект webhook через API (OAuth).
- Тело: `{ type: "notification", event: "payment.succeeded", object: {...} }`. События: `payment.waiting_for_capture`, `payment.succeeded`, `payment.canceled`, `refund.succeeded`.
- Подписи нет. Проверка подлинности: IP отправителя из списка `185.71.76.0/27`, `185.71.77.0/27`, `77.75.153.0/25`, `77.75.156.11`, `77.75.156.35`, `77.75.154.128/25`, `2a02:5180::/32` (сверить актуальность) И повторный `GET /v3/payments/{id}` — доверять статусу из ответа API.
- Ответ: HTTP 200 (тело игнорируется). Иначе повторы в течение 24 ч.

## Тестовые данные
Тестовый магазин (свои shopId/ключ, `test: true`). Карты: `5555555555554477` (3DS), `5555555555554444`, `4111111111111111`, `2200000000000004` (Мир, 3DS); отказ по `insufficient_funds` — `5555555555554600`; `3d_secure_failed` — `5555555555554592`. Дата — любая будущая, CVC и код 3DS — любые.
