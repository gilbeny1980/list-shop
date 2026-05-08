import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";
import { ShoppingItem, Category } from "@/types";
import { randomUUID } from "crypto";

export async function GET() {
  const items = (await kv.get<ShoppingItem[]>("shopping_items")) || [];
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { name, category, quantity, added_by_name } = await req.json();
  const items = (await kv.get<ShoppingItem[]>("shopping_items")) || [];

  const newItem: ShoppingItem = {
    id: randomUUID(),
    name,
    category: category as Category,
    quantity: quantity || 1,
    is_checked: false,
    price: null,
    added_by: added_by_name || "אורח",
    added_by_email: added_by_name || "אורח",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  items.push(newItem);
  await kv.set("shopping_items", items);
  return NextResponse.json(newItem);
}
