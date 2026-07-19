import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from "@babylonjs/core";

export type CharacterMotionName = "idle" | "wave" | "think" | "point" | "present";

export class CharacterController {
  private readonly root: TransformNode;
  private readonly head: Mesh;
  private readonly body: Mesh;
  private readonly leftArm: Mesh;
  private readonly rightArm: Mesh;
  private readonly leftLeg: Mesh;
  private readonly rightLeg: Mesh;
  private motion: CharacterMotionName = "idle";

  constructor(private readonly scene: Scene) {
    const skin = new StandardMaterial("dummyCharacterSkin", scene);
    skin.diffuseColor = Color3.FromHexString("#f6d7b0");

    const suit = new StandardMaterial("dummyCharacterSuit", scene);
    suit.diffuseColor = Color3.FromHexString("#3d7bd9");
    suit.specularColor = Color3.FromHexString("#9ab7dd");

    const limb = new StandardMaterial("dummyCharacterLimbs", scene);
    limb.diffuseColor = Color3.FromHexString("#26324a");

    this.root = new TransformNode("characterRoot", scene);
    this.root.position = new Vector3(-0.65, 0.16, -0.15);

    this.body = MeshBuilder.CreateCapsule("characterBody", { height: 1.25, radius: 0.34 }, scene);
    this.body.position.y = 0.94;
    this.body.material = suit;
    this.body.parent = this.root;

    this.head = MeshBuilder.CreateSphere("characterHead", { diameter: 0.58, segments: 32 }, scene);
    this.head.position.y = 1.72;
    this.head.material = skin;
    this.head.parent = this.root;

    this.leftArm = this.createLimb("leftArm", new Vector3(-0.46, 1.15, 0), limb);
    this.rightArm = this.createLimb("rightArm", new Vector3(0.46, 1.15, 0), limb);
    this.leftLeg = this.createLimb("leftLeg", new Vector3(-0.18, 0.32, 0), limb);
    this.rightLeg = this.createLimb("rightLeg", new Vector3(0.18, 0.32, 0), limb);

    scene.onBeforeRenderObservable.add(() => this.animate());
  }

  playMotion(motion: CharacterMotionName): void {
    this.motion = motion;
  }

  private createLimb(name: string, position: Vector3, material: StandardMaterial): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { width: 0.14, height: 0.72, depth: 0.16 }, this.scene);
    mesh.position = position;
    mesh.material = material;
    mesh.parent = this.root;
    return mesh;
  }

  private animate(): void {
    const seconds = performance.now() / 1000;
    this.resetPose();

    this.root.position.y = 0.16 + Math.sin(seconds * 2.2) * 0.035;

    switch (this.motion) {
      case "wave":
        this.rightArm.rotation.z = -1.55 + Math.sin(seconds * 8) * 0.45;
        this.rightArm.position.y = 1.42;
        this.head.rotation.z = Math.sin(seconds * 2.8) * 0.08;
        break;
      case "think":
        this.root.rotation.z = -0.08;
        this.head.rotation.z = -0.24;
        this.rightArm.rotation.z = -0.5;
        this.rightArm.position.x = 0.36;
        this.rightArm.position.y = 1.42;
        break;
      case "point":
        this.rightArm.rotation.x = Math.PI / 2;
        this.rightArm.rotation.z = -0.18;
        this.rightArm.position = new Vector3(0.42, 1.28, -0.28);
        this.head.rotation.y = -0.16;
        break;
      case "present":
        this.leftArm.rotation.z = 0.92;
        this.rightArm.rotation.z = -0.92;
        this.leftArm.position.y = 1.26;
        this.rightArm.position.y = 1.26;
        this.root.rotation.y = -0.18;
        break;
      case "idle":
        this.leftArm.rotation.z = 0.08 + Math.sin(seconds * 2) * 0.04;
        this.rightArm.rotation.z = -0.08 - Math.sin(seconds * 2) * 0.04;
        break;
    }
  }

  private resetPose(): void {
    this.root.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.body.rotation.set(0, 0, 0);
    this.leftArm.position = new Vector3(-0.46, 1.15, 0);
    this.rightArm.position = new Vector3(0.46, 1.15, 0);
    this.leftArm.rotation.set(0, 0.1, 0.12);
    this.rightArm.rotation.set(0, -0.1, -0.12);
    this.leftLeg.rotation.set(0, 0, 0.04);
    this.rightLeg.rotation.set(0, 0, -0.04);
  }
}
