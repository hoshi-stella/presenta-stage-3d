import { describe, expect, it } from "vitest";
import { runPreflight } from "./preflightService";
import type { PreflightEnvironment, PreflightInput } from "./types";

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
});
