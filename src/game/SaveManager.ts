import { Vector3 } from '@babylonjs/core';
import { TimeData } from '../systems/TimeSystem';
import { CropType } from '../systems/CropSystem';
import { WeatherType } from '../systems/WeatherSystem';
import { AnimalType } from '../systems/LivestockSystem';

export interface SavedCropData {
  type: CropType;
  plantedDay: number;
  plantedSeason: string;
  growthStage: number;
  position: { x: number; y: number; z: number };
}

export interface SavedInventoryData {
  [key: string]: number;
}

export interface SavedEconomyData {
  money: number;
  inventory: SavedInventoryData;
  marketPrices: {
    wheat: number;
    corn: number;
    potato: number;
    carrot: number;
  };
  lastPriceUpdate: number;
}

export interface SavedTimeData extends TimeData {
  timeScale: number;
  realTimeAccumulator: number;
}

export interface SavedWeatherData {
  type: WeatherType;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherChangeTimer: number;
}

export interface SavedVehicleData {
  isInVehicle: boolean;
  currentVehicleId?: string;
  vehicles: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    speed: number;
    isOccupied: boolean;
  }>;
}

export interface SavedLivestockData {
  animals: Array<{
    id: string;
    type: AnimalType;
    position: { x: number; y: number; z: number };
    age: number;
    happiness: number;
    health: number;
    lastFed: number;
  }>;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  timeData: SavedTimeData;
  economyData: SavedEconomyData;
  cropsData: SavedCropData[];
  weatherData: SavedWeatherData;
  vehicleData: SavedVehicleData;
  playerPosition: { x: number; y: number; z: number };
  playerRotation: { x: number; y: number; z: number };
  equipmentData: { ownedEquipment: string[] };
  farmExpansionData: { ownedPlots: string[] };
  buildingData: { placedBuildings: Array<{ id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; dimensions: { x: number; y: number; z: number }; }>; };
  livestockData: SavedLivestockData;
}

export class SaveManager {
  private static readonly SAVE_KEY = 'farming_simulator_save';
  private static readonly SAVE_VERSION = '1.0.0';

  static saveGame(saveData: GameSaveData): boolean {
    try {
      saveData.version = this.SAVE_VERSION;
      saveData.timestamp = Date.now();

      const jsonData = JSON.stringify(saveData, null, 2);
      localStorage.setItem(this.SAVE_KEY, jsonData);

      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  static loadGame(): GameSaveData | null {
    try {
      const jsonData = localStorage.getItem(this.SAVE_KEY);
      if (!jsonData) {
        console.log('No save data found');
        return null;
      }

      const saveData: GameSaveData = JSON.parse(jsonData);

      // Version check
      if (saveData.version !== this.SAVE_VERSION) {
        console.warn(
          `Save version mismatch: expected ${this.SAVE_VERSION}, got ${saveData.version}`
        );
        // Could implement migration logic here
      }

      console.log('Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  static hasSaveData(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  static deleteSave(): boolean {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save data:', error);
      return false;
    }
  }

  static getSaveInfo(): { exists: boolean; timestamp?: number; age?: string } {
    const jsonData = localStorage.getItem(this.SAVE_KEY);
    if (!jsonData) {
      return { exists: false };
    }

    try {
      const saveData: GameSaveData = JSON.parse(jsonData);
      const age = this.formatAge(Date.now() - saveData.timestamp);

      return {
        exists: true,
        timestamp: saveData.timestamp,
        age,
      };
    } catch {
      return { exists: false };
    }
  }

  private static formatAge(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  // Utility methods for converting between Vector3 and plain objects
  static vector3ToObject(vector: Vector3): { x: number; y: number; z: number } {
    return { x: vector.x, y: vector.y, z: vector.z };
  }

  static objectToVector3(obj: { x: number; y: number; z: number }): Vector3 {
    return new Vector3(obj.x, obj.y, obj.z);
  }

  // Helper method to convert Map to plain object
  static mapToObject<T>(map: Map<string, T>): { [key: string]: T } {
    const obj: { [key: string]: T } = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  // Helper method to convert plain object to Map
  static objectToMap<T>(obj: { [key: string]: T }): Map<string, T> {
    const map = new Map<string, T>();
    Object.entries(obj).forEach(([key, value]) => {
      map.set(key, value);
    });
    return map;
  }
}
