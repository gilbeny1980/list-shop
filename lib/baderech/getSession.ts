import { NextRequest } from "next/server";
import { BdSessionData, getBdSession } from "./storage";

export async function getBdSessionFromRequest(req: NextRequest): Promise<BdSessionData | null> {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  return getBdSession(token);
}
