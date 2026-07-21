import type { CharacterId } from "../presentation/types";
import type { CharacterMotionName } from "./characterController";

export type GlbAnimationMode = "off" | "cue";

export type GlbCharacterAssetConfig = {
  characterId: CharacterId;
  type: "glb";
  url: string | null;
  fallback: "dummy";
  animationMode: GlbAnimationMode;
  motionAnimations: Partial<Record<CharacterMotionName, string>>;
};

export function getGlbCharacterAssets(): GlbCharacterAssetConfig[] {
  return [
    {
      characterId: "rei",
      type: "glb",
      url: import.meta.env.VITE_REI_GLB_URL ?? null,
      fallback: "dummy",
      animationMode: getGlbAnimationMode(import.meta.env.VITE_REI_GLB_ANIMATION_MODE),
      motionAnimations: {
        idle: import.meta.env.VITE_REI_GLB_ANIMATION_IDLE ?? "WAIT00",
        wave: import.meta.env.VITE_REI_GLB_ANIMATION_WAVE ?? "HANDUP00_R",
        think: import.meta.env.VITE_REI_GLB_ANIMATION_THINK ?? "WAIT01",
        point: import.meta.env.VITE_REI_GLB_ANIMATION_POINT ?? "WAIT02",
        present: import.meta.env.VITE_REI_GLB_ANIMATION_PRESENT ?? "WAIT03"
      }
    }
  ];
}

function getGlbAnimationMode(value: string | undefined): GlbAnimationMode {
  return value === "cue" ? "cue" : "off";
}
