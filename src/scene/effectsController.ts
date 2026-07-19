import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3
} from "@babylonjs/core";
import { scenePresets, type ScenePresetName } from "./presets";
import type { StageElements } from "./stage";

export class EffectsController {
  private readonly particleMeshes: Mesh[] = [];
  private readonly particleMaterial: StandardMaterial;
  private presetName: ScenePresetName = "neutral";

  constructor(
    private readonly scene: Scene,
    private readonly keyLight: PointLight,
    private readonly stage: StageElements
  ) {
    this.particleMaterial = new StandardMaterial("particleMaterial", scene);
    this.particleMaterial.diffuseColor = Color3.FromHexString("#42d9c8");
    this.particleMaterial.emissiveColor = Color3.FromHexString("#174b66");

    for (let index = 0; index < 42; index += 1) {
      const particle = MeshBuilder.CreateSphere(`ambientParticle${index}`, { diameter: 0.045, segments: 8 }, scene);
      particle.position = new Vector3(
        -3 + Math.random() * 6,
        0.45 + Math.random() * 2.9,
        -1.5 + Math.random() * 3
      );
      particle.material = this.particleMaterial;
      particle.isVisible = false;
      this.particleMeshes.push(particle);
    }

    scene.onBeforeRenderObservable.add(() => this.animate());
  }

  applyPreset(name: ScenePresetName): void {
    const preset = scenePresets[name];
    this.presetName = name;
    this.scene.clearColor.set(preset.clearColor.r, preset.clearColor.g, preset.clearColor.b, 1);
    this.scene.ambientColor = preset.ambientColor;
    this.keyLight.diffuse = preset.lightColor;
    this.keyLight.intensity = preset.lightIntensity;
    this.stage.accentMaterial.diffuseColor = preset.accentColor;
    this.stage.accentMaterial.emissiveColor = preset.accentColor.scale(0.35);
    this.stage.backdropMaterial.diffuseColor = preset.clearColor.scale(0.72);
    this.stage.centerOrb.scaling.setAll(name === "demo" ? 1.35 : 1);
    this.particleMaterial.diffuseColor = preset.accentColor;
    this.particleMaterial.emissiveColor = preset.accentColor.scale(0.45);
    this.particleMeshes.forEach((mesh) => {
      mesh.isVisible = preset.particles;
    });
  }

  private animate(): void {
    const seconds = performance.now() / 1000;
    const active = scenePresets[this.presetName].particles;
    this.stage.centerOrb.rotation.y += 0.01;
    this.stage.centerOrb.position.y = 1.45 + Math.sin(seconds * 1.5) * 0.05;

    if (!active) {
      return;
    }

    this.particleMeshes.forEach((mesh, index) => {
      mesh.position.y += 0.002 + (index % 4) * 0.0005;
      mesh.position.x += Math.sin(seconds + index) * 0.0009;
      if (mesh.position.y > 3.6) {
        mesh.position.y = 0.35;
      }
    });
  }
}
