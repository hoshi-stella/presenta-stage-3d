import type { CharacterId, DirectionIntensity } from "../presentation/types";

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
  license?: AssetLicense;
};
