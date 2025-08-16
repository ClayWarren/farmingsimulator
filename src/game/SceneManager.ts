import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  Vector3,
  SceneLoader,
  Mesh,
} from '@babylonjs/core';

import { FarmExpansionSystem, LandPlot } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';

export class SceneManager {
  private scene: Scene;
  private farmExpansionSystem: FarmExpansionSystem;
  private buildingSystem: BuildingSystem;
  private placedBuildingMeshes: Mesh[] = [];

  constructor(scene: Scene, farmExpansionSystem: FarmExpansionSystem, buildingSystem: BuildingSystem) {
    this.scene = scene;
    this.farmExpansionSystem = farmExpansionSystem;
    this.buildingSystem = buildingSystem;
  }

  initialize(): void {
    this.createTerrain();
    this.createSkybox();
    this.createPlotVisuals();
    this.refreshPlacedBuildings();
  }

  refreshPlacedBuildings(): void {
    // Dispose of old building meshes
    this.placedBuildingMeshes.forEach(mesh => mesh.dispose());
    this.placedBuildingMeshes = [];

    // Create new meshes for all placed buildings
    const placedBuildings = this.buildingSystem.getPlacedBuildings();
    placedBuildings.forEach(async placedBuilding => {
      const buildingData = this.buildingSystem.getBuilding(placedBuilding.id);
      if (buildingData) {
        try {
          const assets = await SceneLoader.LoadAssetContainerAsync(
            buildingData.modelName, // Path to the model file
            '', // Root URL (empty if modelName is full path)
            this.scene
          );

          // Add all meshes from the loaded assets to the scene
          assets.addAllToScene();

          // Position and rotate the loaded meshes
          assets.meshes.forEach(mesh => {
            mesh.position = placedBuilding.position;
            mesh.rotation = placedBuilding.rotation;
            // Adjust scale if necessary, models might have different scales
            mesh.scaling = new Vector3(0.5, 0.5, 0.5); // Example scale
            this.placedBuildingMeshes.push(mesh as Mesh);
          });
        } catch (error) {
          console.error(`Failed to load building model ${buildingData.modelName}:`, error);
          // Fallback to a simple box if model loading fails
          const buildingMesh = MeshBuilder.CreateBox(`placed_building_${placedBuilding.id}_${placedBuilding.position.x}_${placedBuilding.position.z}`, { size: 2 }, this.scene);
          buildingMesh.position = placedBuilding.position;
          buildingMesh.rotation = placedBuilding.rotation;
          const material = new StandardMaterial('placedBuildingMaterial', this.scene);
          material.diffuseColor = Color3.Red(); // Indicate error
          buildingMesh.material = material;
          this.placedBuildingMeshes.push(buildingMesh);
        }
      }
    });
  }

  private createTerrain(): void {
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: 200,
        height: 200,
        subdivisions: 50,
      },
      this.scene
    );

    const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
    groundMaterial.diffuseColor = Color3.FromHexString('#8B4513');
    groundMaterial.specularColor = Color3.FromHexString('#2F4F2F');

    try {
      groundMaterial.diffuseTexture = new Texture(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        this.scene
      );
    } catch {
      console.warn('Could not load ground texture, using solid color');
    }

    ground.material = groundMaterial;
    ground.position.y = 0;

    this.createFields();
  }

  private createFields(): void {
    const fieldPositions = [
      { x: -50, z: -50 },
      { x: 50, z: -50 },
      { x: -50, z: 50 },
      { x: 50, z: 50 },
    ];

    fieldPositions.forEach((pos, index) => {
      const field = MeshBuilder.CreateGround(
        `field_${index}`,
        {
          width: 40,
          height: 40,
          subdivisions: 10,
        },
        this.scene
      );

      const fieldMaterial = new StandardMaterial(
        `fieldMaterial_${index}`,
        this.scene
      );
      fieldMaterial.diffuseColor = Color3.FromHexString('#654321');
      fieldMaterial.emissiveColor = Color3.FromHexString('#2F1B14');

      field.material = fieldMaterial;
      field.position = new Vector3(pos.x, 0.1, pos.z);
    });
  }

  private createSkybox(): void {
    const skybox = MeshBuilder.CreateSphere(
      'skyBox',
      { diameter: 500 },
      this.scene
    );
    const skyboxMaterial = new StandardMaterial('skyBox', this.scene);

    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.diffuseColor = Color3.FromHexString('#87CEEB');
    skyboxMaterial.emissiveColor = Color3.FromHexString('#4682B4');

    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
  }

  private createPlotVisuals(): void {
    const plots = this.farmExpansionSystem.getPlots();
    plots.forEach(plot => {
      if (plot.isOwned) {
        this.createFenceForPlot(plot);
      } else {
        this.createForSaleSign(plot);
      }
    });
  }

  private createForSaleSign(plot: LandPlot): void {
    const sign = MeshBuilder.CreatePlane(`for_sale_sign_${plot.id}`, { width: 4, height: 3 }, this.scene);
    sign.position = plot.bounds.center.clone();
    sign.position.y = 1.5;

    const signMaterial = new StandardMaterial(`for_sale_sign_material_${plot.id}`, this.scene);
    const signTexture = new Texture(`https://placehold.co/400x300/000000/FFFFFF/png?text=For+Sale\n${plot.name}\n${plot.price.toLocaleString()}`, this.scene);
    signMaterial.diffuseTexture = signTexture;
    sign.material = signMaterial;
  }

  private createFenceForPlot(plot: LandPlot): void {
    const bounds = plot.bounds;
    const fenceHeight = 1.5;
    const fencePositions = [
      new Vector3(bounds.minimum.x, fenceHeight / 2, bounds.minimum.z),
      new Vector3(bounds.maximum.x, fenceHeight / 2, bounds.minimum.z),
      new Vector3(bounds.maximum.x, fenceHeight / 2, bounds.maximum.z),
      new Vector3(bounds.minimum.x, fenceHeight / 2, bounds.maximum.z),
    ];

    for (let i = 0; i < fencePositions.length; i++) {
      const start = fencePositions[i];
      const end = fencePositions[(i + 1) % fencePositions.length];
      const fence = MeshBuilder.CreateBox(`fence_${plot.id}_${i}`, { width: Vector3.Distance(start, end), height: fenceHeight, depth: 0.2 }, this.scene);
      fence.position = Vector3.Center(start, end);
      fence.lookAt(end);
      const fenceMaterial = new StandardMaterial(`fence_material_${plot.id}_${i}`, this.scene);
      fenceMaterial.diffuseColor = new Color3(0.5, 0.3, 0.1);
      fence.material = fenceMaterial;
    }
  }

  getScene(): Scene {
    return this.scene;
  }
}
