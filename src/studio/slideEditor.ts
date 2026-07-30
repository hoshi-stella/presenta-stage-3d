import type { CueDefinition, PackageSlideLayout, PresentationPackageV1, SlideDefinition } from "../package/types";

const layouts: PackageSlideLayout[] = ["title", "content", "image", "split", "code", "grid", "minimal"];

export function createSlide(layout: PackageSlideLayout = "content", slides: SlideDefinition[] = []): SlideDefinition {
  if (!layouts.includes(layout)) throw new Error(`Unsupported Studio slide layout: ${layout}`);
  const id = nextSlideId(slides);
  return {
    id,
    layout,
    title: "Untitled slide",
    ...(layout === "content" || layout === "split" || layout === "grid" ? { body: "Add your message here." } : {}),
    ...(layout === "image" ? { image: { alt: "" } } : {}),
    ...(layout === "code" ? { code: { language: "text", value: "" } } : {})
  };
}

export function addSlide(presentation: PresentationPackageV1, layout?: PackageSlideLayout): PresentationPackageV1 {
  return { ...presentation, slides: [...presentation.slides, createSlide(layout, presentation.slides)] };
}

export function duplicateSlide(presentation: PresentationPackageV1, slideId: string): PresentationPackageV1 {
  const index = presentation.slides.findIndex((slide) => slide.id === slideId);
  if (index < 0) return presentation;
  const source = presentation.slides[index];
  const duplicate: SlideDefinition = { ...structuredClone(source), id: nextSlideId(presentation.slides), title: `${source.title ?? "Untitled slide"} copy` };
  return { ...presentation, slides: [...presentation.slides.slice(0, index + 1), duplicate, ...presentation.slides.slice(index + 1)] };
}

export function moveSlide(presentation: PresentationPackageV1, slideId: string, offset: -1 | 1): PresentationPackageV1 {
  const index = presentation.slides.findIndex((slide) => slide.id === slideId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= presentation.slides.length) return presentation;
  const slides = [...presentation.slides];
  [slides[index], slides[target]] = [slides[target], slides[index]];
  return { ...presentation, slides };
}

export function deleteSlide(presentation: PresentationPackageV1, slideId: string): { presentation: PresentationPackageV1; affectedCues: CueDefinition[] } {
  const affectedCues = presentation.cues.filter((cue) => cue.slideRef === slideId);
  return { presentation: { ...presentation, slides: presentation.slides.filter((slide) => slide.id !== slideId) }, affectedCues };
}

function nextSlideId(slides: SlideDefinition[]): string {
  let index = slides.length + 1;
  while (slides.some((slide) => slide.id === `slide_${String(index).padStart(2, "0")}`)) index += 1;
  return `slide_${String(index).padStart(2, "0")}`;
}
