# PayU (GPO Europe)

Документация: https://developers.payu.com/europe/docs/payment-flows/lifecycle/

## Создание платежа (сервер)
- OAuth client_credentials → Bearer токен; создать заказ `POST /api/v2_1/orders` с `notifyUrl`, `customerIp`, `merchantPosId`, `description`, `currencyCode`, `totalAmount` (минорные единицы, строка), `extOrderId`, `products[]`, `buyer`. Ответ — `redirectUri`. Точные URL (prod/sandbox) и обязательные поля сверить в API reference.

## Уведомления
- POST JSON. Заголовок `OpenPayu-Signature: sender=checkout;signature=...;algorithm=MD5|SHA-256;content=DOCUMENT`.
- Проверка: hash(`rawBody + second_key`) по алгоритму из заголовка, сравнить с `signature` (constant-time). Эталон — `assets/snippets/signatures.ts#payuSignature`.
- Статусы: `PENDING`, `WAITING_FOR_CONFIRMATION` (нужен capture), `COMPLETED`, `CANCELED`. После `COMPLETED` дальнейшие уведомления по заказу игнорировать.
- IP sandbox: `185.68.14.10–12`, `185.68.14.26–28`.
