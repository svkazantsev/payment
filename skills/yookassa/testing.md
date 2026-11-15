# Тесты карт и 3-DS (ЮKassa)

Номера карт **не копировать** в skill, код, README, фикстуры, скриншоты в git. Брать только со страницы:

https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data

## Правила тестового магазина

| Правило | Деталь |
|---------|--------|
| Магазин | Только **тестовый** shopId / secret из кабинета ЮKassa |
| Срок | Любая **будущая** дата |
| CVC | Любой |
| Код 3-DS | Любой (когда страница 3-DS показана) |
| Настоящая карта | В тест-магазин **не проходит** |
| Ответ API | У тестового платежа `test: true` |
| Выдача | Товар/доступ можно открыть в тестовом контуре; не путать с боевым |

## Матрица сценариев (проверено 6/6)

| # | Сценарий | Ожидание в приложении |
|---|----------|------------------------|
| 1 | Успех **без** 3-D Secure | `succeeded` → settle/webhook → заказ `paid` |
| 2 | Успех **с** 3-D Secure | После 3-DS → `succeeded` → `paid` |
| 3 | Отказ `3d_secure_failed` | Заказ остаётся `pending`; доступ не открывать |
| 4 | Отказ `insufficient_funds` | `pending`; доступ не открывать |
| 5 | Отказ `general_decline` | `pending`; доступ не открывать |
| 6 | Настоящая карта в тест-магазине | Отклонение на стороне ЮKassa |

Дополнительно проверить:

- [ ] Повтор «Оплатить» после отказа переиспользует тот же pending Order / Idempotence-Key (или создаёт новый — по вашей политике; главное — без двойного fulfill).
- [ ] На localhost без webhook: после успеха return URL вызывает settle и закрывает заказ.
- [ ] В production чужой IP на webhook → 403.

## Юнит-тесты (без живого API)

Минимум:

1. `PaymentConfig` отсутствует → берутся env.
2. `PaymentConfig` есть → env перекрыт.
3. `yookassaAmountMatches(14900, "149.00")` → true; `"149.01"` → false; float-пути нет.
4. `allowYookassaWebhook` в production: IP из списка → true; чужой → false.
5. `allowYookassaWebhook` не в production: `null` / loopback → true.
6. `decideYookassaNotice`: чужой `orderId` / не RUB / не succeeded → ignore.

## E2E / prepare

Перед UI-тестами без кассы:

- выставить `PaymentConfig.provider = mock`;
- **не** стирать `secretKeyEnc` / shopId;
- после тестов вернуть `yookassa`, если нужен живой прогон.

## Что не класть в репозиторий

- PAN / CVC / срок (даже тестовые).
- Реальные `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY`.
- Скриншоты кабинета с ключами.
- Логи webhook с email покупателя.
- Боевые `return_url` / домены чужого прод-проекта в публичных примерах — использовать `https://example.com`.
