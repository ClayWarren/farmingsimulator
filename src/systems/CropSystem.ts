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

  constructor(scene: Scene, timeSystem: TimeSystem) {
    this.scene = scene;
    this.timeSystem = timeSystem;
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

    const amount = Math.floor(Math.random() * 3) + 2;
    console.log(`Harvested ${crop.type}, got ${amount} units`);

    return {
      type: crop.type,
      amount: amount,
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

    const daysSincePlanted = this.calculateDaysSincePlanted(crop, timeData);
    const growthProgress = daysSincePlanted / info.growthTime;

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
