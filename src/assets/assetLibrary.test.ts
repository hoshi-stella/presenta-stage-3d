import { describe, expect, it } from "vitest";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import {
  findAssetReferences,
  getAssetDeletionGuard,
  getPublicAssetReadiness,
  searchPresentationAssets
} from "./assetLibrary";

describe("asset library", () => {
  it("searches package assets by type and tag", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push(
      {
        id: "petal-particle",
        type: "particle",
        label: "Petal fall",
        tags: ["celebration", "flower"],
        visibility: "public"
      },
      {
        id: "bubble-particle",
        type: "particle",
        label: "Bubble float",
        tags: ["ambient"],
        visibility: "public"
      },
      {
        id: "airi-image",
        type: "image",
        label: "Airi image",
        tags: ["character", "celebration"],
        visibility: "public"
      }
    );

    expect(searchPresentationAssets(presentation, { type: "particle", tag: "celebration" }).map((asset) => asset.id)).toEqual([
      "petal-particle"
    ]);
    expect(searchPresentationAssets(presentation, { tag: "celebration" }).map((asset) => asset.id)).toEqual([
      "petal-particle",
      "airi-image"
    ]);
  });

  it("lists slide-image and Cue stage-effect references for an asset", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push(
      { id: "diagram", type: "slide-image", label: "Diagram", visibility: "public" },
      { id: "petal-particle", type: "particle", label: "Petal fall", visibility: "public" }
    );
    presentation.slides[0].image = { assetId: "diagram", alt: "Diagram" };
    presentation.cues[0].stage = { effects: ["petal-particle"] };

    expect(findAssetReferences(presentation, "diagram")).toEqual([
      { kind: "slide-image", slideId: presentation.slides[0].id }
    ]);
    expect(findAssetReferences(presentation, "petal-particle")).toEqual([
      { kind: "cue-stage-effect", cueId: presentation.cues[0].id }
    ]);
  });

  it("blocks deletion and reports each package reference", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push({ id: "diagram", type: "slide-image", label: "Diagram", visibility: "public" });
    presentation.slides[0].image = { assetId: "diagram", alt: "Diagram" };

    expect(getAssetDeletionGuard(presentation, "diagram")).toEqual({
      allowed: false,
      references: [{ kind: "slide-image", slideId: presentation.slides[0].id }]
    });
    expect(getAssetDeletionGuard(presentation, "unused-asset")).toEqual({ allowed: true, references: [] });
  });

  it("reports public-export blockers for local-only assets without fallbacks and credit-required assets without credit metadata", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push(
      {
        id: "local-model",
        type: "model3d",
        label: "Local model",
        visibility: "local-only"
      },
      {
        id: "credit-image",
        type: "image",
        label: "Credit image",
        visibility: "public-with-credit",
        license: { creditRequired: true }
      }
    );

    expect(getPublicAssetReadiness(presentation)).toEqual({
      ready: false,
      issues: [
        { code: "missing_public_fallback", assetId: "local-model" },
        { code: "missing_credit_metadata", assetId: "credit-image" }
      ]
    });
  });
});
