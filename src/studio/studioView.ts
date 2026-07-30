import { downloadPresentationPackage } from "../package/exporter";
import { loadPresentationFromFile, loadPresentationFromUrl } from "../package/loader";
import { getPresentationPackageUrl } from "../package/presentationSource";
import type { CueDefinition, PresentationPackageV1, SlideDefinition } from "../package/types";
import { validatePresentationPackage } from "../package/validator";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { createStudioStore, type StudioState } from "./studioStore";

type StudioSource = "built-in" | string;

export function renderStudioView(root: HTMLElement): void {
  const store = createStudioStore();
  let source: StudioSource = "built-in";

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const slideId = target.closest<HTMLButtonElement>("[data-studio-slide]")?.dataset.studioSlide;
    const cueId = target.closest<HTMLButtonElement>("[data-studio-cue]")?.dataset.studioCue;
    if (slideId) store.selectSlide(slideId);
    if (cueId) store.selectCue(cueId);
    if (target.closest("[data-studio-apply-title]")) {
      const presentation = store.getState().presentation;
      const titleInput = root.querySelector<HTMLInputElement>("[data-studio-title]");
      const title = titleInput?.value.trim();
      if (presentation && title && title !== presentation.presentation.title) {
        store.setPresentation({
          ...presentation,
          presentation: { ...presentation.presentation, title }
        }, { dirty: true });
      }
    }
    if (target.closest("[data-studio-export]") && store.getState().presentation) {
      downloadPresentationPackage(store.getState().presentation!);
      store.markClean();
    }
    if (target.closest("[data-studio-starter]")) {
      source = "built-in";
      store.setPresentation(createDefaultPresentation());
    }
  });

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file" && target.files?.[0]) {
      void importPresentationFile(target.files[0]);
      target.value = "";
    }
  });

  const unsubscribe = store.subscribe((state) => renderWorkspace(root, state, source));
  void loadInitialPresentation();

  async function loadInitialPresentation(): Promise<void> {
    store.setLoading(true);
    const packageUrl = getPresentationPackageUrl();
    try {
      const presentation = await loadPresentationFromUrl(packageUrl);
      source = packageUrl;
      store.setPresentation(presentation);
    } catch (error) {
      source = "built-in";
      store.setPresentation(createDefaultPresentation());
      store.setError(`Package could not be loaded from ${packageUrl}. Showing the built-in starter package. ${message(error)}`);
    } finally {
      store.setLoading(false);
    }
  }

  async function importPresentationFile(file: File): Promise<void> {
    store.setLoading(true);
    try {
      const presentation = await loadPresentationFromFile(file);
      source = `file:${file.name}`;
      store.setPresentation(presentation);
    } catch (error) {
      store.setError(`Import failed. The current Package was kept. ${message(error)}`);
    } finally {
      store.setLoading(false);
    }
  }

  window.addEventListener("pagehide", unsubscribe, { once: true });
}

function renderWorkspace(root: HTMLElement, state: StudioState, source: StudioSource): void {
  if (!state.presentation) {
    root.innerHTML = renderEmptyWorkspace(state);
    return;
  }

  const { presentation } = state;
  const selectedSlide = presentation.slides.find((slide) => slide.id === state.selection.slideId) ?? presentation.slides[0];
  const selectedCue = presentation.cues.find((cue) => cue.id === state.selection.cueId) ?? presentation.cues[0];
  const validation = validatePresentationPackage(presentation);

  root.innerHTML = `<main class="studio-shell" aria-label="Presenta Studio">
    <header class="studio-header">
      <div><strong>Presenta Studio</strong><span>Presentation Package workspace</span></div>
      <div class="studio-header__actions">
        <span class="studio-source">${escape(source)}</span>
        <span class="studio-state ${state.isDirty ? "studio-state--dirty" : ""}">${state.isDirty ? "Unsaved changes" : "Saved"}</span>
        <label class="studio-button">Import<input type="file" accept="application/json,.json" hidden></label>
        <button class="studio-button" type="button" data-studio-export>Export</button>
        <a class="studio-button" href="${stagePlayerHref(source)}">Open Stage Player</a>
      </div>
    </header>
    ${state.error ? `<div class="studio-alert" role="status">${escape(state.error)}</div>` : ""}
    <aside class="studio-nav">
      <div class="studio-package-summary"><p>Package</p><h1>${escape(presentation.presentation.title)}</h1><span>${escape(presentation.presentation.author.name)} / ${formatDuration(presentation.presentation.estimatedDurationMs)}</span></div>
      ${renderNavigation("Slides", presentation.slides, selectedSlide?.id ?? null, "slide")}
      ${renderNavigation("Cues", presentation.cues, selectedCue?.id ?? null, "cue")}
    </aside>
    <section class="studio-preview" aria-label="Presentation preview">
      ${state.isLoading ? `<div class="studio-loading">Loading Presentation Package...</div>` : renderPreview(selectedSlide, selectedCue)}
    </section>
    <aside class="studio-inspector">
      ${renderInspector(presentation, selectedSlide, selectedCue, validation.errors.length, validation.warnings.length)}
    </aside>
  </main>`;
}

