import type { PresentationPackageV1, ValidationIssue } from "../package/types";

export function checkPresentationQuality(presentation: PresentationPackageV1): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  presentation.cues.forEach((cue, index) => {
    const path = `$.cues[${index}]`;
    if (!cue.estimatedDurationMs) issues.push(warning(`${path}.estimatedDurationMs`, "missing_duration", "Cue has no estimated duration."));
    if (cue.estimatedDurationMs && cue.text.length > Math.max(20, cue.estimatedDurationMs / 45)) issues.push(warning(`${path}.estimatedDurationMs`, "short_duration", "Cue duration appears short for its text length."));
    const layers = cue.presentation?.layers ?? presentation.settings.defaultLayers;
    if (layers.length > 5) issues.push(warning(`${path}.presentation.layers`, "excessive_layers", "Cue enables more than five simultaneous layers."));
    if ((cue.presentation?.subtitle ?? presentation.settings.subtitle.enabled) && cue.text.split("\n").length > (presentation.settings.subtitle.maxLines ?? 3)) issues.push(warning(`${path}.text`, "subtitle_overflow", "Cue text exceeds the configured subtitle line count."));
  });
  for (let index = 1; index < presentation.cues.length; index += 1) {
    const previous = presentation.cues[index - 1]; const current = presentation.cues[index];
    if (previous.direction.intensity === "high" && current.direction.intensity === "high") issues.push(warning(`$.cues[${index}].direction.intensity`, "repeated_high_intensity", "Consecutive high-intensity cues may overwhelm the audience."));
  }
  return issues;
}

function warning(path: string, code: string, message: string): ValidationIssue { return { severity: "warning", path, code, message }; }
