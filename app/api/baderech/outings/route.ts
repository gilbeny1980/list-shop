import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getBdSessionFromRequest } from "@/lib/baderech/getSession";
import { getMembers, getOutings, setOutings } from "@/lib/baderech/storage";
import { Outing, ReturnMethod } from "@/types/baderech";

async function assertMember(username: string, teenId: string) {
  const members = await getMembers(teenId);
  return members.some((m) => m.username === username);
}

export async function GET(req: NextRequest) {
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const teenId = req.nextUrl.searchParams.get("teenId");
  if (!teenId) return NextResponse.json({ error: "חסר teenId" }, { status: 400 });
  if (!(await assertMember(session.username, teenId)))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const outings = await getOutings(teenId);
  return NextResponse.json(outings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: NextRequest) {
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { teenId, title, plannedDeparture, plannedReturn, returnMethod, notes } = await req.json();
  if (!teenId || !title || !plannedDeparture || !plannedReturn || !returnMethod)
    return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
  if (!(await assertMember(session.username, teenId)))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const now = new Date().toISOString();
  const outing: Outing = {
    id: randomUUID(),
    teenId,
    title,
    plannedDeparture,
    plannedReturn,
    returnMethod: returnMethod as ReturnMethod,
    notes: notes || "",
    status: "planned",
    history: [{ status: "planned", at: now, by: session.name }],
    createdBy: session.username,
    createdAt: now,
    updatedAt: now,
  };

  const outings = await getOutings(teenId);
  await setOutings(teenId, [...outings, outing]);
  return NextResponse.json(outing);
}
