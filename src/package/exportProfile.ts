import type { AssetDefinition, ExportSettings, PresentationPackageV1 } from "./types";

export type PresentationExportProfile =
  | "local-performance"
  | "public-replay"
  | "static-archive"
  | "speaker-deck"
  | "reading-source";

export type ExportProfileIssue = {
  code: "missing_public_fallback";
  assetId: string;
};

export type PresentationExportProfileResult = {
  status: "ready" | "blocked";
  presentation: PresentationPackageV1;
  issues: ExportProfileIssue[];
  replacements: Array<{ assetId: string; fallbackAssetId: string }>;
};

const publicProfiles = new Set<PresentationExportProfile>([
  "public-replay",
  "static-archive",
  "speaker-deck",
  "reading-source"
]);

export function createExportProfile(
  presentation: PresentationPackageV1,
  profile: PresentationExportProfile
): PresentationExportProfileResult {
  const cloned = clonePresentation(presentation);
  if (!publicProfiles.has(profile)) {
    return { status: "ready", presentation: cloned, issues: [], replacements: [] };
  }

  const assetsById = new Map(cloned.assets.map((asset) => [asset.id, asset]));
  const replacements = new Map<string, string>();
  const issues: ExportProfileIssue[] = [];

  for (const asset of cloned.assets) {
    if (isPublicAsset(asset)) continue;
    const fallback = asset.fallbackAssetId ? assetsById.get(asset.fallbackAssetId) : undefined;
    if (!fallback || !isPublicAsset(fallback)) {
      issues.push({ code: "missing_public_fallback", assetId: asset.id });
      continue;
    }
    replacements.set(asset.id, fallback.id);
  }

  if (issues.length > 0) {
    return {
      status: "blocked",
      presentation: cloned,
      issues,
      replacements: toReplacementList(replacements)
    };
  }

  const includedAssets = cloned.assets
    .filter(isPublicAsset)
    .map((asset) => ({
      ...asset,
      fallbackAssetId: asset.fallbackAssetId && isPublicAsset(assetsById.get(asset.fallbackAssetId))
        ? asset.fallbackAssetId
        : undefined
    }));
  const includedAssetsById = new Map(includedAssets.map((asset) => [asset.id, asset]));
  const replaceAssetId = (assetId: string | undefined): string | undefined => assetId ? replacements.get(assetId) ?? assetId : undefined;

  const exported: PresentationPackageV1 = {
    ...cloned,
    slides: cloned.slides.map((slide) => {
      const assetId = replaceAssetId(slide.image?.assetId);
      const asset = assetId ? includedAssetsById.get(assetId) : undefined;
      return {
        ...slide,
        image: slide.image
          ? { ...slide.image, assetId, url: asset?.url ?? slide.image.url }
          : undefined
      };
    }),
    cues: cloned.cues.map((cue) => ({
      ...cue,
      note: undefined,
      stage: cue.stage
        ? { ...cue.stage, effects: cue.stage.effects?.map((assetId) => replaceAssetId(assetId) ?? assetId) }
        : undefined
    })),
    assets: includedAssets,
    exports: exportSettingsFor(profile, cloned.exports),
    publication: { ...cloned.publication, notesPrivate: true, public: true }
  };

  return {
    status: "ready",
    presentation: exported,
    issues: [],
    replacements: toReplacementList(replacements)
  };
}

function exportSettingsFor(profile: PresentationExportProfile, existing: ExportSettings | undefined): ExportSettings {
  const profileSettings: Record<Exclude<PresentationExportProfile, "local-performance">, ExportSettings> = {
    "public-replay": { enableReplayView: true },
    "static-archive": { enableSlideView: true, enableReadingView: true },
    "speaker-deck": { enableSlideView: true },
    "reading-source": { enableReadingView: true }
  };
  return {
    ...existing,
    ...profileSettings[profile as Exclude<PresentationExportProfile, "local-performance">],
    publicAssetsOnly: true,
    includeSpeakerNotes: false,
    includeCredits: true
  };
}

function isPublicAsset(asset: AssetDefinition | undefined): boolean {
  return asset?.visibility === "public" || asset?.visibility === "public-with-credit";
}

function toReplacementList(replacements: Map<string, string>): Array<{ assetId: string; fallbackAssetId: string }> {
  return [...replacements].map(([assetId, fallbackAssetId]) => ({ assetId, fallbackAssetId }));
}

function clonePresentation(presentation: PresentationPackageV1): PresentationPackageV1 {
  return {
    ...presentation,
    presentation: { ...presentation.presentation, author: { ...presentation.presentation.author } },
    slides: presentation.slides.map((slide) => ({ ...slide, image: slide.image ? { ...slide.image } : undefined })),
    cues: presentation.cues.map((cue) => ({
      ...cue,
      direction: { ...cue.direction },
      stage: cue.stage ? { ...cue.stage, effects: cue.stage.effects ? [...cue.stage.effects] : undefined } : undefined,
      after: { ...cue.after, branches: cue.after.branches?.map((branch) => ({ ...branch })) }
    })),
    characters: presentation.characters.map((character) => ({ ...character, roles: character.roles ? [...character.roles] : undefined })),
    assets: presentation.assets.map((asset) => ({ ...asset, tags: asset.tags ? [...asset.tags] : undefined })),
    directionPresets: presentation.directionPresets.map((preset) => ({ ...preset, effects: preset.effects ? [...preset.effects] : undefined })),
    settings: { ...presentation.settings, defaultLayers: [...presentation.settings.defaultLayers], subtitle: { ...presentation.settings.subtitle } },
    exports: presentation.exports ? { ...presentation.exports } : undefined,
    credits: presentation.credits?.map((credit) => ({ ...credit })),
    publication: presentation.publication ? { ...presentation.publication } : undefined
  };
}
