import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { getUsers, saveUser, saveSession } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { username, password, name } = await req.json();
  if (!username || !password || !name) return NextResponse.json({ error: "כל השדות חובה" }, { status: 400 });

  const users = await getUsers();
  if (users[username]) return NextResponse.json({ error: "שם המשתמש תפוס" }, { status: 409 });

  await saveUser(username, { name, passwordHash: hashPassword(password) });
  const token = generateToken();
  await saveSession(token, { username, name });
  return NextResponse.json({ token, name });
}
