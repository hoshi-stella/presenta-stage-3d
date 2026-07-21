import { directionEffectAssets, directionPresets } from "./directionAssets";
import { presentationObjectAssets } from "./presentationObjects";
import type {
  DirectionEffectAsset,
  DirectionPresetAsset,
  PresentationObjectAction,
  PresentationObjectAsset,
  PresentationObjectInstruction,
  StageEffectInstruction
} from "./types";
import type { Cue, DirectionIntent, DirectionIntensity } from "../presentation/types";

export type DirectionAssetResolution = {
  preset: DirectionPresetAsset | null;
  effects: StageEffectInstruction[];
  debug: {
    presetId: string | null;
    effectIds: string[];
    reason: string;
  };
};

const directionPresetById = new Map(directionPresets.map((preset) => [preset.id, preset]));
const directionEffectById = new Map(directionEffectAssets.map((effect) => [effect.id, effect]));
const presentationObjectById = new Map(presentationObjectAssets.map((object) => [object.id, object]));

export function resolveDirectionAssets(cue: Cue): DirectionAssetResolution {
  const explicitPreset = cue.stage?.directionPreset
    ? directionPresetById.get(cue.stage.directionPreset) ?? null
    : null;
  const preset = explicitPreset ?? selectDirectionPreset(cue.direction.intent, cue.direction.intensity);
  const explicitEffects = cue.stage?.effects ?? [];
  const effectIds = [...new Set([...(preset?.effects ?? []), ...explicitEffects])];
  const effects = effectIds
    .map((effectId) => directionEffectById.get(effectId) ?? null)
    .filter((effect): effect is DirectionEffectAsset => effect !== null)
    .filter((effect) => effect.compatibleIntents.includes(cue.direction.intent) || explicitEffects.includes(effect.id))
    .map((effect) => toStageEffectInstruction(effect, cue.direction.intensity));

  return {
    preset,
    effects,
    debug: {
      presetId: preset?.id ?? null,
      effectIds: effects.map((effect) => effect.id),
      reason: explicitPreset ? "explicit cue preset" : preset ? "intent match" : "fallback direction only"
    }
  };
}

export function getDirectionPreset(presetId: string): DirectionPresetAsset | null {
  return directionPresetById.get(presetId) ?? null;
}

export function resolvePresentationObject(cue: Cue): PresentationObjectInstruction | null {
  const objectRef = cue.stage?.objectRef;
  if (!objectRef) {
    return null;
  }

  const object = presentationObjectById.get(objectRef);
  if (!object) {
    return null;
  }

  const action = cue.stage?.objectAction ?? "show";
  const activePartId = resolveObjectPart(object, cue.stage?.objectPartId);

  return {
    objectId: object.id,
    label: object.label,
    action,
    activePartId,
    capabilities: object.capabilities,
    parts: object.parts
  };
}

function selectDirectionPreset(intent: DirectionIntent, intensity: DirectionIntensity): DirectionPresetAsset | null {
  const compatible = directionPresets.filter((preset) => preset.compatibleIntents.includes(intent));
  if (compatible.length === 0) {
    return null;
  }

  return compatible.find((preset) => preset.intensity === intensity) ?? compatible[0];
}

function toStageEffectInstruction(effect: DirectionEffectAsset, cueIntensity: DirectionIntensity): StageEffectInstruction {
  return {
    id: effect.id,
    kind: effect.kind,
    color: effect.color,
    count: scaleCount(effect.count, cueIntensity),
    size: effect.size,
    spread: effect.spread,
    velocity: effect.velocity,
    intensity: cueIntensity,
    durationMs: effect.durationMs ?? 5000
  };
}

function scaleCount(count: number, intensity: DirectionIntensity): number {
  switch (intensity) {
    case "high":
      return Math.round(count * 1.3);
    case "low":
      return Math.max(8, Math.round(count * 0.68));
    case "medium":
      return count;
  }
}

function resolveObjectPart(object: PresentationObjectAsset, partId: string | undefined): string | null {
  if (!partId) {
    return null;
  }

  return object.parts.some((part) => part.id === partId) ? partId : null;
}

export type { PresentationObjectAction };
