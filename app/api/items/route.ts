import { NextRequest, NextResponse } from "next/server";
import { ShoppingItem, Category } from "@/types";
import { getItems, setItems } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  return NextResponse.json(await getItems(groupId));
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const { name, category, quantity, added_by_name } = await req.json();
  const items = await getItems(groupId);

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

  await setItems(groupId, [...items, newItem]);
  return NextResponse.json(newItem);
}
