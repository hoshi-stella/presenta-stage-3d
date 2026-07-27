import { directionEffectAssets, directionPresets } from "../assets/directionAssets";
import { cues } from "../presentation/cues";
import { characterRegistry } from "../scene/characterRegistry";
import { sampleSlides } from "../slides/sampleSlides";
import type { PresentationPackageV1 } from "../package/types";

export function createDefaultPresentation(): PresentationPackageV1 {
  return {
    schemaVersion: 1,
    presentation: { id: "built-in-demo", title: "Built-in presentation", author: { name: "presenta-stage-3d" }, language: "ja" },
    slides: sampleSlides.map((slide) => ({ ...slide, code: slide.code ? { language: slide.code.language, value: slide.code.source } : undefined, image: slide.image ? { assetId: slide.image.id, url: slide.image.src, alt: slide.image.alt, caption: slide.image.caption } : undefined })),
    cues: cues.map((cue) => ({
      ...cue,
      speaker: cue.speaker,
      direction: { ...cue.direction },
      stage: cue.stage ? { ...cue.stage, effects: cue.stage.effects ? [...cue.stage.effects] : undefined } : undefined,
      presentation: cue.presentation ? { ...cue.presentation, layers: cue.presentation.layers ? [...cue.presentation.layers] : undefined, fallback: cue.presentation.fallback ? { ...cue.presentation.fallback } : undefined } : undefined,
      demo: cue.demo ? { ...cue.demo } : undefined,
      after: { ...cue.after, branches: cue.after.branches?.map((branch) => ({ ...branch })) }
    })),
    characters: characterRegistry.map((character) => ({ id: character.id, displayName: character.displayName, roles: [character.role === "presenter" ? "presenter" : "commentator"], defaultPresenter: character.id === "rei" ? { type: "dummy3d" } : undefined })),
    assets: [
      ...directionEffectAssets.map((asset) => ({ id: asset.id, type: "particle" as const, label: asset.label, tags: asset.tags, visibility: "public" as const })),
      ...directionPresets.map((preset) => ({ id: preset.id, type: "direction-preset" as const, label: preset.label, tags: preset.tags, visibility: "public" as const }))
    ],
    directionPresets: directionPresets.map((preset) => ({ id: preset.id, label: preset.label, intent: preset.intent, effects: preset.effects })),
    settings: { defaultProfile: "classic_slide", defaultLayers: ["slide"], fallbackProfile: "classic_slide", mode: "manual", aspectRatio: "16:9", subtitle: { enabled: true, maxLines: 3 }, localAssetFallback: true }
  };
}
