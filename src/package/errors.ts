export type PresentationLoadErrorCode = "INVALID_JSON" | "UNSUPPORTED_SCHEMA_VERSION" | "SCHEMA_VALIDATION_FAILED" | "REFERENCE_VALIDATION_FAILED" | "FETCH_FAILED";

export class PresentationLoadError extends Error {
  constructor(public readonly code: PresentationLoadErrorCode, message: string, public readonly issues: string[] = []) {
    super(message);
    this.name = "PresentationLoadError";
  }
}
