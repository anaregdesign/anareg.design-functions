export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

interface TimestampLike {
  toDate: () => Date;
}

export function serializeFirestoreData(
  data: Record<string, unknown>
): JsonObject {
  return serializeFirestoreValue(data) as JsonObject;
}

export function serializeFirestoreValue(value: unknown): JsonValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        serializeFirestoreValue(item),
      ])
    );
  }

  return String(value);
}

function isTimestampLike(value: unknown): value is TimestampLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TimestampLike>;
  if (typeof candidate.toDate !== "function") {
    return false;
  }

  try {
    return candidate.toDate() instanceof Date;
  } catch {
    return false;
  }
}
