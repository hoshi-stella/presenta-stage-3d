import type { Cue, CueKind, DirectionIntent, DirectionIntensity, ProgressionMode } from "./types";
import type { PresentationDocument } from "./presentationDocument";
import type { SlideContent, SlideLayout } from "../slides/types";

export type PresentationLoadResult =
  | {
      ok: true;
      document: PresentationDocument;
      sourceUrl: string;
    }
  | {
      ok: false;
      message: string;
      sourceUrl: string;
    };

const defaultPresentationUrl = "/presentations/lt-demo/presentation.json";

const slideLayouts = new Set<SlideLayout>(["title", "content", "image", "split", "code"]);
const cueKinds = new Set<CueKind>([
  "talk",
  "question",
  "answer",
  "supplement",
  "reaction",
  "tsukkomi",
  "slide",
  "demo",
  "summary",
  "qa"
]);
const directionIntents = new Set<DirectionIntent>([
  "neutral",
  "emphasis",
  "question",
  "doubt",
  "supplement",
  "reaction",
  "tsukkomi",
  "deep_dive",
  "warning",
  "summary",
  "transition",
  "celebration"
]);
const directionIntensities = new Set<DirectionIntensity>(["low", "medium", "high"]);
const progressionModes = new Set<ProgressionMode>(["auto_next", "wait_for_presenter", "branch_available"]);

export async function loadPresentationDocument(url = getPresentationUrl()): Promise<PresentationLoadResult> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        sourceUrl: url,
        message: `Presentation JSON was not loaded: ${response.status} ${response.statusText}`
      };
    }

    const document = validatePresentationDocument(await response.json());
    return {
      ok: true,
      document,
      sourceUrl: url
    };
  } catch (error) {
    return {
      ok: false,
      sourceUrl: url,
      message: `Presentation JSON fallback: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function getPresentationUrl(): string {
  const url = new URL(window.location.href);
  return url.searchParams.get("presentation") ?? defaultPresentationUrl;
}

function validatePresentationDocument(value: unknown): PresentationDocument {
  const record = asRecord(value, "presentation");
  const slides = asArray(record.slides, "presentation.slides").map(validateSlide);
  const cues = asArray(record.cues, "presentation.cues").map(validateCue);
  const slideIds = new Set(slides.map((slide) => slide.id));

  cues.forEach((cue) => {
    if (cue.slideRef && !slideIds.has(cue.slideRef)) {
      throw new Error(`Cue ${cue.id} references missing slide ${cue.slideRef}.`);
    }
  });

  return {
    id: asString(record.id, "presentation.id"),
    title: asString(record.title, "presentation.title"),
    version: record.version === 1 ? 1 : fail("presentation.version must be 1."),
    slides,
    cues
  };
}

function validateSlide(value: unknown): SlideContent {
  const record = asRecord(value, "slide");
  const layout = asString(record.layout, `slide(${String(record.id)}).layout`);
  if (!slideLayouts.has(layout as SlideLayout)) {
    throw new Error(`Unsupported slide layout: ${layout}`);
  }

  const slide: SlideContent = {
    id: asString(record.id, "slide.id"),
    layout: layout as SlideLayout,
    title: asString(record.title, `slide(${String(record.id)}).title`)
  };

  copyOptionalString(record, slide, "subtitle");
  copyOptionalString(record, slide, "body");

  if (record.bullets !== undefined) {
    slide.bullets = asArray(record.bullets, `slide(${slide.id}).bullets`).map((bullet) =>
      asString(bullet, `slide(${slide.id}).bullets[]`)
    );
  }

  if (record.code !== undefined) {
    const code = asRecord(record.code, `slide(${slide.id}).code`);
    slide.code = {
      language: asString(code.language, `slide(${slide.id}).code.language`),
      source: asString(code.source, `slide(${slide.id}).code.source`)
    };
  }

  if (record.image !== undefined) {
    const image = asRecord(record.image, `slide(${slide.id}).image`);
    slide.image = {
      id: asString(image.id, `slide(${slide.id}).image.id`),
      src: asString(image.src, `slide(${slide.id}).image.src`),
      alt: asString(image.alt, `slide(${slide.id}).image.alt`)
    };
    copyOptionalString(image, slide.image, "caption");
  }

  return slide;
}

function validateCue(value: unknown): Cue {
  const record = asRecord(value, "cue");
  const kind = asString(record.kind, `cue(${String(record.id)}).kind`);
  const intent = asString(asRecord(record.direction, `cue(${String(record.id)}).direction`).intent, `cue(${String(record.id)}).direction.intent`);
  const intensity = asString(asRecord(record.direction, `cue(${String(record.id)}).direction`).intensity, `cue(${String(record.id)}).direction.intensity`);
  const progressionMode = asString(asRecord(record.after, `cue(${String(record.id)}).after`).mode, `cue(${String(record.id)}).after.mode`);

  if (!cueKinds.has(kind as CueKind)) {
    throw new Error(`Unsupported cue kind: ${kind}`);
  }
  if (!directionIntents.has(intent as DirectionIntent)) {
    throw new Error(`Unsupported direction intent: ${intent}`);
  }
  if (!directionIntensities.has(intensity as DirectionIntensity)) {
    throw new Error(`Unsupported direction intensity: ${intensity}`);
  }
  if (!progressionModes.has(progressionMode as ProgressionMode)) {
    throw new Error(`Unsupported progression mode: ${progressionMode}`);
  }

  return record as Cue;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function copyOptionalString<T extends Record<string, unknown>>(from: Record<string, unknown>, to: T, key: string): void {
  if (from[key] !== undefined) {
    to[key as keyof T] = asString(from[key], key) as T[keyof T];
  }
}

function fail(message: string): never {
  throw new Error(message);
}

