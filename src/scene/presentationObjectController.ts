import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from "@babylonjs/core";
import type { PresentationObjectInstruction, PresentationObjectPart } from "../assets/types";

type ObjectPartMesh = {
  part: PresentationObjectPart;
  mesh: Mesh;
  basePosition: Vector3;
  material: StandardMaterial;
};

export class PresentationObjectController {
  private readonly root: TransformNode;
  private readonly parts = new Map<string, ObjectPartMesh>();
  private activeInstruction: PresentationObjectInstruction | null = null;
  private isVisible = false;
  private rotationEnabled = false;
  private explodeAmount = 0;

  constructor(private readonly scene: Scene) {
    this.root = new TransformNode("presentationObjectRoot", scene);
    this.root.position = new Vector3(-1.45, 0.42, 0.8);
    this.root.scaling.setAll(0.74);
    scene.onBeforeRenderObservable.add(() => this.animate());
  }

  applyInstruction(instruction: PresentationObjectInstruction | null): void {
    if (!instruction) {
      this.setVisible(false);
      this.activeInstruction = null;
      return;
    }

    this.activeInstruction = instruction;
    this.ensureObjectParts(instruction.parts);

    switch (instruction.action) {
      case "hide":
        this.setVisible(false);
        this.rotationEnabled = false;
        this.explodeAmount = 0;
        break;
      case "rotate":
        this.setVisible(true);
        this.rotationEnabled = true;
        this.explodeAmount = 0;
        break;
      case "highlight_part":
      case "focus_part":
        this.setVisible(true);
        this.rotationEnabled = false;
        this.explodeAmount = instruction.action === "focus_part" ? 0.2 : 0;
        break;
      case "explode":
        this.setVisible(true);
        this.rotationEnabled = true;
        this.explodeAmount = 0.62;
        break;
      case "show":
        this.setVisible(true);
        this.rotationEnabled = false;
        this.explodeAmount = 0;
        break;
    }

    this.updatePartEmphasis(instruction.activePartId);
  }

  getDebugLabel(): string | null {
    if (!this.activeInstruction || !this.isVisible) {
      return null;
    }

    const activePart = this.activeInstruction.parts.find((part) => part.id === this.activeInstruction?.activePartId);
    return activePart ? `${this.activeInstruction.label}: ${activePart.label}` : this.activeInstruction.label;
  }

  private ensureObjectParts(parts: PresentationObjectPart[]): void {
    if (this.parts.size > 0) {
      return;
    }

    const positions = [
      new Vector3(-0.7, 0.82, 0),
      new Vector3(0, 0.82, 0),
      new Vector3(0.7, 0.82, 0),
      new Vector3(0, 0.25, 0)
    ];
    parts.forEach((part, index) => {
      const material = new StandardMaterial(`${part.id}ObjectMaterial`, this.scene);
      material.diffuseColor = Color3.FromHexString(part.color);
      material.emissiveColor = Color3.FromHexString(part.color).scale(0.22);

      const mesh = MeshBuilder.CreateBox(
        `${part.id}ObjectPart`,
        { width: index === 3 ? 1.7 : 0.56, height: 0.34, depth: 0.42 },
        this.scene
      );
      const basePosition = positions[index] ?? new Vector3(index * 0.5, 0.5, 0);
      mesh.position = basePosition.clone();
      mesh.material = material;
      mesh.parent = this.root;
      mesh.isVisible = false;
      this.parts.set(part.id, { part, mesh, basePosition, material });
    });
  }

  private setVisible(isVisible: boolean): void {
    this.isVisible = isVisible;
    this.parts.forEach(({ mesh }) => {
      mesh.isVisible = isVisible;
    });
  }

  private updatePartEmphasis(activePartId: string | null): void {
    this.parts.forEach((partMesh, partId) => {
      const isActive = activePartId === null || activePartId === partId;
      partMesh.mesh.scaling.setAll(isActive ? 1 : 0.82);
      partMesh.material.alpha = isActive ? 1 : 0.38;
      partMesh.mesh.position = this.getPartTargetPosition(partMesh, isActive);
    });
  }

  private getPartTargetPosition(partMesh: ObjectPartMesh, isActive: boolean): Vector3 {
    const position = partMesh.basePosition.clone();
    if (this.explodeAmount > 0) {
      position.x += Math.sign(position.x || 0.1) * this.explodeAmount;
      position.y += isActive ? 0.12 : -0.08;
    }
    return position;
  }

  private animate(): void {
    if (!this.isVisible) {
      return;
    }

    const seconds = performance.now() / 1000;
    this.root.rotation.y += this.rotationEnabled ? 0.012 : 0.003;
    this.root.position.y = 0.42 + Math.sin(seconds * 1.4) * 0.035;
  }
}
