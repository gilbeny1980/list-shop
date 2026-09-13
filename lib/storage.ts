import { ShoppingItem } from "@/types";
import { kvGet, kvSet, kvDel } from "@/lib/kv";

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
