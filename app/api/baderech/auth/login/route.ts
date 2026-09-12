import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { getBdUsers, saveBdSession } from "@/lib/baderech/storage";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "כל השדות חובה" }, { status: 400 });

  const users = await getBdUsers();
  const user = users[username];
  if (!user || user.passwordHash !== hashPassword(password))
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });

  const token = generateToken();
  await saveBdSession(token, { username, name: user.name });
  return NextResponse.json({ token, name: user.name });
}
