import {INQUIRY_EVENT_SOURCE} from "./config";
import {JsonObject, serializeFirestoreData} from "./json";

export const INQUIRY_EVENT_SCHEMA_VERSION = "1";

export type InquiryEventType = "inquiry.created" | "inquiry.updated";

export interface InquiryEventEnvelopeV1 {
  schemaVersion: typeof INQUIRY_EVENT_SCHEMA_VERSION;
  id: string;
  type: InquiryEventType;
  source: typeof INQUIRY_EVENT_SOURCE;
  subject: string;
  time: string;
  data: {
    documentId: string;
    before: JsonObject | null;
    after: JsonObject;
  };
}

interface BuildInquiryEventEnvelopeInput {
  eventId: string;
  eventTime: string | undefined;
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

  return {
    schemaVersion: INQUIRY_EVENT_SCHEMA_VERSION,
    id: input.eventId,
    type: before ? "inquiry.updated" : "inquiry.created",
    source: INQUIRY_EVENT_SOURCE,
    subject: `inquiries/${input.documentId}`,
    time: input.eventTime ?? new Date().toISOString(),
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
    schemaVersion: event.schemaVersion,
    eventType: event.type,
    source: event.source,
    documentId: event.data.documentId,
  };
}

export function parseInquiryEventEnvelope(
  value: unknown
): InquiryEventEnvelopeV1 {
  if (!isRecord(value)) {
    throw new Error("Pub/Sub message is not a JSON object");
  }

  if (value.schemaVersion !== INQUIRY_EVENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported inquiry event schema: ${value.schemaVersion}`);
  }

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
