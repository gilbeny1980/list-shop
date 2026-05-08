import { NextRequest, NextResponse } from "next/server";
import { getGroupByCode, saveSession, getSession } from "@/lib/storage";
import { getSessionFromRequest } from "@/lib/getSession";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode) return NextResponse.json({ error: "חסר קוד הזמנה" }, { status: 400 });

  const group = await getGroupByCode(inviteCode.trim());
  if (!group) return NextResponse.json({ error: "קוד הזמנה לא נמצא" }, { status: 404 });

  const token = req.headers.get("Authorization")!.replace("Bearer ", "");
  const current = await getSession(token);
  if (current) await saveSession(token, { ...current, groupId: group.id });

  return NextResponse.json({ groupId: group.id, groupName: group.name, inviteCode: group.inviteCode });
}
