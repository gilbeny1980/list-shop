import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Category } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_CATEGORIES: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing product name" }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 64,
      system: `You are a grocery store categorization expert.
Classify Hebrew and English food product names into exactly one of these categories:
- dry_goods: bread, canned goods, pasta, rice, cereals, snacks, oils, sauces, coffee, tea, sugar, flour
- meat: beef, chicken, lamb, turkey, fish, seafood, deli meats, sausages, eggs
- dairy: milk, cheese, yogurt, butter, cream, ice cream, sour cream
- vegetables_fruits: all fresh/frozen vegetables and fruits, herbs

Respond with ONLY the category name, nothing else.`,
      messages: [
        {
          role: "user",
          content: `Classify this product: "${name}"`,
        },
      ],
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text.trim().toLowerCase()
      : "";

    const category = VALID_CATEGORIES.includes(text as Category)
      ? (text as Category)
      : "dry_goods";

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ category: "dry_goods" });
  }
}
