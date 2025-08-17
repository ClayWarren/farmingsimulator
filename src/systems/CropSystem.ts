import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Vector3,
  Mesh,
  InstancedMesh,
  DynamicTexture,
  Texture,
} from '@babylonjs/core';
import { TimeSystem, TimeData } from './TimeSystem';
import { EquipmentSystem } from './EquipmentSystem';
import { FarmExpansionSystem } from './FarmExpansionSystem';
import { WeatherSystem } from './WeatherSystem';
import { AttachmentSystem } from './AttachmentSystem';

export type CropType = 'wheat' | 'corn' | 'potato' | 'carrot';

export interface CropData {
  type: CropType;
  plantedDay: number;
  plantedSeason: string;
  growthStage: number;
  position: Vector3;
  mesh?: Mesh | InstancedMesh;
}

export interface CropInfo {
  name: string;
  growthTime: number;
  seedPrice: number;
  sellPrice: number;
  color: string;
}

export class CropSystem {
  private scene: Scene;
  private timeSystem: TimeSystem;
  private equipmentSystem: EquipmentSystem;
  private farmExpansionSystem: FarmExpansionSystem;
  private weatherSystem: WeatherSystem;
  private attachmentSystem: AttachmentSystem;
  private crops: Map<string, CropData> = new Map();
  private cropTemplates: Map<CropType, Mesh> = new Map();

  private readonly cropInfo: Record<CropType, CropInfo> = {
    wheat: {
      name: 'Wheat',
      growthTime: 5,
      seedPrice: 2,
      sellPrice: 8,
      color: '#DAA520',
    },
    corn: {
      name: 'Corn',
      growthTime: 7,
      seedPrice: 3,
      sellPrice: 12,
      color: '#FFD700',
    },
    potato: {
      name: 'Potato',
      growthTime: 6,
      seedPrice: 4,
      sellPrice: 10,
      color: '#8B4513',
    },
    carrot: {
      name: 'Carrot',
      growthTime: 4,
      seedPrice: 1,
      sellPrice: 6,
      color: '#FF8C00',
    },
  };

  constructor(scene: Scene, timeSystem: TimeSystem, equipmentSystem: EquipmentSystem, farmExpansionSystem: FarmExpansionSystem, weatherSystem: WeatherSystem, attachmentSystem: AttachmentSystem) {
    this.scene = scene;
    this.timeSystem = timeSystem;
    this.equipmentSystem = equipmentSystem;
    this.farmExpansionSystem = farmExpansionSystem;
    this.weatherSystem = weatherSystem;
    this.attachmentSystem = attachmentSystem;
  }

  initialize(): void {
    this.createCropTemplates();
    console.log('Crop system initialized');
  }

  private createCropTemplates(): void {
    Object.entries(this.cropInfo).forEach(([type, info]) => {
      const cropType = type as CropType;

      // Create more realistic crop models based on type
      let template: Mesh;
      
      switch (cropType) {
        case 'wheat':
          template = this.createWheatModel(cropType);
          break;
        case 'corn':
          template = this.createCornModel(cropType);
          break;
        case 'potato':
          template = this.createPotatoModel(cropType);
          break;
        case 'carrot':
          template = this.createCarrotModel(cropType);
          break;
        default:
          template = this.createDefaultCropModel(cropType, info);
      }

      template.setEnabled(false);
      this.cropTemplates.set(cropType, template);
    });
  }

  private createWheatModel(cropType: CropType): Mesh {
    const template = MeshBuilder.CreateCylinder(
      `${cropType}_template`,
      {
        height: 0.1,
        diameterTop: 0.6,
        diameterBottom: 0.1,
        tessellation: 8,
      },
      this.scene
    );

    const material = new PBRMaterial(`${cropType}_material`, this.scene);
    material.albedoColor = Color3.FromHexString('#F4A460');
    material.roughness = 0.8;
    material.metallic = 0.0;
    
    // Add wheat-like texture
    const wheatTexture = this.createWheatTexture();
    material.albedoTexture = wheatTexture;

    template.material = material;
    return template;
  }

