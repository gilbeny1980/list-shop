const express = require("express");
const QRCode = require("qrcode");
const pino = require("pino");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const { getActiveProducts, getProduct, addOrder, getWaSession, setWaSession, clearWaSession } = require("./lib/storage");
const { sendTelegramMessage, downloadTelegramFile } = require("./lib/telegram");

const AUTH_DIR = process.env.AUTH_DIR || "./auth_data";
const PORT = process.env.PORT || 3000;
const SESSION_TTL_SECONDS = 60 * 60 * 24;

let latestQr = null;
let connectionStatus = "starting";
let sock = null;

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "warn" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQr = qr;
      connectionStatus = "waiting_for_scan";
    }

    if (connection === "open") {
      latestQr = null;
      connectionStatus = "connected";
      console.log("WhatsApp connected ✅");
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log("WhatsApp connection closed", { statusCode, loggedOut });
      if (!loggedOut) {
        startSock();
      } else {
        console.log("Logged out — delete the auth folder and restart to re-link with a new QR code.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      try {
        await handleIncomingMessage(msg);
      } catch (err) {
        console.error("Error handling WhatsApp message", err);
      }
    }
  });
}

function extractText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    ""
  );
}

async function handleIncomingMessage(msg) {
  if (msg.key.fromMe) return;
  const remoteJid = msg.key.remoteJid || "";
  if (!remoteJid.endsWith("@s.whatsapp.net")) return; // ignore groups/broadcasts/status

  const phone = remoteJid.split("@")[0];
  const text = extractText(msg).trim();
  const pushName = msg.pushName || phone;

  const session = await getWaSession(phone);

  if (session.stage === "payment" && session.productId) {
    if (text === "1") return handlePayment(phone, session.productId, "bit", pushName);
    if (text === "2") return handlePayment(phone, session.productId, "cash", pushName);
    if (text === "0") {
      await clearWaSession(phone);
      return sendText(phone, "ההזמנה בוטלה. אפשר להתחיל הזמנה חדשה בכל עת 🙂");
    }
    return sendText(phone, "לא הבנתי. הקלידו 1 לתשלום בביט, 2 למזומן, או 0 לביטול.");
  }

  if (session.stage === "menu" && session.productIds?.length) {
    const idx = parseInt(text, 10);
    if (idx >= 1 && idx <= session.productIds.length) {
      return handleProductSelected(phone, session.productIds[idx - 1]);
    }
    return showMenu(phone, "לא הבנתי — נא להקליד רק את המספר של המוצר.");
  }

  await showMenu(phone, "ברוכים הבאים למתוקים של מירב מלך! 🍰");
}

async function showMenu(phone, greeting) {
  const products = await getActiveProducts();
  if (products.length === 0) {
    await clearWaSession(phone);
    return sendText(phone, "מצטערים, אין כרגע מוצרים זמינים להזמנה 🙏");
  }

  const lines = products.map((p, i) => `${i + 1}. ${p.name} - ${p.price} ₪`);
  const text = `${greeting}\nמה תרצו להזמין?\n\n${lines.join("\n")}\n\nהקלידו את המספר של המוצר.`;
  await sendText(phone, text);
  await setWaSession(phone, { stage: "menu", productIds: products.map((p) => p.id) }, SESSION_TTL_SECONDS);
}

async function handleProductSelected(phone, productId) {
  const product = await getProduct(productId);
  if (!product || !product.active) {
    return showMenu(phone, "המוצר הזה כבר לא זמין. הנה התפריט העדכני:");
  }

  const adminBotToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  let imageSent = false;
  if (adminBotToken) {
    try {
      const buffer = await downloadTelegramFile(adminBotToken, product.telegramFileId);
      await sock.sendMessage(`${phone}@s.whatsapp.net`, {
        image: buffer,
        caption: `${product.name} - ${product.price} ₪`,
      });
      imageSent = true;
    } catch (err) {
      console.error("Failed to fetch/send product photo", err);
    }
  }
  if (!imageSent) {
    await sendText(phone, `${product.name} - ${product.price} ₪`);
  }

  await sendText(phone, "איך תרצו לשלם?\n1. ביט 💳\n2. מזומן 💵\n0. ביטול");
  await setWaSession(phone, { stage: "payment", productId: product.id }, SESSION_TTL_SECONDS);
}

async function handlePayment(phone, productId, paymentMethod, customerName) {
  const product = await getProduct(productId);
  if (!product) {
    await clearWaSession(phone);
    return showMenu(phone, "אירעה שגיאה, בואו ננסה שוב:");
  }

  const order = await addOrder({
    productId: product.id,
    productName: product.name,
    price: product.price,
    paymentMethod,
    channel: "whatsapp",
    customerId: phone,
    customerName,
  });
  await clearWaSession(phone);

  const paymentText =
    paymentMethod === "bit"
      ? `לתשלום בביט: ${process.env.MERAV_BIT_INFO || "נא לתאם עם מירב"}`
      : "התשלום יתבצע במזומן באיסוף / במשלוח";
  await sendText(phone, `תודה! ההזמנה שלך (${product.name}) התקבלה ✅\n${paymentText}`);

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
        `לקוח/ה (וואטסאפ): ${customerName} (${phone})\n` +
        `מס' הזמנה: ${order.id}`
    );
  }
}

async function sendText(phone, text) {
  await sock.sendMessage(`${phone}@s.whatsapp.net`, { text });
}

// ── Small web UI so the QR code can be scanned from a browser ─────────
const app = express();

app.get("/", async (_req, res) => {
  if (connectionStatus === "connected") {
    res.send("<h1>WhatsApp מחובר ✅</h1>");
    return;
  }
  if (!latestQr) {
    res.send("<h1>ממתין לקוד QR... רעננו את הדף בעוד כמה שניות</h1>");
    return;
  }
  const dataUrl = await QRCode.toDataURL(latestQr);
  res.send(`
    <html dir="rtl"><body style="text-align:center;font-family:sans-serif">
      <h1>סרקו את הקוד עם וואטסאפ</h1>
      <p>וואטסאפ ← הגדרות ← מכשירים מקושרים ← קישור מכשיר</p>
      <img src="${dataUrl}" width="300" height="300" />
      <p><small>הדף מתרענן אוטומטית כל 15 שניות</small></p>
      <script>setTimeout(() => location.reload(), 15000)</script>
    </body></html>
  `);
});

app.get("/health", (_req, res) => res.json({ status: connectionStatus }));

app.listen(PORT, () => console.log(`QR/health server listening on port ${PORT}`));

startSock();
