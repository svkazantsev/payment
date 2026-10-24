# Пакет правил Cursor для онлайн-оплаты

- `.cursor/rules/` — правила для Cursor, заполненные под ЮKassa и Т-Банк (Next.js + TypeScript).
- `docs/payments/SPEC.md` — техзадание, критерии приёмки, стартовый промпт.
- `lib/payments/signatures.ts` — проверенная функция подписи Т-Банка.
- `.env.example` — имена переменных окружения.
- `skills/payment-form-cursor/` — исходный навык с шаблонами для других провайдеров (Stripe, CloudPayments, Przelewy24, PayU).

Перед запуском в бой сверить адреса и поля с официальной документацией провайдеров.
