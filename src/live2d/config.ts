import type { Live2DConfig } from "./types";

export function getLive2DConfig(): Live2DConfig {
  return {
    modelUrl: import.meta.env.VITE_LIVE2D_MODEL_URL ?? null,
    coreUrl: import.meta.env.VITE_LIVE2D_CORE_URL ?? null
  };
}
