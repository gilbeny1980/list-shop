import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getBdSessionFromRequest } from "@/lib/baderech/getSession";
import { addMember, getMembers, getTeenById, getUserTeenIds, saveTeen } from "@/lib/baderech/storage";
import { TeenCategory, TeenProfile, TeenWithRole } from "@/types/baderech";

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(req: NextRequest) {
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const ids = await getUserTeenIds(session.username);
  const teens: TeenWithRole[] = [];
  for (const id of ids) {
    const teen = await getTeenById(id);
    if (!teen) continue;
    const members = await getMembers(id);
    const me = members.find((m) => m.username === session.username);
    teens.push({ ...teen, myRole: me?.role || "parent" });
  }
  return NextResponse.json(teens);
}

export async function POST(req: NextRequest) {
  const session = await getBdSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const { name, category, role } = await req.json();
  if (!name || !category) return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
  if (!["middle", "high", "army"].includes(category))
    return NextResponse.json({ error: "קטגוריה לא תקינה" }, { status: 400 });

  const teen: TeenProfile = {
    id: randomUUID(),
    name,
    category: category as TeenCategory,
    inviteCode: randomCode(),
    createdBy: session.username,
    createdAt: new Date().toISOString(),
  };
  await saveTeen(teen);
  await addMember(teen.id, {
    username: session.username,
    name: session.name,
    role: role === "teen" ? "teen" : "parent",
    joinedAt: new Date().toISOString(),
  });

  return NextResponse.json(teen);
}
