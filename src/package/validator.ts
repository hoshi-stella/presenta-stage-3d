import { PresentationLoadError } from "./errors";
import type { PresentationPackageV1, PresentationValidationResult, ValidationIssue } from "./types";

const intensities = new Set(["low", "medium", "high"]);
const assetVisibilities = new Set(["local-only", "private", "public", "public-with-credit"]);
const afterModes = new Set(["auto_next", "wait_for_presenter", "branch_available", "stop"]);
const slideLayouts = new Set(["title", "content", "image", "split", "code", "grid", "minimal", "architecture", "flow"]);

export function validatePresentationPackage(value: unknown): PresentationValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return result([error("$", "invalid_type", "Presentation Package must be an object.")]);
  }

  requiredNumber(value, "schemaVersion", "$", issues);
  if (value.schemaVersion !== 1) {
    issues.push(error("$.schemaVersion", "unsupported_schema_version", "schemaVersion must be 1."));
  }
  validateMetadata(value.presentation, issues);
  validateSlides(value.slides, issues);
  validateCues(value.cues, issues);
  validateCharacters(value.characters, issues);
  validateAssets(value.assets, issues);
  validateDirectionPresets(value.directionPresets, issues);
  validateSettings(value.settings, issues);

  if (isRecord(value)) {
    validateReferences(value, issues);
  }
  return result(issues);
}

export function assertValidPresentationPackage(value: unknown): PresentationPackageV1 {
  const validation = validatePresentationPackage(value);
  if (!validation.valid) {
    const code = validation.errors.some((issue) => issue.code.includes("reference") || issue.code.includes("missing_target"))
      ? "REFERENCE_VALIDATION_FAILED"
      : "SCHEMA_VALIDATION_FAILED";
    throw new PresentationLoadError(code, `Presentation Package validation failed: ${validation.errors.map((issue) => issue.message).join(" ")}`, validation.errors.map((issue) => issue.path));
  }
  return value as PresentationPackageV1;
}

function validateMetadata(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(error("$.presentation", "invalid_type", "presentation must be an object."));
    return;
  }
  requiredString(value, "id", "$.presentation", issues);
  requiredString(value, "title", "$.presentation", issues);
  if (!isRecord(value.author)) {
    issues.push(error("$.presentation.author", "required", "presentation.author must be an object."));
  } else {
    requiredString(value.author, "name", "$.presentation.author", issues);
  }
  requiredString(value, "language", "$.presentation", issues);
}

function validateSlides(value: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(error("$.slides", "invalid_type", "slides must be an array."));
    return;
  }
  value.forEach((slide, index) => {
    const path = `$.slides[${index}]`;
    if (!isRecord(slide)) {
      issues.push(error(path, "invalid_type", "slide must be an object."));
      return;
    }
    requiredString(slide, "id", path, issues);
    const layout = requiredString(slide, "layout", path, issues);
    if (layout && !slideLayouts.has(layout)) {
      issues.push(error(`${path}.layout`, "invalid_enum", `Unsupported slide layout: ${layout}.`));
    }
    optionalString(slide, "title", path, issues);
    if (slide.body !== undefined && typeof slide.body !== "string" && !isStringArray(slide.body)) {
      issues.push(error(`${path}.body`, "invalid_type", "slide body must be a string or string array."));
    }
  });
}

function validateCues(value: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(error("$.cues", "required", "cues must be a non-empty array."));
    return;
  }
  value.forEach((cue, index) => {
    const path = `$.cues[${index}]`;
    if (!isRecord(cue)) {
      issues.push(error(path, "invalid_type", "cue must be an object."));
      return;
    }
    requiredString(cue, "id", path, issues);
    requiredString(cue, "kind", path, issues);
    requiredString(cue, "speaker", path, issues);
    requiredString(cue, "text", path, issues);
    if (cue.audio !== undefined) validateCueAudio(cue.audio, `${path}.audio`, issues);
    if (!isRecord(cue.direction)) {
      issues.push(error(`${path}.direction`, "required", "cue direction must be an object."));
    } else {
      requiredString(cue.direction, "intent", `${path}.direction`, issues);
      const intensity = requiredString(cue.direction, "intensity", `${path}.direction`, issues);
      if (intensity && !intensities.has(intensity)) {
        issues.push(error(`${path}.direction.intensity`, "invalid_enum", "intensity must be low, medium, or high."));
      }
    }
    if (!isRecord(cue.after)) {
      issues.push(error(`${path}.after`, "required", "cue after must be an object."));
    } else {
      const mode = requiredString(cue.after, "mode", `${path}.after`, issues);
      if (mode && !afterModes.has(mode)) {
        issues.push(error(`${path}.after.mode`, "invalid_enum", "Unsupported after.mode."));
      }
      if (cue.after.durationMs === undefined) {
        issues.push(warning(`${path}.after.durationMs`, "missing_duration", "Cue duration is not set; the runtime default will be used."));
      }
    }
  });
}