function renderEmptyWorkspace(state: StudioState): string {
  return `<main class="studio-empty"><div><p>Presenta Studio</p><h1>${state.isLoading ? "Loading Package..." : "No Presentation Package open"}</h1><p>Import a versioned Package to edit it without using raw JSON as the primary workflow.</p>${state.error ? `<p class="studio-alert">${escape(state.error)}</p>` : ""}<button class="studio-button" type="button" data-studio-starter>Use starter package</button></div></main>`;
}

function renderNavigation(title: string, entries: SlideDefinition[] | CueDefinition[], selectedId: string | null, kind: "slide" | "cue"): string {
  return `<section class="studio-nav__section"><h2>${title}<span>${entries.length}</span></h2><div class="studio-nav__list">${entries.map((entry, index) => {
    const label = kind === "slide" ? (entry as SlideDefinition).title ?? entry.id : (entry as CueDefinition).text;
    const dataAttribute = kind === "slide" ? "data-studio-slide" : "data-studio-cue";
    return `<button type="button" ${dataAttribute}="${escape(entry.id)}" class="${entry.id === selectedId ? "is-selected" : ""}"><span>${String(index + 1).padStart(2, "0")}</span>${escape(label)}</button>`;
  }).join("")}</div></section>`;
}

function renderPreview(slide: SlideDefinition | undefined, cue: CueDefinition | undefined): string {
  if (!slide) return `<div class="studio-loading">This Package has no slides.</div>`;
  return `<div class="studio-preview__toolbar"><span>${escape(slide.layout)}</span><span>${cue ? `${escape(cue.kind)} / ${escape(cue.speaker)}` : "No cue selected"}</span></div><article class="studio-slide-preview studio-slide-preview--${escape(slide.layout)}"><p class="studio-slide-preview__eyebrow">${escape(slide.id)}</p><h1>${escape(slide.title ?? "Untitled slide")}</h1>${slide.subtitle ? `<h2>${escape(slide.subtitle)}</h2>` : ""}${slide.body ? `<p>${escape(Array.isArray(slide.body) ? slide.body.join(" ") : slide.body)}</p>` : ""}${slide.bullets?.length ? `<ul>${slide.bullets.map((bullet) => `<li>${escape(bullet)}</li>`).join("")}</ul>` : ""}</article>${cue ? `<section class="studio-cue-preview"><p>Current cue</p><strong>${escape(cue.text)}</strong></section>` : ""}`;
}

function renderInspector(presentation: PresentationPackageV1, slide: SlideDefinition | undefined, cue: CueDefinition | undefined, errors: number, warnings: number): string {
  return `<section><p class="studio-inspector__eyebrow">Presentation</p><label class="studio-field">Title<input type="text" data-studio-title value="${escape(presentation.presentation.title)}"></label><button class="studio-button" type="button" data-studio-apply-title>Apply title</button><dl><dt>Package ID</dt><dd>${escape(presentation.presentation.id)}</dd><dt>Language</dt><dd>${escape(presentation.presentation.language)}</dd><dt>Aspect ratio</dt><dd>${escape(presentation.settings.aspectRatio)}</dd></dl></section><section><p class="studio-inspector__eyebrow">Selected slide</p><h2>${escape(slide?.title ?? "No slide")}</h2><dl><dt>ID</dt><dd>${escape(slide?.id ?? "-")}</dd><dt>Layout</dt><dd>${escape(slide?.layout ?? "-")}</dd></dl></section><section><p class="studio-inspector__eyebrow">Selected cue</p><h2>${escape(cue?.kind ?? "No cue")}</h2><dl><dt>ID</dt><dd>${escape(cue?.id ?? "-")}</dd><dt>Speaker</dt><dd>${escape(cue?.speaker ?? "-")}</dd><dt>After</dt><dd>${escape(cue?.after.mode ?? "-")}</dd></dl></section><section class="studio-validation"><p class="studio-inspector__eyebrow">Validation</p><strong>${errors} errors / ${warnings} warnings</strong><span>${errors === 0 ? "Ready to export" : "Resolve errors before export"}</span></section>`;
}

function stagePlayerHref(source: StudioSource): string {
  if (source === "built-in" || source.startsWith("file:")) return "/";
  return `/?presentation=${encodeURIComponent(source)}`;
}

function formatDuration(durationMs: number | undefined): string {
  return durationMs ? `${Math.max(1, Math.round(durationMs / 60000))} min` : "Duration not set";
}

function escape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
