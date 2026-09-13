import { NextRequest, NextResponse } from "next/server";
import { answerCallbackQuery, sendTelegramMessage, sendTelegramPhoto } from "@/lib/shopBot/telegram";
import {
  addOrder,
  addProduct,
  clearAdminSession,
  clearTgSession,
  deactivateProduct,
  getAdminSession,
  getActiveProducts,
  getProduct,
  getProducts,
  getTgSession,
  setAdminSession,
  setTgSession,
} from "@/lib/shopBot/storage";
import {
  PaymentMethod,
  TelegramCallbackQuery,
  TelegramInlineKeyboard,
  TelegramMessage,
  TelegramUpdate,
  TelegramUser,
} from "@/types/shopBot";

const HELP_TEXT =
  "שלום! 👋 בבוט הזה מנהלים את מוצרי החנות.\n\n" +
  "/addproduct - הוספת מוצר חדש\n" +
  "/listproducts - רשימת המוצרים\n" +
  "/removeproduct <מזהה> - הסרת מוצר מהתפריט\n" +
  "/cancel - ביטול הפעולה הנוכחית\n\n" +
  "(בשלב הוספת תמונה אפשר לשלוח /skip כדי להוסיף מוצר בלי תמונה)";

function isAdmin(chatId: number): boolean {
  const allowed = (process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(String(chatId));
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ status: "ok" });

  try {
    const update: TelegramUpdate = await req.json();
    if (update.callback_query) {
      await handleCallback(botToken, update.callback_query);
    } else if (update.message) {
      await handleMessage(botToken, update.message);
    }
  } catch (err) {
    console.error("Telegram webhook error", err);
  }
  return NextResponse.json({ status: "ok" });
}

async function handleMessage(botToken: string, message: TelegramMessage) {
  const chatId = message.chat.id;

  if (isAdmin(chatId)) {
    await handleAdminMessage(botToken, chatId, message);
    return;
  }

  // Anyone not on the admin list is a customer placing an order.
  await sendCustomerMenu(botToken, chatId, message.text?.trim() === "/start");
}

// ── Customer ordering flow ──────────────────────────────────────────
async function sendCustomerMenu(botToken: string, chatId: number, isStart: boolean) {
  const products = await getActiveProducts();
  if (products.length === 0) {
    await sendTelegramMessage(botToken, chatId, "מצטערים, אין כרגע מוצרים זמינים להזמנה 🙏");
    return;
  }

  const greeting = isStart ? "🍰 הזמנות עוגות מירב מלך 🍰" : "מה תרצו להזמין?";
  const keyboard: TelegramInlineKeyboard = {
    inline_keyboard: products.map((p) => [{ text: `${p.name} - ${p.price} ₪`, callback_data: `product:${p.id}` }]),
  };
  await sendTelegramMessage(botToken, chatId, greeting, keyboard);
}

async function handleProductSelected(botToken: string, chatId: number, productId: string) {
  const product = await getProduct(productId);
  if (!product || !product.active) {
    await sendTelegramMessage(botToken, chatId, "המוצר הזה כבר לא זמין. הנה התפריט העדכני:");
    await sendCustomerMenu(botToken, chatId, false);
    return;
  }

  const paymentKeyboard: TelegramInlineKeyboard = {
    inline_keyboard: [
      [
        { text: "ביט 💳", callback_data: `pay_bit:${product.id}` },
        { text: "מזומן 💵", callback_data: `pay_cash:${product.id}` },
      ],
      [{ text: "ביטול", callback_data: "cancel_order" }],
    ],
  };

  if (product.telegramFileId) {
    await sendTelegramPhoto(
      botToken,
      chatId,
      product.telegramFileId,
      `${product.name} - ${product.price} ₪`,
      paymentKeyboard
    );
  } else {
    await sendTelegramMessage(botToken, chatId, `${product.name} - ${product.price} ₪`, paymentKeyboard);
  }
  await setTgSession(String(chatId), { productId: product.id });
}

