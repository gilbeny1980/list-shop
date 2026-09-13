import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/shopBot/telegram";
import {
  addProduct,
  clearAdminSession,
  deactivateProduct,
  getAdminSession,
  getProducts,
  setAdminSession,
} from "@/lib/shopBot/storage";
import { TelegramMessage, TelegramUpdate } from "@/types/shopBot";

const HELP_TEXT =
  "שלום! 👋 בבוט הזה מנהלים את מוצרי החנות.\n\n" +
  "/addproduct - הוספת מוצר חדש\n" +
  "/listproducts - רשימת המוצרים\n" +
  "/removeproduct <מזהה> - הסרת מוצר מהתפריט\n" +
  "/cancel - ביטול הפעולה הנוכחית";

function isAuthorized(chatId: number): boolean {
  const allowed = (process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(String(chatId));
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ status: "ok" });

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message;
    if (!message) return NextResponse.json({ status: "ok" });

    const chatId = message.chat.id;
    if (!isAuthorized(chatId)) {
      await sendTelegramMessage(botToken, chatId, "אין לך הרשאה לנהל את המוצרים בבוט הזה.");
      return NextResponse.json({ status: "ok" });
    }

    await handleAdminMessage(botToken, chatId, message);
  } catch (err) {
    console.error("Telegram admin webhook error", err);
  }
  return NextResponse.json({ status: "ok" });
}

async function handleAdminMessage(botToken: string, chatId: number, message: TelegramMessage) {
  const text = message.text?.trim();
  const chatKey = String(chatId);

  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(botToken, chatId, HELP_TEXT);
    return;
  }

  if (text === "/cancel") {
    await clearAdminSession(chatKey);
    await sendTelegramMessage(botToken, chatId, "הפעולה בוטלה.");
    return;
  }

  if (text === "/addproduct") {
    await setAdminSession(chatKey, { state: "awaiting_name" });
    await sendTelegramMessage(botToken, chatId, "מה שם המוצר?");
    return;
  }

  if (text === "/listproducts") {
    const products = await getProducts();
    if (products.length === 0) {
      await sendTelegramMessage(botToken, chatId, "אין עדיין מוצרים.");
      return;
    }
    const lines = products.map((p) => `${p.active ? "✅" : "🚫"} ${p.name} - ${p.price} ₪\nמזהה: ${p.id}`);
    await sendTelegramMessage(botToken, chatId, lines.join("\n\n"));
    return;
  }

  if (text?.startsWith("/removeproduct")) {
    const id = text.split(/\s+/)[1];
    if (!id) {
      await sendTelegramMessage(botToken, chatId, "יש לציין מזהה מוצר, לדוגמה:\n/removeproduct abc123");
      return;
    }
    const ok = await deactivateProduct(id);
    await sendTelegramMessage(botToken, chatId, ok ? "המוצר הוסר מהתפריט." : "לא נמצא מוצר עם המזהה הזה.");
    return;
  }

  const session = await getAdminSession(chatKey);
  if (!session) {
    await sendTelegramMessage(botToken, chatId, "לא הבנתי. שלחי /help לרשימת הפקודות.");
    return;
  }

  if (session.state === "awaiting_name") {
    if (!text) {
      await sendTelegramMessage(botToken, chatId, "נא לשלוח שם מוצר בטקסט.");
      return;
    }
    await setAdminSession(chatKey, { state: "awaiting_price", name: text });
    await sendTelegramMessage(botToken, chatId, "מה המחיר (בשקלים)?");
    return;
  }

  if (session.state === "awaiting_price") {
    const price = text ? Number(text.replace(/[^\d.]/g, "")) : NaN;
    if (!text || Number.isNaN(price) || price <= 0) {
      await sendTelegramMessage(botToken, chatId, "נא לשלוח מחיר תקין, לדוגמה: 45");
      return;
    }
    await setAdminSession(chatKey, { ...session, state: "awaiting_photo", price });
    await sendTelegramMessage(botToken, chatId, "מעולה! עכשיו שלחי תמונה של המוצר 📷");
    return;
  }

  if (session.state === "awaiting_photo") {
    const photos = message.photo;
    if (!photos || photos.length === 0) {
      await sendTelegramMessage(botToken, chatId, "נא לשלוח תמונה של המוצר (לא כקובץ).");
      return;
    }
    const fileId = photos[photos.length - 1].file_id;
    const product = await addProduct({ name: session.name!, price: session.price!, telegramFileId: fileId });
    await clearAdminSession(chatKey);
    await sendTelegramMessage(botToken, chatId, `המוצר "${product.name}" (${product.price} ₪) נוסף בהצלחה! ✅`);
    return;
  }
}
