import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3
} from "@babylonjs/core";

export type StageElements = {
  floorMaterial: StandardMaterial;
  backdropMaterial: StandardMaterial;
  accentMaterial: StandardMaterial;
  centerOrb: Mesh;
};

export function createStage(scene: Scene): StageElements {
  const floorMaterial = new StandardMaterial("stageFloorMaterial", scene);
  floorMaterial.diffuseColor = Color3.FromHexString("#222733");
  floorMaterial.specularColor = Color3.FromHexString("#4c5568");

  const backdropMaterial = new StandardMaterial("stageBackdropMaterial", scene);
  backdropMaterial.diffuseColor = Color3.FromHexString("#171b24");

  const accentMaterial = new StandardMaterial("stageAccentMaterial", scene);
  accentMaterial.diffuseColor = Color3.FromHexString("#8ec5ff");
  accentMaterial.emissiveColor = Color3.FromHexString("#274c66");

  const floor = MeshBuilder.CreateCylinder("stageFloor", { diameter: 7.2, height: 0.28, tessellation: 96 }, scene);
  floor.position.y = -0.14;
  floor.material = floorMaterial;

  const platform = MeshBuilder.CreateCylinder("stagePlatform", { diameter: 4.8, height: 0.16, tessellation: 96 }, scene);
  platform.position.y = 0.02;
  platform.material = accentMaterial;

  const backdrop = MeshBuilder.CreateBox("stageBackdrop", { width: 9, height: 4.4, depth: 0.18 }, scene);
  backdrop.position = new Vector3(0, 2.05, 2.2);
  backdrop.material = backdropMaterial;

  const centerOrb = MeshBuilder.CreateSphere("centerIdeaOrb", { diameter: 0.72, segments: 24 }, scene);
  centerOrb.position = new Vector3(1.35, 1.45, 0.25);
  centerOrb.material = accentMaterial;

  for (let index = 0; index < 16; index += 1) {
    const ring = MeshBuilder.CreateTorus(
      `stageRing${index}`,
      { diameter: 1.2 + index * 0.36, thickness: 0.01, tessellation: 96 },
      scene
    );
    ring.position.y = 0.115 + index * 0.001;
    ring.material = accentMaterial;
  }

  return {
    floorMaterial,
    backdropMaterial,
    accentMaterial,
    centerOrb
  };
}
