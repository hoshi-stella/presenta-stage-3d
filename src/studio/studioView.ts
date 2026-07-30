import { downloadPresentationPackage } from "../package/exporter";
import { loadPresentationFromFile, loadPresentationFromUrl } from "../package/loader";
import { getPresentationPackageUrl, handoffPresentationToStage } from "../package/presentationSource";
import type { CueDefinition, PackageSlideLayout, PresentationPackageV1, SlideDefinition } from "../package/types";
import { validatePresentationPackage } from "../package/validator";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { createStudioStore, type StudioState } from "./studioStore";
import { addSlide, deleteSlide, duplicateSlide, moveSlide } from "./slideEditor";
import { addCue, deleteCue, duplicateCue, mergeCueWithNext, moveCue, setCueBranchTarget, splitCue, updateCue } from "./cueEditor";

type StudioSource = "built-in" | string;

export function renderStudioView(root: HTMLElement): void {
  const store = createStudioStore();
  let source: StudioSource = "built-in";
  let loadGeneration = 0;

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
    if (target.closest("[data-studio-open-stage]") && store.getState().presentation) {
      handoffPresentationToStage(store.getState().presentation!);
    }
    if (target.closest("[data-studio-starter]")) {
      source = "built-in";
      store.setPresentation(createDefaultPresentation());
    }
    const presentation = store.getState().presentation;
    const selectedSlideId = store.getState().selection.slideId;
    if (!presentation) return;
    const layout = target.closest<HTMLButtonElement>("[data-studio-add-slide]")?.dataset.studioAddSlide as PackageSlideLayout | undefined;
    if (layout) {
      const next = addSlide(presentation, layout);
      store.setPresentation(next, { dirty: true });
      store.selectSlide(next.slides.at(-1)?.id ?? null);
    }
    if (selectedSlideId && target.closest("[data-studio-duplicate-slide]")) {
      const next = duplicateSlide(presentation, selectedSlideId);
      const index = next.slides.findIndex((slide) => slide.id === selectedSlideId);
      store.setPresentation(next, { dirty: true });
      store.selectSlide(next.slides[index + 1]?.id ?? selectedSlideId);
    }
    const move = target.closest<HTMLButtonElement>("[data-studio-move-slide]")?.dataset.studioMoveSlide;
    if (selectedSlideId && (move === "up" || move === "down")) {
      store.setPresentation(moveSlide(presentation, selectedSlideId, move === "up" ? -1 : 1), { dirty: true });
    }
    if (selectedSlideId && target.closest("[data-studio-delete-slide]")) {
      const result = deleteSlide(presentation, selectedSlideId);
      const notice = result.affectedCues.length ? ` ${result.affectedCues.length} cue(s) still reference it.` : "";
      if (window.confirm(`Delete this slide?${notice}`)) {
        store.setPresentation(result.presentation, { dirty: true });
        store.selectSlide(result.presentation.slides.at(-1)?.id ?? null);
        if (result.affectedCues.length) store.setError(`Deleted ${selectedSlideId}.${notice}`);
      }
    }
    if (target.closest("[data-studio-apply-slide]")) {
      const next = updateSelectedSlide(root, presentation, selectedSlideId);
      if (next) store.setPresentation(next, { dirty: true });
    }
    const selectedCueId = store.getState().selection.cueId;
    if (target.closest("[data-studio-add-cue]")) {
      const next = addCue(presentation, selectedSlideId ?? undefined); store.setPresentation(next, { dirty: true }); store.selectCue(next.cues.at(-1)?.id ?? null);
    }
    if (selectedCueId && target.closest("[data-studio-duplicate-cue]")) { const next = duplicateCue(presentation, selectedCueId); store.setPresentation(next, { dirty: true }); store.selectCue(next.cues[next.cues.findIndex((cue) => cue.id === selectedCueId) + 1]?.id ?? selectedCueId); }
    const cueMove = target.closest<HTMLButtonElement>("[data-studio-move-cue]")?.dataset.studioMoveCue;
    if (selectedCueId && (cueMove === "up" || cueMove === "down")) store.setPresentation(moveCue(presentation, selectedCueId, cueMove === "up" ? -1 : 1), { dirty: true });
    if (selectedCueId && target.closest("[data-studio-delete-cue]") && window.confirm("Delete this cue?")) { const next = deleteCue(presentation, selectedCueId); store.setPresentation(next, { dirty: true }); store.selectCue(next.cues.at(-1)?.id ?? null); }
    if (selectedCueId && target.closest("[data-studio-split-cue]")) { const text = presentation.cues.find((cue) => cue.id === selectedCueId)?.text ?? ""; const next = splitCue(presentation, selectedCueId, Math.ceil(text.length / 2)); store.setPresentation(next, { dirty: true }); }
    if (selectedCueId && target.closest("[data-studio-merge-cue]")) store.setPresentation(mergeCueWithNext(presentation, selectedCueId), { dirty: true });
    if (selectedCueId && target.closest("[data-studio-apply-cue]")) { const next = updateSelectedCue(root, presentation, selectedCueId); if (next) store.setPresentation(next, { dirty: true }); }
    if (selectedCueId && target.closest("[data-studio-apply-branch]")) {
      const branchTarget = root.querySelector<HTMLSelectElement>("[data-studio-cue-branch]")?.value || null;
      store.setPresentation(setCueBranchTarget(presentation, selectedCueId, branchTarget), { dirty: true });
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
    const generation = ++loadGeneration;
    store.setLoading(true);
    const packageUrl = getPresentationPackageUrl();
    try {
      const presentation = await loadPresentationFromUrl(packageUrl);
      if (generation !== loadGeneration) return;
      source = packageUrl;
      store.setPresentation(presentation);
    } catch (error) {
      if (generation !== loadGeneration) return;
      source = "built-in";
      store.setPresentation(createDefaultPresentation());
      store.setError(`Package could not be loaded from ${packageUrl}. Showing the built-in starter package. ${message(error)}`);
    } finally {
      if (generation === loadGeneration) store.setLoading(false);
    }
  }

  async function importPresentationFile(file: File): Promise<void> {
    const generation = ++loadGeneration;
    store.setLoading(true);
    try {
      const presentation = await loadPresentationFromFile(file);
      if (generation !== loadGeneration) return;
      source = `file:${file.name}`;
      store.setPresentation(presentation);
    } catch (error) {
      if (generation !== loadGeneration) return;
      store.setError(`Import failed. The current Package was kept. ${message(error)}`);
    } finally {
      if (generation === loadGeneration) store.setLoading(false);
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
        <a class="studio-button" data-studio-open-stage href="${stagePlayerHref(source)}">Open Stage Player</a>
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
    return `<button type="button" ${dataAttribute}="${escape(entry.id)}" aria-pressed="${entry.id === selectedId}" class="${entry.id === selectedId ? "is-selected" : ""}"><span>${String(index + 1).padStart(2, "0")}</span>${escape(label)}</button>`;
  }).join("")}</div></section>`;
}

function renderPreview(slide: SlideDefinition | undefined, cue: CueDefinition | undefined): string {
  if (!slide) return `<div class="studio-loading">This Package has no slides.</div>`;
  return `<div class="studio-preview__toolbar"><span>${escape(slide.layout)}</span><span>${cue ? `${escape(cue.kind)} / ${escape(cue.speaker)}` : "No cue selected"}</span></div><article class="studio-slide-preview studio-slide-preview--${escape(slide.layout)}"><p class="studio-slide-preview__eyebrow">${escape(slide.id)}</p><h1>${escape(slide.title ?? "Untitled slide")}</h1>${slide.subtitle ? `<h2>${escape(slide.subtitle)}</h2>` : ""}${slide.body ? `<p>${escape(Array.isArray(slide.body) ? slide.body.join(" ") : slide.body)}</p>` : ""}${slide.bullets?.length ? `<ul>${slide.bullets.map((bullet) => `<li>${escape(bullet)}</li>`).join("")}</ul>` : ""}</article>${cue ? `<section class="studio-cue-preview"><p>Current cue</p><strong>${escape(cue.text)}</strong></section>` : ""}`;
}

function renderInspector(presentation: PresentationPackageV1, slide: SlideDefinition | undefined, cue: CueDefinition | undefined, errors: number, warnings: number): string {
  const templates: PackageSlideLayout[] = ["title", "content", "image", "split", "code", "grid", "minimal"];
  const slideEditor = slide ? `<section><p class="studio-inspector__eyebrow">Selected slide</p><div class="studio-editor-actions"><button class="studio-button" data-studio-duplicate-slide type="button">Duplicate</button><button class="studio-button" data-studio-move-slide="up" type="button">Up</button><button class="studio-button" data-studio-move-slide="down" type="button">Down</button><button class="studio-button" data-studio-delete-slide type="button">Delete</button></div><label class="studio-field">Template<select data-studio-slide-layout>${templates.map((layout) => `<option value="${layout}" ${slide.layout === layout ? "selected" : ""}>${layout}</option>`).join("")}</select></label><label class="studio-field">Title<input data-studio-slide-title value="${escape(slide.title ?? "")}"></label><label class="studio-field">Subtitle<input data-studio-slide-subtitle value="${escape(slide.subtitle ?? "")}"></label><label class="studio-field">Body<textarea data-studio-slide-body>${escape(Array.isArray(slide.body) ? slide.body.join("\n") : slide.body ?? "")}</textarea></label><label class="studio-field">Footer<input data-studio-slide-footer value="${escape(slide.footer ?? "")}"></label><label class="studio-field">Image URL<input data-studio-slide-image value="${escape(slide.image?.url ?? "")}"></label><label class="studio-field">Code language<input data-studio-slide-code-language value="${escape(slide.code?.language ?? "")}"></label><label class="studio-field">Code<textarea data-studio-slide-code>${escape(slide.code?.value ?? "")}</textarea></label><button class="studio-button" data-studio-apply-slide type="button">Apply slide</button></section>` : "";
  const cueEditor = cue ? `<section><p class="studio-inspector__eyebrow">Selected cue</p><div class="studio-editor-actions"><button class="studio-button" type="button" data-studio-add-cue>+ Cue</button><button class="studio-button" type="button" data-studio-duplicate-cue>Duplicate</button><button class="studio-button" type="button" data-studio-split-cue>Split</button><button class="studio-button" type="button" data-studio-merge-cue>Merge next</button><button class="studio-button" type="button" data-studio-move-cue="up">Up</button><button class="studio-button" type="button" data-studio-move-cue="down">Down</button><button class="studio-button" type="button" data-studio-delete-cue>Delete</button></div><label class="studio-field">Speaker<select data-studio-cue-speaker>${presentation.characters.map((character) => `<option value="${escape(character.id)}" ${cue.speaker === character.id ? "selected" : ""}>${escape(character.displayName)}</option>`).join("")}</select></label><label class="studio-field">Text<textarea data-studio-cue-text>${escape(cue.text)}</textarea></label><label class="studio-field">Note<textarea data-studio-cue-note>${escape(cue.note ?? "")}</textarea></label><label class="studio-field">Slide<select data-studio-cue-slide><option value="">No slide</option>${presentation.slides.map((slide) => `<option value="${escape(slide.id)}" ${cue.slideRef === slide.id ? "selected" : ""}>${escape(slide.title ?? slide.id)}</option>`).join("")}</select></label><label class="studio-field">Intent<input data-studio-cue-intent value="${escape(cue.direction.intent)}"></label><label class="studio-field">Intensity<select data-studio-cue-intensity>${["low","medium","high"].map((value) => `<option ${cue.direction.intensity === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="studio-field">Duration ms<input type="number" min="0" data-studio-cue-duration value="${cue.estimatedDurationMs ?? ""}"></label><label class="studio-field">Progression<select data-studio-cue-after>${["wait_for_presenter","auto_next","branch_available","stop"].map((value) => `<option ${cue.after.mode === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><details><summary>Advanced stage options</summary><label class="studio-field">Direction preset<select data-studio-cue-preset><option value="">None</option>${presentation.directionPresets.map((preset) => `<option value="${escape(preset.id)}" ${cue.stage?.directionPreset === preset.id ? "selected" : ""}>${escape(preset.label)}</option>`).join("")}</select></label><label class="studio-field">Camera<input data-studio-cue-camera value="${escape(cue.stage?.camera ?? "")}"></label><label class="studio-field">Motion<input data-studio-cue-motion value="${escape(cue.stage?.motion ?? "")}"></label></details><button class="studio-button" type="button" data-studio-apply-cue>Apply cue</button></section>` : "";
  const cueContext = cue ? `<section class="studio-cue-context"><p class="studio-inspector__eyebrow">Cue context</p><span>Previous: ${escape(presentation.cues[presentation.cues.findIndex((item) => item.id === cue.id) - 1]?.text ?? "Start")}</span><span>Next: ${escape(presentation.cues[presentation.cues.findIndex((item) => item.id === cue.id) + 1]?.text ?? "End")}</span></section>` : "";
  const branchEditor = cue ? `<section><p class="studio-inspector__eyebrow">Branch and publication</p><label class="studio-field">Continue to<select data-studio-cue-branch><option value="">No branch</option>${presentation.cues.filter((item) => item.id !== cue.id).map((item) => `<option value="${escape(item.id)}" ${cue.after.branches?.[0]?.targetCueId === item.id ? "selected" : ""}>${escape(item.text)}</option>`).join("")}</select></label><label><input type="checkbox" data-studio-cue-visible ${cue.publication?.visible !== false ? "checked" : ""}> Visible</label><label><input type="checkbox" data-studio-cue-reading ${cue.publication?.includeInReadingView !== false ? "checked" : ""}> Reading view</label><label><input type="checkbox" data-studio-cue-replay ${cue.publication?.includeInReplayView !== false ? "checked" : ""}> Replay view</label><button class="studio-button" type="button" data-studio-apply-branch>Apply branch</button></section>` : "";
  return `<section><p class="studio-inspector__eyebrow">Presentation</p><label class="studio-field">Title<input type="text" data-studio-title value="${escape(presentation.presentation.title)}"></label><button class="studio-button" type="button" data-studio-apply-title>Apply title</button><div class="studio-template-actions">${templates.map((layout) => `<button class="studio-button" type="button" data-studio-add-slide="${layout}">+ ${layout}</button>`).join("")}</div></section>${slideEditor}${cueContext}${cueEditor}${branchEditor}<section class="studio-validation"><p class="studio-inspector__eyebrow">Validation</p><strong>${errors} errors / ${warnings} warnings</strong><span>${errors === 0 ? "Ready to export" : "Resolve errors before export"}</span></section>`;
}

function updateSelectedCue(root: HTMLElement, presentation: PresentationPackageV1, cueId: string): PresentationPackageV1 | null {
  const value = (selector: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? "";
  const duration = Number(value("[data-studio-cue-duration]"));
  const checked = (selector: string) => root.querySelector<HTMLInputElement>(selector)?.checked ?? false;
  return updateCue(presentation, cueId, { speaker: value("[data-studio-cue-speaker]"), text: value("[data-studio-cue-text]"), note: value("[data-studio-cue-note]") || undefined, slideRef: value("[data-studio-cue-slide]") || undefined, estimatedDurationMs: Number.isFinite(duration) && duration > 0 ? duration : undefined, direction: { intent: value("[data-studio-cue-intent]") || "neutral", intensity: value("[data-studio-cue-intensity]") as "low" | "medium" | "high" }, after: { mode: value("[data-studio-cue-after]") as CueDefinition["after"]["mode"] }, publication: { visible: checked("[data-studio-cue-visible]"), includeInReadingView: checked("[data-studio-cue-reading]"), includeInReplayView: checked("[data-studio-cue-replay]") }, stage: value("[data-studio-cue-preset]") || value("[data-studio-cue-camera]") || value("[data-studio-cue-motion]") ? { directionPreset: value("[data-studio-cue-preset]") || undefined, camera: value("[data-studio-cue-camera]") || undefined, motion: value("[data-studio-cue-motion]") || undefined } : undefined });
}

function updateSelectedSlide(root: HTMLElement, presentation: PresentationPackageV1, slideId: string | null): PresentationPackageV1 | null {
  if (!slideId) return null;
  const value = (selector: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim();
  return { ...presentation, slides: presentation.slides.map((slide) => slide.id !== slideId ? slide : {
    ...slide,
    layout: (value("[data-studio-slide-layout]") || slide.layout) as PackageSlideLayout,
    title: value("[data-studio-slide-title]") || undefined,
    subtitle: value("[data-studio-slide-subtitle]") || undefined,
    body: value("[data-studio-slide-body]") || undefined,
    footer: value("[data-studio-slide-footer]") || undefined,
    image: value("[data-studio-slide-image]") ? { ...slide.image, url: value("[data-studio-slide-image]") } : undefined,
    code: value("[data-studio-slide-code]") ? { language: value("[data-studio-slide-code-language]") || "text", value: value("[data-studio-slide-code]")! } : undefined
  }) };
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
