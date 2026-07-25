import type { PresentationSnapshot } from "../presentation/types";
import type { FallbackLevel, PresenterCommand } from "../presentation/types";
import type { EndingCreditsVariant } from "./endingCredits";
import { renderStatusPanel } from "./statusPanel";

export type UiHandlers = {
  onCommand: (command: PresenterCommand) => void;
  onReset: () => void;
  onToggleNote: () => void;
  onToggleSubtitles: () => void;
  onFallbackLevel: (level: FallbackLevel) => void;
  onShowCredits: (variant: EndingCreditsVariant) => void;
  onLoadSampleScript: () => void;
  onAskMockAi: (text: string) => void;
};

export type UiRenderer = {
  update: (snapshot: PresentationSnapshot) => void;
};

export function createUiRenderer(root: HTMLElement, handlers: UiHandlers): UiRenderer {
  const initialControlPanelState = readControlPanelState();
  root.dataset.controlPanel = initialControlPanelState;
  root.innerHTML = `
    <main class="shell">
      <button
        id="control-panel-toggle"
        class="control-panel-toggle"
        type="button"
        aria-controls="control-panel"
        aria-expanded="${initialControlPanelState === "open" ? "true" : "false"}"
      >
        ${initialControlPanelState === "open" ? "Hide Panel" : "Show Panel"}
      </button>
      <section class="stage-shell">
        <canvas id="stage-canvas" aria-label="3D presentation stage"></canvas>
        <div id="slide-layer-host" class="slide-layer-host" aria-live="polite"></div>
        <div id="subtitle-layer-host" class="subtitle-layer-host"></div>
        <div id="live2d-host" class="live2d-host" aria-hidden="true"></div>
        <div id="image-presenter-host" class="image-presenter-host" aria-hidden="true"></div>
        <div id="static-illustration-host" class="static-illustration-host" aria-hidden="true"></div>
        <div class="stage-overlay">
          <div class="live-badge">3D Stage UI</div>
          <div id="transition-debug" class="transition-debug">Transition: idle</div>
        </div>
      </section>
      <aside id="control-panel" class="control-panel">
        <div id="status-panel"></div>
        <nav class="controls" aria-label="Presentation controls">
          <button data-command="back" type="button">Back</button>
          <button data-command="next" type="button" class="primary">Next</button>
          <button data-command="supplement" type="button">Supplement</button>
          <button data-command="tsukkomi" type="button">Tsukkomi</button>
          <button data-command="qa" type="button">QA Mode</button>
          <button data-command="summary" type="button">Summary</button>
          <button data-command="demo" type="button">Demo Script</button>
          <button data-command="return_to_script" type="button">Return</button>
          <button data-command="skip" type="button">Skip</button>
          <button data-command="pause" type="button">Pause</button>
          <button id="reset-button" type="button">Reset</button>
          <button id="note-button" type="button">Toggle Speaker Note</button>
          <button id="subtitle-button" type="button">Toggle Subtitles</button>
          <button id="sample-script-button" type="button">Load Sample Script</button>
          <button data-credits="crawl" type="button">Credits Crawl</button>
          <button data-credits="spiral" type="button">Credits Spiral</button>
          <label class="fallback-select">
            <span>Fallback</span>
            <select id="fallback-level-select">
              <option value="full">full</option>
              <option value="no-live2d">no-live2d</option>
              <option value="no-3d-model">no-3d-model</option>
              <option value="offline">offline</option>
              <option value="static">static</option>
            </select>
          </label>
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
  root.querySelector<HTMLButtonElement>("#control-panel-toggle")?.addEventListener("click", () => {
    const nextState = root.dataset.controlPanel === "collapsed" ? "open" : "collapsed";
    setControlPanelState(root, nextState);
  });
  root.querySelector<HTMLSelectElement>("#fallback-level-select")?.addEventListener("change", (event) => {
    handlers.onFallbackLevel((event.target as HTMLSelectElement).value as FallbackLevel);
  });

  return {
    update: (snapshot) => {
      statusPanel.innerHTML = renderStatusPanel(snapshot);
      const fallbackSelect = root.querySelector<HTMLSelectElement>("#fallback-level-select");
      if (fallbackSelect && fallbackSelect.value !== snapshot.fallbackLevel) {
        fallbackSelect.value = snapshot.fallbackLevel;
      }
      const askButton = statusPanel.querySelector<HTMLButtonElement>("#mock-ai-button");
      const input = statusPanel.querySelector<HTMLInputElement>("#mock-ai-input");
      askButton?.addEventListener("click", () => handlers.onAskMockAi(input?.value.trim() ?? ""));
    }
  };
}

function readControlPanelState(): "open" | "collapsed" {
  try {
    return window.localStorage.getItem("presenta-stage-3d:control-panel") === "collapsed" ? "collapsed" : "open";
  } catch {
    return "open";
  }
}

function setControlPanelState(root: HTMLElement, state: "open" | "collapsed"): void {
  root.dataset.controlPanel = state;
  try {
    window.localStorage.setItem("presenta-stage-3d:control-panel", state);
  } catch {
    // Ignore storage failures so the live presentation controls remain usable.
  }

  const toggle = root.querySelector<HTMLButtonElement>("#control-panel-toggle");
  if (!toggle) {
    return;
  }

  toggle.textContent = state === "open" ? "Hide Panel" : "Show Panel";
  toggle.setAttribute("aria-expanded", state === "open" ? "true" : "false");
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
