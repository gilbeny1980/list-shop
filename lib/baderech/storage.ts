import { CircleMember, Outing, TeenProfile } from "@/types/baderech";

// ── KV backend (shares the same Upstash Redis instance as the rest of the
// app, but every key is namespaced under "bd:" so it never collides with
// the shopping-list app's data) ─────────────────────────────────────────
const mem: Record<string, unknown> = {};

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

async function kvGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  return r ? ((await r.get(key)) as T | null) : ((mem[key] as T) ?? null);
}
async function kvSet(key: string, value: unknown, ex?: number): Promise<void> {
  const r = getRedis();
  if (r) await r.set(key, value, ex ? { ex } : undefined);
  else mem[key] = value;
}
async function kvDel(key: string): Promise<void> {
  const r = getRedis();
  if (r) await r.del(key);
  else delete mem[key];
}

// ── Users ───────────────────────────────────────────────────────────────
type UserRecord = Record<string, { name: string; passwordHash: string }>;
export async function getBdUsers(): Promise<UserRecord> {
  return (await kvGet<UserRecord>("bd:users")) || {};
}
export async function saveBdUser(username: string, data: { name: string; passwordHash: string }): Promise<void> {
  const users = await getBdUsers();
  users[username] = data;
  await kvSet("bd:users", users);
}

// ── Sessions ────────────────────────────────────────────────────────────
export type BdSessionData = { username: string; name: string };
export async function saveBdSession(token: string, data: BdSessionData): Promise<void> {
  await kvSet(`bd:session:${token}`, data, 60 * 60 * 24 * 30);
}
export async function getBdSession(token: string): Promise<BdSessionData | null> {
  return kvGet<BdSessionData>(`bd:session:${token}`);
}
export async function deleteBdSession(token: string): Promise<void> {
  await kvDel(`bd:session:${token}`);
}

// ── Teen profiles (circles) ─────────────────────────────────────────────
export async function saveTeen(teen: TeenProfile): Promise<void> {
  await kvSet(`bd:teen:${teen.id}`, teen);
  await kvSet(`bd:teen:code:${teen.inviteCode}`, teen.id);
}
export async function getTeenById(id: string): Promise<TeenProfile | null> {
  return kvGet<TeenProfile>(`bd:teen:${id}`);
}
export async function getTeenByCode(code: string): Promise<TeenProfile | null> {
  const id = await kvGet<string>(`bd:teen:code:${code.toUpperCase()}`);
  return id ? getTeenById(id) : null;
}

// members of a teen circle
export async function getMembers(teenId: string): Promise<CircleMember[]> {
  return (await kvGet<CircleMember[]>(`bd:teen:${teenId}:members`)) || [];
}
export async function addMember(teenId: string, member: CircleMember): Promise<void> {
  const members = await getMembers(teenId);
  if (!members.some((m) => m.username === member.username)) {
    members.push(member);
    await kvSet(`bd:teen:${teenId}:members`, members);
  }
  await linkUserToTeen(member.username, teenId);
}

// which teen circles a user belongs to
export async function getUserTeenIds(username: string): Promise<string[]> {
  return (await kvGet<string[]>(`bd:user:${username}:teens`)) || [];
}
async function linkUserToTeen(username: string, teenId: string): Promise<void> {
  const ids = await getUserTeenIds(username);
  if (!ids.includes(teenId)) {
    ids.push(teenId);
    await kvSet(`bd:user:${username}:teens`, ids);
  }
}

// ── Outings (per teen) ────────────────────────────────────────────────
export async function getOutings(teenId: string): Promise<Outing[]> {
  return (await kvGet<Outing[]>(`bd:outings:${teenId}`)) || [];
}
export async function setOutings(teenId: string, outings: Outing[]): Promise<void> {
  await kvSet(`bd:outings:${teenId}`, outings);
}