function validateCueAudio(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(error(path, "invalid_type", "cue audio must be an object."));
    return;
  }
  requiredString(value, "src", path, issues);
  if (value.durationMs !== undefined && (typeof value.durationMs !== "number" || !Number.isFinite(value.durationMs) || value.durationMs <= 0)) {
    issues.push(error(`${path}.durationMs`, "invalid_value", "audio durationMs must be a positive number."));
  }
  if (value.volume !== undefined && (typeof value.volume !== "number" || !Number.isFinite(value.volume) || value.volume < 0 || value.volume > 1)) {
    issues.push(error(`${path}.volume`, "invalid_value", "audio volume must be between 0 and 1."));
  }
}

function validateCharacters(value: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(error("$.characters", "invalid_type", "characters must be an array."));
    return;
  }
  value.forEach((character, index) => {
    if (!isRecord(character)) {
      issues.push(error(`$.characters[${index}]`, "invalid_type", "character must be an object."));
      return;
    }
    requiredString(character, "id", `$.characters[${index}]`, issues);
    requiredString(character, "displayName", `$.characters[${index}]`, issues);
  });
}

function validateAssets(value: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(error("$.assets", "invalid_type", "assets must be an array."));
    return;
  }
  value.forEach((asset, index) => {
    const path = `$.assets[${index}]`;
    if (!isRecord(asset)) {
      issues.push(error(path, "invalid_type", "asset must be an object."));
      return;
    }
    requiredString(asset, "id", path, issues);
    requiredString(asset, "type", path, issues);
    requiredString(asset, "label", path, issues);
    const visibility = requiredString(asset, "visibility", path, issues);
    if (visibility && !assetVisibilities.has(visibility)) {
      issues.push(error(`${path}.visibility`, "invalid_enum", "Unsupported asset visibility."));
    }
    if (!asset.fallbackAssetId) {
      issues.push(warning(`${path}.fallbackAssetId`, "missing_fallback", "Asset has no fallbackAssetId."));
    }
  });
}

function validateDirectionPresets(value: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(error("$.directionPresets", "invalid_type", "directionPresets must be an array."));
    return;
  }
  value.forEach((preset, index) => {
    if (!isRecord(preset)) {
      issues.push(error(`$.directionPresets[${index}]`, "invalid_type", "direction preset must be an object."));
      return;
    }
    requiredString(preset, "id", `$.directionPresets[${index}]`, issues);
    requiredString(preset, "label", `$.directionPresets[${index}]`, issues);
  });
}

function validateSettings(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push(error("$.settings", "invalid_type", "settings must be an object."));
    return;
  }
  requiredString(value, "defaultProfile", "$.settings", issues);
  requiredString(value, "fallbackProfile", "$.settings", issues);
  if (!Array.isArray(value.defaultLayers)) issues.push(error("$.settings.defaultLayers", "invalid_type", "defaultLayers must be an array."));
  if (!isRecord(value.subtitle) || typeof value.subtitle.enabled !== "boolean") issues.push(error("$.settings.subtitle.enabled", "required", "subtitle.enabled must be boolean."));
}

