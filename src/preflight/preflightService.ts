import { staticIllustrationFiles } from "../staticIllustration/config";
import { adaptPresentationPackageToRuntime } from "../package/adapter";
import { resolvePresentationComposition } from "../presentation/presentationComposer";
import type { FallbackLevel } from "../presentation/types";
import type { FallbackVerification, PreflightCheck, PreflightEnvironment, PreflightInput, PreflightReport } from "./types";

export async function runPreflight(input: PreflightInput, environment: PreflightEnvironment = createBrowserPreflightEnvironment()): Promise<PreflightReport> {
  const checks: PreflightCheck[] = [
    createPackageCheck(input),
    createPublicationAssetCheck(input),
    createWebglCheck(environment),
    createReducedMotionCheck(environment),
    createViewportCheck(environment),
    createFullscreenCheck(environment)
  ];

  checks.push(...await createLive2dChecks(input, environment));
  checks.push(...await createImagePresenterChecks(input, environment));
  checks.push(...await createStaticIllustrationChecks(input, environment));
  checks.push(...await createGlbChecks(input, environment));
  checks.push(...await createPackageAssetChecks(input, environment));

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
    reducedMotionPreferred: environment.prefersReducedMotion(),
    fallbackVerification: verifyFallbackPaths(input),
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
    prefersReducedMotion: () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
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
      entityId: input.presentation?.presentation.id,
      level: "blocked",
      detail: `${input.packageValidation.errors.length} validation error(s) found.`,
      remediation: "Fix package validation errors before the event."
    };
  }

  if (input.packageValidation.warnings.length > 0) {
    return {
      id: "presentation-package",
      label: "Presentation Package",
      entityId: input.presentation?.presentation.id,
      level: "warning",
      detail: `${input.packageValidation.warnings.length} validation warning(s) found.`,
      remediation: "Review warnings and confirm the fallback path."
    };
  }

  return { id: "presentation-package", label: "Presentation Package", level: "ready", detail: "Package validation passed.", entityId: input.presentation?.presentation.id };
}

function createPublicationAssetCheck(input: PreflightInput): PreflightCheck {
  const privateAssets = input.presentation?.exports?.publicAssetsOnly
    ? input.presentation.assets.filter((asset) => asset.visibility === "local-only" || asset.visibility === "private")
    : [];
  if (privateAssets.length === 0) return { id: "publication-assets", label: "Publication assets", level: "ready", detail: "No non-public assets are selected for public export." };
  return { id: "publication-assets", label: "Publication assets", level: "warning", detail: `${privateAssets.length} local/private asset(s) are referenced by a public export.`, remediation: "Replace these assets or disable publicAssetsOnly for this export.", entityId: privateAssets[0].id };
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

function createReducedMotionCheck(environment: PreflightEnvironment): PreflightCheck {
  return environment.prefersReducedMotion()
    ? {
      id: "reduced-motion",
      label: "Reduced motion",
      level: "warning",
      detail: "The browser prefers reduced motion.",
      remediation: "Rehearse the reduced-motion fallback before the event."
    }
    : { id: "reduced-motion", label: "Reduced motion", level: "ready", detail: "No reduced-motion preference detected." };
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
    createUrlCheck("live2d-core", "Live2D Core", input.live2d.coreUrl, environment, "Configure VITE_LIVE2D_CORE_URL or select the no-live2d fallback.", "live2d"),
    createUrlCheck("live2d-model", "Live2D Model", input.live2d.modelUrl, environment, "Configure VITE_LIVE2D_MODEL_URL or select the no-live2d fallback.", "live2d")
  ]);
}

async function createImagePresenterChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return [await createAssetFileCheck("airi-manju", "Airi Manju", input.imagePresenter.baseUrl, "neutral.png", environment, "Configure VITE_AIRI_MANJU_BASE_URL or use a slide-only fallback.", input.imagePresenter.speakerId)];
}

async function createStaticIllustrationChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  return Promise.all(input.staticIllustrations.characters.map((character) =>
    createAssetFileCheck(
      `static-illustration-${character.characterId}`,
      `Static illustration (${character.characterId})`,
      character.baseUrl,
      staticIllustrationFiles[character.defaultExpression],
      environment,
      "Configure the static illustration asset or use a slide-only fallback.",
      character.characterId
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
      "Configure VITE_REI_GLB_URL or select the no-3d-model fallback.",
      character.characterId
    )
  ));
}

async function createPackageAssetChecks(input: PreflightInput, environment: PreflightEnvironment): Promise<PreflightCheck[]> {
  if (!input.presentation) return [];

  const checks: Array<Promise<PreflightCheck>> = [];
  input.presentation.slides.forEach((slide) => {
    if (slide.image?.url) {
      checks.push(createUrlCheck(`slide-image-${slide.id}`, `Slide image (${slide.id})`, slide.image.url, environment, "Replace the image or provide a slide-only fallback.", slide.id));
    }
  });
  input.presentation.cues.forEach((cue) => {
    if (cue.audio?.src) {
      checks.push(createUrlCheck(`audio-${cue.id}`, `Audio (${cue.id})`, cue.audio.src, environment, "Replace the audio source or rehearse this Cue without audio.", cue.id));
    }
  });

  const externalAssets = input.presentation.assets.filter((asset) => asset.url?.startsWith("http://") || asset.url?.startsWith("https://"));
  if (externalAssets.length === 0) {
    checks.push(Promise.resolve({ id: "external-dependencies", label: "External dependencies", level: "ready", detail: "No external asset URLs are declared." }));
  } else {
    checks.push(Promise.resolve({
      id: "external-dependencies",
      label: "External dependencies",
      level: "warning",
      detail: `${externalAssets.length} external asset(s) require network access.`,
      remediation: "Provide local replacements or rehearse the offline fallback.",
      entityId: externalAssets[0].id
    }));
  }

  return Promise.all(checks);
}

