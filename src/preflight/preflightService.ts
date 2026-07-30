import { staticIllustrationFiles } from "../staticIllustration/config";
import type { FallbackLevel } from "../presentation/types";
import type { PreflightCheck, PreflightEnvironment, PreflightInput, PreflightReport } from "./types";

export async function runPreflight(input: PreflightInput, environment: PreflightEnvironment = createBrowserPreflightEnvironment()): Promise<PreflightReport> {
  const checks: PreflightCheck[] = [
    createPackageCheck(input),
    createWebglCheck(environment),
    createViewportCheck(environment),
    createFullscreenCheck(environment)
  ];

  checks.push(...await createLive2dChecks(input, environment));
  checks.push(...await createImagePresenterChecks(input, environment));
  checks.push(...await createStaticIllustrationChecks(input, environment));
  checks.push(...await createGlbChecks(input, environment));

  const viewport = environment.getViewport();
  return {
    checks,
    recommendedFallbackLevel: recommendFallbackLevel(checks),
    currentFallbackLevel: input.currentFallbackLevel,
    viewport: {
      ...viewport,
      aspectRatio: viewport.height > 0 ? Number((viewport.width / viewport.height).toFixed(2)) : null
    },
    fullscreenAvailable: environment.supportsFullscreen(),
    checkedAt: environment.now().toISOString()
  };
}

export function createBrowserPreflightEnvironment(): PreflightEnvironment {
  return {
    fetchResource: async (url) => {
      try {
        const response = await window.fetch(url, { method: "GET", cache: "no-store" });
        if (!response.ok) return false;
        const contentType = response.headers.get("content-type") ?? "";
        return !contentType.includes("text/html");
      } catch {
        return false;
      }
    },
    supportsWebgl2: () => {
      try {
        const canvas = document.createElement("canvas");
        return canvas.getContext("webgl2") !== null;
      } catch {
        return false;
      }
    },
    getViewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
    supportsFullscreen: () => document.fullscreenEnabled === true,
    now: () => new Date()
  };
}

function createPackageCheck(input: PreflightInput): PreflightCheck {
  if (input.packageValidation.errors.length > 0) {
    return {
      id: "presentation-package",
      label: "Presentation Package",
      level: "blocked",
      detail: `${input.packageValidation.errors.length} validation error(s) found.`,
      remediation: "Fix package validation errors before the event."
    };
  }

  if (input.packageValidation.warnings.length > 0) {
    return {
      id: "presentation-package",
      label: "Presentation Package",
      level: "warning",
      detail: `${input.packageValidation.warnings.length} validation warning(s) found.`,
      remediation: "Review warnings and confirm the fallback path."
    };
  }

  return { id: "presentation-package", label: "Presentation Package", level: "ready", detail: "Package validation passed." };
}

function createWebglCheck(environment: PreflightEnvironment): PreflightCheck {
  return environment.supportsWebgl2()
    ? { id: "webgl2", label: "WebGL2", level: "ready", detail: "WebGL2 is available." }
    : {
      id: "webgl2",
      label: "WebGL2",
      level: "blocked",
      detail: "WebGL2 is unavailable.",
      remediation: "Use the static fallback or a browser/device with WebGL2 enabled."
    };
}

function createViewportCheck(environment: PreflightEnvironment): PreflightCheck {
  const { width, height } = environment.getViewport();
  const aspectRatio = height > 0 ? width / height : 0;
  const isProjectionFriendly = width >= 1280 && height >= 720 && Math.abs(aspectRatio - 16 / 9) < 0.2;
  return isProjectionFriendly
    ? { id: "viewport", label: "Viewport", level: "ready", detail: `${width} x ${height} (${aspectRatio.toFixed(2)}:1).` }
    : {
      id: "viewport",
      label: "Viewport",
      level: "warning",
      detail: `${width} x ${height} (${aspectRatio.toFixed(2)}:1) is not a typical 16:9 projection viewport.`,
      remediation: "Check the projector output and use a 16:9 fullscreen window when possible."
    };
}

function createFullscreenCheck(environment: PreflightEnvironment): PreflightCheck {
  return environment.supportsFullscreen()
    ? { id: "fullscreen", label: "Fullscreen", level: "ready", detail: "Fullscreen API is available." }
    : {
      id: "fullscreen",
      label: "Fullscreen",
      level: "warning",
      detail: "Fullscreen API is unavailable.",
      remediation: "Use browser fullscreen or keep the browser chrome visible during rehearsal."
    };
}

async function createLive2dChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return Promise.all([
    createUrlCheck("live2d-core", "Live2D Core", input.live2d.coreUrl, environment, "Configure VITE_LIVE2D_CORE_URL or select the no-live2d fallback."),
    createUrlCheck("live2d-model", "Live2D Model", input.live2d.modelUrl, environment, "Configure VITE_LIVE2D_MODEL_URL or select the no-live2d fallback.")
  ]);
}

async function createImagePresenterChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return [await createAssetFileCheck("airi-manju", "Airi Manju", input.imagePresenter.baseUrl, "neutral.png", environment, "Configure VITE_AIRI_MANJU_BASE_URL or use a slide-only fallback.")];
}

async function createStaticIllustrationChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return Promise.all(input.staticIllustrations.characters.map((character) =>
    createAssetFileCheck(
      `static-illustration-${character.characterId}`,
      `Static illustration (${character.characterId})`,
      character.baseUrl,
      staticIllustrationFiles[character.defaultExpression],
      environment,
      "Configure the static illustration asset or use a slide-only fallback."
    )
  ));
}

async function createGlbChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return Promise.all(input.glbCharacters.map((character) =>
    createUrlCheck(
      `glb-${character.characterId}`,
      `3D model (${character.characterId})`,
      character.url,
      environment,
      "Configure VITE_REI_GLB_URL or select the no-3d-model fallback."
    )
  ));
}

async function createAssetFileCheck(id: string, label: string, baseUrl: string | null, fileName: string, environment: PreflightEnvironment, remediation: string): Promise<PreflightCheck> {
  if (!baseUrl) {
    return { id, label, level: "warning", detail: "Not configured.", remediation };
  }

  return createUrlCheck(id, label, `${baseUrl.replace(/\/$/, "")}/${fileName}`, environment, remediation);
}

async function createUrlCheck(id: string, label: string, url: string | null, environment: PreflightEnvironment, remediation: string): Promise<PreflightCheck> {
  if (!url) {
    return { id, label, level: "warning", detail: "Not configured.", remediation };
  }

  const available = await environment.fetchResource(url);
  return available
    ? { id, label, level: "ready", detail: `Available: ${url}` }
    : { id, label, level: "warning", detail: `Unavailable: ${url}`, remediation };
}

function recommendFallbackLevel(checks: PreflightCheck[]): FallbackLevel {
  if (checks.some((check) => check.id === "webgl2" && check.level === "blocked")) return "static";
  if (checks.some((check) => check.id.startsWith("glb-") && check.level !== "ready")) return "no-3d-model";
  if (checks.some((check) => check.id.startsWith("live2d-") && check.level !== "ready")) return "no-live2d";
  return "full";
}
