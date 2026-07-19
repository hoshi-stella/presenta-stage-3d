import { ArcRotateCamera, Scene, Vector3 } from "@babylonjs/core";
import { cameraPresets, type CameraPresetName } from "./presets";

export class CameraController {
  readonly camera: ArcRotateCamera;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    const preset = cameraPresets.front;
    this.camera = new ArcRotateCamera("stageCamera", 0, 0, preset.radius, preset.target, scene);
    this.camera.position = preset.position.clone();
    this.camera.setTarget(preset.target);
    this.camera.lowerRadiusLimit = 3.5;
    this.camera.upperRadiusLimit = 14;
    this.camera.wheelPrecision = 70;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(canvas, true);
  }

  applyPreset(name: CameraPresetName): void {
    const preset = cameraPresets[name];
    this.camera.position = Vector3.Lerp(this.camera.position, preset.position, 0.82);
    this.camera.radius = preset.radius;
    this.camera.setTarget(preset.target);
  }
}
