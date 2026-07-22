import type { CharacterId } from "../presentation/types";

export type StaticIllustrationExpression =
  | "neutral"
  | "smile"
  | "thinking"
  | "troubled"
  | "surprised"
  | "angry";

export type StaticIllustrationCharacterConfig = {
  characterId: CharacterId;
  baseUrl: string | null;
  defaultExpression: StaticIllustrationExpression;
};

export type StaticIllustrationConfig = {
  characters: StaticIllustrationCharacterConfig[];
};

export const staticIllustrationFiles: Record<StaticIllustrationExpression, string> = {
  neutral: "neutral.png",
  smile: "smile.png",
  thinking: "thinking.png",
  troubled: "troubled.png",
  surprised: "surprised.png",
  angry: "angry.png"
};

export function getStaticIllustrationConfig(): StaticIllustrationConfig {
  return {
    characters: [
      {
        characterId: "rei",
        baseUrl: readOptionalEnv("VITE_REI_STATIC_ILLUSTRATION_BASE_URL", "/assets-local/characters/2d/rei-static"),
        defaultExpression: "neutral"
      },
      {
        characterId: "mikoto",
        baseUrl: readOptionalEnv("VITE_MIKOTO_STATIC_ILLUSTRATION_BASE_URL", null),
        defaultExpression: "neutral"
      }
    ]
  };
}

function readOptionalEnv(key: string, fallback: string | null): string | null {
  const value = import.meta.env[key];
  if (value === "") {
    return null;
  }

  return value ?? fallback;
}
