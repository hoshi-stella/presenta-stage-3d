import type { PresentationSnapshot } from "../presentation/types";
import type { FallbackLevel, PresenterCommand } from "../presentation/types";
import type { EndingCreditsVariant } from "./endingCredits";
import { renderStatusPanel } from "./statusPanel";
import type { PreflightReport } from "../preflight/types";

export type UiHandlers = {
  onCommand: (command: PresenterCommand) => void;
  onReset: () => void;
  onToggleNote: () => void;
  onToggleSubtitles: () => void;
  onFallbackLevel: (level: FallbackLevel) => void;
  onShowCredits: (variant: EndingCreditsVariant) => void;
  onLoadSampleScript: () => void;
  onAskMockAi: (text: string) => void;
  onLoadPackage: (file: File) => void;
  onExportPackage: () => void;
  onRunPreflight: () => void;
  getPackageStatus: () => { id: string; title: string; source: string; errors: number; warnings: number };
  getPreflightReport: () => PreflightReport | null;
};

export type UiRenderer = {
  update: (snapshot: PresentationSnapshot) => void;
  setTransitioning: (isTransitioning: boolean) => void;
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
          <button id="load-package-button" type="button">Load Package</button>
          <button id="export-package-button" type="button">Export Package</button>
          <button id="run-preflight-button" type="button">Run Preflight</button>
          <input id="package-file-input" type="file" accept="application/json,.json,.presentation.json" hidden />
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
  let latestSnapshot: PresentationSnapshot | null = null;
  let isTransitioning = false;
  const renderStatus = (): void => {
    if (latestSnapshot) {
      statusPanel.innerHTML = renderStatusPanel(latestSnapshot, handlers.getPackageStatus(), handlers.getPreflightReport(), isTransitioning);
    }
  };
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("#mock-ai-button")) {
      return;
    }

    const input = statusPanel.querySelector<HTMLInputElement>("#mock-ai-input");
    handlers.onAskMockAi(input?.value.trim() ?? "");
  });
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
  root.querySelector<HTMLButtonElement>("#load-package-button")?.addEventListener("click", () => root.querySelector<HTMLInputElement>("#package-file-input")?.click());
  root.querySelector<HTMLInputElement>("#package-file-input")?.addEventListener("change", (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) handlers.onLoadPackage(file);
    (event.target as HTMLInputElement).value = "";
  });
  root.querySelector("#export-package-button")?.addEventListener("click", handlers.onExportPackage);
  root.querySelector("#run-preflight-button")?.addEventListener("click", handlers.onRunPreflight);
  root.querySelector<HTMLButtonElement>("#control-panel-toggle")?.addEventListener("click", () => {
    const nextState = root.dataset.controlPanel === "collapsed" ? "open" : "collapsed";
    setControlPanelState(root, nextState);
  });
  root.querySelector<HTMLSelectElement>("#fallback-level-select")?.addEventListener("change", (event) => {
    handlers.onFallbackLevel((event.target as HTMLSelectElement).value as FallbackLevel);
  });

  return {
    update: (snapshot) => {
      latestSnapshot = snapshot;
      renderStatus();
      const fallbackSelect = root.querySelector<HTMLSelectElement>("#fallback-level-select");
      if (fallbackSelect && fallbackSelect.value !== snapshot.fallbackLevel) {
        fallbackSelect.value = snapshot.fallbackLevel;
      }
    },
    setTransitioning: (nextIsTransitioning) => {
      isTransitioning = nextIsTransitioning;
      renderStatus();
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
