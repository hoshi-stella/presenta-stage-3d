import { describe, expect, it } from "vitest";
import { createExportProfile } from "./exportProfile";
import { createDefaultPresentation } from "../presentations/defaultPresentation";

describe("export profiles", () => {
  it("replaces a local-only slide asset with its public fallback for public replay", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push(
      {
        id: "local-airi-model",
        type: "image",
        label: "Local Airi model",
        url: "/assets-local/airi.png",
        visibility: "local-only",
        fallbackAssetId: "public-airi-image"
      },
      {
        id: "public-airi-image",
        type: "image",
        label: "Public Airi image",
        url: "/assets/public/airi.png",
        visibility: "public"
      }
    );
    presentation.slides[0].image = { assetId: "local-airi-model", url: "/assets-local/airi.png", alt: "Airi" };

    const result = createExportProfile(presentation, "public-replay");

    expect(result.status).toBe("ready");
    expect(result.presentation.assets.map((asset) => asset.id)).not.toContain("local-airi-model");
    expect(result.presentation.slides[0].image).toMatchObject({
      assetId: "public-airi-image",
      url: "/assets/public/airi.png"
    });
  });

  it("blocks public replay when a local-only asset has no eligible public fallback", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push({
      id: "local-only-model",
      type: "model3d",
      label: "Local-only model",
      visibility: "local-only"
    });

    const result = createExportProfile(presentation, "public-replay");

    expect(result.status).toBe("blocked");
    expect(result.issues).toContainEqual({
      code: "missing_public_fallback",
      assetId: "local-only-model"
    });
  });

  it("excludes speaker notes from public replay", () => {
    const presentation = createDefaultPresentation();
    presentation.cues[0].note = "Only the presenter should see this.";

    const result = createExportProfile(presentation, "public-replay");

    expect(result.status).toBe("ready");
    expect(result.presentation.cues[0].note).toBeUndefined();
  });

  it("keeps local performance assets and notes unchanged", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push({
      id: "local-stage-model",
      type: "model3d",
      label: "Local stage model",
      url: "/assets-local/models/stage.glb",
      visibility: "local-only"
    });
    presentation.cues[0].note = "Keep this for the live performance.";

    const result = createExportProfile(presentation, "local-performance");

    expect(result.status).toBe("ready");
    expect(result.presentation.assets).toContainEqual(expect.objectContaining({
      id: "local-stage-model",
      url: "/assets-local/models/stage.glb",
      visibility: "local-only"
    }));
    expect(result.presentation.cues[0].note).toBe("Keep this for the live performance.");
  });
});
