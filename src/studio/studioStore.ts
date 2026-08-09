import type { PresentationLifecycleState, PresentationPackageV1 } from "../package/types";

export type StudioSelection = {
  slideId: string | null;
  cueId: string | null;
};

export type StudioSnapshot = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
  presentation: PresentationPackageV1;
};

export type StudioPersistedDraft = {
  presentation: PresentationPackageV1;
  snapshots: StudioSnapshot[];
  savedAt: string;
};

export type StudioState = {
  presentation: PresentationPackageV1 | null;
  selection: StudioSelection;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  snapshots: StudioSnapshot[];
  lifecycle: PresentationLifecycleState;
};

export type StudioListener = (state: StudioState) => void;

export type StudioStore = {
  getState(): StudioState;
  subscribe(listener: StudioListener): () => void;
  setPresentation(presentation: PresentationPackageV1 | null, options?: { dirty?: boolean; recordHistory?: boolean; resetHistory?: boolean }): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
  selectSlide(slideId: string | null): boolean;
  selectCue(cueId: string | null): boolean;
  undo(): boolean;
  redo(): boolean;
  createSnapshot(name: string, note?: string): StudioSnapshot | null;
  restoreSnapshot(snapshotId: string): boolean;
  markPresented(snapshotId: string): boolean;
  markPublished(snapshotId: string): boolean;
  setLifecycle(lifecycle: PresentationLifecycleState): void;
  getPersistedDraft(): StudioPersistedDraft | null;
  markClean(): void;
};

export function createStudioStore(initialPresentation: PresentationPackageV1 | null = null, initialDraft?: StudioPersistedDraft): StudioStore {
  let state: StudioState = createState(initialDraft?.presentation ?? initialPresentation, Boolean(initialDraft), initialDraft?.snapshots ?? []);
  let past: PresentationPackageV1[] = [];
  let future: PresentationPackageV1[] = [];
  const listeners = new Set<StudioListener>();

  const emit = () => {
    const snapshot = getSnapshot(state);
    listeners.forEach((listener) => listener(snapshot));
  };

  const update = (next: StudioState) => {
    state = next;
    emit();
  };

  const withHistoryFlags = (next: StudioState): StudioState => ({ ...next, canUndo: past.length > 0, canRedo: future.length > 0 });

  const setEditablePresentation = (presentation: PresentationPackageV1, options: { dirty: boolean; recordHistory: boolean }) => {
    if (options.recordHistory && state.presentation) {
      past = [...past, clonePresentation(state.presentation)];
      future = [];
    }
    state = withHistoryFlags(createState(presentation, options.dirty, state.snapshots, state.selection));
    emit();
  };

  return {
    getState: () => getSnapshot(state),
    subscribe(listener) {
      listeners.add(listener);
      listener(getSnapshot(state));
      return () => listeners.delete(listener);
    },
    setPresentation(presentation, options = {}) {
      if (!presentation) {
        past = [];
        future = [];
        state = createState(null, false, []);
        emit();
        return;
      }
      if (options.resetHistory ?? !options.dirty) {
        past = [];
        future = [];
        state = withHistoryFlags(createState(presentation, options.dirty ?? false, []));
        emit();
        return;
      }
      setEditablePresentation(presentation, { dirty: options.dirty ?? false, recordHistory: options.recordHistory ?? Boolean(options.dirty) });
    },
    setLoading(isLoading) {
      update({ ...state, isLoading });
    },
    setError(error) {
      update({ ...state, error, isLoading: error ? false : state.isLoading });
    },
    selectSlide(slideId) {
      if (!isKnownSlideId(state.presentation, slideId)) return false;
      update({ ...state, selection: { ...state.selection, slideId } });
      return true;
    },
    selectCue(cueId) {
      if (!isKnownCueId(state.presentation, cueId)) return false;
      update({ ...state, selection: { ...state.selection, cueId } });
      return true;
    },
    undo() {
      const previous = past.at(-1);
      if (!previous || !state.presentation) return false;
      future = [clonePresentation(state.presentation), ...future];
      past = past.slice(0, -1);
      state = withHistoryFlags(createState(previous, true, state.snapshots, state.selection));
      emit();
      return true;
    },
    redo() {
      const next = future[0];
      if (!next || !state.presentation) return false;
      past = [...past, clonePresentation(state.presentation)];
      future = future.slice(1);
      state = withHistoryFlags(createState(next, true, state.snapshots, state.selection));
      emit();
      return true;
    },
    createSnapshot(name, note) {
      if (!state.presentation || !name.trim()) return null;
      const snapshot: StudioSnapshot = { id: nextSnapshotId(state.snapshots), name: name.trim(), note: note?.trim() || undefined, createdAt: new Date().toISOString(), presentation: clonePresentation(state.presentation) };
      update({ ...state, snapshots: [...state.snapshots, snapshot], isDirty: true });
      return cloneSnapshot(snapshot);
    },
    restoreSnapshot(snapshotId) {
      const snapshot = state.snapshots.find((item) => item.id === snapshotId);
      if (!snapshot || !state.presentation) return false;
      setEditablePresentation(snapshot.presentation, { dirty: true, recordHistory: true });
      return true;
    },
    markPresented(snapshotId) {
      return markSnapshot("presentedSnapshotId", "presented", snapshotId);
    },
    markPublished(snapshotId) {
      return markSnapshot("publishedSnapshotId", "published", snapshotId);
    },
    setLifecycle(lifecycle) {
      if (!state.presentation) return;
      setEditablePresentation({ ...state.presentation, publication: { ...state.presentation.publication, lifecycle } }, { dirty: true, recordHistory: true });
    },
    getPersistedDraft() {
      if (!state.presentation) return null;
      return { presentation: clonePresentation(state.presentation), snapshots: state.snapshots.map(cloneSnapshot), savedAt: new Date().toISOString() };
    },
    markClean() {
      update({ ...state, isDirty: false });
    }
  };

  function markSnapshot(field: "presentedSnapshotId" | "publishedSnapshotId", lifecycle: PresentationLifecycleState, snapshotId: string): boolean {
    if (!state.presentation || !state.snapshots.some((snapshot) => snapshot.id === snapshotId)) return false;
    setEditablePresentation({ ...state.presentation, publication: { ...state.presentation.publication, lifecycle, [field]: snapshotId } }, { dirty: true, recordHistory: true });
    return true;
  }
}

