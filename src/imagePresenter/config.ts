import type { CharacterId } from "../presentation/types";

export type ImagePresenterConfig = {
  baseUrl: string | null;
  speakerId: CharacterId;
};

export function getAiriManjuConfig(): ImagePresenterConfig {
  const baseUrl = import.meta.env.VITE_AIRI_MANJU_BASE_URL;
  return {
    baseUrl: baseUrl === "" ? null : baseUrl ?? "/assets-local/characters/2d/airi-manju",
    speakerId: "mikoto"
  };
}
