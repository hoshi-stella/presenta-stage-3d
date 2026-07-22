import { getCharacterInstance } from "../scene/characterRegistry";
import type { CueKind, PresentationSnapshot } from "../presentation/types";

export type SubtitleLayer = {
  update: (snapshot: PresentationSnapshot) => void;
  dispose: () => void;
};

const kindLabels: Record<CueKind, string> = {
  talk: "Talk",
  question: "Question",
  answer: "Answer",
  supplement: "Supplement",
  reaction: "Reaction",
  tsukkomi: "Tsukkomi",
  slide: "Slide",
  demo: "Demo",
  summary: "Summary",
  qa: "QA"
};

export function createSubtitleLayer(host: HTMLElement): SubtitleLayer {
  host.innerHTML = `
    <div class="subtitle-card" role="status" aria-live="polite">
      <div class="subtitle-card__meta">
        <span class="subtitle-card__speaker"></span>
        <span class="subtitle-card__kind"></span>
      </div>
      <p class="subtitle-card__text"></p>
    </div>
  `;

  const card = requireElement(host, ".subtitle-card");
  const speaker = requireElement(host, ".subtitle-card__speaker");
  const kind = requireElement(host, ".subtitle-card__kind");
  const text = requireElement(host, ".subtitle-card__text");
  let currentLine = "";
  let currentLayout = "";
  let typeTimerId: number | null = null;

  const stopTypewriter = (): void => {
    if (typeTimerId === null) {
      return;
    }

    window.clearInterval(typeTimerId);
    typeTimerId = null;
  };

  const renderLine = (line: string, layout: string): void => {
    if (line === currentLine && layout === currentLayout) {
      return;
    }

    currentLine = line;
    currentLayout = layout;
    stopTypewriter();

    if (layout !== "slide_with_manju" || line.length === 0) {
      text.textContent = line;
      return;
    }

    let index = 0;
    text.textContent = "";
    typeTimerId = window.setInterval(() => {
      index += 1;
      text.textContent = line.slice(0, index);

      if (index >= line.length) {
        stopTypewriter();
      }
    }, 56);
  };

  return {
    update: (snapshot) => {
      const character = getCharacterInstance(snapshot.cue.speaker);
      const line = normalizeSubtitle(snapshot.cue.text);
      const layout = snapshot.presentation.layout;

      host.classList.toggle("subtitle-layer-host--hidden", !snapshot.showSubtitles);
      host.dataset.kind = snapshot.cue.kind;
      host.dataset.speaker = snapshot.cue.speaker;
      host.dataset.layout = layout;
      card.classList.toggle("subtitle-card--compact", line.length > 54);
      card.classList.toggle("subtitle-card--dense", line.length > 92);
      card.classList.toggle("subtitle-card--speech-bubble", layout === "slide_with_manju");
      speaker.textContent = character.displayName;
      kind.textContent = kindLabels[snapshot.cue.kind];
      renderLine(line, layout);
    },
    dispose: () => {
      stopTypewriter();
      host.innerHTML = "";
      host.classList.remove("subtitle-layer-host--hidden");
      delete host.dataset.kind;
      delete host.dataset.speaker;
      delete host.dataset.layout;
    }
  };
}

function normalizeSubtitle(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function requireElement(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Missing subtitle element: ${selector}`);
  }

  return element;
}
