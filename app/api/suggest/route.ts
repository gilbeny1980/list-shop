import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Category } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Suggestion {
  name: string;
  category: Category;
}

export async function POST(request: NextRequest) {
  const { items } = await request.json();

  if (!Array.isArray(items)) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  try {
    const itemNames = items.map((i: { name: string }) => i.name).join(", ");
    const itemCount = items.length;

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      system: `You are a helpful grocery shopping assistant for an Israeli family.
You suggest missing items based on a current shopping list.
Always respond in JSON format with exactly this structure:
{"suggestions": [{"name": "...", "category": "..."}, ...]}

Categories must be one of: dry_goods, meat, dairy, vegetables_fruits

Rules:
- Suggest 4-6 common items that are often bought together
- Suggest items in Hebrew if the list items are in Hebrew, English if in English
- Don't suggest items already on the list
- Focus on practical everyday grocery items
- Each suggestion must have a valid category`,
      messages: [
        {
          role: "user",
          content: itemCount === 0
            ? "My shopping list is empty. Suggest common grocery items for a family."
            : `My shopping list has: ${itemNames}\nWhat other items might I need?`,
        },
      ],
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ suggestions: [] });

    const parsed = JSON.parse(jsonMatch[0]) as { suggestions: Suggestion[] };
    const validCategories: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];

    const suggestions = (parsed.suggestions || [])
      .slice(0, 6)
      .filter((s: Suggestion) => s.name && validCategories.includes(s.category));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
