import { describe, expect, it, vi } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { createStudioStore } from "./studioStore";

describe("StudioStore", () => {
  it("holds a package and selects its first slide and cue by default", () => {
    const presentation = createDefaultPresentation();
    const store = createStudioStore();

    store.setPresentation(presentation);

    expect(store.getState()).toMatchObject({
      presentation,
      selection: { slideId: presentation.slides[0].id, cueId: presentation.cues[0].id },
      isLoading: false,
      error: null,
      isDirty: false
    });
  });

  it("tracks loading, errors, and the explicit dirty lifecycle", () => {
    const store = createStudioStore(createDefaultPresentation());

    store.setLoading(true);
    store.setError("Package could not be loaded.");
    expect(store.getState()).toMatchObject({ isLoading: false, error: "Package could not be loaded.", isDirty: false });

    store.setPresentation(createDefaultPresentation(), { dirty: true });
    expect(store.getState()).toMatchObject({ error: null, isDirty: true });

    store.markClean();
    expect(store.getState().isDirty).toBe(false);
  });

  it("changes only valid selections without marking the package dirty", () => {
    const presentation = createDefaultPresentation();
    const store = createStudioStore(presentation);
    const secondSlide = presentation.slides[1];
    const secondCue = presentation.cues[1];

    expect(store.selectSlide(secondSlide.id)).toBe(true);
    expect(store.selectCue(secondCue.id)).toBe(true);
    expect(store.getState()).toMatchObject({
      selection: { slideId: secondSlide.id, cueId: secondCue.id },
      isDirty: false
    });
    expect(store.selectSlide("missing-slide")).toBe(false);
    expect(store.selectCue("missing-cue")).toBe(false);
    expect(store.getState().selection).toEqual({ slideId: secondSlide.id, cueId: secondCue.id });
  });

  it("notifies subscribers immediately and stops after unsubscribe", () => {
    const store = createStudioStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setLoading(true);
    unsubscribe();
    store.setError("Cancelled.");

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toMatchObject({ isLoading: false });
    expect(listener.mock.calls[1][0]).toMatchObject({ isLoading: true });
  });
});
