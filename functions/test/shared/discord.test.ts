import assert from "node:assert/strict";
import test from "node:test";

import {buildDiscordInquiryPayload} from "../../src/shared/discord";
import {InquiryEventEnvelopeV1} from "../../src/shared/inquiryEvent";

test("buildDiscordInquiryPayload formats created inquiry messages", () => {
  const event: InquiryEventEnvelopeV1 = {
    schemaVersion: "1",
    id: "event-1",
    type: "inquiry.created",
    source: "firestore.inquiries",
    subject: "inquiries/inquiry-1",
    time: "2026-05-04T12:00:00.000Z",
    data: {
      documentId: "inquiry-1",
      before: null,
      after: {
        email: "user@example.com",
        message: "Hello",
      },
    },
  };

  const payload = buildDiscordInquiryPayload(event);

  assert.equal(payload.content, "Inquiry created");
  assert.equal(payload.username, "Inquiry Bot");
  assert.equal(payload.embeds[0].title, "New Inquiry");
  assert.deepEqual(payload.embeds[0].fields.slice(0, 4), [
    {
      name: "eventType",
      value: "inquiry.created",
      inline: true,
    },
    {
      name: "documentId",
      value: "inquiry-1",
      inline: true,
    },
    {
      name: "email",
      value: "user@example.com",
      inline: true,
    },
    {
      name: "message",
      value: "Hello",
      inline: true,
    },
  ]);
});

test("buildDiscordInquiryPayload truncates long field values", () => {
  const event: InquiryEventEnvelopeV1 = {
    schemaVersion: "1",
    id: "event-1",
    type: "inquiry.updated",
    source: "firestore.inquiries",
    subject: "inquiries/inquiry-1",
    time: "2026-05-04T12:00:00.000Z",
    data: {
      documentId: "inquiry-1",
      before: {
        message: "old",
      },
      after: {
        message: "a".repeat(2000),
      },
    },
  };

  const payload = buildDiscordInquiryPayload(event);
  const messageField = payload.embeds[0].fields.find((field) => {
    return field.name === "message";
  });

  assert.equal(payload.content, "Inquiry updated");
  assert.equal(payload.embeds[0].title, "Updated Inquiry");
  assert.equal(messageField?.value.length, 1024);
  assert.equal(messageField?.value.endsWith("..."), true);
});
