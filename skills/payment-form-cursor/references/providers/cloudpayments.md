# CloudPayments

Документация: https://developers.cloudpayments.ru/ (EN: https://developers.cloudpayments.ru/en/)

## Фронтенд (виджет)
- Скрипт только с `https://widget.cloudpayments.ru/bundles/cloudpayments.js` — не в бандл, не самохостинг.
- Новый API: `start(intentParams: CreateIntentCommand): Promise<WidgetResult>` по клику «Оплатить».
- Обязательные: `publicTerminalId`, `amount` (> 0, дробное: `2.57`), `currency`, `paymentSchema` (`Single` | `Dual`).
- Полезные: `externalId` (id заказа, бывш. `invoiceId`), `description`, `receiptEmail`, `metadata` (бывш. `data`), `receipt` (CloudKassir), `userInfo`, `successRedirectUrl`, `failRedirectUrl`, `restrictedPaymentMethods` (`Card`, `Sbp`, `TinkoffPay`, `MirPay`, `SberPay`, ...), `tokenize`, `recurrent`, `culture`, `skin`.
- Сумма тут передаётся с клиента — поэтому сервер обязан сверять сумму в уведомлении `check`/`pay` с заказом и отклонять несовпадение.

## Уведомления
- Типы: `check` (до списания, можно отклонить), `pay`, `fail`, `confirm`, `cancel`, `refund`, `recurrent`.
- Подлинность: заголовки `X-Content-HMAC` (по URL-decoded параметрам) и `Content-HMAC` (по URL-encoded) = base64(HMAC-SHA256(тело, API Secret)), UTF-8. Эталон — `assets/snippets/signatures.ts#cloudpaymentsHmac`.
- Ответ: JSON `{"code":0}` = принято; для `check` ненулевой код отклоняет платёж (коды сверить в документации).
- Для MCC 4814 обязателен телефон плательщика.
