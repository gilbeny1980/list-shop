import { TelegramInlineKeyboard } from "@/types/shopBot";

const TELEGRAM_API = "https://api.telegram.org";

export async function telegramCall<T = unknown>(
  botToken: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  return data.result as T;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  replyMarkup?: TelegramInlineKeyboard
): Promise<void> {
  await telegramCall(botToken, "sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
}

// Re-sending a photo the bot already has (e.g. a product photo an admin
// uploaded earlier) only needs the permanent file_id — no re-upload needed.
export async function sendTelegramPhoto(
  botToken: string,
  chatId: string | number,
  fileId: string,
  caption?: string,
  replyMarkup?: TelegramInlineKeyboard
): Promise<void> {
  await telegramCall(botToken, "sendPhoto", { chat_id: chatId, photo: fileId, caption, reply_markup: replyMarkup });
}

// Acknowledges a button tap so Telegram stops showing the loading spinner
// on the user's client.
export async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string): Promise<void> {
  await telegramCall(botToken, "answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

// Telegram file links are only valid for a short while after being minted,
// so we fetch a fresh one right before handing it to WhatsApp rather than
// storing it — the permanent identifier is the file_id.
export async function getTelegramFileUrl(botToken: string, fileId: string): Promise<string> {
  const file = await telegramCall<{ file_path: string }>(botToken, "getFile", { file_id: fileId });
  return `${TELEGRAM_API}/file/bot${botToken}/${file.file_path}`;
}
