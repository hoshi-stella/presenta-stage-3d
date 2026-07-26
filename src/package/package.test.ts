import { describe, expect, it } from "vitest";
import { adaptPresentationPackageToRuntime } from "./adapter";
import { serializePresentationPackage } from "./exporter";
import { PresentationLoadError } from "./errors";
import { loadPresentationFromJson, loadPresentationFromObject } from "./loader";
import { createDefaultPresentation } from "../presentations/defaultPresentation";
import { validatePresentationPackage } from "./validator";

describe("Presentation Package v1", () => {
  it("validates the built-in package and adapts it to playable runtime data", () => {
    const presentation = createDefaultPresentation();
    expect(validatePresentationPackage(presentation).valid).toBe(true);
    const runtime = adaptPresentationPackageToRuntime(presentation);
    expect(runtime.cues.length).toBeGreaterThan(0);
    expect(runtime.slides.length).toBeGreaterThan(0);
    expect(runtime.cues[0].speaker).toBe("mikoto");
  });

  it("rejects invalid JSON and unsupported schema versions", () => {
    expect(() => loadPresentationFromJson("{")).toThrow(PresentationLoadError);
    expect(() => loadPresentationFromObject({ schemaVersion: 2 })).toThrow(/schemaVersion/);
  });

  it("detects duplicate ids and missing references", () => {
    const duplicate = createDefaultPresentation();
    duplicate.cues.push({ ...duplicate.cues[0] });
    expect(validatePresentationPackage(duplicate).errors.some((issue) => issue.code === "duplicate_id")).toBe(true);

    const missingReference = createDefaultPresentation();
    missingReference.cues[0].slideRef = "missing-slide";
    missingReference.cues[0].speaker = "missing-character";
    missingReference.cues[0].after.branches = [{ command: "supplement", label: "Missing", targetCueId: "missing-cue" }];
    const result = validatePresentationPackage(missingReference);
    expect(result.errors.filter((issue) => issue.code === "missing_reference" || issue.code === "missing_target")).toHaveLength(3);
  });

  it("warns for local-only assets without blocking playback", () => {
    const presentation = createDefaultPresentation();
    presentation.assets.push({ id: "local-model", type: "model3d", label: "Local model", visibility: "local-only" });
    const result = validatePresentationPackage(presentation);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((issue) => issue.code === "local_only_asset")).toBe(true);
  });

  it("serializes, parses, and validates without losing the package identity", () => {
    const presentation = createDefaultPresentation();
    const roundTripped = loadPresentationFromJson(serializePresentationPackage(presentation));
    expect(roundTripped.presentation.id).toBe(presentation.presentation.id);
    expect(validatePresentationPackage(roundTripped).valid).toBe(true);
  });
});
