import {INQUIRY_EVENT_SOURCE} from "./config";
import {JsonObject, serializeFirestoreData} from "./json";
import {
  DEFAULT_NOTIFICATION_TARGET,
  NOTIFICATION_SCHEMA_VERSION,
  NotificationEnvelopeV1,
  assertNotificationEnvelope,
  buildNotificationMetadata,
  getNotificationAttributes,
} from "./notification";

export type InquiryEventType = "inquiry.created" | "inquiry.updated";

interface InquiryEventData extends JsonObject {
  documentId: string;
  before: JsonObject | null;
  after: JsonObject;
}

export type InquiryEventEnvelopeV1 =
  NotificationEnvelopeV1<InquiryEventData> & {
    type: InquiryEventType;
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
  const eventType = before ? "inquiry.updated" : "inquiry.created";
  const subject = `inquiries/${input.documentId}`;

  return {
    schemaVersion: NOTIFICATION_SCHEMA_VERSION,
    id: input.eventId,
    type: eventType,
    source: INQUIRY_EVENT_SOURCE,
    subject,
    time: input.eventTime ?? new Date().toISOString(),
    target: DEFAULT_NOTIFICATION_TARGET,
    notification: {
      title: eventType === "inquiry.created" ?
        "New Inquiry" :
        "Updated Inquiry",
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

  if (value.type !== "inquiry.created" && value.type !== "inquiry.updated") {
    throw new Error(`Unsupported inquiry event type: ${value.type}`);
  }

  if (!isRecord(value.data) || !isRecord(value.data.after)) {
    throw new Error("Inquiry event data.after is required");
  }

  return value as unknown as InquiryEventEnvelopeV1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
