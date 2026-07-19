import type { Cue, ResolvedDirection } from "./types";

export function resolveDirection(cue: Cue): ResolvedDirection {
  if (cue.stage?.motion && cue.stage.camera && cue.stage.preset) {
    return {
      motion: cue.stage.motion,
      camera: cue.stage.camera,
      scenePreset: cue.stage.preset
    };
  }

  switch (cue.direction.intent) {
    case "emphasis":
      return {
        motion: "point",
        camera: "close",
        scenePreset: "demo"
      };
    case "question":
    case "doubt":
      return {
        motion: "think",
        camera: "side",
        scenePreset: "problem"
      };
    case "supplement":
      return {
        motion: "point",
        camera: "medium",
        scenePreset: "idea"
      };
    case "tsukkomi":
    case "reaction":
      return {
        motion: "point",
        camera: "side",
        scenePreset: "demo"
      };
    case "deep_dive":
      return {
        motion: "present",
        camera: "medium",
        scenePreset: "deepDive"
      };
    case "warning":
      return {
        motion: "idle",
        camera: "front",
        scenePreset: "warning"
      };
    case "summary":
      return {
        motion: "present",
        camera: "wide",
        scenePreset: "summary"
      };
    case "transition":
      return {
        motion: "present",
        camera: "front",
        scenePreset: "neutral"
      };
    case "celebration":
      return {
        motion: "wave",
        camera: "wide",
        scenePreset: "question"
      };
    case "neutral":
      return {
        motion: "idle",
        camera: "front",
        scenePreset: "neutral"
      };
  }
}
