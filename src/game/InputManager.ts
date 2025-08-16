import { Scene, FreeCamera, Vector3, Ray } from '@babylonjs/core';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { AudioManager } from '../audio/AudioManager';

export class InputManager {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private camera: FreeCamera;
  private cropSystem: CropSystem;
  private economySystem: EconomySystem;
  private vehicleSystem: VehicleSystem;
  private equipmentSystem: EquipmentSystem;
  private audioManager: AudioManager;
  private keys: { [key: string]: boolean } = {};
  private moveSpeed = 20;
  private isPointerLocked = false;
  private currentCropType: CropType = 'wheat';
  private lastInteractionTime = 0;
  private onCropSelectionChange?: (cropType: CropType) => void;
  private onPause?: () => void;
  private onShop?: () => void;

  constructor(
    scene: Scene,
    canvas: HTMLCanvasElement,
    cropSystem: CropSystem,
    economySystem: EconomySystem,
    vehicleSystem: VehicleSystem,
    equipmentSystem: EquipmentSystem,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.canvas = canvas;
    this.cropSystem = cropSystem;
    this.economySystem = economySystem;
    this.vehicleSystem = vehicleSystem;
    this.equipmentSystem = equipmentSystem;
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
    // Apply equipment speed effects for interaction timing
    const currentTime = Date.now();
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    const speedMultiplier = equipmentEffects.plantingSpeed || 1.0;
    const baseInteractionDelay = 500; // 500ms base delay
    const adjustedDelay = baseInteractionDelay / speedMultiplier;
    
    if (currentTime - this.lastInteractionTime < adjustedDelay) {
      return; // Still in cooldown
    }
    
    const pickInfo = this.getGroundPickInfo();
    if (!pickInfo || !pickInfo.hit) {
      return;
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
