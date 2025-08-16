import { Scene, FreeCamera, Vector3, Ray, Mesh, StandardMaterial, Color3, MeshBuilder } from '@babylonjs/core';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { FarmExpansionSystem } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { LivestockSystem, AnimalType } from '../systems/LivestockSystem';
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
        case 'KeyS':
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

    // Apply equipment speed effects for interaction timing
    const currentTime = Date.now();
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    const speedMultiplier = equipmentEffects.plantingSpeed || 1.0;
    const baseInteractionDelay = 500; // 500ms base delay
    const adjustedDelay = baseInteractionDelay / speedMultiplier;
    
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
        console.log(
          `Harvested ${result.amount} ${result.type}(s) with ${((harvestSpeedMultiplier - 1) * 100).toFixed(0)}% speed bonus`
        );
        this.lastInteractionTime = currentTime;
      } else {
        console.log('Crop is not ready for harvest yet');
      }
    } else {
      if (this.economySystem.canAffordSeeds(this.currentCropType)) {
        if (this.economySystem.buySeeds(this.currentCropType)) {
          const success = this.cropSystem.plantCrop(
            this.currentCropType,
            gridPosition
          );
          if (success) {
            this.audioManager.playSound('interaction_plant');
            console.log(
              `Planted ${this.currentCropType} with ${((speedMultiplier - 1) * 100).toFixed(0)}% speed bonus at (${gridX}, ${gridZ})`
            );
            this.lastInteractionTime = currentTime;
          } else {
            console.log('Cannot plant here');
          }
        }
      } else {
        const seedPrice = this.economySystem.getSeedPrice(this.currentCropType);
        console.log(
          `Not enough money for ${this.currentCropType} seeds (need ${seedPrice})`
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

    // For now, create a simple box as a placeholder for the building model
    this.ghostMesh = MeshBuilder.CreateBox('ghostBuilding', { size: 2 }, this.scene);
    const ghostMaterial = new StandardMaterial('ghostMaterial', this.scene);
    ghostMaterial.alpha = 0.5;
    ghostMaterial.diffuseColor = Color3.Green(); // Default to green
    this.ghostMesh.material = ghostMaterial;
    this.ghostMesh.isPickable = false; // Ghost mesh should not be pickable
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
      this.audioManager.playSound('vehicle_stop');
      this.vehicleSystem.exitVehicle();
      this.camera = this.scene.activeCamera as FreeCamera;
    } else {
      const nearestVehicle = this.vehicleSystem.getNearestVehicle(
        this.camera.position
      );
      if (nearestVehicle) {
        this.audioManager.playSound('vehicle_start');
        this.vehicleSystem.enterVehicle(nearestVehicle.id);
      } else {
        console.log('No vehicle nearby');
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
}