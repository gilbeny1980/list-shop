import { NextRequest, NextResponse } from "next/server";
import { ShoppingItem, Category } from "@/types";
import { getItems, setItems } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(await getItems());
}

export async function POST(req: NextRequest) {
  const { name, category, quantity, added_by_name } = await req.json();
  const items = await getItems();

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

  await setItems([...items, newItem]);
  return NextResponse.json(newItem);
}
