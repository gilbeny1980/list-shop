import { ShoppingItem } from "@/types";

// ── In-memory fallback (local dev) ──────────────────────────────
const mem: Record<string, unknown> = {};

// ── Firestore client (production on Firebase App Hosting) ────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  if (_db) return _db;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require("firebase-admin");
    if (!admin.apps.length) admin.initializeApp();
    _db = admin.firestore();
    return _db;
  } catch {
    return null;
  }
}

const safeKey = (k: string) => k.replace(/[/:]/g, "__");

async function kvGet<T>(key: string): Promise<T | null> {
  const db = getDb();
  if (db) {
    const snap = await db.collection("kv").doc(safeKey(key)).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    if (d.expiresAt && d.expiresAt.toMillis() < Date.now()) return null;
    return d.value as T;
  }
  return (mem[key] as T) ?? null;
}

async function kvSet(key: string, value: unknown, ex?: number): Promise<void> {
  const db = getDb();
  if (db) {
    const doc: Record<string, unknown> = { value, updatedAt: new Date() };
    if (ex) doc.expiresAt = new Date(Date.now() + ex * 1000);
    await db.collection("kv").doc(safeKey(key)).set(doc);
    return;
  }
  mem[key] = value;
}

async function kvDel(key: string): Promise<void> {
  const db = getDb();
  if (db) { await db.collection("kv").doc(safeKey(key)).delete(); return; }
  delete mem[key];
}

// ── Items (per group) ───────────────────────────────────────────
export async function getItems(groupId: string): Promise<ShoppingItem[]> {
  return (await kvGet<ShoppingItem[]>(`items:${groupId}`)) || [];
}
export async function setItems(groupId: string, items: ShoppingItem[]): Promise<void> {
  await kvSet(`items:${groupId}`, items);
}

// ── History (per group) ─────────────────────────────────────────
interface HistoryEntry { id: string; date: string; total: number; itemCount: number; items: { name: string; quantity: number }[]; }
export async function getHistory(groupId: string): Promise<HistoryEntry[]> {
  return (await kvGet<HistoryEntry[]>(`history:${groupId}`)) || [];
}
export async function addHistory(groupId: string, entry: HistoryEntry): Promise<void> {
  const h = await getHistory(groupId);
  h.push(entry);
  await kvSet(`history:${groupId}`, h);
}

// ── Users ───────────────────────────────────────────────────────
type UserRecord = Record<string, { name: string; passwordHash: string }>;
export async function getUsers(): Promise<UserRecord> {
  return (await kvGet<UserRecord>("users")) || {};
}
export async function saveUser(username: string, data: { name: string; passwordHash: string }): Promise<void> {
  const users = await getUsers();
  users[username] = data;
  await kvSet("users", users);
}

// ── Sessions ────────────────────────────────────────────────────
export type SessionData = { username: string; name: string; groupId?: string };
export async function saveSession(token: string, data: SessionData): Promise<void> {
  await kvSet(`session:${token}`, data, 60 * 60 * 24 * 30);
}
export async function getSession(token: string): Promise<SessionData | null> {
  return kvGet<SessionData>(`session:${token}`);
}
export async function deleteSession(token: string): Promise<void> {
  await kvDel(`session:${token}`);
}

// ── Groups ──────────────────────────────────────────────────────
export interface GroupData { id: string; name: string; inviteCode: string; createdBy: string; }
export async function saveGroup(group: GroupData): Promise<void> {
  await kvSet(`group:${group.id}`, group);
  await kvSet(`group:code:${group.inviteCode}`, group.id);
}
export async function getGroupById(id: string): Promise<GroupData | null> {
  return kvGet<GroupData>(`group:${id}`);
}
export async function getGroupByCode(code: string): Promise<GroupData | null> {
  const id = await kvGet<string>(`group:code:${code.toUpperCase()}`);
  return id ? getGroupById(id) : null;
}
