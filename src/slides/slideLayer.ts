import { getSlideContent } from "./sampleSlides";
import type { PresentationSnapshot } from "../presentation/types";
import type { SlideContent } from "./types";

export type SlideLayer = {
  update: (snapshot: PresentationSnapshot) => void;
  dispose: () => void;
};

export function createSlideLayer(host: HTMLElement, stageShell: HTMLElement): SlideLayer {
  return {
    update: (snapshot) => {
      const slide = getSlideContent(snapshot.cue.slideRef);
      host.classList.toggle("slide-layer-host--visible", slide !== null);
      stageShell.classList.toggle("stage-shell--slide-only", slide?.displayMode === "slide_only");

      if (!slide) {
        host.innerHTML = "";
        return;
      }

      host.innerHTML = renderSlide(slide);
    },
    dispose: () => {
      host.innerHTML = "";
      host.classList.remove("slide-layer-host--visible");
      stageShell.classList.remove("stage-shell--slide-only");
    }
  };
}

function renderSlide(slide: SlideContent): string {
  const body = slide.body ? `<p class="slide-layer__body">${escapeHtml(slide.body)}</p>` : "";
  const subtitle = slide.subtitle ? `<p class="slide-layer__subtitle">${escapeHtml(slide.subtitle)}</p>` : "";
  const bullets = slide.bullets
    ? `<ul>${slide.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
    : "";
  const image = slide.image
    ? `
      <figure class="slide-layer__figure">
        <img src="${escapeHtml(slide.image.src)}" alt="${escapeHtml(slide.image.alt)}" />
        ${slide.image.caption ? `<figcaption>${escapeHtml(slide.image.caption)}</figcaption>` : ""}
      </figure>
    `
    : "";
  const code = slide.code
    ? `
      <pre class="slide-layer__code"><code>${escapeHtml(slide.code.source)}</code></pre>
      <span class="slide-layer__language">${escapeHtml(slide.code.language)}</span>
    `
    : "";

  return `
    <article class="slide-layer slide-layer--${slide.layout}" aria-label="${escapeHtml(slide.title)}">
      <header>
        <span class="slide-layer__layout">${escapeHtml(slide.layout)}</span>
        <h2>${escapeHtml(slide.title)}</h2>
        ${subtitle}
      </header>
      <div class="slide-layer__content">
        ${body}
        ${bullets}
        ${image}
        ${code}
      </div>
    </article>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
