import type { PresentationPackageV1 } from "../package/types";

export type StudioSelection = {
  slideId: string | null;
  cueId: string | null;
};

export type StudioState = {
  presentation: PresentationPackageV1 | null;
  selection: StudioSelection;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
};

export type StudioListener = (state: StudioState) => void;

export type StudioStore = {
  getState(): StudioState;
  subscribe(listener: StudioListener): () => void;
  setPresentation(presentation: PresentationPackageV1 | null, options?: { dirty?: boolean }): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
  selectSlide(slideId: string | null): boolean;
  selectCue(cueId: string | null): boolean;
  markClean(): void;
};

export function createStudioStore(initialPresentation: PresentationPackageV1 | null = null): StudioStore {
  let state: StudioState = createState(initialPresentation, false);
  const listeners = new Set<StudioListener>();

  const emit = () => {
    const snapshot = getSnapshot(state);
    listeners.forEach((listener) => listener(snapshot));
  };

  const update = (next: StudioState) => {
    state = next;
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
      state = createState(presentation, options.dirty ?? false, state.selection);
      emit();
    },
    setLoading(isLoading) {
      update({ ...state, isLoading });
    },
    setError(error) {
      update({ ...state, error, isLoading: error ? false : state.isLoading });
    },
    selectSlide(slideId) {
      if (!isKnownSlideId(state.presentation, slideId)) {
        return false;
      }
      update({ ...state, selection: { ...state.selection, slideId } });
      return true;
    },
    selectCue(cueId) {
      if (!isKnownCueId(state.presentation, cueId)) {
        return false;
      }
      update({ ...state, selection: { ...state.selection, cueId } });
      return true;
    },
    markClean() {
      update({ ...state, isDirty: false });
    }
  };
}

function createState(
  presentation: PresentationPackageV1 | null,
  isDirty: boolean,
  previousSelection: StudioSelection = { slideId: null, cueId: null }
): StudioState {
  return {
    presentation,
    selection: {
      slideId: isKnownSlideId(presentation, previousSelection.slideId) ? previousSelection.slideId : presentation?.slides[0]?.id ?? null,
      cueId: isKnownCueId(presentation, previousSelection.cueId) ? previousSelection.cueId : presentation?.cues[0]?.id ?? null
    },
    isLoading: false,
    error: null,
    isDirty
  };
}

function getSnapshot(state: StudioState): StudioState {
  return {
    ...state,
    selection: { ...state.selection }
  };
}

function isKnownSlideId(presentation: PresentationPackageV1 | null, slideId: string | null): boolean {
  return slideId !== null && presentation?.slides.some((slide) => slide.id === slideId) === true;
}

function isKnownCueId(presentation: PresentationPackageV1 | null, cueId: string | null): boolean {
  return cueId !== null && presentation?.cues.some((cue) => cue.id === cueId) === true;
}
