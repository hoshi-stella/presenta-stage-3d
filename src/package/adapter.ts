import type { Cue, CharacterId, DirectionIntent, LayoutPreset, PresentationLayer, PresentationProfile, PresenterCommand, ProgressionMode } from "../presentation/types";
import type { SlideContent, SlideLayout } from "../slides/types";
import type { AssetDefinition, CharacterDefinition, PresentationMetadata, PresentationPackageV1 } from "./types";

export type RuntimePresentationData = {
  metadata: PresentationMetadata;
  slides: SlideContent[];
  cues: Cue[];
  characters: CharacterDefinition[];
  assets: AssetDefinition[];
};

const runtimeLayouts = new Set<SlideLayout>(["title", "content", "image", "split", "code"]);
const runtimeCharacters = new Set<CharacterId>(["rei", "mikoto", "dummy"]);
const runtimeIntents = new Set<DirectionIntent>(["neutral", "emphasis", "question", "doubt", "supplement", "reaction", "tsukkomi", "deep_dive", "warning", "summary", "transition", "celebration"]);
const runtimeProfiles = new Set<PresentationProfile>(["classic_slide", "manju_commentary", "live2d_talk", "stage3d", "mixed_dialogue", "technical_overview", "ending"]);
const runtimeLayers = new Set<PresentationLayer>(["slide", "subtitle", "manju", "static_illustration", "live2d", "stage3d", "effects", "ending_credits"]);
const runtimeLayoutsForPresentation = new Set<LayoutPreset>(["slide_only", "slide_with_caption", "slide_with_manju", "slide_with_character", "live2d_focus", "dialogue_split", "stage_focus", "live2d_stage_dialogue", "stage_full", "stage_with_overlay"]);

export function adaptPresentationPackageToRuntime(presentation: PresentationPackageV1): RuntimePresentationData {
  return {
    metadata: presentation.presentation,
    slides: presentation.slides.map(adaptSlide),
    cues: presentation.cues.map(adaptCue),
    characters: presentation.characters,
    assets: presentation.assets
  };
}

function adaptSlide(slide: PresentationPackageV1["slides"][number]): SlideContent {
  return {
    id: slide.id,
    layout: runtimeLayouts.has(slide.layout as SlideLayout) ? slide.layout as SlideLayout : "content",
    title: slide.title ?? "Untitled slide",
    subtitle: slide.subtitle,
    body: Array.isArray(slide.body) ? slide.body.join("\n\n") : slide.body,
    bullets: slide.bullets,
    code: slide.code ? { language: slide.code.language ?? "text", source: slide.code.value } : undefined,
    image: slide.image?.url ? { id: slide.image.assetId ?? slide.id, src: slide.image.url, alt: slide.image.alt ?? "", caption: slide.image.caption } : undefined
  };
}

function adaptCue(cue: PresentationPackageV1["cues"][number]): Cue {
  const profile = cue.presentation?.profile;
  const layout = cue.presentation?.layout;
  const stage = cue.stage;
  const runtimeStage: NonNullable<Cue["stage"]> | undefined = stage ? {
    preset: stage.preset as NonNullable<Cue["stage"]>["preset"], camera: stage.camera as NonNullable<Cue["stage"]>["camera"], motion: stage.motion as NonNullable<Cue["stage"]>["motion"], focusTarget: stage.focusTarget,
    directionPreset: stage.directionPreset, effects: stage.effects, objectRef: stage.objectRef, objectAction: stage.objectAction as NonNullable<Cue["stage"]>["objectAction"], objectPartId: stage.objectPartId
  } : undefined;
  return {
    id: cue.id,
    kind: cue.kind === "ending" ? "summary" : cue.kind === "transition" ? "talk" : cue.kind,
    speaker: runtimeCharacters.has(cue.speaker as CharacterId) ? cue.speaker as CharacterId : "dummy",
    text: cue.text,
    note: cue.note,
    slideRef: cue.slideRef,
    direction: { intent: runtimeIntents.has(cue.direction.intent as DirectionIntent) ? cue.direction.intent as DirectionIntent : "neutral", emotion: cue.direction.emotion, intensity: cue.direction.intensity },
    stage: runtimeStage,
    presentation: cue.presentation ? {
      profile: runtimeProfiles.has(profile as PresentationProfile) ? profile as PresentationProfile : undefined,
      layout: runtimeLayoutsForPresentation.has(layout as LayoutPreset) ? layout as LayoutPreset : undefined,
      layers: cue.presentation.layers?.filter((layer): layer is PresentationLayer => runtimeLayers.has(layer as PresentationLayer)),
      creditsVariant: cue.presentation.creditsVariant ?? (cue.stage?.endingCreditsVariant === "crawl" || cue.stage?.endingCreditsVariant === "spiral" ? cue.stage.endingCreditsVariant : undefined)
    } : undefined,
    demo: cue.demo,
    after: { mode: cue.after.mode === "stop" ? "wait_for_presenter" : cue.after.mode as ProgressionMode, durationMs: cue.after.durationMs, branches: cue.after.branches?.map((branch) => ({ command: branch.command as PresenterCommand, label: branch.label, targetCueId: branch.targetCueId })) }
  };
}
