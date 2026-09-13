import { randomUUID } from "crypto";
import { kvGet, kvSet, kvDel } from "@/lib/kv";
import { AdminSession, BotOrder, BotProduct, CustomerSession } from "@/types/shopBot";

const PRODUCTS_KEY = "shopbot:products";
const ORDERS_KEY = "shopbot:orders";

export async function getProducts(): Promise<BotProduct[]> {
  return (await kvGet<BotProduct[]>(PRODUCTS_KEY)) || [];
}

export async function getActiveProducts(): Promise<BotProduct[]> {
  return (await getProducts()).filter((p) => p.active);
}

export async function getProduct(id: string): Promise<BotProduct | null> {
  return (await getProducts()).find((p) => p.id === id) ?? null;
}

export async function addProduct(data: {
  name: string;
  price: number;
  telegramFileId: string | null;
}): Promise<BotProduct> {
  const products = await getProducts();
  const product: BotProduct = {
    id: randomUUID(),
    name: data.name,
    price: data.price,
    telegramFileId: data.telegramFileId,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await kvSet(PRODUCTS_KEY, [...products, product]);
  return product;
}

export async function deactivateProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products[idx] = { ...products[idx], active: false };
  await kvSet(PRODUCTS_KEY, products);
  return true;
}

export async function addOrder(order: Omit<BotOrder, "id" | "createdAt">): Promise<BotOrder> {
  const orders = (await kvGet<BotOrder[]>(ORDERS_KEY)) || [];
  const full: BotOrder = { ...order, id: randomUUID(), createdAt: new Date().toISOString() };
  await kvSet(ORDERS_KEY, [...orders, full]);
  return full;
}

// ── WhatsApp customer sessions (per phone number) ───────────────────
export async function getWaSession(phone: string): Promise<CustomerSession> {
  return (await kvGet<CustomerSession>(`shopbot:wa:${phone}`)) || {};
}
export async function setWaSession(phone: string, session: CustomerSession): Promise<void> {
  await kvSet(`shopbot:wa:${phone}`, session, 60 * 60 * 24);
}
export async function clearWaSession(phone: string): Promise<void> {
  await kvDel(`shopbot:wa:${phone}`);
}

// ── Telegram customer sessions (per chat id) ────────────────────────
export async function getTgSession(chatId: string): Promise<CustomerSession> {
  return (await kvGet<CustomerSession>(`shopbot:tg:${chatId}`)) || {};
}
export async function setTgSession(chatId: string, session: CustomerSession): Promise<void> {
  await kvSet(`shopbot:tg:${chatId}`, session, 60 * 60 * 24);
}
export async function clearTgSession(chatId: string): Promise<void> {
  await kvDel(`shopbot:tg:${chatId}`);
}

// ── Telegram admin "/addproduct" sessions (per chat id) ─────────────
export async function getAdminSession(chatId: string): Promise<AdminSession | null> {
  return kvGet<AdminSession>(`shopbot:admin:${chatId}`);
}
export async function setAdminSession(chatId: string, session: AdminSession): Promise<void> {
  await kvSet(`shopbot:admin:${chatId}`, session, 60 * 30);
}
export async function clearAdminSession(chatId: string): Promise<void> {
  await kvDel(`shopbot:admin:${chatId}`);
}
