import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { ShoppingItem } from "@/types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await req.json();
  const items = (await redis.get<ShoppingItem[]>("shopping_items")) || [];
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
  await redis.set("shopping_items", items);
  return NextResponse.json(items[index]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = (await redis.get<ShoppingItem[]>("shopping_items")) || [];
  await redis.set("shopping_items", items.filter((i) => i.id !== id));
  return NextResponse.json({ success: true });
}
