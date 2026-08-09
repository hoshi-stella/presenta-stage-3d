import type { PresentationPackageV1 } from "../package/types";

export type RevisionSnapshot = {
  id: string;
  label?: string;
  note?: string;
  createdAt: string;
  presentation: PresentationPackageV1;
};

export type RevisionSnapshotInput = Omit<RevisionSnapshot, "presentation">;
export type RevisionCollectionDiff = {
  added: string[];
  removed: string[];
  reordered: Array<{ id: string; from: number; to: number }>;
};
export type PresentationRevisionDiff = {
  slides: RevisionCollectionDiff;
  cues: RevisionCollectionDiff;
  changes: {
    slideContent: string[];
    cueText: string[];
    cueSpeaker: string[];
    cueProfile: string[];
    publication: boolean;
    assetReferences: string[];
  };
};

export function recordRevisionSnapshot(
  presentation: PresentationPackageV1,
  input: RevisionSnapshotInput
): RevisionSnapshot {
  return { ...input, label: input.label?.trim() || undefined, note: input.note?.trim() || undefined, presentation: structuredClone(presentation) };
}

export function listRevisionSnapshots(snapshots: RevisionSnapshot[]): RevisionSnapshot[] {
  return snapshots
    .map((snapshot) => structuredClone(snapshot))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function restoreRevisionSnapshot(
  currentDraft: PresentationPackageV1,
  snapshot: RevisionSnapshot
): PresentationPackageV1 {
  void currentDraft;
  return structuredClone(snapshot.presentation);
}

export function diffPresentationRevision(before: PresentationPackageV1, after: PresentationPackageV1): PresentationRevisionDiff {
  return {
    slides: diffIds(before.slides.map((slide) => slide.id), after.slides.map((slide) => slide.id)),
    cues: diffIds(before.cues.map((cue) => cue.id), after.cues.map((cue) => cue.id)),
    changes: {
      slideContent: changedIds(before.slides, after.slides, (slide) => ({ title: slide.title, subtitle: slide.subtitle, body: slide.body, bullets: slide.bullets, columns: slide.columns, layout: slide.layout })),
      cueText: changedIds(before.cues, after.cues, (cue) => cue.text),
      cueSpeaker: changedIds(before.cues, after.cues, (cue) => cue.speaker),
      cueProfile: changedIds(before.cues, after.cues, (cue) => cue.presentation?.profile),
      publication: serialized(before.publication) !== serialized(after.publication),
      assetReferences: [
        ...changedIds(before.slides, after.slides, (slide) => ({ assetId: slide.image?.assetId, url: slide.image?.url })),
        ...changedIds(before.cues, after.cues, (cue) => cue.stage?.effects)
      ]
    }
  };
}

function diffIds(before: string[], after: string[]): RevisionCollectionDiff {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const sharedBefore = before.filter((id) => afterSet.has(id));
  const sharedAfter = after.filter((id) => beforeSet.has(id));
  const beforePositions = new Map(sharedBefore.map((id, index) => [id, index]));
  return {
    added: after.filter((id) => !beforeSet.has(id)),
    removed: before.filter((id) => !afterSet.has(id)),
    reordered: sharedAfter.flatMap((id, index) => {
      const from = beforePositions.get(id);
      return from !== undefined && from !== index ? [{ id, from, to: index }] : [];
    })
  };
}

function changedIds<T extends { id: string }>(before: T[], after: T[], value: (item: T) => unknown): string[] {
  const beforeById = new Map(before.map((item) => [item.id, item]));
  return after.flatMap((item) => {
    const previous = beforeById.get(item.id);
    return previous && serialized(value(previous)) !== serialized(value(item)) ? [item.id] : [];
  });
}

function serialized(value: unknown): string {
  return JSON.stringify(value) ?? "undefined";
}
