/**
 * Send a message via the Golang WhatsApp bot.
 * Centralizes TLS handling and error management so individual routes
 * don't scatter process.env.NODE_TLS_REJECT_UNAUTHORIZED everywhere.
 */

const GOLANG_BOT_URL = process.env.GOLANG_BOT_URL || "https://bot.rafliramadhani.site";
const BOT_API_TOKEN = process.env.BOT_API_TOKEN || "";

function getBotBaseUrl(): string {
  return GOLANG_BOT_URL.endsWith("/") ? GOLANG_BOT_URL.slice(0, -1) : GOLANG_BOT_URL;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const baseUrl = getBotBaseUrl();
  
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (BOT_API_TOKEN) {
      headers["X-API-Token"] = BOT_API_TOKEN;
    }

    const res = await fetch(`${baseUrl}/send-message`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone, message }),
    });

    if (!res.ok) {
      console.error(`❌ Bot send failed to ${phone}: ${res.status} ${await res.text()}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`❌ Bot send error to ${phone}:`, err);
    return false;
  }
}

/**
 * Fire-and-forget variant — does not block the caller.
 * Use for non-critical notifications (e.g. admin alerts).
 */
export function sendWhatsAppMessageAsync(phone: string, message: string): void {
  sendWhatsAppMessage(phone, message).catch((err) =>
    console.error("Background WA send failed:", err)
  );
}
