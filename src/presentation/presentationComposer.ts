import type { Cue, FallbackLevel, LayoutPreset, PresentationLayer, PresentationSnapshot } from "./types";

export type PresentationComposition = {
  activeLayers: PresentationLayer[];
  layout: LayoutPreset;
  debugReason: string;
  creditsVariant: "crawl" | "spiral" | null;
};

const allLayers: PresentationLayer[] = [
  "slide",
  "subtitle",
  "manju",
  "static_illustration",
  "live2d",
  "stage3d",
  "effects",
  "ending_credits"
];

const defaultLayouts: Record<LayoutPreset, PresentationLayer[]> = {
  slide_only: ["slide"],
  slide_with_caption: ["slide", "subtitle"],
  slide_with_manju: ["slide", "subtitle", "manju"],
  slide_with_character: ["slide", "subtitle", "static_illustration"],
  dialogue_split: ["slide", "subtitle", "manju", "static_illustration"],
  stage_full: ["stage3d", "live2d", "manju", "effects"],
  stage_with_overlay: ["slide", "subtitle", "stage3d", "live2d", "manju", "static_illustration", "effects"]
};

export function resolvePresentationComposition(cue: Cue, fallbackLevel: FallbackLevel = "full"): PresentationComposition {
  const explicitLayout = cue.presentation?.layout;
  const inferredLayout = explicitLayout ?? inferLayout(cue);
  const explicitLayers = cue.presentation?.layers;
  const fallback = fallbackLevel === "full" ? undefined : cue.presentation?.fallback?.[fallbackLevel];
  const fallbackLayout = fallback?.layout;
  const resolvedLayout = fallbackLayout ?? inferredLayout;
  const layers = normalizeLayers(fallback?.layers ?? explicitLayers ?? defaultLayouts[resolvedLayout]);

  return {
    activeLayers: layers,
    layout: resolvedLayout,
    debugReason: getDebugReason(fallbackLevel, fallback !== undefined, explicitLayout !== undefined || explicitLayers !== undefined),
    creditsVariant: cue.presentation?.creditsVariant ?? null
  };
}

export function applyPresentationComposition(root: HTMLElement, snapshot: PresentationSnapshot): void {
  root.dataset.layout = snapshot.presentation.layout;
  root.dataset.layers = snapshot.presentation.activeLayers.join(" ");
  root.dataset.subtitles = snapshot.showSubtitles ? "on" : "off";

  allLayers.forEach((layer) => {
    root.classList.toggle(`presentation-layer--${layer}`, snapshot.presentation.activeLayers.includes(layer));
  });
  root.classList.toggle("presentation-subtitles--hidden", !snapshot.showSubtitles);
}

function inferLayout(cue: Cue): LayoutPreset {
  if (cue.slideRef && cue.stage?.objectRef) {
    return "stage_with_overlay";
  }

  if (cue.slideRef && cue.kind === "question") {
    return "slide_with_manju";
  }

  if (cue.slideRef && cue.kind === "talk") {
    return "slide_with_caption";
  }

  if (cue.slideRef) {
    return "slide_with_character";
  }

  return "stage_full";
}

function normalizeLayers(layers: PresentationLayer[]): PresentationLayer[] {
  return layers.filter((layer, index) => allLayers.includes(layer) && layers.indexOf(layer) === index);
}

function getDebugReason(fallbackLevel: FallbackLevel, usedFallback: boolean, explicit: boolean): string {
  if (usedFallback) {
    return `fallback:${fallbackLevel}`;
  }

  return explicit ? "explicit cue presentation" : "inferred from cue";
}
