import type { CharacterId } from "../presentation/types";

export type CharacterVisualKind = "dummy-character" | "status-only";
export type CharacterRole = "explainer" | "questioner" | "stage-object";

export type CharacterInstance = {
  id: CharacterId;
  displayName: string;
  role: CharacterRole;
  visualKind: CharacterVisualKind;
  basePosition: readonly [number, number, number];
  suitColor: string;
  specularColor: string;
  listeningYaw: number;
};

export const characterRegistry: CharacterInstance[] = [
  {
    id: "rei",
    displayName: "Rei",
    role: "explainer",
    visualKind: "dummy-character",
    basePosition: [-0.82, 0.16, -0.15],
    suitColor: "#3d7bd9",
    specularColor: "#9ab7dd",
    listeningYaw: 0.18
  },
  {
    id: "mikoto",
    displayName: "Mikoto",
    role: "questioner",
    visualKind: "dummy-character",
    basePosition: [0.82, 0.16, 0.05],
    suitColor: "#cf6f42",
    specularColor: "#f0b38e",
    listeningYaw: -0.18
  },
  {
    id: "dummy",
    displayName: "Stage Dummy",
    role: "stage-object",
    visualKind: "status-only",
    basePosition: [0, 0, 0],
    suitColor: "#8a8f98",
    specularColor: "#c3c7cf",
    listeningYaw: 0
  }
];

export const characterIds = characterRegistry.map((character) => character.id);

const characterById = new Map(characterRegistry.map((character) => [character.id, character]));

export function getCharacterInstance(characterId: CharacterId): CharacterInstance {
  const character = characterById.get(characterId);
  if (!character) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  return character;
}
