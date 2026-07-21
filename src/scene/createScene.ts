import {
  Color4,
  Engine,
  HemisphericLight,
  PointLight,
  Scene,
  Vector3
} from "@babylonjs/core";
import { CameraController } from "./cameraController";
import { CharacterController } from "./characterController";
import { EffectsController } from "./effectsController";
import { getGlbCharacterAssets } from "./modelAssetConfig";
import { createStage } from "./stage";
import type { StageEffectInstruction } from "../assets/types";
import type { CameraPresetName, ScenePresetName } from "./presets";

export type StageScene = {
  engine: Engine;
  scene: Scene;
  characterController: CharacterController;
  applySectionVisuals: (preset: ScenePresetName, camera: CameraPresetName, effects?: StageEffectInstruction[]) => void;
  dispose: () => void;
};

export function createStageScene(canvas: HTMLCanvasElement): StageScene {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.06, 0.07, 0.09, 1);

  const cameraController = new CameraController(scene, canvas);
  const hemiLight = new HemisphericLight("ambientStageLight", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.34;

  const keyLight = new PointLight("keyStageLight", new Vector3(0, 4.6, -3.6), scene);
  keyLight.intensity = 1.1;

  const stage = createStage(scene);
  const characterController = new CharacterController(scene);
  void characterController.loadGlbCharacters(getGlbCharacterAssets());
  const effectsController = new EffectsController(scene, keyLight, stage);
  effectsController.applyPreset("intro");

  engine.runRenderLoop(() => {
    scene.render();
  });

  const handleResize = (): void => {
    engine.resize();
  };
  window.addEventListener("resize", handleResize);

  return {
    engine,
    scene,
    characterController,
    applySectionVisuals: (preset, camera, effects = []) => {
      effectsController.applyPreset(preset);
      effectsController.applyDirectionEffects(effects);
      cameraController.applyPreset(camera);
    },
    dispose: () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
    }
  };
}
