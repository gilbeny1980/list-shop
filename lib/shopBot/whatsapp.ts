const GRAPH_VERSION = "v21.0";

function apiUrl(): string {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

async function callWhatsapp(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(apiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${res.status} ${await res.text()}`);
  }
}

export async function sendWhatsappText(to: string, text: string): Promise<void> {
  await callWhatsapp({ to, type: "text", text: { body: text } });
}

export async function sendWhatsappImage(to: string, link: string, caption?: string): Promise<void> {
  await callWhatsapp({ to, type: "image", image: { link, caption } });
}

export interface WhatsappListRow {
  id: string;
  title: string;
  description?: string;
}

export async function sendWhatsappList(
  to: string,
  bodyText: string,
  buttonText: string,
  rows: WhatsappListRow[]
): Promise<void> {
  await callWhatsapp({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText.slice(0, 20),
        sections: [
          {
            rows: rows.map((r) => ({
              id: r.id,
              title: r.title.slice(0, 24),
              description: r.description?.slice(0, 72),
            })),
          },
        ],
      },
    },
  });
}

export interface WhatsappReplyButton {
  id: string;
  title: string;
}

export async function sendWhatsappButtons(
  to: string,
  bodyText: string,
  buttons: WhatsappReplyButton[]
): Promise<void> {
  await callWhatsapp({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })),
      },
    },
  });
}