function createState(presentation: PresentationPackageV1 | null, isDirty: boolean, snapshots: StudioSnapshot[] = [], previousSelection: StudioSelection = { slideId: null, cueId: null }): StudioState {
  return {
    presentation: presentation ? clonePresentation(presentation) : null,
    selection: {
      slideId: isKnownSlideId(presentation, previousSelection.slideId) ? previousSelection.slideId : presentation?.slides[0]?.id ?? null,
      cueId: isKnownCueId(presentation, previousSelection.cueId) ? previousSelection.cueId : presentation?.cues[0]?.id ?? null
    },
    isLoading: false,
    error: null,
    isDirty,
    canUndo: false,
    canRedo: false,
    snapshots: snapshots.map(cloneSnapshot),
    lifecycle: presentation?.publication?.lifecycle ?? "draft"
  };
}

function getSnapshot(state: StudioState): StudioState {
  return {
    ...state,
    presentation: state.presentation ? clonePresentation(state.presentation) : null,
    selection: { ...state.selection },
    snapshots: state.snapshots.map(cloneSnapshot)
  };
}

function clonePresentation(presentation: PresentationPackageV1): PresentationPackageV1 {
  return structuredClone(presentation);
}

function cloneSnapshot(snapshot: StudioSnapshot): StudioSnapshot {
  return { ...snapshot, presentation: clonePresentation(snapshot.presentation) };
}

function nextSnapshotId(snapshots: StudioSnapshot[]): string {
  let index = snapshots.length + 1;
  while (snapshots.some((snapshot) => snapshot.id === `snapshot_${String(index).padStart(3, "0")}`)) index += 1;
  return `snapshot_${String(index).padStart(3, "0")}`;
}

function isKnownSlideId(presentation: PresentationPackageV1 | null, slideId: string | null): boolean {
  return slideId !== null && presentation?.slides.some((slide) => slide.id === slideId) === true;
}

function isKnownCueId(presentation: PresentationPackageV1 | null, cueId: string | null): boolean {
  return cueId !== null && presentation?.cues.some((cue) => cue.id === cueId) === true;
}
