const { Redis } = require("@upstash/redis");

// Same Upstash Redis instance/keys as the Next.js app's lib/kv.ts — this
// service and the Telegram bot share one product/order catalog.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
