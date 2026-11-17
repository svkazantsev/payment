# Stripe

Документация: https://docs.stripe.com/payments/accept-a-payment · вебхуки: https://docs.stripe.com/webhooks · идемпотентность: https://docs.stripe.com/api/idempotent_requests · тесты: https://docs.stripe.com/testing

## Создание платежа (сервер)
- Рекомендуемый путь в текущей документации — Checkout Sessions + Payment Element (`checkout.createPaymentElement`); классический путь — PaymentIntent + Payment Element. Выбери один и зафиксируй в правиле.
- Сумма — `amount` в минорных единицах, `currency` в нижнем регистре; `automatic_payment_methods` / способы оплаты включаются в Dashboard.
- Клиенту отдаётся только `client_secret`. Секретный ключ `sk_...` — только сервер; клиент — `pk_...`.
- Заголовок `Idempotency-Key` на все POST (UUID v4 или от id корзины). Ключ хранится ≥24 ч; ретраить только в пределах 24 ч с теми же параметрами, иначе сверяться через GET/вебхуки.

## Фронтенд
- `@stripe/stripe-js` + `@stripe/react-stripe-js`; Payment Element — iframe Stripe. Не вкладывать в свой iframe; если иначе нельзя — `allow="payment *"`.
- Подтверждение: `stripe.confirmPayment({ elements, confirmParams: { return_url } })`; 3DS и редиректные методы обрабатывает Stripe.
- Только HTTPS для live; Apple Pay требует верификации домена.

## Вебхук
- Заголовок `Stripe-Signature` (`t=`, `v1=`), секрет `whsec_...` (свой для каждого endpoint и для test/live).
- Проверять на raw body: `stripe.webhooks.constructEvent(rawBody, sig, secret)`; в Next.js App Router — `await req.text()`, не `req.json()`.
- Допуск по времени по умолчанию 5 мин, не ставить 0. Ответ 2xx быстро, обработка асинхронно; события дублируются и приходят не по порядку — дедуп по `event.id`.
- Ключевые события: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed` (для Checkout Sessions), `charge.refunded`.
- Локально: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Тестовые карты
`4242424242424242` успех · `4000000000003220` 3DS · `4000000000000002` отказ · `4000000000009995` недостаточно средств (любая будущая дата, любой CVC).
