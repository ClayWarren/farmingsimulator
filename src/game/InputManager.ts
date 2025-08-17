import { Scene, FreeCamera, Vector3, Ray, Mesh, StandardMaterial, Color3, MeshBuilder } from '@babylonjs/core';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { FarmExpansionSystem } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { LivestockSystem, AnimalType } from '../systems/LivestockSystem';
import { FieldStateSystem } from '../systems/FieldStateSystem';
import { AttachmentSystem } from '../systems/AttachmentSystem';
import { AudioManager } from '../audio/AudioManager';

export class InputManager {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private camera: FreeCamera;
  private cropSystem: CropSystem;
  private economySystem: EconomySystem;
  private vehicleSystem: VehicleSystem;
  private equipmentSystem: EquipmentSystem;
  private farmExpansionSystem: FarmExpansionSystem;
  private buildingSystem: BuildingSystem;
  private livestockSystem: LivestockSystem;
  private fieldStateSystem: FieldStateSystem;
  private attachmentSystem: AttachmentSystem;
  private audioManager: AudioManager;
  private keys: { [key: string]: boolean } = {};
  private moveSpeed = 20;
  private isPointerLocked = false;
  private currentCropType: CropType = 'wheat';
  private lastInteractionTime = 0;
  private isBuildMode: boolean = false;
  private onCropSelectionChange?: (cropType: CropType) => void;
  private onPause?: () => void;
  private onShop?: () => void;
  private onToggleBuildMode?: (isBuildMode: boolean) => void;
  private onBuildingPlaced?: () => void;
  private currentBuildingId?: string;
  private ghostMesh?: Mesh;
  private isAnimalMode: boolean = false;
  private currentAnimalType: AnimalType = 'chicken';

  constructor(
    scene: Scene,
    canvas: HTMLCanvasElement,
    cropSystem: CropSystem,
    economySystem: EconomySystem,
    vehicleSystem: VehicleSystem,
    equipmentSystem: EquipmentSystem,
    farmExpansionSystem: FarmExpansionSystem,
    buildingSystem: BuildingSystem,
    livestockSystem: LivestockSystem,
    fieldStateSystem: FieldStateSystem,
    attachmentSystem: AttachmentSystem,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.canvas = canvas;
    this.cropSystem = cropSystem;
    this.economySystem = economySystem;
    this.vehicleSystem = vehicleSystem;
    this.equipmentSystem = equipmentSystem;
    this.farmExpansionSystem = farmExpansionSystem;
    this.buildingSystem = buildingSystem;
    this.livestockSystem = livestockSystem;
    this.fieldStateSystem = fieldStateSystem;
    this.attachmentSystem = attachmentSystem;
    this.audioManager = audioManager;
    this.camera = scene.activeCamera as FreeCamera;
  }

