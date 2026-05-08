import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { ShoppingItem } from "@/types";

export async function DELETE() {
  const items = (await kv.get<ShoppingItem[]>("shopping_items")) || [];
  await kv.set("shopping_items", items.filter((i) => i.category !== "payment_basket"));
  return NextResponse.json({ success: true });
}
