import type { SmsMessage, SmsProvider, SmsResult } from "./provider";

type AfricaTalkingRecipient = {
  statusCode?: number;
  status?: string;
  messageId?: string;
  number?: string;
};

type AfricaTalkingResponse = {
  SMSMessageData?: {
    Message?: string;
    Recipients?: AfricaTalkingRecipient[];
  };
  errorMessage?: string;
};

const SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging";
const LIVE_URL = "https://api.africastalking.com/version1/messaging";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`SMS_PROVIDER_NOT_CONFIGURED:${name}`);
  return value;
}

function renderMessage(message: SmsMessage) {
  if (message.templateKey === "CONTACT_VERIFICATION_CODE") {
    const code = String(message.payload["code"] ?? "");
    const expires = String(message.payload["expires_in_minutes"] ?? "10");
    if (!/^\d{6}$/.test(code)) throw new Error("SMS_TEMPLATE_INVALID");
    return `RFCBANK : votre code de vérification est ${code}. Il expire dans ${expires} minutes.`;
  }

  throw new Error(`SMS_TEMPLATE_UNSUPPORTED:${message.templateKey}`);
}

export const africaTalkingSmsProvider: SmsProvider = {
  async send(message): Promise<SmsResult> {
    try {
      const apiKey = requiredEnv("AFRICASTALKING_API_KEY");
      const username = process.env["AFRICASTALKING_USERNAME"]?.trim() || "sandbox";
      const senderId = requiredEnv("AFRICASTALKING_SENDER_ID");
      const environment = process.env["AFRICASTALKING_ENV"]?.trim().toLowerCase() || "sandbox";
      const endpoint = environment === "production" || environment === "live" ? LIVE_URL : SANDBOX_URL;
      const text = renderMessage(message);

      const body = new URLSearchParams({
        username,
        to: message.recipient,
        message: text,
        from: senderId,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
        body,
      });

      const raw = await response.text();
      let data: AfricaTalkingResponse = {};
      try {
        data = JSON.parse(raw) as AfricaTalkingResponse;
      } catch {
        // Keep the provider error generic; never expose credentials or raw response bodies.
      }

      if (!response.ok) {
        return {
          state: "FAILED",
          providerReference: null,
          errorCode: `HTTP_${response.status}`,
        };
      }

      const recipient = data.SMSMessageData?.Recipients?.[0];
      const statusCode = recipient?.statusCode;

      if (statusCode === 100 || statusCode === 101 || statusCode === 102) {
        return {
          state: "SENT",
          providerReference: recipient?.messageId ?? null,
          errorCode: null,
        };
      }

      return {
        state: "FAILED",
        providerReference: recipient?.messageId ?? null,
        errorCode: recipient?.statusCode ? `AT_${recipient.statusCode}` : "AT_SEND_FAILED",
      };
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "SMS_SEND_FAILED";
      const errorCode = messageText.startsWith("SMS_PROVIDER_NOT_CONFIGURED:")
        ? messageText
        : messageText.startsWith("SMS_TEMPLATE_")
          ? messageText
          : "SMS_PROVIDER_REQUEST_FAILED";
      return { state: "FAILED", providerReference: null, errorCode };
    }
  },
};