  private createCornModel(cropType: CropType): Mesh {
    const template = MeshBuilder.CreateCylinder(
      `${cropType}_template`,
      {
        height: 0.2,
        diameterTop: 0.4,
        diameterBottom: 0.6,
        tessellation: 6,
      },
      this.scene
    );

    const material = new PBRMaterial(`${cropType}_material`, this.scene);
    material.albedoColor = Color3.FromHexString('#228B22');
    material.roughness = 0.7;
    material.metallic = 0.0;

    template.material = material;
    return template;
  }

  private createPotatoModel(cropType: CropType): Mesh {
    const template = MeshBuilder.CreateSphere(
      `${cropType}_template`,
      { diameter: 0.8 },
      this.scene
    );

    const material = new PBRMaterial(`${cropType}_material`, this.scene);
    material.albedoColor = Color3.FromHexString('#32CD32');
    material.roughness = 0.8;
    material.metallic = 0.0;

    template.material = material;
    template.scaling.y = 0.4; // Flatten for leafy appearance
    return template;
  }

  private createCarrotModel(cropType: CropType): Mesh {
    const template = MeshBuilder.CreateCylinder(
      `${cropType}_template`,
      {
        height: 0.3,
        diameterTop: 0.8,
        diameterBottom: 0.2,
        tessellation: 6,
      },
      this.scene
    );

    const material = new PBRMaterial(`${cropType}_material`, this.scene);
    material.albedoColor = Color3.FromHexString('#FF6347');
    material.roughness = 0.7;
    material.metallic = 0.0;

    template.material = material;
    return template;
  }

  private createDefaultCropModel(cropType: CropType, info: any): Mesh {
    const template = MeshBuilder.CreateCylinder(
      `${cropType}_template`,
      {
        height: 0.1,
        diameterTop: 0.8,
        diameterBottom: 0.2,
        tessellation: 6,
      },
      this.scene
    );

    const material = new PBRMaterial(`${cropType}_material`, this.scene);
    material.albedoColor = Color3.FromHexString(info.color);
    material.roughness = 0.8;
    material.metallic = 0.0;

    template.material = material;
    return template;
  }

