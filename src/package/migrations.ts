import { PresentationLoadError } from "./errors";

export function migratePresentationPackage(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion === 1) {
    return value;
  }

  throw new PresentationLoadError("UNSUPPORTED_SCHEMA_VERSION", `Unsupported Presentation Package schemaVersion: ${String(value.schemaVersion)}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
