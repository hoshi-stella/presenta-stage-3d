import type { PresentationLayer } from "../presentation/types";

export type PresentationLayerName = PresentationLayer;

export type PresentationMetadata = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  author: { name: string; url?: string };
  language: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  estimatedDurationMs?: number;
  repositoryUrl?: string;
  sourceUrl?: string;
};

export type SlideColumn = { title?: string; body?: string; bullets?: string[] };
export type PackageSlideLayout = "title" | "content" | "image" | "split" | "code" | "grid" | "minimal" | "architecture" | "flow";

export type SlideDefinition = {
  id: string;
  layout: PackageSlideLayout;
  title?: string;
  subtitle?: string;
  body?: string | string[];
  bullets?: string[];
  columns?: SlideColumn[];
  image?: { assetId?: string; url?: string; alt?: string; caption?: string };
  code?: { language?: string; value: string };
  footer?: string;
  theme?: string;
};

export type CueBranchDefinition = { command: string; label: string; targetCueId: string };
export type CueAudioDefinition = { src: string; durationMs?: number; volume?: number };
export type CueDefinition = {
  id: string;
  kind: "talk" | "question" | "answer" | "supplement" | "reaction" | "tsukkomi" | "slide" | "demo" | "summary" | "qa" | "transition" | "ending";
  speaker: string;
  text: string;
  audio?: CueAudioDefinition;
  note?: string;
  estimatedDurationMs?: number;
  slideRef?: string;
  presentation?: { profile?: string; layers?: PresentationLayerName[]; layout?: string; subtitle?: boolean; creditsVariant?: "crawl" | "spiral" };
  direction: { intent: string; emotion?: string; intensity: "low" | "medium" | "high" };
  stage?: { directionPreset?: string; camera?: string; motion?: string; effects?: string[]; focusTarget?: string; endingCreditsVariant?: string; preset?: string; objectRef?: string; objectAction?: string; objectPartId?: string };
  transition?: { enter?: string; exit?: string };
  demo?: { step: number; label: string; targetSeconds: number };
  after: { mode: "auto_next" | "wait_for_presenter" | "branch_available" | "stop"; durationMs?: number; branches?: CueBranchDefinition[] };
  publication?: { visible: boolean; includeInReadingView?: boolean; includeInReplayView?: boolean };
};

export type PresenterDefinition =
  | { type: "image"; baseUrl: string; expressions?: Record<string, string> }
  | { type: "live2d"; modelUrl: string; coreUrl?: string }
  | { type: "glb"; modelUrl: string; animationMap?: Record<string, string> }
  | { type: "dummy3d" };

export type CharacterDefinition = {
  id: string;
  displayName: string;
  roles?: Array<"presenter" | "commentator" | "questioner" | "tsukkomi" | "summarizer">;
  defaultPresenter?: PresenterDefinition;
  presenters?: PresenterDefinition[];
};

export type AssetVisibility = "local-only" | "private" | "public" | "public-with-credit";
export type AssetDefinition = {
  id: string;
  type: "image" | "slide-image" | "character" | "motion" | "expression" | "model3d" | "live2d" | "sound" | "particle" | "camera" | "direction-preset" | "other";
  label: string;
  url?: string;
  tags?: string[];
  visibility: AssetVisibility;
  fallbackAssetId?: string;
  license?: { author?: string; source?: string; licenseName?: string; licenseUrl?: string; commercialUse?: boolean; redistribution?: boolean; modification?: boolean; creditRequired?: boolean; creditText?: string };
};

export type DirectionPresetDefinition = { id: string; label: string; intent?: string; effects?: string[]; [key: string]: unknown };
export type CreditDefinition = { role: string; name: string; url?: string };
export type PresentationSettings = {
  defaultProfile: string;
  defaultLayers: PresentationLayerName[];
  fallbackProfile: string;
  mode: "manual" | "semi-auto" | "auto";
  aspectRatio: "16:9" | "4:3" | "auto";
  subtitle: { enabled: boolean; maxLines?: number };
  reducedMotionFallback?: boolean;
  localAssetFallback?: boolean;
};
export type ExportSettings = { enableSlideView?: boolean; enableReadingView?: boolean; enableReplayView?: boolean; publicAssetsOnly?: boolean; fallbackProfile?: string; includeSpeakerNotes?: boolean; includeCredits?: boolean };

export type PresentationPackageV1 = {
  schemaVersion: 1;
  presentation: PresentationMetadata;
  slides: SlideDefinition[];
  cues: CueDefinition[];
  characters: CharacterDefinition[];
  assets: AssetDefinition[];
  directionPresets: DirectionPresetDefinition[];
  settings: PresentationSettings;
  exports?: ExportSettings;
  credits?: CreditDefinition[];
};

export type ValidationSeverity = "error" | "warning";
export type ValidationIssue = { severity: ValidationSeverity; path: string; code: string; message: string };
export type PresentationValidationResult = { valid: boolean; errors: ValidationIssue[]; warnings: ValidationIssue[] };
