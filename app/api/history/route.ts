import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getHistory, addHistory } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const history = await getHistory(groupId);
  return NextResponse.json([...history].reverse());
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const groupId = session?.groupId || "default";
  const { items, total } = await req.json();
  const entry = { id: randomUUID(), date: new Date().toISOString(), total, itemCount: items.length, items };
  await addHistory(groupId, entry);
  return NextResponse.json(entry);
}
