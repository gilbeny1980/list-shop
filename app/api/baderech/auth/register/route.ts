import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { getBdUsers, saveBdUser, saveBdSession } from "@/lib/baderech/storage";

export async function POST(req: NextRequest) {
  const { username, password, name } = await req.json();
  if (!username || !password || !name) return NextResponse.json({ error: "כל השדות חובה" }, { status: 400 });

  const users = await getBdUsers();
  if (users[username]) return NextResponse.json({ error: "שם המשתמש תפוס" }, { status: 409 });

  await saveBdUser(username, { name, passwordHash: hashPassword(password) });
  const token = generateToken();
  await saveBdSession(token, { username, name });
  return NextResponse.json({ token, name });
}
