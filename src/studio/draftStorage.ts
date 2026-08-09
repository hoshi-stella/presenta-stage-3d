import type { StudioPersistedDraft } from "./studioStore";

export type StudioStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultKey = "presenta-stage-3d:studio-draft:v1";

export function loadStudioDraft(storage: StudioStorage, key = defaultKey): StudioPersistedDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioPersistedDraft>;
    if (!parsed.presentation || !Array.isArray(parsed.snapshots) || typeof parsed.savedAt !== "string") return null;
    return structuredClone(parsed as StudioPersistedDraft);
  } catch {
    return null;
  }
}

export function saveStudioDraft(storage: StudioStorage, draft: StudioPersistedDraft, key = defaultKey): boolean {
  try {
    storage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearStudioDraft(storage: StudioStorage, key = defaultKey): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be disabled in private browsing; keeping the editor usable is more important.
  }
}
