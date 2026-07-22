import type { LayoutPreset, PresentationLayer, PresentationSnapshot } from "./types";

export type PresentationTransitionCoordinator = {
  apply: (snapshot: PresentationSnapshot) => void;
  isTransitioning: () => boolean;
  dispose: () => void;
};

const transitionDurationMs = 420;
const transitionLayers: PresentationLayer[] = [
  "slide",
  "subtitle",
  "manju",
  "static_illustration",
  "live2d",
  "stage3d",
  "effects",
  "ending_credits"
];

export function createPresentationTransitionCoordinator(root: HTMLElement): PresentationTransitionCoordinator {
  let lastLayout: LayoutPreset | null = null;
  let lastLayers: PresentationLayer[] = [];
  let timerId: number | null = null;
  let transitionKey = 0;
  const debug = root.querySelector<HTMLElement>("#transition-debug");

  const finishTransition = (): void => {
    root.dataset.transitionPhase = "idle";
    root.classList.remove(
      "presentation-transition--active",
      "presentation-transition--stage-enter",
      "presentation-transition--slide-enter",
      "presentation-transition--character-enter"
    );
    clearExitLayerClasses(root);
    if (debug) {
      debug.textContent = "Transition: idle";
    }
    timerId = null;
  };

  return {
    apply: (snapshot) => {
      const nextLayout = snapshot.presentation.layout;
      const nextLayers = snapshot.presentation.activeLayers;
      const hasPrevious = lastLayout !== null;
      const changedLayers = getChangedLayers(lastLayers, nextLayers);
      const layoutChanged = hasPrevious && lastLayout !== nextLayout;
      const layersChanged = hasPrevious && changedLayers.length > 0;

      if (!hasPrevious) {
        lastLayout = nextLayout;
        lastLayers = nextLayers;
        root.dataset.transitionFrom = nextLayout;
        root.dataset.transitionTo = nextLayout;
        root.dataset.transitionLayers = "";
        finishTransition();
        return;
      }

      if (!layoutChanged && !layersChanged) {
        if (!timerId) {
          root.dataset.transitionFrom = nextLayout;
          root.dataset.transitionTo = nextLayout;
          root.dataset.transitionLayers = "";
          finishTransition();
        }
        return;
      }

      const previousLayout = lastLayout ?? nextLayout;
      transitionKey += 1;
      window.clearTimeout(timerId ?? undefined);
      root.dataset.transitionFrom = previousLayout;
      root.dataset.transitionTo = nextLayout;
      root.dataset.transitionLayers = changedLayers.join(" ");
      root.dataset.transitionKey = String(transitionKey);
      root.dataset.transitionPhase = "entering";
      root.classList.add("presentation-transition--active");
      clearExitLayerClasses(root);
      lastLayers
        .filter((layer) => !nextLayers.includes(layer))
        .forEach((layer) => root.classList.add(`presentation-layer-exit--${layer}`));
      root.classList.toggle("presentation-transition--stage-enter", nextLayers.includes("stage3d") && !lastLayers.includes("stage3d"));
      root.classList.toggle("presentation-transition--slide-enter", nextLayers.includes("slide") && !lastLayers.includes("slide"));
      root.classList.toggle("presentation-transition--character-enter", hasAnyCharacterLayer(nextLayers) && !hasAnyCharacterLayer(lastLayers));

      if (debug) {
        debug.textContent = `Transition: ${lastLayout} -> ${nextLayout} / ${changedLayers.join(", ")}`;
      }

      lastLayout = nextLayout;
      lastLayers = nextLayers;
      timerId = window.setTimeout(finishTransition, transitionDurationMs);
    },
    isTransitioning: () => root.dataset.transitionPhase === "entering",
    dispose: () => {
      window.clearTimeout(timerId ?? undefined);
      timerId = null;
      root.classList.remove(
        "presentation-transition--active",
        "presentation-transition--stage-enter",
        "presentation-transition--slide-enter",
        "presentation-transition--character-enter"
      );
      clearExitLayerClasses(root);
      delete root.dataset.transitionFrom;
      delete root.dataset.transitionTo;
      delete root.dataset.transitionLayers;
      delete root.dataset.transitionPhase;
      delete root.dataset.transitionKey;
    }
  };
}

function clearExitLayerClasses(root: HTMLElement): void {
  transitionLayers.forEach((layer) => {
    root.classList.remove(`presentation-layer-exit--${layer}`);
  });
}

function getChangedLayers(previous: PresentationLayer[], next: PresentationLayer[]): PresentationLayer[] {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);
  return [...previous, ...next].filter((layer, index, layers) => {
    return layers.indexOf(layer) === index && previousSet.has(layer) !== nextSet.has(layer);
  });
}

function hasAnyCharacterLayer(layers: PresentationLayer[]): boolean {
  return layers.includes("manju") || layers.includes("static_illustration") || layers.includes("live2d");
}
