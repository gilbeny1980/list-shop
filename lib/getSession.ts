import { NextRequest } from "next/server";
import { getSession, SessionData } from "./storage";

export async function getSessionFromRequest(req: NextRequest): Promise<SessionData | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  return getSession(token);
}
