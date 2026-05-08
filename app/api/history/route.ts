import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface HistoryEntry {
  id: string;
  date: string;
  total: number;
  itemCount: number;
  items: { name: string; price: number | null; quantity: number }[];
}

// Reuse same storage pattern
const memoryHistory: HistoryEntry[] = [];

function getRedis() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  }
  return null;
}

export async function GET() {
  const r = getRedis();
  const history = r ? ((await r.get("shopping_history")) as HistoryEntry[] | null) || [] : [...memoryHistory];
  return NextResponse.json(history.reverse()); // newest first
}

export async function POST(req: NextRequest) {
  const { items, total } = await req.json();
  const r = getRedis();
  const history: HistoryEntry[] = r
    ? ((await r.get("shopping_history")) as HistoryEntry[] | null) || []
    : [...memoryHistory];

  const entry: HistoryEntry = {
    id: randomUUID(),
    date: new Date().toISOString(),
    total,
    itemCount: items.length,
    items,
  };

  history.push(entry);
  if (r) await r.set("shopping_history", history);
  else { memoryHistory.length = 0; memoryHistory.push(...history); }

  return NextResponse.json(entry);
}
