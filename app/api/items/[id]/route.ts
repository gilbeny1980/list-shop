import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { ShoppingItem } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await req.json();
  const items = (await kv.get<ShoppingItem[]>("shopping_items")) || [];
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
  await kv.set("shopping_items", items);
  return NextResponse.json(items[index]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = (await kv.get<ShoppingItem[]>("shopping_items")) || [];
  await kv.set("shopping_items", items.filter((i) => i.id !== id));
  return NextResponse.json({ success: true });
}
