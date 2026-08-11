import type { PresentationSnapshot } from "../presentation/types";

export type Algorithm2DLayer = {
  update: (snapshot: PresentationSnapshot) => void;
  dispose: () => void;
};

type AlgorithmMode = "stack" | "queue" | "buffer" | "sort" | null;

const modeByObjectRef: Record<string, AlgorithmMode> = {
  algorithm_stack: "stack",
  algorithm_queue: "queue",
  algorithm_ring_buffer: "buffer",
  algorithm_sort: "sort"
};

export function createAlgorithm2DLayer(host: HTMLElement): Algorithm2DLayer {
  let previousCueId: string | null = null;

  return {
    update: (snapshot) => {
      const mode = modeByObjectRef[snapshot.cue.stage?.objectRef ?? ""] ?? null;
      if (snapshot.cue.id === previousCueId) {
        return;
      }

      previousCueId = snapshot.cue.id;
      host.replaceChildren();
      if (!mode) {
        return;
      }

      host.append(createVisualizer(mode));
    },
    dispose: () => {
      host.replaceChildren();
    }
  };
}

function createVisualizer(mode: Exclude<AlgorithmMode, null>): HTMLElement {
  const visualizer = document.createElement("section");
  visualizer.className = `algorithm-2d algorithm-2d--${mode}`;
  visualizer.setAttribute("aria-label", `${mode} algorithm visualization`);

  switch (mode) {
    case "stack":
      visualizer.innerHTML = `
        <p class="algorithm-2d__label">Stack: push / pop</p>
        <div class="algorithm-2d__stack" aria-hidden="true">
          <span class="algorithm-2d__token token--cyan">A</span>
          <span class="algorithm-2d__token token--blue">B</span>
          <span class="algorithm-2d__token token--orange">C</span>
        </div>`;
      break;
    case "queue":
      visualizer.innerHTML = `
        <p class="algorithm-2d__label">Queue: enqueue -> dequeue</p>
        <div class="algorithm-2d__queue" aria-hidden="true">
          <span class="algorithm-2d__token token--cyan">A</span>
          <span class="algorithm-2d__token token--blue">B</span>
          <span class="algorithm-2d__token token--orange">C</span>
          <span class="algorithm-2d__arrow">-></span>
        </div>`;
      break;
    case "buffer":
      visualizer.innerHTML = `
        <p class="algorithm-2d__label">Ring Buffer: read / write</p>
        <div class="algorithm-2d__ring" aria-hidden="true">
          <span class="algorithm-2d__ring-slot">0</span><span class="algorithm-2d__ring-slot">1</span>
          <span class="algorithm-2d__ring-slot">2</span><span class="algorithm-2d__ring-slot">3</span>
          <span class="algorithm-2d__ring-pointer">write</span>
        </div>`;
      break;
    case "sort":
      visualizer.innerHTML = `
        <p class="algorithm-2d__label">Sort: compare / swap</p>
        <div class="algorithm-2d__bars" aria-hidden="true">
          <span class="algorithm-2d__bar bar--one"></span><span class="algorithm-2d__bar bar--two"></span>
          <span class="algorithm-2d__bar bar--three"></span><span class="algorithm-2d__bar bar--four"></span>
        </div>`;
      break;
  }

  return visualizer;
}
