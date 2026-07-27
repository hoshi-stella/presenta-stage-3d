import { PresentationLoadError } from "./errors";
import { migratePresentationPackage } from "./migrations";
import type { PresentationPackageV1 } from "./types";
import { assertValidPresentationPackage } from "./validator";

export async function loadPresentationFromUrl(url: string): Promise<PresentationPackageV1> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    throw new PresentationLoadError("FETCH_FAILED", `Presentation Package could not be fetched: ${message(error)}.`);
  }
  if (!response.ok) {
    throw new PresentationLoadError("FETCH_FAILED", `Presentation Package could not be fetched: ${response.status} ${response.statusText}.`);
  }
  return loadPresentationFromObject(await response.json());
}

export function loadPresentationFromJson(json: string): PresentationPackageV1 {
  try {
    return loadPresentationFromObject(JSON.parse(json) as unknown);
  } catch (error) {
    if (error instanceof PresentationLoadError) throw error;
    throw new PresentationLoadError("INVALID_JSON", `Presentation Package JSON is invalid: ${message(error)}.`);
  }
}

export function loadPresentationFromObject(value: unknown): PresentationPackageV1 {
  return assertValidPresentationPackage(migratePresentationPackage(value));
}

export async function loadPresentationFromFile(file: File): Promise<PresentationPackageV1> {
  try {
    return loadPresentationFromJson(await file.text());
  } catch (error) {
    if (error instanceof PresentationLoadError) throw error;
    throw new PresentationLoadError("INVALID_JSON", `Presentation Package file ${file.name} could not be read: ${message(error)}.`);
  }
}

function message(error: unknown): string { return error instanceof Error ? error.message : String(error); }
