import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveGroup, saveSession, getSession } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "חסר שם קבוצה" }, { status: 400 });

  const group = {
    id: randomUUID(),
    name,
    inviteCode: randomCode(),
    createdBy: session.name,
  };

  await saveGroup(group);

  const token = req.headers.get("Authorization")!.replace("Bearer ", "");
  const current = await getSession(token);
  if (current) await saveSession(token, { ...current, groupId: group.id });

  return NextResponse.json({ groupId: group.id, groupName: group.name, inviteCode: group.inviteCode });
}