  private createWheatTexture(): DynamicTexture {
    const texture = new DynamicTexture('wheatTexture', { width: 128, height: 128 }, this.scene);
    const context = texture.getContext();
    
    // Base wheat color
    context.fillStyle = '#F4A460';
    context.fillRect(0, 0, 128, 128);
    
    // Add grain-like patterns
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 2 + 1;
      context.fillStyle = `rgba(${200 + Math.random() * 55}, ${180 + Math.random() * 40}, ${100 + Math.random() * 30}, 0.6)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    
    return texture;
  }

  plantCrop(cropType: CropType, position: Vector3): boolean {
    if (!this.farmExpansionSystem.isPositionOnOwnedLand(position)) {
      console.log("You don't own this land!");
      return false;
    }

    const key = `${position.x}_${position.z}`;

    if (this.crops.has(key)) {
      return false;
    }

    const timeData = this.timeSystem.getTimeData();
    const template = this.cropTemplates.get(cropType);

    if (!template) {
      return false;
    }

    const cropMesh = template.createInstance(`crop_${key}`);
    cropMesh.position = position.clone();
    cropMesh.position.y = 0.05;
    cropMesh.scaling = new Vector3(0.3, 0.3, 0.3);

    const cropData: CropData = {
      type: cropType,
      plantedDay: timeData.day,
      plantedSeason: timeData.season,
      growthStage: 0,
      position: position.clone(),
      mesh: cropMesh,
    };

    this.crops.set(key, cropData);
    this.updateCropAppearance(cropData);

    console.log(
      `Planted ${cropType} at position (${position.x}, ${position.z})`
    );
    return true;
  }

  harvestCrop(position: Vector3): { type: CropType; amount: number } | null {
    const key = `${position.x}_${position.z}`;
    const crop = this.crops.get(key);

    if (!crop || crop.growthStage < 3) {
      return null;
    }

    if (crop.mesh) {
      crop.mesh.dispose();
    }

    this.crops.delete(key);

    // Apply equipment, attachment, and weather effects to yield
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    const weatherData = this.weatherSystem.getWeatherData();
    
    // Get attachment effects from current vehicle
    let attachmentEffects = {};
    // For now, we'll assume the tractor is the first vehicle - this could be improved
    const vehicles = ['tractor_1', 'combine_harvester_1'];
    for (const vehicleId of vehicles) {
      const effects = this.attachmentSystem.getAttachmentEffects(vehicleId);
      if (effects && Object.keys(effects).length > 0) {
        attachmentEffects = effects;
        break;
      }
    }
    
    const baseAmount = Math.floor(Math.random() * 3) + 2;
    const equipmentMultiplier = equipmentEffects.cropYield || 1.0;
    const attachmentMultiplier = (attachmentEffects as any).efficiency || 1.0;
    const weatherMultiplier = this.getWeatherYieldMultiplier(weatherData.type);
    const totalMultiplier = equipmentMultiplier * attachmentMultiplier * weatherMultiplier;
    
    const modifiedAmount = Math.floor(baseAmount * totalMultiplier);
    const finalAmount = Math.max(1, modifiedAmount);
    
    console.log(`Harvested ${crop.type}, got ${finalAmount} units (base: ${baseAmount}, equipment bonus: ${((equipmentMultiplier - 1) * 100).toFixed(0)}%, attachment bonus: ${((attachmentMultiplier - 1) * 100).toFixed(0)}%, weather bonus: ${((weatherMultiplier - 1) * 100).toFixed(0)}%)`);

    return {
      type: crop.type,
      amount: finalAmount,
    };
  }

  update(): void {
    this.crops.forEach(crop => {
      this.updateCropGrowth(crop);
    });
  }

  private updateCropGrowth(crop: CropData): void {
    const timeData = this.timeSystem.getTimeData();
    const info = this.cropInfo[crop.type];
    const weatherData = this.weatherSystem.getWeatherData();

    const daysSincePlanted = this.calculateDaysSincePlanted(crop, timeData);
    
    // Apply weather effects to growth rate
    const weatherMultiplier = this.getWeatherGrowthMultiplier(weatherData.type);
    const effectiveDays = daysSincePlanted * weatherMultiplier;
    const growthProgress = effectiveDays / info.growthTime;

    let newGrowthStage: number;
    if (growthProgress < 0.25) {
      newGrowthStage = 0;
    } else if (growthProgress < 0.5) {
      newGrowthStage = 1;
    } else if (growthProgress < 0.75) {
      newGrowthStage = 2;
    } else {
      newGrowthStage = 3;
    }

    if (newGrowthStage !== crop.growthStage) {
      crop.growthStage = newGrowthStage;
      this.updateCropAppearance(crop);
    }
  }

  private getWeatherGrowthMultiplier(weatherType: string): number {
    // Weather effects on crop growth speed
    switch (weatherType) {
      case 'Rainy':
        return 1.3; // 30% faster growth in rain
      case 'Stormy':
        return 0.7; // 30% slower growth in storms
      case 'Cloudy':
        return 1.1; // 10% faster growth when cloudy
      case 'Sunny':
      default:
        return 1.0; // Normal growth rate
    }
  }

  private getWeatherYieldMultiplier(weatherType: string): number {
    // Weather effects on crop yield when harvesting
    switch (weatherType) {
      case 'Rainy':
        return 1.2; // 20% higher yield if grown during rain
      case 'Stormy':
        return 0.8; // 20% lower yield if grown during storms
      case 'Cloudy':
        return 1.05; // 5% higher yield when cloudy
      case 'Sunny':
      default:
        return 1.0; // Normal yield
    }
  }

  private calculateDaysSincePlanted(
    crop: CropData,
    currentTime: TimeData
  ): number {
    if (crop.plantedSeason === currentTime.season) {
      return currentTime.day - crop.plantedDay;
    }

    const seasonsToAdd = this.getSeasonDifference(
      crop.plantedSeason,
      currentTime.season
    );
    return seasonsToAdd * 30 + currentTime.day - crop.plantedDay;
  }

  private getSeasonDifference(
    plantedSeason: string,
    currentSeason: string
  ): number {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const plantedIndex = seasons.indexOf(plantedSeason);
    const currentIndex = seasons.indexOf(currentSeason);

    if (currentIndex >= plantedIndex) {
      return currentIndex - plantedIndex;
    } else {
      return 4 - plantedIndex + currentIndex;
    }
  }

  private updateCropAppearance(crop: CropData): void {
    if (!crop.mesh) return;

    const scaleFactors = [0.3, 0.5, 0.8, 1.0];
    const heightFactors = [0.3, 0.6, 0.9, 1.2];

    const scale = scaleFactors[crop.growthStage];
    const height = heightFactors[crop.growthStage];

    crop.mesh.scaling = new Vector3(scale, height, scale);

    const info = this.cropInfo[crop.type];
    if (crop.mesh.material && crop.mesh.material instanceof StandardMaterial) {
      const material = crop.mesh.material as StandardMaterial;
      const baseColor = Color3.FromHexString(info.color);

      if (crop.growthStage === 3) {
        material.emissiveColor = baseColor.scale(0.4);
      } else {
        material.emissiveColor = baseColor.scale(0.2);
      }
    }
  }

  getCropAt(position: Vector3): CropData | undefined {
    const key = `${position.x}_${position.z}`;
    return this.crops.get(key);
  }

  getCropInfo(cropType: CropType): CropInfo {
    return this.cropInfo[cropType];
  }

  getAllCrops(): CropData[] {
    return Array.from(this.crops.values());
  }

  getCropCount(): number {
    return this.crops.size;
  }

  getMatureCropCount(): number {
    return Array.from(this.crops.values()).filter(
      crop => crop.growthStage === 3
    ).length;
  }

  // Save/Load functionality
  getSaveData(): Array<{
    type: CropType;
    plantedDay: number;
    plantedSeason: string;
    growthStage: number;
    position: { x: number; y: number; z: number };
  }> {
    return Array.from(this.crops.values()).map(crop => ({
      type: crop.type,
      plantedDay: crop.plantedDay,
      plantedSeason: crop.plantedSeason,
      growthStage: crop.growthStage,
      position: {
        x: crop.position.x,
        y: crop.position.y,
        z: crop.position.z,
      },
    }));
  }

  loadSaveData(
    saveData: Array<{
      type: CropType;
      plantedDay: number;
      plantedSeason: string;
      growthStage: number;
      position: { x: number; y: number; z: number };
    }>
  ): void {
    // Clear existing crops
    this.crops.forEach(crop => {
      if (crop.mesh) {
        crop.mesh.dispose();
      }
    });
    this.crops.clear();

    // Load saved crops
    saveData.forEach(savedCrop => {
      const position = new Vector3(
        savedCrop.position.x,
        savedCrop.position.y,
        savedCrop.position.z
      );

      const template = this.cropTemplates.get(savedCrop.type);
      if (!template) return;

      const key = `${position.x}_${position.z}`;
      const cropMesh = template.createInstance(`crop_${key}`);
      cropMesh.position = position.clone();
      cropMesh.position.y = 0.05;

      const cropData: CropData = {
        type: savedCrop.type,
        plantedDay: savedCrop.plantedDay,
        plantedSeason: savedCrop.plantedSeason,
        growthStage: savedCrop.growthStage,
        position: position.clone(),
        mesh: cropMesh,
      };

      this.crops.set(key, cropData);
      this.updateCropAppearance(cropData);
    });

    console.log(`Crop system data loaded: ${saveData.length} crops restored`);
  }
}
