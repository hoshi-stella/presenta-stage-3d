import { Color3, Vector3 } from "@babylonjs/core";

export type ScenePresetName =
  | "neutral"
  | "intro"
  | "problem"
  | "deepDive"
  | "idea"
  | "demo"
  | "warning"
  | "summary"
  | "question";

export type CameraPresetName = "front" | "side" | "medium" | "close" | "wide";

export type ScenePreset = {
  clearColor: Color3;
  ambientColor: Color3;
  lightColor: Color3;
  lightIntensity: number;
  accentColor: Color3;
  particles: boolean;
};

export const scenePresets: Record<ScenePresetName, ScenePreset> = {
  neutral: {
    clearColor: Color3.FromHexString("#10131a"),
    ambientColor: Color3.FromHexString("#2d3342"),
    lightColor: Color3.White(),
    lightIntensity: 1.05,
    accentColor: Color3.FromHexString("#8ec5ff"),
    particles: false
  },
  intro: {
    clearColor: Color3.FromHexString("#1a2130"),
    ambientColor: Color3.FromHexString("#67708a"),
    lightColor: Color3.FromHexString("#fff1c6"),
    lightIntensity: 1.35,
    accentColor: Color3.FromHexString("#f6c65b"),
    particles: false
  },
  problem: {
    clearColor: Color3.FromHexString("#0d1117"),
    ambientColor: Color3.FromHexString("#202634"),
    lightColor: Color3.FromHexString("#9fb2cc"),
    lightIntensity: 0.78,
    accentColor: Color3.FromHexString("#ef6f6c"),
    particles: false
  },
  deepDive: {
    clearColor: Color3.FromHexString("#061725"),
    ambientColor: Color3.FromHexString("#174b66"),
    lightColor: Color3.FromHexString("#8ed8ff"),
    lightIntensity: 1.1,
    accentColor: Color3.FromHexString("#42d9c8"),
    particles: true
  },
  idea: {
    clearColor: Color3.FromHexString("#15151f"),
    ambientColor: Color3.FromHexString("#3a405d"),
    lightColor: Color3.FromHexString("#fff2a6"),
    lightIntensity: 1.2,
    accentColor: Color3.FromHexString("#f4e04d"),
    particles: true
  },
  demo: {
    clearColor: Color3.FromHexString("#12151b"),
    ambientColor: Color3.FromHexString("#34404d"),
    lightColor: Color3.FromHexString("#ffffff"),
    lightIntensity: 1.45,
    accentColor: Color3.FromHexString("#78f29b"),
    particles: true
  },
  warning: {
    clearColor: Color3.FromHexString("#190f13"),
    ambientColor: Color3.FromHexString("#3a2428"),
    lightColor: Color3.FromHexString("#ffb6a2"),
    lightIntensity: 0.92,
    accentColor: Color3.FromHexString("#ff6b4a"),
    particles: false
  },
  summary: {
    clearColor: Color3.FromHexString("#141922"),
    ambientColor: Color3.FromHexString("#404a5f"),
    lightColor: Color3.FromHexString("#d6e4ff"),
    lightIntensity: 1.15,
    accentColor: Color3.FromHexString("#b8ccff"),
    particles: false
  },
  question: {
    clearColor: Color3.FromHexString("#111720"),
    ambientColor: Color3.FromHexString("#3c4654"),
    lightColor: Color3.FromHexString("#f4fbff"),
    lightIntensity: 1.22,
    accentColor: Color3.FromHexString("#d7ff6b"),
    particles: true
  }
};

export const cameraPresets: Record<CameraPresetName, { position: Vector3; target: Vector3; radius: number }> = {
  front: {
    position: new Vector3(0, 2.8, -8.2),
    target: new Vector3(0, 1.25, 0),
    radius: 8.2
  },
  side: {
    position: new Vector3(6.3, 2.4, -5.1),
    target: new Vector3(0, 1.15, 0),
    radius: 8.1
  },
  medium: {
    position: new Vector3(0.8, 2.1, -5.6),
    target: new Vector3(0, 1.35, 0),
    radius: 5.8
  },
  close: {
    position: new Vector3(1.6, 2.05, -4.2),
    target: new Vector3(0, 1.45, 0),
    radius: 4.7
  },
  wide: {
    position: new Vector3(0, 4.1, -10.8),
    target: new Vector3(0, 1.1, 0),
    radius: 11.1
  }
};
