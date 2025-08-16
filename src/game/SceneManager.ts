import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Texture,
  Vector3,
  Mesh,
  DirectionalLight,
  ShadowGenerator,
  GroundMesh,
  DynamicTexture,
  ImageProcessingConfiguration,
} from '@babylonjs/core';

import { FarmExpansionSystem, LandPlot } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';

export class SceneManager {
  private scene: Scene;
  private farmExpansionSystem: FarmExpansionSystem;
  private buildingSystem: BuildingSystem;
  private placedBuildingMeshes: Mesh[] = [];
  private shadowGenerator?: ShadowGenerator;

  constructor(scene: Scene, farmExpansionSystem: FarmExpansionSystem, buildingSystem: BuildingSystem) {
    this.scene = scene;
    this.farmExpansionSystem = farmExpansionSystem;
    this.buildingSystem = buildingSystem;
  }

  initialize(): void {
    this.setupLighting();
    this.createTerrain();
    this.createSkybox();
    this.addEnvironmentalDetails();
    this.createPlotVisuals();
    this.refreshPlacedBuildings();
  }

  refreshPlacedBuildings(): void {
    // Dispose of old building meshes
    this.placedBuildingMeshes.forEach(mesh => mesh.dispose());
    this.placedBuildingMeshes = [];

    // Create new meshes for all placed buildings
    const placedBuildings = this.buildingSystem.getPlacedBuildings();
    placedBuildings.forEach(placedBuilding => {
      const buildingData = this.buildingSystem.getBuilding(placedBuilding.id);
      if (buildingData) {
        const buildingMesh = this.createBuildingMesh(buildingData, placedBuilding.position, placedBuilding.rotation);
        if (buildingMesh) {
          this.placedBuildingMeshes.push(buildingMesh);
          
          // Add to shadow system
          if (this.shadowGenerator) {
            this.shadowGenerator.addShadowCaster(buildingMesh);
          }
          buildingMesh.receiveShadows = true;
        }
      }
    });
  }

