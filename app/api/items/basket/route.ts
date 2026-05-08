import { NextResponse } from "next/server";
import { getItems, setItems } from "@/lib/storage";

export async function DELETE() {
  const items = await getItems();
  await setItems(items.filter((i) => i.category !== "payment_basket"));
  return NextResponse.json({ success: true });
}
