# payment

Публичный **Cursor Agent Skill** для подключения онлайн-оплаты через **ЮKassa** (YooKassa). Репозиторий без прикладного кода приложения: источник истины для агентов — skill + чеклисты.

Для vibe-coding: клонируй/подключи skill и собирай checkout, webhook и settle по правилам ниже. **Секретов, shopId и PAN в репозитории нет** — только плейсхолдеры (`YOUR_SHOP_ID`, `https://example.com`).

## Skill

| Путь | Назначение |
|------|------------|
| [`skills/yookassa/SKILL.md`](skills/yookassa/SKILL.md) | Когда применять, поток, webhook, settle, ловушки |
| [`skills/yookassa/reference.md`](skills/yookassa/reference.md) | Модель данных, сверка суммы, IP, env, карта модулей |
| [`skills/yookassa/checklists.md`](skills/yookassa/checklists.md) | Приёмка, merge, prod/nginx, живой тест |
| [`skills/yookassa/testing.md`](skills/yookassa/testing.md) | Матрица тестовых карт / 3-DS (без PAN) |

Локальная копия для агентов на машине: `~/.cursor/skills/yookassa/` (тот же контент).

### Как пользоваться

В чате Cursor явно подключи skill **yookassa** (или работай в контексте оплаты — description триггерит по YooKassa / oplata / webhook / PaymentConfig). Агент должен:

1. Читать `SKILL.md`, при деталях — `reference.md` / `checklists.md` / `testing.md`.
2. Не собирать карту на сайте (только redirect).
3. Считать деньги в копейках; статус брать из GET API, не из тела webhook.
4. Не коммитить секреты и не вставлять тестовые PAN в код.

Официальные тестовые карты: [YooKassa testing](https://yookassa.ru/developers/payment-acceptance/testing-and-going-live/testing#test-bank-card-data).

## Кратко

- Одностадийный редирект, `Idempotence-Key = orderId`.
- Webhook: HTTPS 443/8443, IP allowlist, идемпотентность `WebhookEvent`, событие `payment.succeeded`.
- Localhost: settle по return URL без webhook.
- `PaymentConfig` (шифротекст) перекрывает env; пустой ключ в форме не затирает секрет.
- Prod: `SITE_URL=https://example.com`, `TRUSTED_PROXY_HOPS` за nginx.
- Live: матрица карт 6/6 + return-URL settle на localhost.

Релизные заметки: [`RELEASE.md`](RELEASE.md).
