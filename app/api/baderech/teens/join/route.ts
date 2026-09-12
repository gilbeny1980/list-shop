import { NextRequest, NextResponse } from "next/server";
import { getBdSessionFromRequest } from "@/lib/baderech/getSession";
import { addMember, getTeenByCode } from "@/lib/baderech/storage";

export async function POST(req: NextRequest) {
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { inviteCode, role } = await req.json();
  if (!inviteCode) return NextResponse.json({ error: "חסר קוד הזמנה" }, { status: 400 });

  const teen = await getTeenByCode(inviteCode.trim());
  if (!teen) return NextResponse.json({ error: "קוד הזמנה לא נמצא" }, { status: 404 });

  await addMember(teen.id, {
    username: session.username,
    name: session.name,
    role: role === "teen" ? "teen" : "parent",
    joinedAt: new Date().toISOString(),
  });

  return NextResponse.json(teen);
}
