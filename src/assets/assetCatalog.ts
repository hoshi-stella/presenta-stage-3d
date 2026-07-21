import { directionEffectAssets, directionPresets } from "./directionAssets";
import { presentationObjectAssets } from "./presentationObjects";
import type {
  AssetMetadata,
  AssetSelectionRejection,
  DirectionEffectAsset,
  DirectionPresetAsset,
  PresentationObjectAction,
  PresentationObjectAsset,
  PresentationObjectInstruction,
  StageEffectInstruction
} from "./types";
import type { CharacterId, Cue, DirectionIntent, DirectionIntensity } from "../presentation/types";

export type DirectionAssetSelectionInput = {
  intent: DirectionIntent;
  emotion?: string;
  intensity: DirectionIntensity;
  speaker: CharacterId;
  explicitPresetId?: string;
  explicitEffectIds?: string[];
  recentlyUsedAssetIds?: Record<string, number>;
  nowMs?: number;
};

export type DirectionAssetResolution = {
  preset: DirectionPresetAsset | null;
  effects: StageEffectInstruction[];
  debug: {
    presetId: string | null;
    effectIds: string[];
    reason: string;
    rejected: AssetSelectionRejection[];
  };
};

const directionPresetById = new Map(directionPresets.map((preset) => [preset.id, preset]));
const directionEffectById = new Map(directionEffectAssets.map((effect) => [effect.id, effect]));
const presentationObjectById = new Map(presentationObjectAssets.map((object) => [object.id, object]));

export function resolveDirectionAssets(cue: Cue): DirectionAssetResolution {
  return selectDirectionAssets({
    ...cue.direction,
    speaker: cue.speaker,
    explicitPresetId: cue.stage?.directionPreset,
    explicitEffectIds: cue.stage?.effects
  });
}

export function selectDirectionAssets(input: DirectionAssetSelectionInput): DirectionAssetResolution {
  const nowMs = input.nowMs ?? Date.now();
  const rejected: AssetSelectionRejection[] = [];
  const explicitPreset = input.explicitPresetId
    ? directionPresetById.get(input.explicitPresetId) ?? null
    : null;
  const preset = explicitPreset ?? selectDirectionPreset(input, rejected, nowMs);
  const explicitEffects = input.explicitEffectIds ?? [];
  const effectIds = [...new Set([...(preset?.effects ?? []), ...explicitEffects])];
  const selectedEffectIds: string[] = [];
  const effects = effectIds
    .map((effectId) => directionEffectById.get(effectId) ?? null)
    .filter((effect): effect is DirectionEffectAsset => effect !== null)
    .filter((effect) => {
      const isExplicit = explicitEffects.includes(effect.id);
      const selectionResult = canSelectAsset(effect, input, selectedEffectIds, rejected, nowMs);
      if (!selectionResult && isExplicit) {
        return false;
      }

      if (!isExplicit && !effect.compatibleIntents.includes(input.intent)) {
        rejected.push({ assetId: effect.id, reason: "intent_mismatch" });
        return false;
      }

      return selectionResult;
    })
    .map((effect) => {
      selectedEffectIds.push(effect.id);
      return toStageEffectInstruction(effect, input.intensity);
    });

  return {
    preset,
    effects,
    debug: {
      presetId: preset?.id ?? null,
      effectIds: effects.map((effect) => effect.id),
      reason: getSelectionReason(input, preset, explicitPreset),
      rejected
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

function selectDirectionPreset(
  input: DirectionAssetSelectionInput,
  rejected: AssetSelectionRejection[],
  nowMs: number
): DirectionPresetAsset | null {
  const compatible = directionPresets.filter((preset) => {
    if (!preset.compatibleIntents.includes(input.intent)) {
      return false;
    }

    return canSelectAsset(preset, input, [], rejected, nowMs);
  });
  if (compatible.length === 0) {
    return null;
  }

  return compatible.find((preset) => preset.intensity === input.intensity) ?? compatible[0];
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

function canSelectAsset(
  asset: AssetMetadata,
  input: DirectionAssetSelectionInput,
  selectedAssetIds: string[],
  rejected: AssetSelectionRejection[],
  nowMs: number
): boolean {
  if (asset.compatibleCharacters && !asset.compatibleCharacters.includes(input.speaker)) {
    rejected.push({ assetId: asset.id, reason: "incompatible_character" });
    return false;
  }

  const lastUsedAt = input.recentlyUsedAssetIds?.[asset.id];
  if (lastUsedAt !== undefined && asset.cooldownMs !== undefined && nowMs - lastUsedAt < asset.cooldownMs) {
    rejected.push({ assetId: asset.id, reason: "cooldown" });
    return false;
  }

  const conflicts = asset.conflicts ?? [];
  const hasConflict = conflicts.some((conflictId) => selectedAssetIds.includes(conflictId));
  if (hasConflict) {
    rejected.push({ assetId: asset.id, reason: "conflict" });
    return false;
  }

  return true;
}

function getSelectionReason(
  input: DirectionAssetSelectionInput,
  preset: DirectionPresetAsset | null,
  explicitPreset: DirectionPresetAsset | null
): string {
  if (explicitPreset) {
    return `explicit preset ${explicitPreset.id} selected for ${input.speaker}`;
  }

  if (preset) {
    return `${input.intent}/${input.intensity} selected ${preset.id} for ${input.speaker}`;
  }

  return `${input.intent}/${input.intensity} has no compatible preset for ${input.speaker}; fallback direction only`;
}

export type { PresentationObjectAction };
