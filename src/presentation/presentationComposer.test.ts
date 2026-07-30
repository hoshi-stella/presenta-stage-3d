import { describe, expect, it } from "vitest";
import { adaptPresentationPackageToRuntime } from "../package/adapter";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { resolvePresentationComposition } from "./presentationComposer";

describe("presentation composition", () => {
  it("keeps stage overlays focused on the stage, slide, subtitle, and effects", () => {
    const cues = adaptPresentationPackageToRuntime(createDefaultPresentation()).cues;
    const stageOverlayCue = {
      ...cues[0],
      presentation: { layout: "stage_with_overlay" as const }
    };

    expect(resolvePresentationComposition(stageOverlayCue).activeLayers).toEqual(["slide", "subtitle", "stage3d", "effects"]);
  });
});
