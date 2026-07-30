import type { ImagePresenterConfig } from "../imagePresenter/config";
import type { PresentationValidationResult } from "../package/types";
import type { GlbCharacterAssetConfig } from "../scene/modelAssetConfig";
import type { StaticIllustrationConfig } from "../staticIllustration/config";
import type { Live2DConfig } from "../live2d/types";
import type { FallbackLevel } from "../presentation/types";

export type PreflightCheckLevel = "ready" | "warning" | "blocked";

export type PreflightCheck = {
  id: string;
  label: string;
  level: PreflightCheckLevel;
  detail: string;
  remediation?: string;
};

export type PreflightReport = {
  checks: PreflightCheck[];
  recommendedFallbackLevel: FallbackLevel;
  currentFallbackLevel: FallbackLevel;
  viewport: { width: number; height: number; aspectRatio: number | null };
  fullscreenAvailable: boolean;
  checkedAt: string;
};

export type PreflightInput = {
  live2d: Live2DConfig;
  imagePresenter: ImagePresenterConfig;
  staticIllustrations: StaticIllustrationConfig;
  glbCharacters: GlbCharacterAssetConfig[];
  packageValidation: PresentationValidationResult;
  currentFallbackLevel: FallbackLevel;
};

export type PreflightEnvironment = {
  fetchResource: (url: string) => Promise<boolean>;
  supportsWebgl2: () => boolean;
  getViewport: () => { width: number; height: number };
  supportsFullscreen: () => boolean;
  now: () => Date;
};
