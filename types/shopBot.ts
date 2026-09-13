export interface BotProduct {
  id: string;
  name: string;
  price: number;
  telegramFileId: string;
  active: boolean;
  createdAt: string;
}

export type PaymentMethod = "bit" | "cash";

export interface BotOrder {
  id: string;
  productId: string;
  productName: string;
  price: number;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  createdAt: string;
}

// WhatsApp customer conversation state, keyed by phone number.
// A `productId` means the customer picked a product and we're waiting for
// their payment choice.
export interface WaSession {
  productId?: string;
}

// Telegram admin "/addproduct" conversation state, keyed by chat id.
export type AdminSessionState = "awaiting_name" | "awaiting_price" | "awaiting_photo";
export interface AdminSession {
  state: AdminSessionState;
  name?: string;
  price?: number;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  photo?: TelegramPhotoSize[];
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface WhatsAppInteractiveReply {
  type: "list_reply" | "button_reply";
  list_reply?: { id: string; title: string };
  button_reply?: { id: string; title: string };
}

export interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  interactive?: WhatsAppInteractiveReply;
}

export interface WhatsAppWebhookBody {
  entry?: {
    changes?: {
      value?: {
        messages?: WhatsAppMessage[];
      };
    }[];
  }[];
}
