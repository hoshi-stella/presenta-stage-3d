export type EndingCreditsVariant = "crawl" | "spiral";

export type EndingCreditsOverlay = {
  show: (variant: EndingCreditsVariant) => void;
  hide: () => void;
  dispose: () => void;
};

const creditGroups = [
  {
    title: "PRESENTA STAGE 3D",
    items: ["cue driven presentation", "browser stage prototype", "local character performance"]
  },
  {
    title: "STAGE ENGINE",
    items: ["TypeScript", "Vite", "Babylon.js", "WebGL2"]
  },
  {
    title: "CHARACTER LAYERS",
    items: ["Live2D Cubism Core", "PixiJS", "pixi-live2d-display", "UnityGLTF", "glTF / GLB"]
  },
  {
    title: "LOCAL ASSETS",
    items: ["UnityChan local GLB", "Hoshinonya Live2D", "assets-local", "not committed to Git"]
  },
  {
    title: "APPLICATION CORE",
    items: ["Cue Runner", "Character Registry", "Direction Resolver", "Mock AI Client"]
  },
  {
    title: "SPECIAL THANKS",
    items: ["Rei", "Mikoto", "LT operators", "future presenters"]
  }
];

const spiralLines = [
  "I realize",
  "the stage is state",
  "we are not rendering slides",
  "TypeScript",
  "Vite",
  "Babylon.js",
  "Live2D Cubism Core",
  "PixiJS",
  "UnityGLTF",
  "local characters",
  "not committed",
  "only performed",
  "presenta-stage-3d"
];

export function createEndingCreditsOverlay(root: HTMLElement): EndingCreditsOverlay {
  const overlay = document.createElement("div");
  overlay.className = "ending-credits";
  overlay.setAttribute("aria-hidden", "true");
  root.appendChild(overlay);

  const hide = (): void => {
    overlay.className = "ending-credits";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = "";
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      hide();
    }
  };
  const handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(".ending-credits__close")) {
      hide();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  overlay.addEventListener("click", handleClick);

  return {
    show: (variant) => {
      overlay.className = `ending-credits ending-credits--visible ending-credits--${variant}`;
      overlay.setAttribute("aria-hidden", "false");
      overlay.innerHTML = variant === "crawl" ? renderCrawlCredits() : renderSpiralCredits();
    },
    hide,
    dispose: () => {
      window.removeEventListener("keydown", handleKeyDown);
      overlay.removeEventListener("click", handleClick);
      overlay.remove();
    }
  };
}

function renderCrawlCredits(): string {
  return `
    <div class="ending-credits__fade ending-credits__fade--top"></div>
    <div class="ending-credits__fade ending-credits__fade--bottom"></div>
    <div class="ending-credits__crawl" aria-label="Technology credits crawl">
      ${creditGroups.map((group) => `
        <section>
          <h2>${escapeHtml(group.title)}</h2>
          ${group.items.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </section>
      `).join("")}
    </div>
    <button class="ending-credits__close" type="button" aria-label="Close credits">Close</button>
  `;
}

function renderSpiralCredits(): string {
  return `
    <div class="ending-credits__vignette"></div>
    <div class="ending-credits__spiral" aria-label="Technology credits spiral">
      ${spiralLines.map((line, index) => `
        <span style="${getSpiralStyle(index)}">${escapeHtml(line)}</span>
      `).join("")}
    </div>
    <button class="ending-credits__close" type="button" aria-label="Close credits">Close</button>
  `;
}

function getSpiralStyle(index: number): string {
  const delay = -index * 8.2;
  const size = index % 3 === 0 ? 1.18 : index % 3 === 1 ? 0.9 : 1.02;
  return `--credit-delay:${delay}s;--credit-size:${size};`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
