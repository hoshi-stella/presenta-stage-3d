import type { CueDefinition, PresentationPackageV1 } from "../package/types";

export function createCue(slideRef?: string): CueDefinition {
  return { id: "cue_new", kind: "talk", speaker: "dummy", text: "New cue", slideRef, direction: { intent: "neutral", intensity: "low" }, after: { mode: "wait_for_presenter" }, publication: { visible: true, includeInReadingView: true, includeInReplayView: true } };
}

export function addCue(presentation: PresentationPackageV1, slideRef?: string): PresentationPackageV1 {
  const cue = { ...createCue(slideRef), id: nextCueId(presentation.cues) };
  return { ...presentation, cues: [...presentation.cues, cue] };
}

export function duplicateCue(presentation: PresentationPackageV1, cueId: string): PresentationPackageV1 {
  const index = presentation.cues.findIndex((cue) => cue.id === cueId);
  if (index < 0) return presentation;
  const source = structuredClone(presentation.cues[index]);
  const duplicate = { ...source, id: nextCueId(presentation.cues), text: `${source.text} (copy)` };
  return { ...presentation, cues: [...presentation.cues.slice(0, index + 1), duplicate, ...presentation.cues.slice(index + 1)] };
}

export function moveCue(presentation: PresentationPackageV1, cueId: string, offset: -1 | 1): PresentationPackageV1 {
  const index = presentation.cues.findIndex((cue) => cue.id === cueId); const target = index + offset;
  if (index < 0 || target < 0 || target >= presentation.cues.length) return presentation;
  const cues = [...presentation.cues]; [cues[index], cues[target]] = [cues[target], cues[index]];
  return { ...presentation, cues };
}

export function updateCue(presentation: PresentationPackageV1, cueId: string, changes: Partial<CueDefinition>): PresentationPackageV1 {
  return { ...presentation, cues: presentation.cues.map((cue) => cue.id === cueId ? { ...cue, ...changes } : cue) };
}

export function deleteCue(presentation: PresentationPackageV1, cueId: string): PresentationPackageV1 {
  if (presentation.cues.length <= 1) return presentation;
  return { ...presentation, cues: presentation.cues.filter((cue) => cue.id !== cueId).map((cue) => ({ ...cue, after: cue.after.branches ? { ...cue.after, branches: cue.after.branches.filter((branch) => branch.targetCueId !== cueId) } : cue.after })) };
}

function nextCueId(cues: CueDefinition[]): string {
  let index = cues.length + 1;
  while (cues.some((cue) => cue.id === `cue_${String(index).padStart(2, "0")}`)) index += 1;
  return `cue_${String(index).padStart(2, "0")}`;
}
