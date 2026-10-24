# Przelewy24

Документация: https://developers.przelewy24.pl/

## Создание платежа (сервер)
- Basic Auth: `posId` : API key (ключ отчётов) из панели. IP сервера нужно внести в панели P24.
- `POST {base}/api/v1/transaction/register`; base: sandbox `https://sandbox.przelewy24.pl`, prod `https://secure.przelewy24.pl`.
- Поля: `merchantId`, `posId`, `sessionId` (уникальный, ≤100), `amount` (гроши, int), `currency` (`PLN`), `description`, `email`, `country`, `language`, `urlReturn`, `urlStatus`, `sign`.
- `sign` = SHA-384(JSON `{"sessionId","merchantId","amount","currency","crc"}` в этом порядке, без экранирования слэшей/юникода). Ответ даёт `token` → редирект на `{base}/trnRequest/{token}`.

## Уведомление и верификация
- P24 шлёт JSON на `urlStatus` только для успешных оплат: `merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign`.
- Проверить `sign` = SHA-384(JSON полей в этом порядке + `crc`).
- ОБЯЗАТЕЛЬНО вызвать `PUT /api/v1/transaction/verify` (`merchantId, posId, sessionId, amount, currency, orderId, sign`), где `sign` = SHA-384(`{"sessionId","orderId","amount","currency","crc"}`). Без verify деньги не зачисляются. Успех: `{"data":{"status":"success"},"responseCode":0}`.
- Только после успешного verify — заказ оплачен. Без корректной верификации P24 повторяет уведомления.
- Эталоны — `assets/snippets/signatures.ts#p24*`.
