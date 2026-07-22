import type { Cue, LayoutPreset, PresentationLayer, PresentationSnapshot } from "./types";

export type PresentationComposition = {
  activeLayers: PresentationLayer[];
  layout: LayoutPreset;
  debugReason: string;
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

export function resolvePresentationComposition(cue: Cue): PresentationComposition {
  const explicitLayout = cue.presentation?.layout;
  const inferredLayout = explicitLayout ?? inferLayout(cue);
  const explicitLayers = cue.presentation?.layers;
  const layers = normalizeLayers(explicitLayers ?? defaultLayouts[inferredLayout]);

  return {
    activeLayers: layers,
    layout: inferredLayout,
    debugReason: explicitLayout || explicitLayers ? "explicit cue presentation" : "inferred from cue"
  };
}

export function applyPresentationComposition(root: HTMLElement, snapshot: PresentationSnapshot): void {
  root.dataset.layout = snapshot.presentation.layout;
  root.dataset.layers = snapshot.presentation.activeLayers.join(" ");

  allLayers.forEach((layer) => {
    root.classList.toggle(`presentation-layer--${layer}`, snapshot.presentation.activeLayers.includes(layer));
  });
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
