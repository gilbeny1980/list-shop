import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Category } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ items: [] });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: `You are a grocery list parser for an Israeli family.
Parse the input text into individual grocery items and categorize each one.
Respond ONLY with valid JSON in this exact format:
{"items": [{"name": "...", "category": "...", "quantity": 1}]}

Categories must be exactly one of: dry_goods, meat, dairy, vegetables_fruits
- dry_goods: bread, pasta, rice, canned goods, oils, snacks, coffee, sugar, flour, cereal
- meat: beef, chicken, fish, eggs, deli meats, sausages
- dairy: milk, cheese, yogurt, butter, cream
- vegetables_fruits: all vegetables and fruits

Rules:
- Keep names in the same language as input (Hebrew stays Hebrew)
- Extract quantity if mentioned (e.g. "2 חלב" → quantity: 2)
- Split combined items into separate entries
- Ignore duplicates`,
      messages: [{ role: "user", content: `Parse this shopping list: "${text}"` }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ items: [] });

    const parsed = JSON.parse(match[0]) as { items: { name: string; category: Category; quantity: number }[] };
    const valid: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];
    const items = (parsed.items || []).filter((i) => i.name && valid.includes(i.category));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
