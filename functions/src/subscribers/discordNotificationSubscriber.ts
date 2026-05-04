import {defineSecret} from "firebase-functions/params";
import {onMessagePublished} from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";

import {
  DISCORD_WEBHOOK_INQUIRIES,
  INQUIRY_EVENTS_TOPIC,
} from "../shared/config";
import {
  DiscordWebhookError,
  buildDiscordInquiryPayload,
  postDiscordWebhook,
} from "../shared/discord";
import {
  InquiryEventEnvelopeV1,
  isInquiryMessageType,
  parseInquiryEventEnvelope,
} from "../shared/inquiryEvent";

const discordWebhookInquiries = defineSecret(DISCORD_WEBHOOK_INQUIRIES);

export const subscriberDiscordNotifications =
  onMessagePublished<InquiryEventEnvelopeV1>(
    {
      topic: INQUIRY_EVENTS_TOPIC,
      secrets: [discordWebhookInquiries],
      retry: true,
    },
    async (event) => {
      const rawMessage = event.data.message.json;

      if (isTypedNotification(rawMessage) &&
        !isInquiryMessageType(rawMessage.messageType)) {
        logger.info("Skipping unsupported Discord message type", {
          eventId: rawMessage.id,
          messageType: rawMessage.messageType,
        });
        return;
      }

      const inquiryEvent = parseInquiryEventEnvelope(rawMessage);
      const webhookUrl = discordWebhookInquiries.value();

      if (!webhookUrl) {
        throw new Error(`${DISCORD_WEBHOOK_INQUIRIES} is not set`);
      }

      const payload = buildDiscordInquiryPayload(inquiryEvent);

      try {
        await postDiscordWebhook(webhookUrl, payload);
      } catch (error) {
        if (error instanceof DiscordWebhookError && !error.retryable) {
          logger.error("Discord webhook rejected inquiry event permanently", {
            eventId: inquiryEvent.id,
            documentId: inquiryEvent.data.documentId,
            messageType: inquiryEvent.messageType,
            status: error.status,
            error: error.message,
          });
          return;
        }

        logger.error("Discord webhook failed for inquiry event", {
          eventId: inquiryEvent.id,
          documentId: inquiryEvent.data.documentId,
          messageType: inquiryEvent.messageType,
          error,
        });
        throw error;
      }

      logger.info("Posted inquiry event to Discord", {
        eventId: inquiryEvent.id,
        messageType: inquiryEvent.messageType,
        documentId: inquiryEvent.data.documentId,
      });
    }
  );

function isTypedNotification(value: unknown): value is {
  id: string;
  messageType: string;
} {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).id === "string" &&
    typeof (value as Record<string, unknown>).messageType === "string";
}
