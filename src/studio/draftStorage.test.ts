import { describe, expect, it } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { clearStudioDraft, loadStudioDraft, saveStudioDraft, type StudioStorage } from "./draftStorage";

function storage(): StudioStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe("Studio draft storage", () => {
  it("persists and restores a local crash-recovery draft", () => {
    const localStorage = storage();
    const draft = { presentation: createDefaultPresentation(), snapshots: [], savedAt: "2026-08-09T00:00:00.000Z" };

    expect(saveStudioDraft(localStorage, draft)).toBe(true);
    expect(loadStudioDraft(localStorage)).toEqual(draft);
    clearStudioDraft(localStorage);
    expect(loadStudioDraft(localStorage)).toBeNull();
  });
});
