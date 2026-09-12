import { NextRequest, NextResponse } from "next/server";
import { getBdSessionFromRequest } from "@/lib/baderech/getSession";
import { getMembers, getOutings, setOutings } from "@/lib/baderech/storage";
import { OutingStatus } from "@/types/baderech";

async function assertMember(username: string, teenId: string) {
  const members = await getMembers(teenId);
  return members.some((m) => m.username === username);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { teenId, status, ...fields } = await req.json();
  if (!teenId) return NextResponse.json({ error: "חסר teenId" }, { status: 400 });
  if (!(await assertMember(session.username, teenId)))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const outings = await getOutings(teenId);
  const index = outings.findIndex((o) => o.id === id);
  if (index === -1) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const now = new Date().toISOString();
  const outing = { ...outings[index], ...fields, updatedAt: now };
  if (status && status !== outings[index].status) {
    outing.status = status as OutingStatus;
    outing.history = [...outings[index].history, { status: status as OutingStatus, at: now, by: session.name }];
  }
  outings[index] = outing;
  await setOutings(teenId, outings);
  return NextResponse.json(outing);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const teenId = req.nextUrl.searchParams.get("teenId");
  if (!teenId) return NextResponse.json({ error: "חסר teenId" }, { status: 400 });
  if (!(await assertMember(session.username, teenId)))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const outings = await getOutings(teenId);
  await setOutings(teenId, outings.filter((o) => o.id !== id));
  return NextResponse.json({ success: true });
}
