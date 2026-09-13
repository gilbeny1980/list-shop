const TELEGRAM_API = "https://api.telegram.org";

async function telegramCall(botToken, method, body) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  return data.result;
}

async function sendTelegramMessage(botToken, chatId, text) {
  await telegramCall(botToken, "sendMessage", { chat_id: chatId, text });
}

// Downloads a product photo the admin uploaded via the Telegram bot, so it
// can be forwarded to a WhatsApp chat as an actual image (WhatsApp doesn't
// accept another platform's file id — it needs the raw bytes).
async function downloadTelegramFile(botToken, fileId) {
  const file = await telegramCall(botToken, "getFile", { file_id: fileId });
  const res = await fetch(`${TELEGRAM_API}/file/bot${botToken}/${file.file_path}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { sendTelegramMessage, downloadTelegramFile };
