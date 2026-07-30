import { describe, expect, it } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { checkPresentationQuality } from "./presentationQuality";

describe("checkPresentationQuality", () => {
  it("reports timing, subtitle, layer, and intensity rehearsal risks", () => {
    const presentation = createDefaultPresentation();
    presentation.cues[0] = { ...presentation.cues[0], text: "first\nsecond\nthird\nfourth", estimatedDurationMs: 100, direction: { intent: "focus", intensity: "high" }, presentation: { layers: ["slide", "subtitle", "manju", "live2d", "stage3d", "static_illustration"] } };
    presentation.cues[1] = { ...presentation.cues[1], estimatedDurationMs: undefined, direction: { intent: "focus", intensity: "high" } };
    expect(checkPresentationQuality(presentation).map((issue) => issue.code)).toEqual(expect.arrayContaining(["short_duration", "subtitle_overflow", "excessive_layers", "missing_duration", "repeated_high_intensity"]));
  });
});
