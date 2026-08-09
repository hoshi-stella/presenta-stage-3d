import { describe, expect, it } from "vitest";
import { runPreflight } from "./preflightService";
import type { PreflightEnvironment, PreflightInput } from "./types";
import { createDefaultPresentation } from "../presentations/defaultPresentation";

const input: PreflightInput = {
  live2d: { coreUrl: "/live2d/core.js", modelUrl: "/live2d/model.json" },
  imagePresenter: { baseUrl: "/characters/airi", speakerId: "mikoto" },
  staticIllustrations: {
    characters: [
      { characterId: "rei", baseUrl: "/characters/rei", defaultExpression: "neutral" },
      { characterId: "mikoto", baseUrl: null, defaultExpression: "neutral" }
    ]
  },
  glbCharacters: [{ characterId: "rei", type: "glb", url: "/characters/rei.glb", fallback: "dummy", animationMode: "off", motionAnimations: {} }],
  packageValidation: { valid: true, errors: [], warnings: [] },
  currentFallbackLevel: "full"
};

function environment(overrides: Partial<PreflightEnvironment> = {}): PreflightEnvironment {
  return {
    fetchResource: async () => true,
    supportsWebgl2: () => true,
    prefersReducedMotion: () => false,
    getViewport: () => ({ width: 1920, height: 1080 }),
    supportsFullscreen: () => true,
    now: () => new Date("2026-07-30T00:00:00.000Z"),
    ...overrides
  };
}

describe("runPreflight", () => {
  it("reports configured assets and a full fallback recommendation when all checks are ready", async () => {
    const report = await runPreflight(input, environment());

    expect(report.recommendedFallbackLevel).toBe("full");
    expect(report.viewport).toEqual({ width: 1920, height: 1080, aspectRatio: 1.78 });
    expect(report.checks.find((check) => check.id === "webgl2")?.level).toBe("ready");
    expect(report.checks.find((check) => check.id === "static-illustration-mikoto")?.level).toBe("warning");
  });

  it("recommends static fallback when WebGL2 is unavailable", async () => {
    const report = await runPreflight(input, environment({ supportsWebgl2: () => false }));

    expect(report.recommendedFallbackLevel).toBe("static");
    expect(report.checks.find((check) => check.id === "webgl2")).toMatchObject({ level: "blocked" });
  });

  it("recommends the matching fallback when required model assets are unavailable", async () => {
    const report = await runPreflight(input, environment({
      fetchResource: async (url) => !url.endsWith("rei.glb") && !url.endsWith("model.json")
    }));

    expect(report.recommendedFallbackLevel).toBe("no-3d-model");
    expect(report.checks.find((check) => check.id === "glb-rei")).toMatchObject({ level: "warning" });
    expect(report.checks.find((check) => check.id === "live2d-model")).toMatchObject({ level: "warning" });
  });

  it("recommends static fallback when a configured image presenter asset is unavailable", async () => {
    const report = await runPreflight(input, environment({
      fetchResource: async (url) => !url.endsWith("airi/neutral.png")
    }));

    expect(report.recommendedFallbackLevel).toBe("static");
    expect(report.checks.find((check) => check.id === "airi-manju")).toMatchObject({ level: "warning" });
  });

  it("blocks invalid packages while preserving the asset fallback recommendation", async () => {
    const report = await runPreflight({
      ...input,
      packageValidation: {
        valid: false,
        errors: [{ severity: "error", path: "$.cues", code: "missing", message: "Missing cues" }],
        warnings: []
      }
    }, environment());

    expect(report.checks.find((check) => check.id === "presentation-package")).toMatchObject({ level: "blocked" });
    expect(report.recommendedFallbackLevel).toBe("full");
  });

  it("warns when a public export includes local-only assets", async () => {
    const presentation = createDefaultPresentation();
    presentation.exports = { publicAssetsOnly: true };
    presentation.assets[0] = { ...presentation.assets[0], visibility: "local-only" };
    const report = await runPreflight({ ...input, presentation }, environment());
    expect(report.checks.find((check) => check.id === "publication-assets")).toMatchObject({ level: "warning", entityId: presentation.assets[0].id });
  });

  it("verifies fallback compositions without mutating presentation Cue data", async () => {
    const presentation = createDefaultPresentation();
    presentation.cues[0] = {
      ...presentation.cues[0],
      presentation: { ...presentation.cues[0].presentation, layers: ["slide", "live2d"] }
    };
    presentation.cues[1] = {
      ...presentation.cues[1],
      presentation: { ...presentation.cues[1].presentation, layers: ["slide", "manju"] }
    };
    const originalCueIds = presentation.cues.map((cue) => cue.id);
    const report = await runPreflight({ ...input, presentation }, environment());

    expect(report.fallbackVerification.find((result) => result.id === "slide-only")).toMatchObject({ level: "ready" });
    expect(report.fallbackVerification.find((result) => result.id === "live2d")).toMatchObject({ level: "ready" });
    expect(report.fallbackVerification.find((result) => result.id === "image-presenter")).toMatchObject({ level: "ready" });
    expect(presentation.cues.map((cue) => cue.id)).toEqual(originalCueIds);
  });

  it("reports a missing representative fallback Cue as a warning", async () => {
    const presentation = createDefaultPresentation();
    presentation.cues = presentation.cues.filter((cue) => !cue.presentation?.layers?.includes("live2d"));
    const report = await runPreflight({ ...input, presentation }, environment());

    expect(report.fallbackVerification.find((result) => result.id === "live2d")).toMatchObject({ level: "warning" });
  });

  it("checks package-declared audio and warns about external asset dependencies", async () => {
    const presentation = createDefaultPresentation();
    presentation.cues[0] = { ...presentation.cues[0], audio: { src: "/audio/opening.mp3" } };
    presentation.assets.push({ id: "remote-image", type: "image", label: "Remote image", url: "https://example.test/image.png", visibility: "public" });
    const report = await runPreflight({ ...input, presentation }, environment({ fetchResource: async (url) => !url.endsWith("opening.mp3") }));

    expect(report.checks.find((check) => check.id === `audio-${presentation.cues[0].id}`)).toMatchObject({ level: "warning", entityId: presentation.cues[0].id });
    expect(report.checks.find((check) => check.id === "external-dependencies")).toMatchObject({ level: "warning", entityId: "remote-image" });
  });
});
