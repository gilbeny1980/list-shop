import { NextRequest, NextResponse } from "next/server";
import { getTelegramFileUrl, sendTelegramMessage } from "@/lib/shopBot/telegram";
import {
  addOrder,
  clearWaSession,
  getActiveProducts,
  getProduct,
  getWaSession,
  setWaSession,
} from "@/lib/shopBot/storage";
import { sendWhatsappButtons, sendWhatsappImage, sendWhatsappList, sendWhatsappText } from "@/lib/shopBot/whatsapp";
import { PaymentMethod, WhatsAppMessage, WhatsAppWebhookBody } from "@/types/shopBot";

// Meta's webhook verification handshake.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookBody = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message) await handleIncomingMessage(message);
  } catch (err) {
    console.error("WhatsApp webhook error", err);
  }
  // Always 200 — Meta retries aggressively on non-2xx responses.
  return NextResponse.json({ status: "ok" });
}

async function sendProductMenu(to: string) {
  const products = await getActiveProducts();
  if (products.length === 0) {
    await sendWhatsappText(to, "מצטערים, אין כרגע מוצרים זמינים להזמנה 🙏");
    return;
  }
  await sendWhatsappList(
    to,
    "שלום! 😊 מה תרצו להזמין היום?",
    "בחירת מוצר",
    products.map((p) => ({ id: `product:${p.id}`, title: p.name, description: `${p.price} ₪` }))
  );
}

async function handleProductSelected(from: string, productId: string) {
  const product = await getProduct(productId);
  if (!product || !product.active) {
    await sendWhatsappText(from, "המוצר הזה כבר לא זמין. הנה התפריט העדכני:");
    await sendProductMenu(from);
    return;
  }

  const adminBotToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (adminBotToken && product.telegramFileId) {
    const imageUrl = await getTelegramFileUrl(adminBotToken, product.telegramFileId);
    await sendWhatsappImage(from, imageUrl, `${product.name} - ${product.price} ₪`);
  } else {
    await sendWhatsappText(from, `${product.name} - ${product.price} ₪`);
  }

  await sendWhatsappButtons(from, "איך תרצו לשלם?", [
    { id: "pay_bit", title: "ביט 💳" },
    { id: "pay_cash", title: "מזומן 💵" },
    { id: "cancel_order", title: "ביטול" },
  ]);
  await setWaSession(from, { productId: product.id });
}

async function handlePaymentSelected(from: string, paymentMethod: PaymentMethod) {
  const session = await getWaSession(from);
  const product = session.productId ? await getProduct(session.productId) : null;
  if (!product) {
    await clearWaSession(from);
    await sendWhatsappText(from, "אירעה שגיאה, בואו ננסה שוב:");
    await sendProductMenu(from);
    return;
  }

  const order = await addOrder({
    productId: product.id,
    productName: product.name,
    price: product.price,
    paymentMethod,
    channel: "whatsapp",
    customerId: from,
  });
  await clearWaSession(from);

  const paymentText =
    paymentMethod === "bit"
      ? `לתשלום בביט: ${process.env.MERAV_BIT_INFO || "נא לתאם עם מירב"}`
      : "התשלום יתבצע במזומן באיסוף / במשלוח";
  await sendWhatsappText(from, `תודה! ההזמנה שלך (${product.name}) התקבלה ✅\n${paymentText}`);

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
        `לקוח/ה (וואטסאפ): ${from}\n` +
        `מס' הזמנה: ${order.id}`
    );
  }
}

async function handleIncomingMessage(message: WhatsAppMessage) {
  const from = message.from;
  const interactive = message.interactive;

  if (interactive?.type === "list_reply" && interactive.list_reply?.id.startsWith("product:")) {
    await handleProductSelected(from, interactive.list_reply.id.slice("product:".length));
    return;
  }

  if (interactive?.type === "button_reply") {
    const id = interactive.button_reply?.id;
    if (id === "pay_bit" || id === "pay_cash") {
      await handlePaymentSelected(from, id === "pay_bit" ? "bit" : "cash");
      return;
    }
    if (id === "cancel_order") {
      await clearWaSession(from);
      await sendWhatsappText(from, "ההזמנה בוטלה. אפשר להתחיל הזמנה חדשה בכל עת 🙂");
      return;
    }
  }

  // Any other message (greeting, free text, unrecognized reply) opens the menu.
  await sendProductMenu(from);
}
