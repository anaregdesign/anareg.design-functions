import {INQUIRY_EVENT_SOURCE} from "./config";
import {JsonObject, serializeFirestoreData} from "./json";
import {
  NOTIFICATION_SCHEMA_VERSION,
  NotificationEnvelopeV1,
  assertNotificationEnvelope,
  buildNotificationMetadata,
  getNotificationAttributes,
} from "./notification";

export const LP_CUSTOMER_INQUIRY_CREATED_MESSAGE_TYPE =
  "lp.customerInquiry.created";
export const LP_CUSTOMER_INQUIRY_UPDATED_MESSAGE_TYPE =
  "lp.customerInquiry.updated";

export type InquiryMessageType =
  typeof LP_CUSTOMER_INQUIRY_CREATED_MESSAGE_TYPE |
  typeof LP_CUSTOMER_INQUIRY_UPDATED_MESSAGE_TYPE;

interface InquiryEventData extends JsonObject {
  documentId: string;
  before: JsonObject | null;
  after: JsonObject;
}

export type InquiryEventEnvelopeV1 =
  NotificationEnvelopeV1<InquiryEventData> & {
    messageType: InquiryMessageType;
    source: typeof INQUIRY_EVENT_SOURCE;
  };

interface BuildInquiryEventEnvelopeInput {
  eventId: string;
  eventTime: string | undefined;
  producedAt?: string;
  documentId: string;
  before: Record<string, unknown> | undefined;
  after: Record<string, unknown> | undefined;
}

export function buildInquiryEventEnvelope(
  input: BuildInquiryEventEnvelopeInput
): InquiryEventEnvelopeV1 | null {
  if (!input.after) {
    return null;
  }

  const before = input.before ? serializeFirestoreData(input.before) : null;
  const after = serializeFirestoreData(input.after);
  const messageType = before ?
    LP_CUSTOMER_INQUIRY_UPDATED_MESSAGE_TYPE :
    LP_CUSTOMER_INQUIRY_CREATED_MESSAGE_TYPE;
  const subject = `inquiries/${input.documentId}`;

  return {
    schemaVersion: NOTIFICATION_SCHEMA_VERSION,
    id: input.eventId,
    messageType,
    source: INQUIRY_EVENT_SOURCE,
    subject,
    time: input.eventTime ?? new Date().toISOString(),
    notification: {
      title: messageType === LP_CUSTOMER_INQUIRY_CREATED_MESSAGE_TYPE ?
        "New Customer Inquiry" :
        "Updated Customer Inquiry",
      body: subject,
    },
    metadata: buildNotificationMetadata({
      id: input.eventId,
      source: INQUIRY_EVENT_SOURCE,
      producedAt: input.producedAt,
    }),
    data: {
      documentId: input.documentId,
      before,
      after,
    },
  };
}

export function getInquiryEventAttributes(
  event: InquiryEventEnvelopeV1
): Record<string, string> {
  return {
    ...getNotificationAttributes(event),
    documentId: event.data.documentId,
  };
}

export function parseInquiryEventEnvelope(
  value: unknown
): InquiryEventEnvelopeV1 {
  assertNotificationEnvelope(value);

  if (!isInquiryMessageType(value.messageType)) {
    throw new Error(`Unsupported inquiry message type: ${value.messageType}`);
  }

  if (!isRecord(value.data) || !isRecord(value.data.after)) {
    throw new Error("Inquiry event data.after is required");
  }

  return value as unknown as InquiryEventEnvelopeV1;
}

export function isInquiryMessageType(
  messageType: string
): messageType is InquiryMessageType {
  return messageType === LP_CUSTOMER_INQUIRY_CREATED_MESSAGE_TYPE ||
    messageType === LP_CUSTOMER_INQUIRY_UPDATED_MESSAGE_TYPE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
