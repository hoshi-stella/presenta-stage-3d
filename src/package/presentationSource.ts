import { loadPresentationFromJson } from "./loader";
import type { PresentationPackageV1 } from "./types";

const stageHandoffKey = "presenta-stage-3d.stage-handoff";

export function getPresentationPackageUrl(url = new URL(window.location.href)): string {
  return url.searchParams.get("presentation") ?? import.meta.env.VITE_PRESENTATION_URL ?? "/presentations/demo/lt-showcase/presentation.json";
}

export function handoffPresentationToStage(presentation: PresentationPackageV1): void {
  window.sessionStorage.setItem(stageHandoffKey, JSON.stringify(presentation));
}

export function consumeStagePresentationHandoff(): PresentationPackageV1 | null {
  const serialized = window.sessionStorage.getItem(stageHandoffKey);
  if (!serialized) return null;
  window.sessionStorage.removeItem(stageHandoffKey);
  return loadPresentationFromJson(serialized);
}
