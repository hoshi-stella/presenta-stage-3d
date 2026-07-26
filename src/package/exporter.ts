import type { PresentationPackageV1 } from "./types";
import { validatePresentationPackage } from "./validator";

export type PresentationExportOptions = { pretty?: boolean; updateUpdatedAt?: boolean };

export function serializePresentationPackage(presentation: PresentationPackageV1, options: PresentationExportOptions = {}): string {
  const nextPackage = options.updateUpdatedAt
    ? { ...presentation, presentation: { ...presentation.presentation, updatedAt: new Date().toISOString() } }
    : presentation;
  const validation = validatePresentationPackage(nextPackage);
  if (!validation.valid) {
    throw new Error(`Presentation Package cannot be exported: ${validation.errors.map((issue) => issue.message).join(" ")}`);
  }
  return JSON.stringify(removeUndefined(nextPackage), null, options.pretty === false ? undefined : 2) + (options.pretty === false ? "" : "\n");
}

export function downloadPresentationPackage(presentation: PresentationPackageV1, filename?: string): void {
  const content = serializePresentationPackage(presentation, { pretty: true });
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `${safeFilename(presentation.presentation.id || presentation.presentation.title)}.presentation.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function safeFilename(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return normalized || "presentation";
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, removeUndefined(item)]));
}
