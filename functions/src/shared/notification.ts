import {JsonObject} from "./json";

export const NOTIFICATION_SCHEMA_VERSION = "1";

export interface NotificationEnvelopeV1<TData extends JsonObject> {
  schemaVersion: typeof NOTIFICATION_SCHEMA_VERSION;
  id: string;
  messageType: string;
  source: string;
  subject: string;
  time: string;
  notification: {
    title: string;
    body: string;
  };
  metadata: {
    correlationId: string;
    deduplicationKey: string;
    producedAt: string;
  };
  data: TData;
}

export function buildNotificationMetadata(input: {
  id: string;
  source: string;
  producedAt?: string;
  correlationId?: string;
}): NotificationEnvelopeV1<JsonObject>["metadata"] {
  return {
    correlationId: input.correlationId ?? input.id,
    deduplicationKey: `${input.source}:${input.id}`,
    producedAt: input.producedAt ?? new Date().toISOString(),
  };
}

export function getNotificationAttributes(
  event: NotificationEnvelopeV1<JsonObject>
): Record<string, string> {
  return {
    schemaVersion: event.schemaVersion,
    messageType: event.messageType,
    source: event.source,
    subject: event.subject,
    correlationId: event.metadata.correlationId,
    deduplicationKey: event.metadata.deduplicationKey,
  };
}

export function assertNotificationEnvelope(
  value: unknown
): asserts value is NotificationEnvelopeV1<JsonObject> {
  if (!isRecord(value)) {
    throw new Error("Pub/Sub message is not a JSON object");
  }

  if (value.schemaVersion !== NOTIFICATION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported notification schema: ${value.schemaVersion}`
    );
  }

  if (
    typeof value.id !== "string" ||
    typeof value.messageType !== "string" ||
    typeof value.source !== "string" ||
    typeof value.subject !== "string" ||
    typeof value.time !== "string"
  ) {
    throw new Error("Notification envelope is missing required fields");
  }

  if (!isRecord(value.notification) || !isRecord(value.metadata)) {
    throw new Error("Notification envelope is missing common sections");
  }

  if (
    typeof value.notification.title !== "string" ||
    typeof value.notification.body !== "string" ||
    typeof value.metadata.correlationId !== "string" ||
    typeof value.metadata.deduplicationKey !== "string" ||
    typeof value.metadata.producedAt !== "string"
  ) {
    throw new Error("Notification envelope common sections are invalid");
  }

  if (!isRecord(value.data)) {
    throw new Error("Notification envelope data is required");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
