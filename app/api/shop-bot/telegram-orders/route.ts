import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/shopBot/telegram";
import { TelegramUpdate } from "@/types/shopBot";

// This bot only ever pushes order notifications (sent from telegram.ts and
// the WhatsApp bot) — the only inbound interaction it needs to handle is a
// friendly /start so opening it doesn't feel broken.
const WELCOME_TEXT =
  "📋 הזמנות מירב מלך\n\n" +
  "לכאן מגיעה התראה בזמן אמת על כל הזמנה חדשה מלקוחות — שם המוצר, המחיר ואופן התשלום.\n\n" +
  "לניהול המוצרים והמחירים יש להשתמש בבוט @merav_admin_bot 🍰";

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_ORDERS_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ status: "ok" });

  try {
    const update: TelegramUpdate = await req.json();
    if (update.message?.text?.trim() === "/start") {
      await sendTelegramMessage(botToken, update.message.chat.id, WELCOME_TEXT);
    }
  } catch (err) {
    console.error("Telegram orders webhook error", err);
  }
  return NextResponse.json({ status: "ok" });
}
