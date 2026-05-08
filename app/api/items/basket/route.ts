import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { ShoppingItem } from "@/types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function DELETE() {
  const items = (await redis.get<ShoppingItem[]>("shopping_items")) || [];
  await redis.set("shopping_items", items.filter((i) => i.category !== "payment_basket"));
  return NextResponse.json({ success: true });
}
