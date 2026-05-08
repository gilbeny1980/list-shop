import { NextRequest, NextResponse } from "next/server";
import { getItems, setItems } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const updates = await req.json();
  const items = await getItems(groupId);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
  await setItems(groupId, items);
  return NextResponse.json(items[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const items = await getItems(groupId);
  await setItems(groupId, items.filter((i) => i.id !== id));
  return NextResponse.json({ success: true });
}
