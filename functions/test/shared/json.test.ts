import assert from "node:assert/strict";
import test from "node:test";

import {serializeFirestoreValue} from "../../src/shared/json";

test("serializeFirestoreValue returns JSON-safe data", () => {
  const timestamp = {
    toDate: () => new Date("2026-05-04T12:00:00.000Z"),
  };

  assert.deepEqual(
    serializeFirestoreValue({
      name: "Anareg",
      sentAt: timestamp,
      updatedAt: new Date("2026-05-04T13:00:00.000Z"),
      nested: {
        values: [1, undefined, BigInt(42)],
      },
    }),
    {
      name: "Anareg",
      sentAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-05-04T13:00:00.000Z",
      nested: {
        values: [1, null, "42"],
      },
    }
  );
});
