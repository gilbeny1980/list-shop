import { NextRequest, NextResponse } from "next/server";
import { getBdSessionFromRequest } from "@/lib/baderech/getSession";
import { getMembers, getTeenById } from "@/lib/baderech/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const teen = await getTeenById(id);
  if (!teen) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const members = await getMembers(id);
  if (!members.some((m) => m.username === session.username))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  return NextResponse.json({ teen, members });
}
