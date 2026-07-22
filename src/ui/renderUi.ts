import type { PresentationSnapshot } from "../presentation/types";
import type { PresenterCommand } from "../presentation/types";
import type { EndingCreditsVariant } from "./endingCredits";
import { renderStatusPanel } from "./statusPanel";

export type UiHandlers = {
  onCommand: (command: PresenterCommand) => void;
  onReset: () => void;
  onToggleNote: () => void;
  onToggleSubtitles: () => void;
  onShowCredits: (variant: EndingCreditsVariant) => void;
  onLoadSampleScript: () => void;
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
        <div id="slide-layer-host" class="slide-layer-host" aria-live="polite"></div>
        <div id="subtitle-layer-host" class="subtitle-layer-host"></div>
        <div id="live2d-host" class="live2d-host" aria-hidden="true"></div>
        <div id="image-presenter-host" class="image-presenter-host" aria-hidden="true"></div>
        <div id="static-illustration-host" class="static-illustration-host" aria-hidden="true"></div>
        <div class="stage-overlay">
          <div class="live-badge">3D Stage UI</div>
        </div>
      </section>
      <aside class="control-panel">
        <div id="status-panel"></div>
        <nav class="controls" aria-label="Presentation controls">
          <button data-command="back" type="button">Back</button>
          <button data-command="next" type="button" class="primary">Next</button>
          <button data-command="supplement" type="button">Supplement</button>
          <button data-command="tsukkomi" type="button">Tsukkomi</button>
          <button data-command="qa" type="button">QA Mode</button>
          <button data-command="summary" type="button">Summary</button>
          <button data-command="return_to_script" type="button">Return</button>
          <button data-command="skip" type="button">Skip</button>
          <button data-command="pause" type="button">Pause</button>
          <button id="reset-button" type="button">Reset</button>
          <button id="note-button" type="button">Toggle Speaker Note</button>
          <button id="subtitle-button" type="button">Toggle Subtitles</button>
          <button id="sample-script-button" type="button">Load Sample Script</button>
          <button data-credits="crawl" type="button">Credits Crawl</button>
          <button data-credits="spiral" type="button">Credits Spiral</button>
        </nav>
      </aside>
    </main>
  `;

  const statusPanel = requireElement(root, "#status-panel");
  root.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
    const command = button.dataset.command as PresenterCommand;
    button.addEventListener("click", () => handlers.onCommand(command));
  });
  root.querySelectorAll<HTMLButtonElement>("[data-credits]").forEach((button) => {
    const variant = button.dataset.credits as EndingCreditsVariant;
    button.addEventListener("click", () => handlers.onShowCredits(variant));
  });
  root.querySelector("#reset-button")?.addEventListener("click", handlers.onReset);
  root.querySelector("#note-button")?.addEventListener("click", handlers.onToggleNote);
  root.querySelector("#subtitle-button")?.addEventListener("click", handlers.onToggleSubtitles);
  root.querySelector("#sample-script-button")?.addEventListener("click", handlers.onLoadSampleScript);

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

export function getStaticIllustrationHost(root: HTMLElement): HTMLElement {
  return requireElement(root, "#static-illustration-host");
}

export function getStageShell(root: HTMLElement): HTMLElement {
  return requireElement(root, ".stage-shell");
}

export function getSlideLayerHost(root: HTMLElement): HTMLElement {
  return requireElement(root, "#slide-layer-host");
}

export function getSubtitleLayerHost(root: HTMLElement): HTMLElement {
  return requireElement(root, "#subtitle-layer-host");
}

function requireElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Missing UI element: ${selector}`);
  }

  return element;
}
