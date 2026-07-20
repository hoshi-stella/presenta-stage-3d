import type { CharacterId } from "../presentation/types";

export type GlbCharacterAssetConfig = {
  characterId: CharacterId;
  type: "glb";
  url: string | null;
  fallback: "dummy";
};

export function getGlbCharacterAssets(): GlbCharacterAssetConfig[] {
  return [
    {
      characterId: "rei",
      type: "glb",
      url: import.meta.env.VITE_REI_GLB_URL ?? null,
      fallback: "dummy"
    }
  ];
}
