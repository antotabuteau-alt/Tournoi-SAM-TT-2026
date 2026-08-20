import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

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

export function checkPublicPollRateLimit(identifier: string) {
  return check(publicPollLimiter, identifier);
}

export function checkCsvImportRateLimit(identifier: string) {
  return check(csvImportLimiter, identifier);
}
