import { describe, expect, it } from "vitest";
import { addSlide, deleteSlide, duplicateSlide, moveSlide } from "./slideEditor";
import { createDefaultPresentation } from "../presentations/defaultPresentation";

describe("slide editor commands", () => {
  it("adds, duplicates, and reorders stable slide IDs", () => {
    const presentation = createDefaultPresentation();
    const added = addSlide(presentation, "code");
    const duplicated = duplicateSlide(added, added.slides[0].id);
    const moved = moveSlide(duplicated, duplicated.slides[1].id, -1);
    expect(new Set(moved.slides.map((slide) => slide.id)).size).toBe(moved.slides.length);
    expect(added.slides.at(-1)).toMatchObject({ layout: "code", code: { language: "text", value: "" } });
    expect(moved.slides[0].id).toBe(duplicated.slides[1].id);
  });

  it("reports cues affected by deletion without mutating them", () => {
    const presentation = createDefaultPresentation();
    const slideId = presentation.cues[0].slideRef!;
    const result = deleteSlide(presentation, slideId);
    expect(result.presentation.slides.some((slide) => slide.id === slideId)).toBe(false);
    expect(result.affectedCues).toEqual(expect.arrayContaining([expect.objectContaining({ slideRef: slideId })]));
    expect(result.presentation.cues).toHaveLength(presentation.cues.length);
  });
});
