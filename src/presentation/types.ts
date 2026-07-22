import type { CameraPresetName, ScenePresetName } from "../scene/presets";
import type { CharacterMotionName } from "../scene/characterController";
import type {
  AssetSelectionRejection,
  PresentationObjectAction,
  PresentationObjectInstruction,
  StageEffectInstruction
} from "../assets/types";

export type PresentationMode = "manual" | "semiAuto" | "demoScript" | "qa" | "liveAi";
export type CueId = string;
export type CharacterId = "rei" | "mikoto" | "dummy";
export type FallbackLevel = "full" | "no-live2d" | "no-3d-model" | "offline" | "static";

export type CueKind =
  | "talk"
  | "question"
  | "answer"
  | "supplement"
  | "reaction"
  | "tsukkomi"
  | "slide"
  | "demo"
  | "summary"
  | "qa";

export type DirectionIntent =
  | "neutral"
  | "emphasis"
  | "question"
  | "doubt"
  | "supplement"
  | "reaction"
  | "tsukkomi"
  | "deep_dive"
  | "warning"
  | "summary"
  | "transition"
  | "celebration";

export type DirectionIntensity = "low" | "medium" | "high";

export type ProgressionMode =
  | "auto_next"
  | "wait_for_presenter"
  | "branch_available";

export type PresentationLayer =
  | "slide"
  | "subtitle"
  | "manju"
  | "static_illustration"
  | "live2d"
  | "stage3d"
  | "effects"
  | "ending_credits";

export type LayoutPreset =
  | "slide_only"
  | "slide_with_caption"
  | "slide_with_manju"
  | "slide_with_character"
  | "dialogue_split"
  | "stage_full"
  | "stage_with_overlay";

export type PresenterCommand =
  | "next"
  | "back"
  | "pause"
  | "resume"
  | "supplement"
  | "example"
  | "question"
  | "tsukkomi"
  | "summary"
  | "demo"
  | "qa"
  | "return_to_script"
  | "skip";

export type CueBranch = {
  command: PresenterCommand;
  label: string;
  targetCueId: CueId;
};

export type Cue = {
  id: CueId;
  kind: CueKind;
  speaker: CharacterId;
  text: string;
  slideRef?: string;
  note?: string;
  direction: {
    intent: DirectionIntent;
    emotion?: string;
    intensity: DirectionIntensity;
  };
  stage?: {
    preset?: ScenePresetName;
    camera?: CameraPresetName;
    motion?: CharacterMotionName;
    focusTarget?: string;
    directionPreset?: string;
    effects?: string[];
    objectRef?: string;
    objectAction?: PresentationObjectAction;
    objectPartId?: string;
  };
  presentation?: {
    layers?: PresentationLayer[];
    layout?: LayoutPreset;
    fallback?: Partial<Record<FallbackLevel, {
      layers?: PresentationLayer[];
      layout?: LayoutPreset;
    }>>;
    creditsVariant?: "crawl" | "spiral";
  };
  demo?: {
    step: number;
    label: string;
    targetSeconds: number;
  };
  after: {
    mode: ProgressionMode;
    durationMs?: number;
    branches?: CueBranch[];
  };
};

export type CharacterState =
  | "idle"
  | "listening"
  | "speaking"
  | "reacting"
  | "transitioning";

export type CharacterRuntimeState = Record<CharacterId, CharacterState>;

export type ResolvedDirection = {
  motion: CharacterMotionName;
  camera: CameraPresetName;
  scenePreset: ScenePresetName;
  directionPresetId: string | null;
  effects: StageEffectInstruction[];
  object: PresentationObjectInstruction | null;
  assetDebug: {
    presetId: string | null;
    effectIds: string[];
    reason: string;
    rejected: AssetSelectionRejection[];
  };
};

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
  cueIndex: number;
  cueCount: number;
  showSpeakerNote: boolean;
  showSubtitles: boolean;
  fallbackLevel: FallbackLevel;
  aiMessage: string | null;
  statusMessage: string | null;
  isPaused: boolean;
  cue: Cue;
  resolvedDirection: ResolvedDirection;
  characterStates: CharacterRuntimeState;
  flow: {
    isQaActive: boolean;
    returnCueId: CueId | null;
    returnCueLabel: string | null;
    shortcutCommands: PresenterCommand[];
  };
  presentation: {
    activeLayers: PresentationLayer[];
    layout: LayoutPreset;
    debugReason: string;
    creditsVariant: "crawl" | "spiral" | null;
  };
};

export type PresentationListener = (snapshot: PresentationSnapshot) => void;
