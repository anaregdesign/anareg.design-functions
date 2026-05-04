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
  parseInquiryEventEnvelope,
} from "../shared/inquiryEvent";
import {DEFAULT_NOTIFICATION_TARGET} from "../shared/notification";

const discordWebhookInquiries = defineSecret(DISCORD_WEBHOOK_INQUIRIES);

export const subscriberDiscordInquiryEvents =
  onMessagePublished<InquiryEventEnvelopeV1>(
    {
      topic: INQUIRY_EVENTS_TOPIC,
      secrets: [discordWebhookInquiries],
      retry: true,
    },
    async (event) => {
      const inquiryEvent = parseInquiryEventEnvelope(event.data.message.json);
      const webhookUrl = discordWebhookInquiries.value();

      if (inquiryEvent.target !== DEFAULT_NOTIFICATION_TARGET) {
        logger.info("Skipping inquiry event for unsupported Discord target", {
          eventId: inquiryEvent.id,
          target: inquiryEvent.target,
        });
        return;
      }

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
            target: inquiryEvent.target,
            status: error.status,
            error: error.message,
          });
          return;
        }

        logger.error("Discord webhook failed for inquiry event", {
          eventId: inquiryEvent.id,
          documentId: inquiryEvent.data.documentId,
          target: inquiryEvent.target,
          error,
        });
        throw error;
      }

      logger.info("Posted inquiry event to Discord", {
        eventId: inquiryEvent.id,
        eventType: inquiryEvent.type,
        documentId: inquiryEvent.data.documentId,
        target: inquiryEvent.target,
      });
    }
  );
