import type { CameraPresetName, ScenePresetName } from "../scene/presets";
import type { CharacterMotionName } from "../scene/characterController";
import type { CharacterId, DirectionIntensity, DirectionIntent } from "../presentation/types";

export type AssetLicense = {
  author?: string;
  source?: string;
  licenseName?: string;
  licenseUrl?: string;
  commercialUse?: boolean;
  creditRequired?: boolean;
};

export type AssetMetadata = {
  id: string;
  type:
    | "character"
    | "expression"
    | "motion"
    | "object"
    | "particle"
    | "camera"
    | "sound"
    | "scene_template"
    | "direction_preset";
  label: string;
  tags: string[];
  intensity?: DirectionIntensity;
  durationMs?: number;
  loop?: boolean;
  compatibleCharacters?: CharacterId[];
  cooldownMs?: number;
  conflicts?: string[];
  license?: AssetLicense;
};

export type DirectionEffectKind =
  | "ambient_spark"
  | "petal_fall"
  | "bubble_float"
  | "focus_pulse"
  | "warning_flash";

export type DirectionEffectAsset = AssetMetadata & {
  type: "particle";
  kind: DirectionEffectKind;
  color: string;
  count: number;
  size: readonly [number, number];
  spread: readonly [number, number, number];
  velocity: readonly [number, number, number];
  compatibleIntents: DirectionIntent[];
};

export type DirectionPresetAsset = AssetMetadata & {
  type: "direction_preset";
  intent: DirectionIntent;
  motion: CharacterMotionName;
  camera: CameraPresetName;
  scenePreset: ScenePresetName;
  effects: string[];
  compatibleIntents: DirectionIntent[];
};

export type StageEffectInstruction = {
  id: string;
  kind: DirectionEffectKind;
  color: string;
  count: number;
  size: readonly [number, number];
  spread: readonly [number, number, number];
  velocity: readonly [number, number, number];
  intensity: DirectionIntensity;
  durationMs: number;
};

export type ObjectCapability =
  | "show"
  | "hide"
  | "rotate"
  | "highlight_part"
  | "focus_part"
  | "explode";

export type PresentationObjectPart = {
  id: string;
  label: string;
  tags: string[];
  color: string;
};

export type PresentationObjectAsset = AssetMetadata & {
  type: "object";
  format: "procedural" | "glb";
  capabilities: ObjectCapability[];
  parts: PresentationObjectPart[];
};

export type PresentationObjectAction =
  | "show"
  | "hide"
  | "rotate"
  | "highlight_part"
  | "focus_part"
  | "explode";

export type PresentationObjectInstruction = {
  objectId: string;
  label: string;
  action: PresentationObjectAction;
  activePartId: string | null;
  capabilities: ObjectCapability[];
  parts: PresentationObjectPart[];
};
