import { ShoppingItem } from "@/types";

const memoryItems: ShoppingItem[] = [];
const memoryUsers: Record<string, { name: string; passwordHash: string }> = {};
const memorySessions: Record<string, { username: string; name: string }> = {};

type RedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, options?: { ex: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
};

function getRedis(): RedisClient | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }) as RedisClient;
  }
  return null;
}

// Items
export async function getItems(): Promise<ShoppingItem[]> {
  const r = getRedis();
  return r ? ((await r.get("shopping_items")) as ShoppingItem[] | null) || [] : [...memoryItems];
}
export async function setItems(items: ShoppingItem[]): Promise<void> {
  const r = getRedis();
  if (r) await r.set("shopping_items", items);
  else { memoryItems.length = 0; memoryItems.push(...items); }
}

// Users
type UserRecord = Record<string, { name: string; passwordHash: string }>;
export async function getUsers(): Promise<UserRecord> {
  const r = getRedis();
  return r ? ((await r.get("users")) as UserRecord | null) || {} : { ...memoryUsers };
}
export async function saveUser(username: string, data: { name: string; passwordHash: string }): Promise<void> {
  const users = await getUsers();
  users[username] = data;
  const r = getRedis();
  if (r) await r.set("users", users);
  else memoryUsers[username] = data;
}

// Sessions
type SessionData = { username: string; name: string };
export async function saveSession(token: string, data: SessionData): Promise<void> {
  const r = getRedis();
  if (r) await r.set(`session:${token}`, data, { ex: 60 * 60 * 24 * 30 });
  else memorySessions[token] = data;
}
export async function getSession(token: string): Promise<SessionData | null> {
  const r = getRedis();
  return r ? ((await r.get(`session:${token}`)) as SessionData | null) : memorySessions[token] || null;
}
export async function deleteSession(token: string): Promise<void> {
  const r = getRedis();
  if (r) await r.del(`session:${token}`);
  else delete memorySessions[token];
}
