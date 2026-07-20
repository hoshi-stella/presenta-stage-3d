import type { CharacterId, CharacterRuntimeState, Cue } from "../presentation/types";

export type Live2DConfig = {
  modelUrl: string | null;
  coreUrl: string | null;
};

export type Live2DPresenterLayer = {
  update: (states: CharacterRuntimeState, speaker: CharacterId, cue?: Cue) => void;
  dispose: () => void;
};

export type Live2DLoadState =
  | "disabled"
  | "loading"
  | "ready"
  | "missing-core"
  | "missing-model"
  | "error";
