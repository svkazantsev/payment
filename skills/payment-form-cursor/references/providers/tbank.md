# Т-Банк (интернет-эквайринг)

Документация: Init https://developer.tbank.ru/eacq/api/init · подпись https://developer.tbank.ru/eacq/intro/developer/token · уведомления https://developer.tbank.ru/eacq/intro/developer/notification · Integration.js https://developer.tbank.ru/eacq/intro/developer/setup_js/

## Создание платежа (сервер)
- `POST https://securepay.tinkoff.ru/v2/Init`: `TerminalKey`, `Amount` (копейки, integer), `OrderId`, `Description`, `NotificationURL`, `SuccessURL`, `FailURL`, при 54-ФЗ — `Receipt`, доп. поля — `DATA`. Операции только в рублях.
- Подпись `Token`: пары ключ:значение только корневых полей (без вложенных `Receipt`, `DATA`) + `Password` → сортировка по ключу → конкатенация значений без ключей → SHA-256 (UTF-8, hex). Эталон — `assets/snippets/signatures.ts#tbankToken`. Проверка: в ЛК, Операции → заказ → `inittokenisvalid`.
- Ответ содержит `PaymentId` и `PaymentURL`.
- Статус по запросу: `GetState`; двухстадийная — `Confirm`; отмена/возврат — `Cancel`.

## Фронтенд
- Скрипт только по URL, не в бандл: `<script src="https://integrationjs.t-static.ru/integration.js" onload="onPaymentIntegrationLoad()" async></script>` перед `</body>`.
- `PaymentIntegration.init({ terminalKey, product: 'eacq', features: { payment: {}, iframe: {} } })` — включать только нужные модули.
- Требования: HTTPS; нет заголовка `Cross-Origin-Opener-Policy`; CSP разрешает `https://*.tinkoff.ru https://*.tcsbank.ru https://*.tbank.ru https://*.nspk.ru https://*.t-static.ru` в `script-src`, `img-src`, `connect-src`, `style-src` (+ `'unsafe-inline'` в style-src). Для формы в iframe НЕ ограничивать `frame-src` — ломает 3DS.
- Альтернатива без виджета: редирект на `PaymentURL`.

## Уведомления
- POST на `NotificationURL`. Проверка `Token`: все поля кроме `Token` и вложенных `Data`/`Receipt` + `Password` → тот же алгоритм → сравнить. Булевы значения входят строкой `true`/`false`.
- Ответ: HTTP 200 с телом `OK` (заглавными, без тегов). Иначе повтор раз в час 24 ч, затем раз в сутки месяц.
- При одностадийной оплате приходят `AUTHORIZED`, затем `CONFIRMED` — финальный успех = `CONFIRMED`. Прочие статусы (`REJECTED`, `CANCELED`, `REFUNDED` и др.) сверить со справочником статусов в документации.
- Сверять `Amount` и `OrderId` с заказом.
