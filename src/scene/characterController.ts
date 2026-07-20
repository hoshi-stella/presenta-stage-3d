import {
  AbstractMesh,
  AnimationGroup,
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  SceneLoader,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from "@babylonjs/core";
import { GLTFFileLoader, GLTFLoaderAnimationStartMode } from "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/glTF";
import type { CharacterId, CharacterRuntimeState } from "../presentation/types";
import type { GlbCharacterAssetConfig } from "./modelAssetConfig";

export type CharacterMotionName = "idle" | "wave" | "think" | "point" | "present";

type DummyCharacter = {
  id: CharacterId;
  root: TransformNode;
  head: Mesh;
  body: Mesh;
  leftArm: Mesh;
  rightArm: Mesh;
  leftLeg: Mesh;
  rightLeg: Mesh;
  basePosition: Vector3;
  motion: CharacterMotionName;
  runtimeState: CharacterRuntimeState[CharacterId];
};

type GlbCharacter = {
  id: CharacterId;
  root: TransformNode;
  contentRoot: TransformNode;
  meshes: AbstractMesh[];
  animationGroups: Map<string, AnimationGroup>;
  motionAnimations: Partial<Record<CharacterMotionName, string>>;
  activeAnimationName: string | null;
  animationMode: "off" | "cue";
  basePosition: Vector3;
  motion: CharacterMotionName;
  runtimeState: CharacterRuntimeState[CharacterId];
};

export class CharacterController {
  private readonly characters = new Map<CharacterId, DummyCharacter>();
  private readonly glbCharacters = new Map<CharacterId, GlbCharacter>();

  constructor(private readonly scene: Scene) {
    const skin = new StandardMaterial("dummyCharacterSkin", scene);
    skin.diffuseColor = Color3.FromHexString("#f6d7b0");

    const reiSuit = new StandardMaterial("reiCharacterSuit", scene);
    reiSuit.diffuseColor = Color3.FromHexString("#3d7bd9");
    reiSuit.specularColor = Color3.FromHexString("#9ab7dd");

    const mikotoSuit = new StandardMaterial("mikotoCharacterSuit", scene);
    mikotoSuit.diffuseColor = Color3.FromHexString("#cf6f42");
    mikotoSuit.specularColor = Color3.FromHexString("#f0b38e");

    const limb = new StandardMaterial("dummyCharacterLimbs", scene);
    limb.diffuseColor = Color3.FromHexString("#26324a");

    this.characters.set("rei", this.createCharacter("rei", new Vector3(-0.82, 0.16, -0.15), skin, reiSuit, limb));
    this.characters.set("mikoto", this.createCharacter("mikoto", new Vector3(0.82, 0.16, 0.05), skin, mikotoSuit, limb));

    scene.onBeforeRenderObservable.add(() => this.animate());
  }

  async loadGlbCharacters(configs: GlbCharacterAssetConfig[]): Promise<void> {
    await Promise.all(configs.map((config) => this.loadGlbCharacter(config)));
  }

  playMotion(motion: CharacterMotionName, speaker: CharacterId = "rei"): void {
    this.characters.forEach((character) => {
      character.motion = character.id === speaker ? motion : "idle";
    });
    this.glbCharacters.forEach((character) => {
      character.motion = character.id === speaker ? motion : "idle";
      this.playGlbMotion(character);
    });
  }

  applyCharacterStates(states: CharacterRuntimeState, speaker: CharacterId): void {
    this.characters.forEach((character, characterId) => {
      character.runtimeState = states[characterId];
      character.root.rotation.y = characterId === speaker ? 0 : characterId === "rei" ? 0.18 : -0.18;
    });
    this.glbCharacters.forEach((character, characterId) => {
      character.runtimeState = states[characterId];
      character.root.rotation.y = characterId === speaker ? 0 : characterId === "rei" ? 0.18 : -0.18;
    });
  }

  private async loadGlbCharacter(config: GlbCharacterAssetConfig): Promise<void> {
    if (!config.url) {
      return;
    }

    try {
      SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
        if (loader instanceof GLTFFileLoader) {
          loader.animationStartMode = GLTFLoaderAnimationStartMode.NONE;
        }
      });
      const result = await SceneLoader.ImportMeshAsync("", config.url, "", this.scene);
      result.animationGroups.forEach((animationGroup) => {
        animationGroup.stop();
      });
      const animationGroups = new Map(result.animationGroups.map((animationGroup) => [animationGroup.name, animationGroup]));
      const root = new TransformNode(`${config.characterId}GlbRoot`, this.scene);
      const contentRoot = new TransformNode(`${config.characterId}GlbContentRoot`, this.scene);
      contentRoot.parent = root;
      const basePosition = new Vector3(-1.04, 0, -0.12);
      root.position = basePosition.clone();
      root.rotation = new Vector3(0, 0, 0);
      root.scaling.setAll(1.25);
      contentRoot.rotation = new Vector3(0, 0, 0);

      result.meshes.forEach((mesh) => {
        if (mesh !== root && mesh !== contentRoot) {
          mesh.parent = contentRoot;
          this.tuneGlbMaterial(mesh);
        }
      });

      const glbCharacter: GlbCharacter = {
        id: config.characterId,
        root,
        contentRoot,
        meshes: result.meshes,
        animationGroups,
        motionAnimations: config.motionAnimations,
        activeAnimationName: null,
        animationMode: config.animationMode,
        basePosition,
        motion: "idle",
        runtimeState: "listening"
      };
      this.glbCharacters.set(config.characterId, glbCharacter);
      this.setDummyVisible(config.characterId, false);
      this.playGlbMotion(glbCharacter);
    } catch (error) {
      console.warn(`Failed to load GLB character ${config.characterId}:`, error);
      this.setDummyVisible(config.characterId, true);
    }
  }

  private playGlbMotion(character: GlbCharacter): void {
    if (character.animationMode === "off") {
      this.stopGlbAnimations(character);
      return;
    }

    const nextAnimationName = character.motionAnimations[character.motion];
    if (!nextAnimationName || nextAnimationName === character.activeAnimationName) {
      return;
    }

    const nextAnimation = character.animationGroups.get(nextAnimationName);
    if (!nextAnimation) {
      console.warn(`GLB animation "${nextAnimationName}" was not found for ${character.id}.`);
      this.stopGlbAnimations(character);
      return;
    }

    this.stopGlbAnimations(character);
    character.activeAnimationName = nextAnimationName;
    nextAnimation.reset();
    nextAnimation.start(true);
  }

  private stopGlbAnimations(character: GlbCharacter): void {
    character.animationGroups.forEach((animationGroup) => {
      animationGroup.stop();
    });
    character.activeAnimationName = null;
  }

  private setDummyVisible(characterId: CharacterId, isVisible: boolean): void {
    const character = this.characters.get(characterId);
    if (!character) {
      return;
    }

    [
      character.head,
      character.body,
      character.leftArm,
      character.rightArm,
      character.leftLeg,
      character.rightLeg
    ].forEach((mesh) => {
      mesh.isVisible = isVisible;
    });
  }

  private tuneGlbMaterial(mesh: AbstractMesh): void {
    const material = mesh.material;
    if (material instanceof PBRMaterial) {
      material.metallic = 0;
      material.roughness = 0.72;
      material.environmentIntensity = 0.85;
      return;
    }

    if (material instanceof StandardMaterial) {
      material.specularColor = Color3.FromHexString("#222222");
    }
  }

  private createCharacter(
    id: CharacterId,
    basePosition: Vector3,
    skin: StandardMaterial,
    suit: StandardMaterial,
    limb: StandardMaterial
  ): DummyCharacter {
    const root = new TransformNode(`${id}Root`, this.scene);
    root.position = basePosition.clone();

    const body = MeshBuilder.CreateCapsule(`${id}Body`, { height: 1.25, radius: 0.34 }, this.scene);
    body.position.y = 0.94;
    body.material = suit;
    body.parent = root;

    const head = MeshBuilder.CreateSphere(`${id}Head`, { diameter: 0.58, segments: 32 }, this.scene);
    head.position.y = 1.72;
    head.material = skin;
    head.parent = root;

    const leftArm = this.createLimb(`${id}LeftArm`, new Vector3(-0.46, 1.15, 0), limb, root);
    const rightArm = this.createLimb(`${id}RightArm`, new Vector3(0.46, 1.15, 0), limb, root);
    const leftLeg = this.createLimb(`${id}LeftLeg`, new Vector3(-0.18, 0.32, 0), limb, root);
    const rightLeg = this.createLimb(`${id}RightLeg`, new Vector3(0.18, 0.32, 0), limb, root);

    return {
      id,
      root,
      head,
      body,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      basePosition,
      motion: "idle",
      runtimeState: "listening"
    };
  }

  private createLimb(name: string, position: Vector3, material: StandardMaterial, root: TransformNode): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { width: 0.14, height: 0.72, depth: 0.16 }, this.scene);
    mesh.position = position;
    mesh.material = material;
    mesh.parent = root;
    return mesh;
  }

  private animate(): void {
    const seconds = performance.now() / 1000;
    this.characters.forEach((character) => {
      this.resetPose(character);

      const bobAmount = character.runtimeState === "speaking" ? 0.045 : 0.018;
      character.root.position.y = character.basePosition.y + Math.sin(seconds * 2.2) * bobAmount;
      character.root.scaling.setAll(character.runtimeState === "speaking" ? 1.06 : 0.92);

      switch (character.motion) {
        case "wave":
          character.rightArm.rotation.z = -1.55 + Math.sin(seconds * 8) * 0.45;
          character.rightArm.position.y = 1.42;
          character.head.rotation.z = Math.sin(seconds * 2.8) * 0.08;
          break;
        case "think":
          character.root.rotation.z = -0.08;
          character.head.rotation.z = -0.24;
          character.rightArm.rotation.z = -0.5;
          character.rightArm.position.x = 0.36;
          character.rightArm.position.y = 1.42;
          break;
        case "point":
          character.rightArm.rotation.x = Math.PI / 2;
          character.rightArm.rotation.z = -0.18;
          character.rightArm.position = new Vector3(0.42, 1.28, -0.28);
          character.head.rotation.y = -0.16;
          break;
        case "present":
          character.leftArm.rotation.z = 0.92;
          character.rightArm.rotation.z = -0.92;
          character.leftArm.position.y = 1.26;
          character.rightArm.position.y = 1.26;
          character.root.rotation.y += character.id === "rei" ? -0.12 : 0.12;
          break;
        case "idle":
          character.leftArm.rotation.z = 0.08 + Math.sin(seconds * 2) * 0.04;
          character.rightArm.rotation.z = -0.08 - Math.sin(seconds * 2) * 0.04;
          break;
      }
    });
    this.glbCharacters.forEach((character) => {
      character.root.position.y = character.basePosition.y;
      character.root.scaling.setAll(character.runtimeState === "speaking" ? 1.26 : 1.22);
      character.contentRoot.rotation.z = 0;
    });
  }

  private resetPose(character: DummyCharacter): void {
    character.root.rotation.set(0, character.root.rotation.y, 0);
    character.head.rotation.set(0, 0, 0);
    character.body.rotation.set(0, 0, 0);
    character.leftArm.position = new Vector3(-0.46, 1.15, 0);
    character.rightArm.position = new Vector3(0.46, 1.15, 0);
    character.leftArm.rotation.set(0, 0.1, 0.12);
    character.rightArm.rotation.set(0, -0.1, -0.12);
    character.leftLeg.rotation.set(0, 0, 0.04);
    character.rightLeg.rotation.set(0, 0, -0.04);
  }
}
