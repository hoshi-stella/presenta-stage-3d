import type { PresentationLifecycleState, PresentationPackageV1 } from "../package/types";
import { validatePresentationPackage } from "../package/validator";

export type RemotePresentationSummary = {
  presentationKey: string;
  title: string;
  lifecycle: PresentationLifecycleState;
  updatedAt: string;
  revisionNumber: number | null;
  snapshotName: string | null;
  revisionCreatedAt: string | null;
};

export type StoredPresentation = {
  presentation: PresentationPackageV1;
  revision: { id: string; number: number; snapshotName: string | null; snapshotNote: string | null; createdAt?: string };
  lifecycle: PresentationLifecycleState;
};

export type StoredPresentationResult = {
  presentationKey: string;
  lifecycle: PresentationLifecycleState;
  revision: { id: string; number: number; snapshotName: string | null; snapshotNote: string | null };
};

export async function listRemotePresentations(): Promise<RemotePresentationSummary[]> {
  const response = await fetch("/api/presentations");
  const body = await readJson(response);
  if (!response.ok) throw new Error(apiError(body, "Could not load local presentations."));
  return Array.isArray(body.presentations) ? body.presentations as RemotePresentationSummary[] : [];
}

export async function loadRemotePresentation(presentationKey: string): Promise<StoredPresentation> {
  const response = await fetch(`/api/presentations/${encodeURIComponent(presentationKey)}`);
  const body = await readJson(response);
  if (!response.ok) throw new Error(apiError(body, "Could not load the selected presentation."));
  return body as StoredPresentation;
}

export async function saveRemotePresentation(presentation: PresentationPackageV1, snapshot?: { name?: string; note?: string }): Promise<StoredPresentationResult> {
  const validation = validatePresentationPackage(presentation);
  if (!validation.valid) throw new Error(`Resolve ${validation.errors.length} Package validation error(s) before saving to MariaDB.`);
  const response = await fetch(`/api/presentations/${encodeURIComponent(presentation.presentation.id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ presentation, snapshot })
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(apiError(body, "Could not save the presentation to MariaDB."));
  return body as StoredPresentationResult;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function apiError(body: Record<string, unknown>, fallback: string): string {
  if (typeof body.error === "string") return body.error;
  return fallback;
}
