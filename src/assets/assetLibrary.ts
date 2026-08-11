import type { AssetDefinition, PresentationPackageV1 } from "../package/types";

export type AssetSearch = {
  query?: string;
  type?: AssetDefinition["type"];
  tag?: string;
};

export type AssetReference =
  | { kind: "slide-image"; slideId: string }
  | { kind: "cue-stage-effect"; cueId: string }
  | { kind: "cue-stage-object"; cueId: string }
  | { kind: "direction-preset-effect"; directionPresetId: string };

export type PublicAssetReadinessIssue = {
  code: "missing_public_fallback" | "missing_credit_metadata";
  assetId: string;
};

export function searchPresentationAssets(presentation: PresentationPackageV1, search: AssetSearch = {}): AssetDefinition[] {
  const query = search.query?.trim().toLowerCase();
  const tag = search.tag?.trim().toLowerCase();
  return presentation.assets.filter((asset) => {
    if (search.type && asset.type !== search.type) return false;
    if (tag && !asset.tags?.some((assetTag) => assetTag.toLowerCase() === tag)) return false;
    if (query && !`${asset.label} ${asset.id} ${(asset.tags ?? []).join(" ")}`.toLowerCase().includes(query)) return false;
    return true;
  }).map((asset) => structuredClone(asset));
}

export function findAssetReferences(presentation: PresentationPackageV1, assetId: string): AssetReference[] {
  const references: AssetReference[] = [];
  presentation.slides.forEach((slide) => {
    if (slide.image?.assetId === assetId) references.push({ kind: "slide-image", slideId: slide.id });
  });
  presentation.cues.forEach((cue) => {
    if (cue.stage?.effects?.includes(assetId)) references.push({ kind: "cue-stage-effect", cueId: cue.id });
    if (cue.stage?.objectRef === assetId) references.push({ kind: "cue-stage-object", cueId: cue.id });
  });
  presentation.directionPresets.forEach((preset) => {
    if (preset.effects?.includes(assetId)) references.push({ kind: "direction-preset-effect", directionPresetId: preset.id });
  });
  return references;
}

export function getAssetDeletionGuard(presentation: PresentationPackageV1, assetId: string): { allowed: boolean; references: AssetReference[] } {
  const references = findAssetReferences(presentation, assetId);
  return { allowed: references.length === 0, references };
}

export function getPublicAssetReadiness(presentation: PresentationPackageV1): { ready: boolean; issues: PublicAssetReadinessIssue[] } {
  const byId = new Map(presentation.assets.map((asset) => [asset.id, asset]));
  const issues: PublicAssetReadinessIssue[] = [];
  presentation.assets.forEach((asset) => {
    if ((asset.visibility === "local-only" || asset.visibility === "private") && !hasPublicFallback(asset, byId)) {
      issues.push({ code: "missing_public_fallback", assetId: asset.id });
    }
    if (asset.visibility === "public-with-credit" && asset.license?.creditRequired && !hasCreditMetadata(asset)) {
      issues.push({ code: "missing_credit_metadata", assetId: asset.id });
    }
  });
  return { ready: issues.length === 0, issues };
}

function hasPublicFallback(asset: AssetDefinition, byId: Map<string, AssetDefinition>): boolean {
  const fallback = asset.fallbackAssetId ? byId.get(asset.fallbackAssetId) : undefined;
  return fallback?.visibility === "public" || fallback?.visibility === "public-with-credit";
}

function hasCreditMetadata(asset: AssetDefinition): boolean {
  const license = asset.license;
  return Boolean(license?.creditText?.trim() || license?.author?.trim() || license?.source?.trim());
}
