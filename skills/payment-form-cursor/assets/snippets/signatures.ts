// Эталонные реализации проверки подписей (Node.js, node:crypto).
// Копируй в проект только нужную функцию. Всегда сравнивай через timingSafeEqual.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// --- Т-Банк: Token для запросов и уведомлений ---
// Только корневые скалярные поля; вложенные объекты (Receipt, DATA, Data) и Token исключаются.
export function tbankToken(params: Record<string, unknown>, password: string): string {
  const flat: Record<string, string> = { Password: password };
  for (const [k, v] of Object.entries(params)) {
    if (k === "Token" || v === null || v === undefined || typeof v === "object") continue;
    flat[k] = String(v); // boolean -> "true"/"false"
  }
  const concatenated = Object.keys(flat).sort().map((k) => flat[k]).join("");
  return createHash("sha256").update(concatenated, "utf8").digest("hex");
}
export const verifyTbankNotification = (body: Record<string, unknown>, password: string) =>
  typeof body.Token === "string" && safeEqual(tbankToken(body, password), body.Token);
// Ответ на уведомление: HTTP 200, тело "OK".

// --- CloudPayments: HMAC уведомлений ---
// rawBody — тело запроса как пришло. Сравнивать с заголовком Content-HMAC
// (для X-Content-HMAC — по URL-decoded строке параметров).
export function cloudpaymentsHmac(rawBody: string, apiSecret: string): string {
  return createHmac("sha256", apiSecret).update(rawBody, "utf8").digest("base64");
}
// Ответ: {"code":0}

// --- Przelewy24: SHA-384 от JSON с фиксированным порядком полей ---
const sha384Json = (o: object) => createHash("sha384").update(JSON.stringify(o), "utf8").digest("hex");
export const p24RegisterSign = (p: { sessionId: string; merchantId: number; amount: number; currency: string }, crc: string) =>
  sha384Json({ sessionId: p.sessionId, merchantId: p.merchantId, amount: p.amount, currency: p.currency, crc });
export const p24NotificationSign = (n: {
  merchantId: number; posId: number; sessionId: string; amount: number; originAmount: number;
  currency: string; orderId: number; methodId: number; statement: string;
}, crc: string) =>
  sha384Json({ merchantId: n.merchantId, posId: n.posId, sessionId: n.sessionId, amount: n.amount,
    originAmount: n.originAmount, currency: n.currency, orderId: n.orderId, methodId: n.methodId,
    statement: n.statement, crc });
export const p24VerifySign = (v: { sessionId: string; orderId: number; amount: number; currency: string }, crc: string) =>
  sha384Json({ sessionId: v.sessionId, orderId: v.orderId, amount: v.amount, currency: v.currency, crc });
// JSON.stringify не экранирует "/" и юникод — совпадает с PHP JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES.

// --- PayU: OpenPayu-Signature ---
export function verifyPayuSignature(rawBody: string, header: string, secondKey: string): boolean {
  const parts = Object.fromEntries(header.split(";").map((p) => p.trim().split("=") as [string, string]));
  const algo = (parts.algorithm || "MD5").toUpperCase().replace("-", "");
  const nodeAlgo = algo === "MD5" ? "md5" : algo === "SHA256" ? "sha256" : null;
  if (!nodeAlgo || !parts.signature) return false;
  const expected = createHash(nodeAlgo).update(rawBody + secondKey, "utf8").digest("hex");
  return safeEqual(expected, parts.signature);
}

// --- Stripe: используйте SDK, а не ручную проверку ---
// const event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature")!, process.env.STRIPE_WEBHOOK_SECRET!);

// --- ЮKassa: подписи нет ---
// 1) IP из allowlist; 2) GET /v3/payments/{object.id} и доверять статусу из ответа API.
