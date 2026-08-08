import type { ImagePresenterConfig } from "../imagePresenter/config";
import type { PresentationPackageV1, PresentationValidationResult } from "../package/types";
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
  entityId?: string;
};

export type FallbackVerification = {
  id: "slide-only" | "image-presenter" | "live2d" | "stage3d";
  label: string;
  level: PreflightCheckLevel;
  detail: string;
  cueId?: string;
  remediation?: string;
};

export type PreflightReport = {
  checks: PreflightCheck[];
  recommendedFallbackLevel: FallbackLevel;
  currentFallbackLevel: FallbackLevel;
  viewport: { width: number; height: number; aspectRatio: number | null };
  fullscreenAvailable: boolean;
  reducedMotionPreferred: boolean;
  fallbackVerification: FallbackVerification[];
  checkedAt: string;
};

export type PreflightInput = {
  live2d: Live2DConfig;
  imagePresenter: ImagePresenterConfig;
  staticIllustrations: StaticIllustrationConfig;
  glbCharacters: GlbCharacterAssetConfig[];
  packageValidation: PresentationValidationResult;
  currentFallbackLevel: FallbackLevel;
  presentation?: PresentationPackageV1;
};

export type PreflightEnvironment = {
  fetchResource: (url: string) => Promise<boolean>;
  supportsWebgl2: () => boolean;
  prefersReducedMotion: () => boolean;
  getViewport: () => { width: number; height: number };
  supportsFullscreen: () => boolean;
  now: () => Date;
};