async function createAssetFileCheck(id: string, label: string, baseUrl: string | null, fileName: string, environment: PreflightEnvironment, remediation: string, entityId?: string): Promise<PreflightCheck> {
  if (!baseUrl) {
    return { id, label, level: "warning", detail: "Not configured.", remediation, entityId };
  }

  return createUrlCheck(id, label, `${baseUrl.replace(/\/$/, "")}/${fileName}`, environment, remediation, entityId);
}

async function createUrlCheck(id: string, label: string, url: string | null, environment: PreflightEnvironment, remediation: string, entityId?: string): Promise<PreflightCheck> {
  if (!url) {
    return { id, label, level: "warning", detail: "Not configured.", remediation, entityId };
  }

  const available = await environment.fetchResource(url);
  return available
    ? { id, label, level: "ready", detail: `Available: ${url}`, entityId }
    : { id, label, level: "warning", detail: `Unavailable: ${url}`, remediation, entityId };
}

function recommendFallbackLevel(checks: PreflightCheck[]): FallbackLevel {
  if (checks.some((check) => check.id === "webgl2" && check.level === "blocked")) return "static";
  if (checks.some((check) => (check.id === "airi-manju" || check.id.startsWith("static-illustration-")) && check.detail.startsWith("Unavailable:"))) return "static";
  if (checks.some((check) => check.id.startsWith("glb-") && check.level !== "ready")) return "no-3d-model";
  if (checks.some((check) => check.id.startsWith("live2d-") && check.level !== "ready")) return "no-live2d";
  return "full";
}

function verifyFallbackPaths(input: PreflightInput): FallbackVerification[] {
  if (!input.presentation) return [];

  const runtimeCues = adaptPresentationPackageToRuntime(input.presentation).cues;
  return [
    verifyFallbackPath("slide-only", "Slide-only fallback", runtimeCues.find((cue) => cue.slideRef !== undefined), "static", [], ["slide"]),
    verifyFallbackPath("image-presenter", "Image presenter", runtimeCues.find((cue) => cue.presentation?.layers?.includes("manju") || cue.presentation?.layers?.includes("static_illustration")), "full", [], [], ["manju", "static_illustration"]),
    verifyFallbackPath("live2d", "Live2D fallback", runtimeCues.find((cue) => cue.presentation?.layers?.includes("live2d")), "no-live2d", ["live2d"]),
    verifyFallbackPath("stage3d", "3D stage fallback", runtimeCues.find((cue) => cue.presentation?.layers?.includes("stage3d")), "no-3d-model", ["stage3d", "effects"])
  ];
}

function verifyFallbackPath(
  id: FallbackVerification["id"],
  label: string,
  cue: ReturnType<typeof adaptPresentationPackageToRuntime>["cues"][number] | undefined,
  fallbackLevel: FallbackLevel,
  excludedLayers: string[],
  requiredLayers: string[] = [],
  requiredAnyLayers: string[] = []
): FallbackVerification {
  if (!cue) {
    return {
      id,
      label,
      level: "warning",
      detail: "No representative Cue is configured.",
      remediation: "Add a Cue for this presentation layer before rehearsal."
    };
  }

  const composition = resolvePresentationComposition(cue, fallbackLevel);
  const invalidLayers = composition.activeLayers.filter((layer) => excludedLayers.includes(layer));
  const missingLayers = requiredLayers.filter((layer) => !composition.activeLayers.includes(layer as typeof composition.activeLayers[number]));
  const missingRequiredLayer = requiredAnyLayers.length > 0 && !requiredAnyLayers.some((layer) => composition.activeLayers.includes(layer as typeof composition.activeLayers[number]));
  if (invalidLayers.length > 0 || missingLayers.length > 0 || missingRequiredLayer) {
    const detail = [
      invalidLayers.length > 0 ? `Fallback still includes: ${invalidLayers.join(", ")}.` : "",
      missingLayers.length > 0 ? `Fallback is missing: ${missingLayers.join(", ")}.` : "",
      missingRequiredLayer ? `Fallback is missing one of: ${requiredAnyLayers.join(", ")}.` : ""
    ].filter(Boolean).join(" ");
    return {
      id,
      label,
      level: "blocked",
      cueId: cue.id,
      detail,
      remediation: "Define a fallback composition that preserves the required layer and removes unavailable layers."
    };
  }

  return { id, label, level: "ready", cueId: cue.id, detail: `Verified with Cue ${cue.id}.` };
}