async function handlePaymentSelected(
  botToken: string,
  chatId: number,
  productId: string,
  paymentMethod: PaymentMethod,
  from: TelegramUser
) {
  const product = await getProduct(productId);
  if (!product) {
    await sendTelegramMessage(botToken, chatId, "אירעה שגיאה, בואו ננסה שוב:");
    await sendCustomerMenu(botToken, chatId, false);
    return;
  }

  const order = await addOrder({
    productId: product.id,
    productName: product.name,
    price: product.price,
    paymentMethod,
    channel: "telegram",
    customerId: String(chatId),
    customerName: from.username ? `@${from.username}` : from.first_name,
  });
  await clearTgSession(String(chatId));

  const paymentText =
    paymentMethod === "bit"
      ? `לתשלום בביט: ${process.env.MERAV_BIT_INFO || "נא לתאם עם מירב"}`
      : "התשלום יתבצע במזומן באיסוף / במשלוח";
  await sendTelegramMessage(botToken, chatId, `תודה! ההזמנה שלך (${product.name}) התקבלה ✅\n${paymentText}`);

  const ordersBotToken = process.env.TELEGRAM_ORDERS_BOT_TOKEN;
  const ordersChatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
  if (ordersBotToken && ordersChatId) {
    await sendTelegramMessage(
      ordersBotToken,
      ordersChatId,
      `🛒 הזמנה חדשה!\n` +
        `מוצר: ${product.name}\n` +
        `מחיר: ${product.price} ₪\n` +
        `תשלום: ${paymentMethod === "bit" ? "ביט" : "מזומן"}\n` +
        `לקוח/ה (טלגרם): ${order.customerName}\n` +
        `מס' הזמנה: ${order.id}`
    );
  }
}

async function handleCallback(botToken: string, callback: TelegramCallbackQuery) {
  await answerCallbackQuery(botToken, callback.id);

  const chatId = callback.message?.chat.id;
  const data = callback.data;
  if (!chatId || !data) return;

  if (data.startsWith("product:")) {
    await handleProductSelected(botToken, chatId, data.slice("product:".length));
    return;
  }

  if (data.startsWith("pay_bit:") || data.startsWith("pay_cash:")) {
    const [prefix, productId] = data.split(":");
    await handlePaymentSelected(botToken, chatId, productId, prefix === "pay_bit" ? "bit" : "cash", callback.from);
    return;
  }

  if (data === "cancel_order") {
    await clearTgSession(String(chatId));
    await sendTelegramMessage(botToken, chatId, "ההזמנה בוטלה. אפשר להתחיל הזמנה חדשה בכל עת 🙂");
  }
}

// ── Admin product management flow ───────────────────────────────────
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
    await sendTelegramMessage(
      botToken,
      chatId,
      "מעולה! עכשיו שלחי תמונה של המוצר 📷 (או שלחי /skip כדי להוסיף בלי תמונה בינתיים)"
    );
    return;
  }

  if (session.state === "awaiting_photo") {
    const photos = message.photo;
    if (!photos || photos.length === 0) {
      if (text === "/skip") {
        const product = await addProduct({ name: session.name!, price: session.price!, telegramFileId: null });
        await clearAdminSession(chatKey);
        await sendTelegramMessage(botToken, chatId, `המוצר "${product.name}" (${product.price} ₪) נוסף בהצלחה! ✅`);
        return;
      }
      await sendTelegramMessage(botToken, chatId, "נא לשלוח תמונה של המוצר (לא כקובץ), או /skip כדי לדלג.");
      return;
    }
    const fileId = photos[photos.length - 1].file_id;
    const product = await addProduct({ name: session.name!, price: session.price!, telegramFileId: fileId });
    await clearAdminSession(chatKey);
    await sendTelegramMessage(botToken, chatId, `המוצר "${product.name}" (${product.price} ₪) נוסף בהצלחה! ✅`);
    return;
  }
}
