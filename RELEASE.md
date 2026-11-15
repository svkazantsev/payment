# Release notes — YooKassa skill

## v0.2.0 — публичный skill для vibe-coding (2026-11-16)

### Зачем

Собрать в одном месте проверенный опыт подключения кассы ЮKassa и прогона тестовых карт, чтобы любой мог подключить оплату через Cursor / vibe coding без копирования секретов и без привязки к чужому продукту.

### Что вошло

- **Redirect one-stage checkout** (`capture: true`, только `confirmation_url`).
- **Суммы в целых копейках** + `kopecksToYookassa`.
- **PaymentConfig vs env** (шифротекст, пустой ключ не затирает секрет).
- **Webhook**: IP allowlist, GET для сверки, `WebhookEvent`, 200/503.
- **Return-URL settle** без webhook на localhost.
- **Idempotence-Key = orderId**.
- **Prod/nginx**: `SITE_URL`, `TRUSTED_PROXY_HOPS`, безопасный `return_url` origin.
- **Матрица тестов карт / 3-DS** (без PAN) — `skills/yookassa/testing.md`.
- Чеклисты приёмки / merge / prod.

### Санитизация для публичного репо

- Убраны имена частного продукта и ссылки на закрытый исходник.
- Убраны продуктовые термины выдачи → нейтральное «товар / доступ».
- Примеры URL → `https://example.com`; ключи → `YOUR_SHOP_ID` / `YOUR_SECRET_KEY`.
- Секретов, реальных shopId, email, телефонов, orderId прод-заказов **не найдено** (и не добавлено).

### Файлы

```
skills/yookassa/SKILL.md
skills/yookassa/reference.md
skills/yookassa/checklists.md
skills/yookassa/testing.md
README.md
RELEASE.md
```

### Следующие шаги для пользователя skill

1. Создать тестовый магазин в кабинете ЮKassa.
2. Положить `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` только в server env или зашифрованный `PaymentConfig`.
3. Пройти чеклисты и матрицу из `testing.md`.
4. Перед боем: webhook URL, CIDR из актуальной доки, `TRUSTED_PROXY_HOPS`.
