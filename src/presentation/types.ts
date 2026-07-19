import type { CameraPresetName, ScenePresetName } from "../scene/presets";
import type { CharacterMotionName } from "../scene/characterController";

export type PresentationMode = "manual" | "script" | "liveAi";

export type PresentationSection = {
  id: string;
  title: string;
  stageText: string;
  speakerNote: string;
  characterLine: string;
  preset: ScenePresetName;
  motion: CharacterMotionName;
  camera: CameraPresetName;
  durationMs?: number;
};

export type PresentationSnapshot = {
  mode: PresentationMode;
  sectionIndex: number;
  sectionCount: number;
  showSpeakerNote: boolean;
  aiMessage: string | null;
  isScriptPlaying: boolean;
  section: PresentationSection;
};

export type PresentationListener = (snapshot: PresentationSnapshot) => void;
