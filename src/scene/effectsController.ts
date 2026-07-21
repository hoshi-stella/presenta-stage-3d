import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3
} from "@babylonjs/core";
import type { StageEffectInstruction } from "../assets/types";
import { scenePresets, type ScenePresetName } from "./presets";
import type { StageElements } from "./stage";

type ActiveEffectParticle = {
  mesh: Mesh;
  instruction: StageEffectInstruction;
  basePosition: Vector3;
  seed: number;
  startedAt: number;
};

export class EffectsController {
  private readonly particleMeshes: Mesh[] = [];
  private readonly effectParticles: ActiveEffectParticle[] = [];
  private readonly effectMaterials: StandardMaterial[] = [];
  private readonly particleMaterial: StandardMaterial;
  private presetName: ScenePresetName = "neutral";
  private effectSignature = "";

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

  applyDirectionEffects(effects: StageEffectInstruction[]): void {
    const nextSignature = effects.map((effect) => `${effect.id}:${effect.count}:${effect.intensity}`).join("|");
    if (nextSignature === this.effectSignature) {
      return;
    }

    this.effectSignature = nextSignature;
    this.clearDirectionEffects();
    effects.forEach((effect) => this.createDirectionEffect(effect));
  }

  private createDirectionEffect(effect: StageEffectInstruction): void {
    const material = new StandardMaterial(`${effect.id}Material`, this.scene);
    material.diffuseColor = Color3.FromHexString(effect.color);
    material.emissiveColor = Color3.FromHexString(effect.color).scale(effect.kind === "warning_flash" ? 0.86 : 0.52);
    material.alpha = effect.kind === "bubble_float" ? 0.42 : 0.74;
    material.backFaceCulling = false;
    this.effectMaterials.push(material);

    for (let index = 0; index < effect.count; index += 1) {
      const size = randomBetween(effect.size[0], effect.size[1]);
      const mesh = effect.kind === "petal_fall"
        ? MeshBuilder.CreatePlane(`${effect.id}${index}`, { size }, this.scene)
        : MeshBuilder.CreateSphere(`${effect.id}${index}`, { diameter: size, segments: 10 }, this.scene);
      mesh.material = material;
      mesh.position = this.createEffectBasePosition(effect);
      mesh.rotation = new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.effectParticles.push({
        mesh,
        instruction: effect,
        basePosition: mesh.position.clone(),
        seed: Math.random() * 100,
        startedAt: performance.now()
      });
    }
  }

  private createEffectBasePosition(effect: StageEffectInstruction): Vector3 {
    const x = randomBetween(-effect.spread[0] / 2, effect.spread[0] / 2);
    const z = randomBetween(-effect.spread[2] / 2, effect.spread[2] / 2);
    const y = effect.kind === "petal_fall"
      ? randomBetween(2.2, 2.2 + effect.spread[1])
      : randomBetween(0.55, 0.55 + effect.spread[1]);
    return new Vector3(x, y, z);
  }

  private clearDirectionEffects(): void {
    this.effectParticles.forEach((particle) => particle.mesh.dispose());
    this.effectParticles.length = 0;
    this.effectMaterials.forEach((material) => material.dispose());
    this.effectMaterials.length = 0;
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
    this.animateDirectionEffects(seconds);
  }

  private animateDirectionEffects(seconds: number): void {
    this.effectParticles.forEach((particle, index) => {
      const age = (performance.now() - particle.startedAt) / particle.instruction.durationMs;
      if (age >= 1) {
        particle.mesh.isVisible = false;
        return;
      }

      const sway = Math.sin(seconds * 1.8 + particle.seed) * 0.22;
      particle.mesh.position.x = particle.basePosition.x + particle.instruction.velocity[0] * age * 42 + sway;
      particle.mesh.position.y = particle.basePosition.y + particle.instruction.velocity[1] * age * 42;
      particle.mesh.position.z = particle.basePosition.z + particle.instruction.velocity[2] * age * 42 + Math.cos(seconds + particle.seed) * 0.08;

      if (particle.instruction.kind === "focus_pulse") {
        const pulse = 1 + Math.sin(seconds * 8 + index) * 0.28;
        particle.mesh.scaling.setAll(pulse);
      }

      if (particle.instruction.kind === "warning_flash") {
        particle.mesh.isVisible = Math.sin(seconds * 12 + index) > -0.2;
      }

      particle.mesh.rotation.x += 0.008 + (index % 3) * 0.002;
      particle.mesh.rotation.y += 0.012 + (index % 5) * 0.002;
    });
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
