import { NextRequest, NextResponse } from "next/server";
import { getItems, setItems } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const items = await getItems(groupId);
  await setItems(groupId, items.filter((i) => i.category !== "payment_basket"));
  return NextResponse.json({ success: true });
}
