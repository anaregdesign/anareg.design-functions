import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInquiryEventEnvelope,
  getInquiryEventAttributes,
  parseInquiryEventEnvelope,
} from "../../src/shared/inquiryEvent";

test("buildInquiryEventEnvelope builds created inquiry events", () => {
  const event = buildInquiryEventEnvelope({
    eventId: "event-1",
    eventTime: "2026-05-04T12:00:00.000Z",
    producedAt: "2026-05-04T12:00:01.000Z",
    documentId: "inquiry-1",
    before: undefined,
    after: {
      email: "user@example.com",
    },
  });

  assert.deepEqual(event, {
    schemaVersion: "1",
    id: "event-1",
    type: "inquiry.created",
    source: "firestore.inquiries",
    subject: "inquiries/inquiry-1",
    time: "2026-05-04T12:00:00.000Z",
    target: "*",
    notification: {
      title: "New Inquiry",
      body: "inquiries/inquiry-1",
    },
    metadata: {
      correlationId: "event-1",
      deduplicationKey: "firestore.inquiries:event-1",
      producedAt: "2026-05-04T12:00:01.000Z",
    },
    data: {
      documentId: "inquiry-1",
      before: null,
      after: {
        email: "user@example.com",
      },
    },
  });
});

test("buildInquiryEventEnvelope skips deleted inquiry events", () => {
  const event = buildInquiryEventEnvelope({
    eventId: "event-1",
    eventTime: "2026-05-04T12:00:00.000Z",
    documentId: "inquiry-1",
    before: {
      email: "user@example.com",
    },
    after: undefined,
  });

  assert.equal(event, null);
});

test("getInquiryEventAttributes returns stable Pub/Sub attributes", () => {
  const event = parseInquiryEventEnvelope({
    schemaVersion: "1",
    id: "event-1",
    type: "inquiry.updated",
    source: "firestore.inquiries",
    subject: "inquiries/inquiry-1",
    time: "2026-05-04T12:00:00.000Z",
    target: "*",
    notification: {
      title: "Updated Inquiry",
      body: "inquiries/inquiry-1",
    },
    metadata: {
      correlationId: "event-1",
      deduplicationKey: "firestore.inquiries:event-1",
      producedAt: "2026-05-04T12:00:01.000Z",
    },
    data: {
      documentId: "inquiry-1",
      before: {
        email: "old@example.com",
      },
      after: {
        email: "new@example.com",
      },
    },
  });

  assert.deepEqual(getInquiryEventAttributes(event), {
    schemaVersion: "1",
    eventType: "inquiry.updated",
    source: "firestore.inquiries",
    subject: "inquiries/inquiry-1",
    target: "*",
    correlationId: "event-1",
    deduplicationKey: "firestore.inquiries:event-1",
    documentId: "inquiry-1",
  });
});
