import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Category } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_CATEGORIES: Category[] = ["dry_goods", "meat", "dairy", "vegetables_fruits"];

// Local dictionary - always correct, no API needed
const LOCAL_MAP: [string[], Category][] = [
  // dairy
  [["חלב", "גבינ", "יוגורט", "לבן", "שמנת", "חמאה", "גבינה", "קוטג", "ריקוטה", "מוצרלה", "פרמזן", "בולגרית", "צהובה", "קשקבל", "עמק"], "dairy"],
  // meat
  [["עוף", "בשר", "פרגית", "כנפיים", "שניצל", "חזה", "ירך", "בקר", "כבש", "הודו", "דג", "סלמון", "בורי", "דניס", "לוקוס", "קרפיון", "נקניק", "נקניקיה", "המבורגר", "ביצ", "כבד", "שפונדרה", "אנטריקוט", "פילה"], "meat"],
  // vegetables_fruits
  [["עגבני", "מלפפון", "גזר", "תפוח", "בצל", "שום", "פלפל", "חציל", "קישוא", "ברוקולי", "כרוב", "חסה", "תרד", "סלק", "לפת", "כרובית", "פטריה", "תירס", "אפונה", "שעועית", "בננ", "תפוז", "לימון", "ענב", "אבטיח", "מלון", "אגס", "אננס", "מנגו", "קיווי", "אשכולית", "תות", "דובדבן", "שזיף", "אפרסק", "משמש", "רימון", "תאנ", "ירק", "פרי", "ירקות", "פירות", "עשבי", "כוסברה", "פטרוזיליה", "נענע"], "vegetables_fruits"],
  // dry_goods
  [["לחם", "פיתה", "בגט", "חלה", "לחמניה", "אורז", "פסטה", "ספגטי", "מקרוני", "קמח", "סוכר", "מלח", "שמן", "זית", "חמניות", "קנולה", "קפה", "תה", "קורנפלקס", "שיבולת", "מוזלי", "גרנולה", "עוגיות", "ביסקוויט", "שוקולד", "ממתק", "ריבה", "דבש", "טחינה", "חומוס", "מיונז", "קטשופ", "חרדל", "רוטב", "שימורים", "קופסא", "פח", "קרקר", "צ'יפס", "חטיף", "אגוזים", "שקדים", "גרעינים", "פיסטוק", "קשיו", "צנים", "טונה", "סרדינים", "מקרל", "דג שימורים", "עדשים", "חומוס שימורים", "שעועית לבנה"], "dry_goods"],
];

function localCategorize(name: string): Category | null {
  const lower = name.toLowerCase();
  for (const [keywords, category] of LOCAL_MAP) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) return category;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name || typeof name !== "string") return NextResponse.json({ error: "Missing name" }, { status: 400 });

  // Try local dictionary first (instant, free)
  const local = localCategorize(name.trim());
  if (local) return NextResponse.json({ category: local });

  // Fall back to Claude for unknown items
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 32,
      system: `Classify Hebrew/English grocery product names into exactly one category.
Reply with ONLY the category name — nothing else.

Categories:
- dairy: milk, cheese, yogurt, butter, cream, and all dairy products (חלב, גבינה, יוגורט, חמאה, שמנת)
- meat: beef, chicken, fish, eggs, deli meats (בשר, עוף, דג, ביצים, נקניק)
- vegetables_fruits: all vegetables and fruits (ירקות, פירות)
- dry_goods: bread, pasta, rice, canned goods, oils, coffee, snacks, sweets (לחם, פסטה, אורז, שמן, קפה)`,
      messages: [{ role: "user", content: `Classify: "${name}"` }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim().toLowerCase() : "";
    const category = VALID_CATEGORIES.includes(text as Category) ? (text as Category) : "dry_goods";
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ category: local ?? "dry_goods" });
  }
}
