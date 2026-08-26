import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// L'intégration "Storage" de Vercel (Upstash for Redis) injecte les
// identifiants sous les noms historiques KV_REST_API_URL/TOKEN plutôt que
// UPSTASH_REDIS_REST_URL/TOKEN — on accepte les deux conventions.
const restUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const restToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = restUrl && restToken ? new Redis({ url: restUrl, token: restToken }) : null;

function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
  });
}

// Si Upstash n'est pas configuré (dev local sans compte créé), le rate
// limiting est simplement désactivé plutôt que de faire planter l'app —
// à configurer avant la mise en production.
const loginLimiter = makeLimiter(10, "1 m");
const registerLimiter = makeLimiter(5, "1 h");
const publicPollLimiter = makeLimiter(60, "1 m");
const csvImportLimiter = makeLimiter(5, "1 m");

async function check(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean }> {
  if (!limiter) return { success: true };
  const result = await limiter.limit(identifier);
  return { success: result.success };
}

export function checkLoginRateLimit(identifier: string) {
  return check(loginLimiter, identifier);
}

export function checkRegisterRateLimit(identifier: string) {
  return check(registerLimiter, identifier);
}

export function checkPublicPollRateLimit(identifier: string) {
  return check(publicPollLimiter, identifier);
}

export function checkCsvImportRateLimit(identifier: string) {
  return check(csvImportLimiter, identifier);
}