  private setupLighting(): void {
    // Remove default light from Game.ts and create better lighting here
    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.3), this.scene);
    sun.intensity = 3.0;
    sun.diffuse = Color3.FromHexString('#FFF8DC');
    sun.specular = Color3.FromHexString('#FFFAF0');
    
    // Enable shadows
    this.shadowGenerator = new ShadowGenerator(2048, sun);
    this.shadowGenerator.bias = 0.001;
    this.shadowGenerator.normalBias = 0.02;
    this.shadowGenerator.useCloseExponentialShadowMap = true;
    
    // Set up tone mapping for more realistic lighting
    this.scene.imageProcessingConfiguration.exposure = 1.2;
    this.scene.imageProcessingConfiguration.contrast = 1.1;
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  }

  private createTerrain(): void {
    // Create main terrain with higher subdivision for better detail
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: 400,
        height: 400,
        subdivisions: 100,
      },
      this.scene
    ) as GroundMesh;

    // Create realistic PBR ground material
    const groundMaterial = new PBRMaterial('groundMaterial', this.scene);
    
    // Create procedural grass texture
    const grassTexture = this.createGrassTexture();
    groundMaterial.albedoTexture = grassTexture;
    
    // PBR properties for realistic grass
    groundMaterial.albedoColor = Color3.FromHexString('#4A7C59');
    groundMaterial.roughness = 0.9;
    groundMaterial.metallic = 0.0;
    
    // Add normal map for grass detail
    const normalTexture = this.createGrassNormalTexture();
    groundMaterial.bumpTexture = normalTexture;
    
    ground.material = groundMaterial;
    ground.position.y = 0;
    ground.receiveShadows = true;

    // Add ground to shadow casters
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(ground);
    }

    this.createFields();
  }

  private createGrassTexture(): DynamicTexture {
    const texture = new DynamicTexture('grassTexture', { width: 512, height: 512 }, this.scene);
    const context = texture.getContext();
    
    // Create grass-like pattern
    context.fillStyle = '#4A7C59';
    context.fillRect(0, 0, 512, 512);
    
    // Add variation with darker green patches
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 8 + 2;
      context.fillStyle = `rgba(${60 + Math.random() * 40}, ${90 + Math.random() * 40}, ${45 + Math.random() * 20}, 0.6)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 20;
    texture.vScale = 20;
    
    return texture;
  }

  private createGrassNormalTexture(): DynamicTexture {
    const texture = new DynamicTexture('grassNormal', { width: 256, height: 256 }, this.scene);
    const context = texture.getContext();
    
    // Create subtle normal map for grass detail
    context.fillStyle = '#8080FF'; // Neutral normal (128, 128, 255)
    context.fillRect(0, 0, 256, 256);
    
    // Add some variation
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 4 + 1;
      context.fillStyle = `rgba(${120 + Math.random() * 20}, ${120 + Math.random() * 20}, 255, 0.3)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 20;
    texture.vScale = 20;
    
    return texture;
  }

  private createFields(): void {
    const fieldPositions = [
      { x: -60, z: -60 },
      { x: 60, z: -60 },
      { x: -60, z: 60 },
      { x: 60, z: 60 },
      { x: 0, z: -60 },
      { x: 0, z: 60 },
    ];

    fieldPositions.forEach((pos, index) => {
      const field = MeshBuilder.CreateGround(
        `field_${index}`,
        {
          width: 50,
          height: 50,
          subdivisions: 20,
        },
        this.scene
      );

      // Create PBR material for soil fields
      const fieldMaterial = new PBRMaterial(`fieldMaterial_${index}`, this.scene);
      
      // Create soil texture
      const soilTexture = this.createSoilTexture();
      fieldMaterial.albedoTexture = soilTexture;
      
      fieldMaterial.albedoColor = Color3.FromHexString('#8B4513');
      fieldMaterial.roughness = 0.8;
      fieldMaterial.metallic = 0.0;

      field.material = fieldMaterial;
      field.position = new Vector3(pos.x, 0.05, pos.z);
      field.receiveShadows = true;
      
      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(field);
      }
    });
  }

  private createSoilTexture(): DynamicTexture {
    const texture = new DynamicTexture('soilTexture', { width: 256, height: 256 }, this.scene);
    const context = texture.getContext();
    
    // Base soil color
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, 256, 256);
    
    // Add soil variation
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 3 + 1;
      const brightness = Math.random() * 60 + 80;
      context.fillStyle = `rgba(${brightness}, ${brightness * 0.6}, ${brightness * 0.3}, 0.4)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 10;
    texture.vScale = 10;
    
    return texture;
  }

  private createSkybox(): void {
    const skybox = MeshBuilder.CreateSphere(
      'skyBox',
      { diameter: 1000 },
      this.scene
    );
    
    const skyboxMaterial = new PBRMaterial('skyBoxMaterial', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    
    // Create gradient sky texture
    const skyTexture = this.createSkyTexture();
    skyboxMaterial.emissiveTexture = skyTexture;
    skyboxMaterial.emissiveColor = Color3.White();

    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
  }

  private createSkyTexture(): DynamicTexture {
    const texture = new DynamicTexture('skyTexture', { width: 1024, height: 512 }, this.scene);
    const context = texture.getContext();
    
    // Create gradient from horizon to zenith
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue at horizon
    gradient.addColorStop(0.3, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.7, '#4682B4'); // Steel blue
    gradient.addColorStop(1, '#191970'); // Midnight blue at zenith
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 512);
    
    // Add some cloud-like noise
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 300 + 100; // Clouds in middle area
      const size = Math.random() * 100 + 30;
      context.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.3})`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    texture.update();
    return texture;
  }

  private addEnvironmentalDetails(): void {
    // Add trees around the perimeter
    this.createTrees();
    
    // Add some rocks and environmental clutter
    this.createEnvironmentalClutter();
  }

  private createTrees(): void {
    const treePositions = [
      { x: -180, z: -180 }, { x: -150, z: -190 }, { x: -120, z: -180 },
      { x: 180, z: -180 }, { x: 150, z: -190 }, { x: 120, z: -180 },
      { x: -180, z: 180 }, { x: -150, z: 190 }, { x: -120, z: 180 },
      { x: 180, z: 180 }, { x: 150, z: 190 }, { x: 120, z: 180 },
      { x: -190, z: -50 }, { x: -190, z: 0 }, { x: -190, z: 50 },
      { x: 190, z: -50 }, { x: 190, z: 0 }, { x: 190, z: 50 },
    ];

    treePositions.forEach((pos, index) => {
      this.createTree(pos.x, pos.z, index);
    });
  }

  private createTree(x: number, z: number, index: number): void {
    // Create trunk
    const trunk = MeshBuilder.CreateCylinder(
      `treeTrunk_${index}`,
      { height: 8 + Math.random() * 4, diameterTop: 0.8, diameterBottom: 1.2 },
      this.scene
    );
    
    const trunkMaterial = new PBRMaterial(`trunkMaterial_${index}`, this.scene);
    trunkMaterial.albedoColor = Color3.FromHexString('#8B4513');
    trunkMaterial.roughness = 0.9;
    trunkMaterial.metallic = 0.0;
    
    trunk.material = trunkMaterial;
    trunk.position = new Vector3(x, 4, z);
    trunk.receiveShadows = true;
    
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(trunk);
    }

    // Create foliage
    const foliage = MeshBuilder.CreateSphere(
      `treeFoliage_${index}`,
      { diameter: 8 + Math.random() * 4 },
      this.scene
    );
    
    const foliageMaterial = new PBRMaterial(`foliageMaterial_${index}`, this.scene);
    foliageMaterial.albedoColor = Color3.FromHexString('#228B22');
    foliageMaterial.roughness = 0.8;
    foliageMaterial.metallic = 0.0;
    
    foliage.material = foliageMaterial;
    foliage.position = new Vector3(x, 8 + Math.random() * 2, z);
    foliage.receiveShadows = true;
    
    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(foliage);
    }
  }

  private createEnvironmentalClutter(): void {
    // Add some rocks
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      
      // Avoid placing rocks on fields
      if (Math.abs(x) < 80 && Math.abs(z) < 80) continue;
      
      const rock = MeshBuilder.CreateSphere(
        `rock_${i}`,
        { diameter: 1 + Math.random() * 2 },
        this.scene
      );
      
      const rockMaterial = new PBRMaterial(`rockMaterial_${i}`, this.scene);
      rockMaterial.albedoColor = Color3.FromHexString('#696969');
      rockMaterial.roughness = 0.9;
      rockMaterial.metallic = 0.1;
      
      rock.material = rockMaterial;
      rock.position = new Vector3(x, 0.5, z);
      rock.scaling = new Vector3(1, 0.6, 1); // Flatten slightly
      rock.receiveShadows = true;
      
      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(rock);
      }
    }
  }

  private createBuildingMesh(buildingData: any, position: Vector3, rotation: Vector3): Mesh | null {
    let buildingMesh: Mesh;

    switch (buildingData.id) {
      case 'wooden_fence':
        buildingMesh = this.createWoodenFence(buildingData, position);
        break;
      case 'small_shed':
        buildingMesh = this.createSmallShed(buildingData, position);
        break;
      case 'small_silo':
        buildingMesh = this.createSmallSilo(buildingData, position);
        break;
      case 'large_silo':
        buildingMesh = this.createLargeSilo(buildingData, position);
        break;
      default:
        buildingMesh = this.createDefaultBuilding(buildingData, position);
    }

    buildingMesh.rotation = rotation;
    return buildingMesh;
  }

  private createWoodenFence(_buildingData: any, position: Vector3): Mesh {
    // Create fence post
    const post = MeshBuilder.CreateBox(
      `fence_post_${position.x}_${position.z}`,
      { width: 0.2, height: 2, depth: 0.2 },
      this.scene
    );
    
    // Create fence panels
    const panel1 = MeshBuilder.CreateBox(
      `fence_panel1_${position.x}_${position.z}`,
      { width: 1.8, height: 0.15, depth: 0.05 },
      this.scene
    );
    panel1.position.y = 0.6;
    
    const panel2 = MeshBuilder.CreateBox(
      `fence_panel2_${position.x}_${position.z}`,
      { width: 1.8, height: 0.15, depth: 0.05 },
      this.scene
    );
    panel2.position.y = 1.2;

    // Merge into single mesh
    const fence = Mesh.MergeMeshes([post, panel1, panel2], true, true);
    
    if (fence) {
      const fenceMaterial = new PBRMaterial(`fence_material_${position.x}_${position.z}`, this.scene);
      
      // Create wood texture
      const woodTexture = this.createWoodTexture();
      fenceMaterial.albedoTexture = woodTexture;
      fenceMaterial.albedoColor = Color3.FromHexString('#8B4513');
      fenceMaterial.roughness = 0.8;
      fenceMaterial.metallic = 0.0;
      
      fence.material = fenceMaterial;
      fence.position = position;
    }

    return fence!;
  }

  private createSmallShed(_buildingData: any, position: Vector3): Mesh {
    // Create walls
    const walls = MeshBuilder.CreateBox(
      `shed_walls_${position.x}_${position.z}`,
      { width: 5, height: 3, depth: 5 },
      this.scene
    );
    
    // Create roof
    const roof = MeshBuilder.CreateBox(
      `shed_roof_${position.x}_${position.z}`,
      { width: 5.5, height: 0.3, depth: 5.5 },
      this.scene
    );
    roof.position.y = 1.8;
    
    // Create door frame
    const doorFrame = MeshBuilder.CreateBox(
      `shed_door_${position.x}_${position.z}`,
      { width: 1.2, height: 2.2, depth: 0.1 },
      this.scene
    );
    doorFrame.position.y = -0.4;
    doorFrame.position.z = 2.5;

    // Merge into single mesh
    const shed = Mesh.MergeMeshes([walls, roof, doorFrame], true, true);
    
    if (shed) {
      const shedMaterial = new PBRMaterial(`shed_material_${position.x}_${position.z}`, this.scene);
      
      // Create wood texture for shed
      const woodTexture = this.createWoodTexture();
      shedMaterial.albedoTexture = woodTexture;
      shedMaterial.albedoColor = Color3.FromHexString('#654321');
      shedMaterial.roughness = 0.7;
      shedMaterial.metallic = 0.0;
      
      shed.material = shedMaterial;
      shed.position = position;
      shed.position.y = 1.5; // Lift off ground
    }

    return shed!;
  }

  private createSmallSilo(_buildingData: any, position: Vector3): Mesh {
    // Create main cylinder
    const body = MeshBuilder.CreateCylinder(
      `silo_body_${position.x}_${position.z}`,
      { height: 8, diameter: 4 },
      this.scene
    );
    
    // Create conical top
    const top = MeshBuilder.CreateCylinder(
      `silo_top_${position.x}_${position.z}`,
      { height: 2, diameterTop: 0.5, diameterBottom: 4 },
      this.scene
    );
    top.position.y = 5;

    // Merge into single mesh
    const silo = Mesh.MergeMeshes([body, top], true, true);
    
    if (silo) {
      const siloMaterial = new PBRMaterial(`silo_material_${position.x}_${position.z}`, this.scene);
      
      // Create metal texture
      const metalTexture = this.createMetalTexture();
      siloMaterial.albedoTexture = metalTexture;
      siloMaterial.albedoColor = Color3.FromHexString('#C0C0C0');
      siloMaterial.roughness = 0.3;
      siloMaterial.metallic = 0.8;
      
      silo.material = siloMaterial;
      silo.position = position;
      silo.position.y = 4; // Lift off ground
    }

    return silo!;
  }

  private createLargeSilo(_buildingData: any, position: Vector3): Mesh {
    // Create main cylinder
    const body = MeshBuilder.CreateCylinder(
      `large_silo_body_${position.x}_${position.z}`,
      { height: 15, diameter: 8 },
      this.scene
    );
    
    // Create conical top
    const top = MeshBuilder.CreateCylinder(
      `large_silo_top_${position.x}_${position.z}`,
      { height: 3, diameterTop: 1, diameterBottom: 8 },
      this.scene
    );
    top.position.y = 9;

    // Create ladder
    const ladder = MeshBuilder.CreateBox(
      `large_silo_ladder_${position.x}_${position.z}`,
      { width: 0.3, height: 12, depth: 0.1 },
      this.scene
    );
    ladder.position.z = 4.1;

    // Merge into single mesh
    const largeSilo = Mesh.MergeMeshes([body, top, ladder], true, true);
    
    if (largeSilo) {
      const siloMaterial = new PBRMaterial(`large_silo_material_${position.x}_${position.z}`, this.scene);
      
      // Create metal texture
      const metalTexture = this.createMetalTexture();
      siloMaterial.albedoTexture = metalTexture;
      siloMaterial.albedoColor = Color3.FromHexString('#B0B0B0');
      siloMaterial.roughness = 0.2;
      siloMaterial.metallic = 0.9;
      
      largeSilo.material = siloMaterial;
      largeSilo.position = position;
      largeSilo.position.y = 7.5; // Lift off ground
    }

    return largeSilo!;
  }

  private createDefaultBuilding(buildingData: any, position: Vector3): Mesh {
    const building = MeshBuilder.CreateBox(
      `building_${buildingData.id}_${position.x}_${position.z}`,
      { width: buildingData.dimensions.x, height: buildingData.dimensions.y, depth: buildingData.dimensions.z },
      this.scene
    );
    
    const material = new PBRMaterial(`building_material_${buildingData.id}_${position.x}_${position.z}`, this.scene);
    material.albedoColor = Color3.FromHexString('#8B4513');
    material.roughness = 0.8;
    material.metallic = 0.0;
    
    building.material = material;
    building.position = position;
    building.position.y = buildingData.dimensions.y / 2;
    
    return building;
  }

  private createWoodTexture(): DynamicTexture {
    const texture = new DynamicTexture('woodTexture', { width: 256, height: 256 }, this.scene);
    const context = texture.getContext();
    
    // Base wood color
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, 256, 256);
    
    // Add wood grain lines
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      const shade = Math.random() * 40 + 100;
      context.fillStyle = `rgba(${shade}, ${shade * 0.6}, ${shade * 0.3}, 0.3)`;
      context.fillRect(0, y, 256, 2 + Math.random() * 3);
    }
    
    // Add vertical grain
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const height = Math.random() * 50 + 10;
      const shade = Math.random() * 30 + 80;
      context.fillStyle = `rgba(${shade}, ${shade * 0.7}, ${shade * 0.4}, 0.2)`;
      context.fillRect(x, y, 1, height);
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    
    return texture;
  }

  private createMetalTexture(): DynamicTexture {
    const texture = new DynamicTexture('metalTexture', { width: 256, height: 256 }, this.scene);
    const context = texture.getContext();
    
    // Base metal color
    context.fillStyle = '#C0C0C0';
    context.fillRect(0, 0, 256, 256);
    
    // Add metal scratches and variation
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const length = Math.random() * 20 + 5;
      const brightness = Math.random() * 50 + 150;
      context.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.4)`;
      context.lineWidth = 0.5;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + length, y + Math.random() * 5 - 2.5);
      context.stroke();
    }
    
    // Add horizontal rivets/panels
    for (let i = 0; i < 8; i++) {
      const y = (i * 32) + 16;
      context.strokeStyle = 'rgba(160, 160, 160, 0.6)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y);
      context.stroke();
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    
    return texture;
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
