const { Redis } = require("@upstash/redis");

// Same Redis instance/keys as the Next.js app's lib/kv.ts — this service
// and the Telegram bot share one product/order catalog. Accepts either the
// plain Upstash env names or Vercel's own KV integration names (which wrap
// the same Upstash-backed REST API).
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

async function kvGet(key) {
  return (await redis.get(key)) ?? null;
}
async function kvSet(key, value, ex) {
  await redis.set(key, value, ex ? { ex } : undefined);
}
async function kvDel(key) {
  await redis.del(key);
}

module.exports = { kvGet, kvSet, kvDel };
