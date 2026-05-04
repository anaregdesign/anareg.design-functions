import {InquiryEventEnvelopeV1} from "./inquiryEvent";
import {JsonValue} from "./json";

const DISCORD_FIELD_NAME_LIMIT = 256;
const DISCORD_FIELD_VALUE_LIMIT = 1024;
const DISCORD_EMBED_FIELD_LIMIT = 25;

export interface DiscordWebhookPayload {
  content: string;
  username: string;
  embeds: DiscordEmbed[];
}

interface DiscordEmbed {
  title: string;
  description: string;
  timestamp: string;
  fields: DiscordEmbedField[];
  footer: {
    text: string;
  };
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export class DiscordWebhookError extends Error {
  readonly retryable: boolean;
  readonly status?: number;

  constructor(message: string, retryable: boolean, status?: number) {
    super(message);
    this.retryable = retryable;
    this.status = status;
  }
}

export function buildDiscordInquiryPayload(
  event: InquiryEventEnvelopeV1
): DiscordWebhookPayload {
  const isCreated = event.type === "inquiry.created";
  const fields = buildInquiryFields(event);

  return {
    content: isCreated ? "Inquiry created" : "Inquiry updated",
    username: "Inquiry Bot",
    embeds: [
      {
        title: event.notification.title,
        description: event.notification.body,
        timestamp: event.time,
        fields,
        footer: {
          text: `deduplicationKey: ${event.metadata.deduplicationKey}`,
        },
      },
    ],
  };
}

export async function postDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new DiscordWebhookError(
      `Discord webhook request failed: ${toErrorMessage(error)}`,
      true
    );
  }

  if (response.ok) {
    return;
  }

  const responseBody = await response.text().catch(() => "");
  const retryable = response.status === 429 || response.status >= 500;

  throw new DiscordWebhookError(
    [
      `Discord webhook responded with ${response.status}`,
      response.statusText,
      truncate(responseBody, 240),
    ].filter(Boolean).join(": "),
    retryable,
    response.status
  );
}

function buildInquiryFields(
  event: InquiryEventEnvelopeV1
): DiscordEmbedField[] {
  const baseFields: DiscordEmbedField[] = [
    {
      name: "eventType",
      value: event.type,
      inline: true,
    },
    {
      name: "documentId",
      value: event.data.documentId,
      inline: true,
    },
    {
      name: "target",
      value: event.target,
      inline: true,
    },
  ];

  const inquiryFields = Object.entries(event.data.after)
    .slice(0, DISCORD_EMBED_FIELD_LIMIT - baseFields.length)
    .map(([name, value]) => ({
      name: truncate(name, DISCORD_FIELD_NAME_LIMIT),
      value: formatDiscordFieldValue(value),
      inline: true,
    }));

  const remainingFieldCount = Object.keys(event.data.after).length -
    inquiryFields.length;

  if (
    remainingFieldCount > 0 &&
    baseFields.length + inquiryFields.length < DISCORD_EMBED_FIELD_LIMIT
  ) {
    inquiryFields.push({
      name: "additionalFields",
      value: `${remainingFieldCount} field(s) omitted`,
      inline: false,
    });
  }

  return [...baseFields, ...inquiryFields];
}

function formatDiscordFieldValue(value: JsonValue): string {
  if (typeof value === "string") {
    return truncate(value || "(empty)", DISCORD_FIELD_VALUE_LIMIT);
  }

  return truncate(JSON.stringify(value), DISCORD_FIELD_VALUE_LIMIT);
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3)}...`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