  initialize(): void {
    this.setupKeyboardControls();
    this.setupMouseControls();
    this.setupActionManager();
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', event => {
      this.keys[event.code] = true;
    });

    window.addEventListener('keyup', event => {
      this.keys[event.code] = false;
    });
  }

  private setupMouseControls(): void {
    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', event => {
      if (this.isPointerLocked && this.camera) {
        const sensitivity = 0.002;
        this.camera.rotation.y += event.movementX * sensitivity;
        this.camera.rotation.x += event.movementY * sensitivity;

        this.camera.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.camera.rotation.x)
        );
      }
    });
  }

  private setupActionManager(): void {
    this.scene.onKeyboardObservable.add(kbInfo => {
      switch (kbInfo.event.code) {
        case 'Space':
          if (kbInfo.type === 1) {
            this.handleInteraction();
          }
          break;
        case 'KeyE':
          if (kbInfo.type === 1) {
            this.handleVehicleInteraction();
          }
          break;
        case 'KeyR':
          if (kbInfo.type === 1) {
            this.sellAllCrops();
          }
          break;
        case 'KeyP':
          if (kbInfo.type === 1) {
            if (this.onShop) {
              this.onShop();
            }
          }
          break;
        case 'KeyB':
          if (kbInfo.type === 1) {
            this.toggleBuildMode();
          }
          break;
        case 'KeyL':
          if (kbInfo.type === 1) {
            this.toggleAnimalMode();
          }
          break;
        case 'KeyF':
          if (kbInfo.type === 1) {
            this.feedAnimals();
          }
          break;
        case 'KeyC':
          if (kbInfo.type === 1) {
            this.collectProducts();
          }
          break;
        case 'Digit1':
          if (kbInfo.type === 1) {
            this.selectCrop('wheat');
          }
          break;
        case 'Digit2':
          if (kbInfo.type === 1) {
            this.selectCrop('corn');
          }
          break;
        case 'Digit3':
          if (kbInfo.type === 1) {
            this.selectCrop('potato');
          }
          break;
        case 'Digit4':
          if (kbInfo.type === 1) {
            this.selectCrop('carrot');
          }
          break;
        case 'KeyT':
          if (kbInfo.type === 1) {
            this.handleTilling();
          }
          break;
        case 'KeyQ':
          if (kbInfo.type === 1) {
            this.handleAttachmentSwitch();
          }
          break;
        case 'KeyZ':
          if (kbInfo.type === 1) {
            console.log('=== DEBUG: Listing attachment meshes ===');
            this.attachmentSystem.debugListAttachmentMeshes();
          }
          break;
        case 'Escape':
          if (kbInfo.type === 1) {
            if (this.isPointerLocked) {
              document.exitPointerLock();
            } else if (this.onPause) {
              this.onPause();
            }
          }
          break;
      }
    });
  }

  private handleInteraction(): void {
    if (this.isAnimalMode) {
      const pickInfo = this.getGroundPickInfo();
      if (!pickInfo || !pickInfo.hit || !pickInfo.pickedPoint) {
        console.log('Cannot place animal here (no ground picked).');
        return;
      }

      const snappedPosition = new Vector3(
        Math.round(pickInfo.pickedPoint.x / 2) * 2,
        0.1, // Slightly above ground
        Math.round(pickInfo.pickedPoint.z / 2) * 2
      );

      const success = this.livestockSystem.purchaseAnimal(this.currentAnimalType, snappedPosition);
      if (success) {
        this.audioManager.playSound('economy_buy');
        console.log(`Placed ${this.currentAnimalType} at position (${snappedPosition.x}, ${snappedPosition.z})`);
      }
      return;
    }

    if (this.isBuildMode) {
      const pickInfo = this.getGroundPickInfo();
      if (!pickInfo || !pickInfo.hit || !pickInfo.pickedPoint) {
        console.log('Cannot place building here (no ground picked).');
        return;
      }

      const snappedPosition = new Vector3(
        Math.round(pickInfo.pickedPoint.x / 2) * 2,
        0.05, // Slightly above ground
        Math.round(pickInfo.pickedPoint.z / 2) * 2
      );

      const building = this.buildingSystem.getBuilding(this.currentBuildingId!); // currentBuildingId is guaranteed to be set in build mode
      if (!building) {
        console.log('No building selected.');
        return;
      }

      const isValidPlacement =
        this.farmExpansionSystem.isPositionOnOwnedLand(snappedPosition) &&
        !this.buildingSystem.isPositionOccupied(snappedPosition, building.dimensions);

      if (isValidPlacement) {
        if (this.economySystem.getMoney() >= building.price) {
          this.economySystem.setMoney(this.economySystem.getMoney() - building.price);
          this.buildingSystem.placeBuilding(this.currentBuildingId!, snappedPosition, new Vector3(0, 0, 0)); // Fixed rotation for now
          this.audioManager.playSound('economy_buy');
          console.log(`Placed ${building.name} for ${building.price}`);
          // Trigger scene refresh for placed buildings
          if (this.onBuildingPlaced) {
            this.onBuildingPlaced();
          }
        } else {
          console.log('Not enough money to buy this building.');
        }
      } else {
        console.log('Cannot place building here (invalid location).');
      }
      return;
    }

    const pickInfo = this.getGroundPickInfo();
    if (!pickInfo || !pickInfo.hit) {
      return;
    }

    if (pickInfo.pickedMesh?.name.startsWith('for_sale_sign')) {
      const plotId = pickInfo.pickedMesh.name.replace('for_sale_sign_', '');
      this.purchasePlot(plotId);
      return;
    }

    // Apply equipment and attachment speed effects for interaction timing
    const currentTime = Date.now();
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    
    // Get attachment effects from current vehicle
    let attachmentEffects = {};
    const currentVehicle = this.vehicleSystem.getCurrentVehicle();
    if (currentVehicle) {
      attachmentEffects = this.attachmentSystem.getAttachmentEffects(currentVehicle.id);
    }
    
    const equipmentSpeedMultiplier = equipmentEffects.plantingSpeed || 1.0;
    const attachmentSpeedMultiplier = (attachmentEffects as any).plantingSpeed || 1.0;
    const totalSpeedMultiplier = equipmentSpeedMultiplier * attachmentSpeedMultiplier;
    const baseInteractionDelay = 500; // 500ms base delay
    const adjustedDelay = baseInteractionDelay / totalSpeedMultiplier;
    
    if (currentTime - this.lastInteractionTime < adjustedDelay) {
      return; // Still in cooldown
    }
    
    const position = pickInfo.pickedPoint!;
    const gridX = Math.round(position.x / 2) * 2;
    const gridZ = Math.round(position.z / 2) * 2;
    const gridPosition = new Vector3(gridX, 0, gridZ);

    const existingCrop = this.cropSystem.getCropAt(gridPosition);

    if (existingCrop) {
      // Apply harvest speed effects
      const harvestSpeedMultiplier = equipmentEffects.harvestSpeed || 1.0;
      const harvestDelay = baseInteractionDelay / harvestSpeedMultiplier;
      
      if (currentTime - this.lastInteractionTime < harvestDelay) {
        return; // Still in harvest cooldown
      }
      
      const result = this.cropSystem.harvestCrop(gridPosition);
      if (result) {
        this.audioManager.playSound('interaction_harvest');
        const storageSuccess = this.economySystem.addToInventory(result.type, result.amount);
        if (!storageSuccess) {
          console.log('Storage is full! Consider buying more storage equipment.');
        }
        // Update field state to harvested
        this.fieldStateSystem.updateFieldState(gridPosition, 'harvested');
        console.log(
          `Harvested ${result.amount} ${result.type}(s) with ${((harvestSpeedMultiplier - 1) * 100).toFixed(0)}% speed bonus`
        );
        this.lastInteractionTime = currentTime;
      } else {
        console.log('Crop is not ready for harvest yet');
      }
    } else {
      // Check if field is tilled before allowing planting
      const currentFieldState = this.fieldStateSystem.getFieldState(gridPosition);
      
      if (currentFieldState !== 'tilled') {
        console.log('Field must be tilled before planting! Press T to till the soil first.');
        return;
      }

      // Get attachment working area effects
      const workingArea = (attachmentEffects as any).workingArea || 1;
      const plantingPositions = this.getPlantingPositions(gridPosition, workingArea);
      
      // Check if we can afford seeds for all positions
      const totalSeedCost = this.economySystem.getSeedPrice(this.currentCropType) * plantingPositions.length;
      
      if (this.economySystem.getMoney() >= totalSeedCost) {
        let plantsSuccessful = 0;
        let totalCost = 0;
        
        // Plant crops at all positions
        for (const position of plantingPositions) {
          // Check if field is tilled at this position
          const positionFieldState = this.fieldStateSystem.getFieldState(position);
          if (positionFieldState !== 'tilled') {
            continue; // Skip untilled positions
          }
          
          // Check if position is clear and on owned land
          if (!this.cropSystem.getCropAt(position) && this.farmExpansionSystem.isPositionOnOwnedLand(position)) {
            if (this.economySystem.buySeeds(this.currentCropType)) {
              const success = this.cropSystem.plantCrop(this.currentCropType, position);
              if (success) {
                this.fieldStateSystem.updateFieldState(position, 'planted', this.currentCropType);
                plantsSuccessful++;
                totalCost += this.economySystem.getSeedPrice(this.currentCropType);
              }
            }
          }
        }
        
        if (plantsSuccessful > 0) {
          this.audioManager.playSound('interaction_plant');
          console.log(
            `Planted ${plantsSuccessful} ${this.currentCropType}(s) with ${((totalSpeedMultiplier - 1) * 100).toFixed(0)}% speed bonus and ${workingArea}x${workingArea} working area`
          );
          this.lastInteractionTime = currentTime;
        } else {
          console.log('Cannot plant here - ensure fields are tilled and on owned land');
        }
      } else {
        console.log(
          `Not enough money for ${this.currentCropType} seeds (need $${totalSeedCost} for ${plantingPositions.length} plants)`
        );
      }
    }
  }

  toggleBuildMode(): void {
    this.isBuildMode = !this.isBuildMode;
    this.audioManager.playSound('interaction_click');
    console.log(`Build Mode: ${this.isBuildMode ? 'ON' : 'OFF'}`);

    if (this.isBuildMode) {
      // Select the first building in the catalog by default
      if (!this.currentBuildingId) {
        this.currentBuildingId = this.buildingSystem.getBuildingCatalog()[0]?.id;
      }
      if (this.currentBuildingId) {
        this.createGhostMesh();
      }
    } else {
      this.disposeGhostMesh();
    }

    if (this.onToggleBuildMode) {
      this.onToggleBuildMode(this.isBuildMode);
    }
  }

  private createGhostMesh(): void {
    if (this.ghostMesh) {
      this.disposeGhostMesh();
    }

    if (!this.currentBuildingId) return;

    const building = this.buildingSystem.getBuilding(this.currentBuildingId);
    if (!building) return;

    // Create a proper building preview mesh based on building type
    this.ghostMesh = this.createBuildingPreview(building);
    
    // Make it semi-transparent and green to indicate it's a preview
    if (this.ghostMesh.material instanceof StandardMaterial) {
      this.ghostMesh.material.alpha = 0.6;
      this.ghostMesh.material.emissiveColor = Color3.Green().scale(0.3);
    }
    
    this.ghostMesh.isPickable = false; // Ghost mesh should not be pickable
  }

  private createBuildingPreview(building: any): Mesh {
    let previewMesh: Mesh;

    switch (building.id) {
      case 'wooden_fence':
        previewMesh = this.createFencePreview();
        break;
      case 'small_shed':
        previewMesh = this.createShedPreview();
        break;
      case 'small_silo':
        previewMesh = this.createSmallSiloPreview();
        break;
      case 'large_silo':
        previewMesh = this.createLargeSiloPreview();
        break;
      default:
        previewMesh = this.createDefaultBuildingPreview(building);
    }

    return previewMesh;
  }

  private createFencePreview(): Mesh {
    // Create fence post
    const post = MeshBuilder.CreateBox('preview_post', { width: 0.2, height: 2, depth: 0.2 }, this.scene);
    
    // Create fence panels
    const panel1 = MeshBuilder.CreateBox('preview_panel1', { width: 1.8, height: 0.15, depth: 0.05 }, this.scene);
    panel1.position.y = 0.6;
    
    const panel2 = MeshBuilder.CreateBox('preview_panel2', { width: 1.8, height: 0.15, depth: 0.05 }, this.scene);
    panel2.position.y = 1.2;

    // Merge into single mesh
    const fence = Mesh.MergeMeshes([post, panel1, panel2], true, true);
    
    if (fence) {
      const material = new StandardMaterial('fence_preview_material', this.scene);
      material.diffuseColor = Color3.FromHexString('#8B4513');
      fence.material = material;
    }

    return fence!;
  }

  private createShedPreview(): Mesh {
    // Create walls
    const walls = MeshBuilder.CreateBox('preview_walls', { width: 5, height: 3, depth: 5 }, this.scene);
    
    // Create roof
    const roof = MeshBuilder.CreateBox('preview_roof', { width: 5.5, height: 0.3, depth: 5.5 }, this.scene);
    roof.position.y = 1.8;
    
    // Create door frame
    const doorFrame = MeshBuilder.CreateBox('preview_door', { width: 1.2, height: 2.2, depth: 0.1 }, this.scene);
    doorFrame.position.y = -0.4;
    doorFrame.position.z = 2.5;

    // Merge into single mesh
    const shed = Mesh.MergeMeshes([walls, roof, doorFrame], true, true);
    
    if (shed) {
      const material = new StandardMaterial('shed_preview_material', this.scene);
      material.diffuseColor = Color3.FromHexString('#654321');
      shed.material = material;
      shed.position.y = 1.5;
    }

    return shed!;
  }

  private createSmallSiloPreview(): Mesh {
    // Create main cylinder
    const body = MeshBuilder.CreateCylinder('preview_silo_body', { height: 8, diameter: 4 }, this.scene);
    
    // Create conical top
    const top = MeshBuilder.CreateCylinder('preview_silo_top', { height: 2, diameterTop: 0.5, diameterBottom: 4 }, this.scene);
    top.position.y = 5;

    // Merge into single mesh
    const silo = Mesh.MergeMeshes([body, top], true, true);
    
    if (silo) {
      const material = new StandardMaterial('silo_preview_material', this.scene);
      material.diffuseColor = Color3.FromHexString('#C0C0C0');
      silo.material = material;
      silo.position.y = 4;
    }

    return silo!;
  }

  private createLargeSiloPreview(): Mesh {
    // Create main cylinder
    const body = MeshBuilder.CreateCylinder('preview_large_silo_body', { height: 15, diameter: 8 }, this.scene);
    
    // Create conical top
    const top = MeshBuilder.CreateCylinder('preview_large_silo_top', { height: 3, diameterTop: 1, diameterBottom: 8 }, this.scene);
    top.position.y = 9;

    // Create ladder
    const ladder = MeshBuilder.CreateBox('preview_large_silo_ladder', { width: 0.3, height: 12, depth: 0.1 }, this.scene);
    ladder.position.z = 4.1;

    // Merge into single mesh
    const largeSilo = Mesh.MergeMeshes([body, top, ladder], true, true);
    
    if (largeSilo) {
      const material = new StandardMaterial('large_silo_preview_material', this.scene);
      material.diffuseColor = Color3.FromHexString('#B0B0B0');
      largeSilo.material = material;
      largeSilo.position.y = 7.5;
    }

    return largeSilo!;
  }

  private createDefaultBuildingPreview(building: any): Mesh {
    const previewMesh = MeshBuilder.CreateBox('preview_default', { width: building.dimensions.x, height: building.dimensions.y, depth: building.dimensions.z }, this.scene);
    
    const material = new StandardMaterial('default_preview_material', this.scene);
    material.diffuseColor = Color3.FromHexString('#8B4513');
    previewMesh.material = material;
    previewMesh.position.y = building.dimensions.y / 2;
    
    return previewMesh;
  }

  private disposeGhostMesh(): void {
    if (this.ghostMesh) {
      this.ghostMesh.dispose();
      this.ghostMesh = undefined;
    }
  }

  private updateGhostMeshPosition(): void {
    if (!this.ghostMesh) return;

    const pickInfo = this.getGroundPickInfo();
    if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
      const snappedPosition = new Vector3(
        Math.round(pickInfo.pickedPoint.x / 2) * 2,
        0.05,
        Math.round(pickInfo.pickedPoint.z / 2) * 2
      );

      this.ghostMesh.position = snappedPosition;

      // Update ghost material color based on placement validity
      const building = this.buildingSystem.getBuilding(this.currentBuildingId!);
      if (building) {
        const isValidPlacement =
          this.farmExpansionSystem.isPositionOnOwnedLand(snappedPosition) &&
          !this.buildingSystem.isPositionOccupied(snappedPosition, building.dimensions);

        const material = this.ghostMesh.material as StandardMaterial;
        material.diffuseColor = isValidPlacement ? Color3.Green() : Color3.Red();
      }
    }
  }

  setToggleBuildModeCallback(callback: (isBuildMode: boolean) => void): void {
    this.onToggleBuildMode = callback;
  }

  private purchasePlot(plotId: string): void {
    const plot = this.farmExpansionSystem.getPlot(plotId);
    if (plot && !plot.isOwned) {
      if (this.economySystem.getMoney() >= plot.price) {
        this.economySystem.setMoney(this.economySystem.getMoney() - plot.price);
        this.farmExpansionSystem.purchasePlot(plotId);
        this.audioManager.playSound('economy_buy');
        // The SceneManager will need to be updated to remove the sign and add a fence.
        // This will be handled by a new method in SceneManager that is called after a plot is purchased.
      } else {
        console.log('Not enough money to buy this plot.');
      }
    }
  }

  private getGroundPickInfo() {
    const ray = new Ray(
      this.camera.position,
      this.camera.getDirection(Vector3.Forward())
    );
    return this.scene.pickWithRay(ray, mesh => {
      return mesh.name.includes('ground') || mesh.name.includes('field') || mesh.name.startsWith('for_sale_sign');
    });
  }

  private handleVehicleInteraction(): void {
    if (this.vehicleSystem.isInVehicle()) {
      console.log('Exiting vehicle');
      this.audioManager.playSound('vehicle_stop');
      this.vehicleSystem.exitVehicle();
      this.camera = this.scene.activeCamera as FreeCamera;
    } else {
      const nearestVehicle = this.vehicleSystem.getNearestVehicle(
        this.camera.position,
        15 // 15 unit detection distance
      );
      if (nearestVehicle) {
        console.log('Entering vehicle:', nearestVehicle.name);
        this.audioManager.playSound('vehicle_start');
        this.vehicleSystem.enterVehicle(nearestVehicle.id);
      } else {
        console.log('No vehicle nearby - get closer to a vehicle to enter it');
      }
    }
  }

  update(deltaTime: number): void {
    if (!this.camera) return;

    if (this.isBuildMode) {
      this.updateGhostMeshPosition();
    } else if (this.vehicleSystem.isInVehicle()) {
      this.handleVehicleMovement();
    } else {
      this.handlePlayerMovement(deltaTime);
      this.updateVehicleProximityIndicator();
    }
  }

  private handlePlayerMovement(deltaTime: number): void {
    const moveVector = Vector3.Zero();
    const speed = this.moveSpeed * deltaTime;

    if (this.keys['KeyW']) {
      moveVector.addInPlace(this.camera.getDirection(Vector3.Forward()));
    }
    if (this.keys['KeyS']) {
      moveVector.addInPlace(this.camera.getDirection(Vector3.Backward()));
    }
    if (this.keys['KeyA']) {
      moveVector.addInPlace(this.camera.getDirection(Vector3.Left()));
    }
    if (this.keys['KeyD']) {
      moveVector.addInPlace(this.camera.getDirection(Vector3.Right()));
    }

    if (this.keys['ShiftLeft']) {
      moveVector.scaleInPlace(2);
    }

    moveVector.scaleInPlace(speed);
    this.camera.position.addInPlace(moveVector);

    if (this.camera.position.y < 2) {
      this.camera.position.y = 2;
    }
  }

  private handleVehicleMovement(): void {
    const forward = this.keys['KeyW'];
    const backward = this.keys['KeyS'];
    const left = this.keys['KeyA'];
    const right = this.keys['KeyD'];

    this.vehicleSystem.handleVehicleInput(forward, backward, left, right);
  }

  private selectCrop(cropType: CropType): void {
    this.currentCropType = cropType;
    this.audioManager.playSound('interaction_click');
    console.log(`Selected crop: ${cropType}`);
    if (this.onCropSelectionChange) {
      this.onCropSelectionChange(cropType);
    }
  }

  setCropSelectionCallback(callback: (cropType: CropType) => void): void {
    this.onCropSelectionChange = callback;
  }

  setPauseCallback(callback: () => void): void {
    this.onPause = callback;
  }

  setShopCallback(callback: () => void): void {
    this.onShop = callback;
  }

  setBuildingPlacedCallback(callback: () => void): void {
    this.onBuildingPlaced = callback;
  }

  setSelectedBuilding(buildingId: string): void {
    this.currentBuildingId = buildingId;
    if (this.isBuildMode) {
      this.createGhostMesh();
    }
  }

  private toggleAnimalMode(): void {
    this.isAnimalMode = !this.isAnimalMode;
    this.audioManager.playSound('interaction_click');
    console.log(`Animal Mode: ${this.isAnimalMode ? 'ON' : 'OFF'}`);
    
    // Exit build mode if entering animal mode
    if (this.isAnimalMode && this.isBuildMode) {
      this.isBuildMode = false;
      this.disposeGhostMesh();
      if (this.onToggleBuildMode) {
        this.onToggleBuildMode(false);
      }
    }
  }

  private feedAnimals(): void {
    this.livestockSystem.feedAnimals();
    this.audioManager.playSound('interaction_click');
  }

  private collectProducts(): void {
    const products = this.livestockSystem.collectProducts();
    this.audioManager.playSound('economy_sell');
    console.log('Collected products:', products);
  }


  private handleTilling(): void {
    const pickInfo = this.getGroundPickInfo();
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedPoint) {
      return;
    }

    const position = pickInfo.pickedPoint!;
    const gridX = Math.round(position.x / 2) * 2;
    const gridZ = Math.round(position.z / 2) * 2;
    const gridPosition = new Vector3(gridX, 0, gridZ);

    // Check if there's already a crop here
    const existingCrop = this.cropSystem.getCropAt(gridPosition);
    if (existingCrop) {
      console.log('Cannot till here - crop already planted');
      return;
    }

    // Get current field state
    const currentState = this.fieldStateSystem.getFieldState(gridPosition);
    
    // Can only till untilled or stubble fields
    if (currentState !== 'untilled' && currentState !== 'stubble' && currentState !== null) {
      console.log('Field is already prepared or not ready for tilling');
      return;
    }

    // Apply equipment and attachment speed effects for tilling timing
    const currentTime = Date.now();
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    
    // Get attachment effects from current vehicle
    let attachmentEffects = {};
    const currentVehicle = this.vehicleSystem.getCurrentVehicle();
    if (currentVehicle) {
      attachmentEffects = this.attachmentSystem.getAttachmentEffects(currentVehicle.id);
    }
    
    const equipmentSpeedMultiplier = equipmentEffects.plantingSpeed || 1.0; // Reuse planting speed for tilling
    const attachmentSpeedMultiplier = (attachmentEffects as any).tillingSpeed || (attachmentEffects as any).plantingSpeed || 1.0;
    const totalSpeedMultiplier = equipmentSpeedMultiplier * attachmentSpeedMultiplier;
    const baseTillingDelay = 300; // 300ms base delay for tilling
    const adjustedDelay = baseTillingDelay / totalSpeedMultiplier;
    
    if (currentTime - this.lastInteractionTime < adjustedDelay) {
      return; // Still in cooldown
    }

    // Get attachment working area effects for tilling
    const workingArea = (attachmentEffects as any).workingArea || 1;
    const tillingPositions = this.getPlantingPositions(gridPosition, workingArea);
    
    let fieldsTilled = 0;
    
    // Till fields at all positions
    for (const position of tillingPositions) {
      const existingCrop = this.cropSystem.getCropAt(position);
      if (existingCrop) {
        continue; // Skip positions with crops
      }
      
      const positionState = this.fieldStateSystem.getFieldState(position);
      if (positionState !== 'untilled' && positionState !== 'stubble' && positionState !== null) {
        continue; // Skip already prepared fields
      }
      
      this.fieldStateSystem.updateFieldState(position, 'tilled');
      fieldsTilled++;
    }
    
    if (fieldsTilled > 0) {
      this.audioManager.playSound('interaction_plant'); // Reuse plant sound for now
      console.log(`Tilled ${fieldsTilled} field(s) with ${((totalSpeedMultiplier - 1) * 100).toFixed(0)}% speed bonus and ${workingArea}x${workingArea} working area`);
      this.lastInteractionTime = currentTime;
    } else {
      console.log('No fields could be tilled in this area');
    }
  }

  private sellAllCrops(): void {
    const results = this.economySystem.sellAllCrops();
    let totalSold = 0;
    let totalRevenue = 0;

    Object.entries(results).forEach(([cropType, quantity]) => {
      if (quantity > 0) {
        const price = this.economySystem.getMarketPrice(cropType as CropType);
        totalSold += quantity;
        totalRevenue += quantity * price;
      }
    });

    if (totalSold > 0) {
      this.audioManager.playSound('economy_sell');
      console.log(`Sold all crops: ${totalSold} items for $${totalRevenue}`);
    } else {
      console.log('No crops to sell');
    }
  }

  private handleAttachmentSwitch(): void {
    const currentVehicle = this.vehicleSystem.getCurrentVehicle();
    if (!currentVehicle) {
      console.log('No vehicle to switch attachment for');
      return;
    }

    const success = this.attachmentSystem.switchAttachment(currentVehicle.id);
    if (success) {
      const currentAttachment = this.attachmentSystem.getCurrentAttachment(currentVehicle.id);
      const attachmentName = currentAttachment ? 
        this.attachmentSystem.getAttachment(`${currentAttachment}_attachment`)?.name || currentAttachment : 
        'None';
      console.log(`Switched to attachment: ${attachmentName}`);
      this.audioManager.playSound('interaction_click');
    } else {
      console.log('No attachments available or failed to switch');
    }
  }

  private updateVehicleProximityIndicator(): void {
    const promptElement = document.getElementById('vehicle-prompt');
    if (!promptElement) return;

    const nearestVehicle = this.vehicleSystem.getNearestVehicle(this.camera.position, 15);
    if (nearestVehicle && !this.vehicleSystem.isInVehicle()) {
      promptElement.classList.remove('hidden');
      const distance = Vector3.Distance(this.camera.position, nearestVehicle.mesh.position);
      promptElement.textContent = `Press E to enter ${nearestVehicle.name} (${distance.toFixed(1)}m)`;
    } else {
      promptElement.classList.add('hidden');
    }
  }

  private getPlantingPositions(centerPosition: Vector3, workingArea: number): Vector3[] {
    const positions: Vector3[] = [];
    const halfArea = Math.floor(workingArea / 2);
    
    // Generate positions in a square pattern around the center
    for (let x = -halfArea; x <= halfArea; x++) {
      for (let z = -halfArea; z <= halfArea; z++) {
        const position = new Vector3(
          centerPosition.x + (x * 2), // 2-unit grid spacing
          centerPosition.y,
          centerPosition.z + (z * 2)
        );
        positions.push(position);
      }
    }
    
    return positions;
  }
}