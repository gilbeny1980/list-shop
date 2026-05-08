import { NextRequest, NextResponse } from "next/server";
import { getItems, setItems } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await req.json();
  const items = await getItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
  await setItems(items);
  return NextResponse.json(items[index]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await getItems();
  await setItems(items.filter((i) => i.id !== id));
  return NextResponse.json({ success: true });
}
