import type { PresentationSnapshot } from "../presentation/types";
import { renderStatusPanel } from "./statusPanel";

export type UiHandlers = {
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleNote: () => void;
  onAskMockAi: (text: string) => void;
};

export type UiRenderer = {
  update: (snapshot: PresentationSnapshot) => void;
};

export function createUiRenderer(root: HTMLElement, handlers: UiHandlers): UiRenderer {
  root.innerHTML = `
    <main class="shell">
      <section class="stage-shell">
        <canvas id="stage-canvas" aria-label="3D presentation stage"></canvas>
        <div class="stage-overlay">
          <div class="live-badge">3D Stage UI</div>
        </div>
      </section>
      <aside class="control-panel">
        <div id="status-panel"></div>
        <nav class="controls" aria-label="Presentation controls">
          <button id="previous-button" type="button">Previous</button>
          <button id="next-button" type="button" class="primary">Next</button>
          <button id="play-button" type="button">Play Script</button>
          <button id="pause-button" type="button">Pause</button>
          <button id="reset-button" type="button">Reset</button>
          <button id="note-button" type="button">Toggle Speaker Note</button>
        </nav>
      </aside>
    </main>
  `;

  const statusPanel = requireElement(root, "#status-panel");
  root.querySelector("#previous-button")?.addEventListener("click", handlers.onPrevious);
  root.querySelector("#next-button")?.addEventListener("click", handlers.onNext);
  root.querySelector("#play-button")?.addEventListener("click", handlers.onPlay);
  root.querySelector("#pause-button")?.addEventListener("click", handlers.onPause);
  root.querySelector("#reset-button")?.addEventListener("click", handlers.onReset);
  root.querySelector("#note-button")?.addEventListener("click", handlers.onToggleNote);

  return {
    update: (snapshot) => {
      statusPanel.innerHTML = renderStatusPanel(snapshot);
      const askButton = statusPanel.querySelector<HTMLButtonElement>("#mock-ai-button");
      const input = statusPanel.querySelector<HTMLInputElement>("#mock-ai-input");
      askButton?.addEventListener("click", () => handlers.onAskMockAi(input?.value.trim() ?? ""));
    }
  };
}

export function getStageCanvas(root: HTMLElement): HTMLCanvasElement {
  return requireElement(root, "#stage-canvas") as HTMLCanvasElement;
}

function requireElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Missing UI element: ${selector}`);
  }

  return element;
}
