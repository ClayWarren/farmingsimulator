import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  InstancedMesh,
} from '@babylonjs/core';
import { TimeSystem, TimeData } from './TimeSystem';
import { EquipmentSystem } from './EquipmentSystem';
import { FarmExpansionSystem } from './FarmExpansionSystem';
import { WeatherSystem } from './WeatherSystem';

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

  constructor(scene: Scene, timeSystem: TimeSystem, equipmentSystem: EquipmentSystem, farmExpansionSystem: FarmExpansionSystem, weatherSystem: WeatherSystem) {
    this.scene = scene;
    this.timeSystem = timeSystem;
    this.equipmentSystem = equipmentSystem;
    this.farmExpansionSystem = farmExpansionSystem;
    this.weatherSystem = weatherSystem;
  }

  initialize(): void {
    this.createCropTemplates();
    console.log('Crop system initialized');
  }

  private createCropTemplates(): void {
    Object.entries(this.cropInfo).forEach(([type, info]) => {
      const cropType = type as CropType;

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

      const material = new StandardMaterial(`${cropType}_material`, this.scene);
      material.diffuseColor = Color3.FromHexString(info.color);
      material.emissiveColor = Color3.FromHexString(info.color).scale(0.2);

      template.material = material;
      template.setEnabled(false);

      this.cropTemplates.set(cropType, template);
    });
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

    // Apply equipment and weather effects to yield
    const equipmentEffects = this.equipmentSystem.getEquipmentEffects();
    const weatherData = this.weatherSystem.getWeatherData();
    
    const baseAmount = Math.floor(Math.random() * 3) + 2;
    const equipmentMultiplier = equipmentEffects.cropYield || 1.0;
    const weatherMultiplier = this.getWeatherYieldMultiplier(weatherData.type);
    const totalMultiplier = equipmentMultiplier * weatherMultiplier;
    
    const modifiedAmount = Math.floor(baseAmount * totalMultiplier);
    const finalAmount = Math.max(1, modifiedAmount);
    
    console.log(`Harvested ${crop.type}, got ${finalAmount} units (base: ${baseAmount}, equipment bonus: ${((equipmentMultiplier - 1) * 100).toFixed(0)}%, weather bonus: ${((weatherMultiplier - 1) * 100).toFixed(0)}%)`);

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
