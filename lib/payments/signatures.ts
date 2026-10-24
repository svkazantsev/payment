// Подписи платёжных провайдеров (Node.js, node:crypto). Сравнение — только через timingSafeEqual.
// tbankToken проверен на примерах из https://developer.tbank.ru/eacq/intro/developer/token
import { createHash, timingSafeEqual } from "node:crypto";

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

// --- ЮKassa: подписи нет ---
// 1) IP из allowlist; 2) GET /v3/payments/{object.id} и доверять статусу из ответа API.
