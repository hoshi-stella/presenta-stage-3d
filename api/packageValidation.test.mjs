import { describe, expect, it } from "vitest";
import { validateStoredPresentationPackage } from "./packageValidation.mjs";

const validPackage = {
  schemaVersion: 1,
  presentation: { id: "demo", title: "Demo" },
  slides: [{ id: "slide_1" }],
  cues: [{ id: "cue_1", speaker: "presenter", slideRef: "slide_1" }],
  characters: [{ id: "presenter" }],
  assets: [],
  directionPresets: [],
  settings: {}
};

describe("validateStoredPresentationPackage", () => {
  it("accepts the API storage contract", () => {
    expect(validateStoredPresentationPackage(validPackage)).toEqual([]);
  });

  it("rejects missing structural data and broken references", () => {
    const invalid = structuredClone(validPackage);
    invalid.cues[0].slideRef = "missing";
    invalid.cues[0].speaker = "unknown";
    invalid.slides.push({ id: "slide_1" });
    expect(validateStoredPresentationPackage(invalid)).toEqual(expect.arrayContaining([
      "Duplicate slide id: slide_1.",
      "cues[0].slideRef does not reference a known slide.",
      "cues[0].speaker does not reference a known character."
    ]));
  });
});