function validateReferences(value: Record<string, unknown>, issues: ValidationIssue[]): void {
  const slides = arrayRecords(value.slides);
  const cues = arrayRecords(value.cues);
  const characters = arrayRecords(value.characters);
  const assets = arrayRecords(value.assets);
  const presets = arrayRecords(value.directionPresets);
  duplicateIds(slides, "slides", issues);
  duplicateIds(cues, "cues", issues);
  duplicateIds(characters, "characters", issues);
  duplicateIds(assets, "assets", issues);
  duplicateIds(presets, "directionPresets", issues);
  const slideIds = ids(slides); const cueIds = ids(cues); const characterIds = ids(characters); const assetIds = ids(assets); const presetIds = ids(presets);
  cues.forEach((cue, index) => {
    const path = `$.cues[${index}]`;
    if (typeof cue.slideRef === "string" && !slideIds.has(cue.slideRef)) issues.push(error(`${path}.slideRef`, "missing_reference", `Cue references missing slide: ${cue.slideRef}.`));
    if (typeof cue.speaker === "string" && !characterIds.has(cue.speaker)) issues.push(error(`${path}.speaker`, "missing_reference", `Cue references missing character: ${cue.speaker}.`));
    if (isRecord(cue.stage)) {
      if (typeof cue.stage.directionPreset === "string" && !presetIds.has(cue.stage.directionPreset)) issues.push(error(`${path}.stage.directionPreset`, "missing_reference", `Cue references missing direction preset: ${cue.stage.directionPreset}.`));
      if (Array.isArray(cue.stage.effects)) cue.stage.effects.forEach((effect, effectIndex) => {
        if (typeof effect === "string" && !assetIds.has(effect)) issues.push(error(`${path}.stage.effects[${effectIndex}]`, "missing_reference", `Cue references missing effect asset: ${effect}.`));
      });
    }
    if (isRecord(cue.after) && Array.isArray(cue.after.branches)) cue.after.branches.forEach((branch, branchIndex) => {
      if (isRecord(branch) && typeof branch.targetCueId === "string" && !cueIds.has(branch.targetCueId)) issues.push(error(`${path}.after.branches[${branchIndex}].targetCueId`, "missing_target", `Branch references missing cue: ${branch.targetCueId}.`));
    });
  });
  assets.forEach((asset, index) => {
    if (typeof asset.fallbackAssetId === "string" && !assetIds.has(asset.fallbackAssetId)) issues.push(error(`$.assets[${index}].fallbackAssetId`, "missing_reference", `Asset fallback does not exist: ${asset.fallbackAssetId}.`));
    if (asset.visibility === "local-only") issues.push(warning(`$.assets[${index}]`, "local_only_asset", `Asset ${String(asset.id)} is local-only and must not be published.`));
  });
  if (isRecord(value.exports) && value.exports.publicAssetsOnly === true) {
    assets.filter((asset) => asset.visibility === "local-only" || asset.visibility === "private").forEach((asset) => issues.push(warning("$.exports.publicAssetsOnly", "private_asset_in_public_export", `Public export includes non-public asset ${String(asset.id)}.`)));
  }
}

function result(issues: ValidationIssue[]): PresentationValidationResult { const errors = issues.filter((issue) => issue.severity === "error"); return { valid: errors.length === 0, errors, warnings: issues.filter((issue) => issue.severity === "warning") }; }
function error(path: string, code: string, message: string): ValidationIssue { return { severity: "error", path, code, message }; }
function warning(path: string, code: string, message: string): ValidationIssue { return { severity: "warning", path, code, message }; }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function arrayRecords(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter(isRecord) : []; }
function ids(records: Record<string, unknown>[]): Set<string> { return new Set(records.map((record) => record.id).filter((id): id is string => typeof id === "string")); }
function duplicateIds(records: Record<string, unknown>[], key: string, issues: ValidationIssue[]): void { const seen = new Set<string>(); records.forEach((record, index) => { if (typeof record.id === "string") { if (seen.has(record.id)) issues.push(error(`$.${key}[${index}].id`, "duplicate_id", `Duplicate ${key} id: ${record.id}.`)); seen.add(record.id); } }); }
function requiredString(record: Record<string, unknown>, key: string, path: string, issues: ValidationIssue[]): string | null { const value = record[key]; if (typeof value !== "string" || value.trim().length === 0) { issues.push(error(`${path}.${key}`, "required", `${key} must be a non-empty string.`)); return null; } return value; }
function optionalString(record: Record<string, unknown>, key: string, path: string, issues: ValidationIssue[]): void { if (record[key] !== undefined && typeof record[key] !== "string") issues.push(error(`${path}.${key}`, "invalid_type", `${key} must be a string.`)); }
function requiredNumber(record: Record<string, unknown>, key: string, path: string, issues: ValidationIssue[]): void { if (typeof record[key] !== "number") issues.push(error(`${path}.${key}`, "required", `${key} must be a number.`)); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((entry) => typeof entry === "string"); }
