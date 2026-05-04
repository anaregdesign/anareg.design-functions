import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

import {
  INQUIRIES_DOCUMENT_PATH,
  INQUIRY_EVENTS_TOPIC,
} from "../shared/config";
import {
  buildInquiryEventEnvelope,
  getInquiryEventAttributes,
} from "../shared/inquiryEvent";
import {publishJsonMessage} from "../shared/pubsub";

export const publisherFirestoreInquiryEvents = onDocumentWritten(
  {
    document: INQUIRIES_DOCUMENT_PATH,
    retry: true,
  },
  async (event) => {
    const documentId = String(event.params.documentId);
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    const inquiryEvent = buildInquiryEventEnvelope({
      eventId: event.id,
      eventTime: event.time,
      documentId,
      before,
      after,
    });

    if (!inquiryEvent) {
      logger.info("Skipping deleted inquiry document", {
        eventId: event.id,
        documentId,
      });
      return;
    }

    const messageId = await publishJsonMessage(
      INQUIRY_EVENTS_TOPIC,
      inquiryEvent,
      getInquiryEventAttributes(inquiryEvent)
    );

    logger.info("Published inquiry event", {
      eventId: inquiryEvent.id,
      eventType: inquiryEvent.type,
      documentId,
      messageId,
      topic: INQUIRY_EVENTS_TOPIC,
    });
  }
);
