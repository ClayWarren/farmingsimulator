import { Vector3, BoundingBox } from '@babylonjs/core';

export interface BuildingEffects {
  storageCapacity?: number; // Additional storage slots
}

export interface Building {
  id: string;
  name: string;
  price: number;
  modelName: string;
  dimensions: Vector3; // Width, Height, Depth
  effects?: BuildingEffects;
}

export interface PlacedBuilding {
  id: string;
  position: Vector3;
  rotation: Vector3;
  dimensions: Vector3; // Store dimensions for collision checking on load
}

export class BuildingSystem {
  private buildingCatalog: Building[] = [];
  private placedBuildings: PlacedBuilding[] = [];

  constructor() {
    this.initializeBuildingCatalog();
  }

  initialize(): void {
    console.log('Building System initialized');
  }

  private initializeBuildingCatalog(): void {
    this.buildingCatalog = [
      {
        id: 'wooden_fence',
        name: 'Wooden Fence',
        price: 50,
        modelName: 'assets/models/fence.glb',
        dimensions: new Vector3(2, 2, 0.5),
      },
      {
        id: 'small_shed',
        name: 'Small Shed',
        price: 500,
        modelName: 'assets/models/shed.glb',
        dimensions: new Vector3(5, 4, 5),
      },
      {
        id: 'small_silo',
        name: 'Small Silo',
        price: 5000,
        modelName: 'assets/models/small_silo.glb',
        dimensions: new Vector3(4, 8, 4),
        effects: { storageCapacity: 1000 },
      },
      {
        id: 'large_silo',
        name: 'Large Silo',
        price: 12000,
        modelName: 'assets/models/large_silo.glb',
        dimensions: new Vector3(8, 15, 8),
        effects: { storageCapacity: 5000 },
      },
    ];
  }

  getBuildingCatalog(): Building[] {
    return this.buildingCatalog;
  }

  getBuilding(id: string): Building | undefined {
    return this.buildingCatalog.find(b => b.id === id);
  }

  placeBuilding(id: string, position: Vector3, rotation: Vector3): void {
    const building = this.getBuilding(id);
    if (building) {
      this.placedBuildings.push({ id, position, rotation, dimensions: building.dimensions });
      console.log(`Placed ${building.name} at ${position}`);
    }
  }

  isPositionOccupied(position: Vector3, newBuildingDimensions: Vector3): boolean {
    const newBuildingMin = position.subtract(newBuildingDimensions.scale(0.5));
    const newBuildingMax = position.add(newBuildingDimensions.scale(0.5));
    const newBuildingBounds = new BoundingBox(newBuildingMin, newBuildingMax);

    for (const placedBuilding of this.placedBuildings) {
      const placedBuildingMin = placedBuilding.position.subtract(placedBuilding.dimensions.scale(0.5));
      const placedBuildingMax = placedBuilding.position.add(placedBuilding.dimensions.scale(0.5));
      const placedBuildingBounds = new BoundingBox(placedBuildingMin, placedBuildingMax);

      if (newBuildingBounds.intersectsMinMax(placedBuildingBounds.minimumWorld, placedBuildingBounds.maximumWorld)) {
        return true;
      }
    }
    return false;
  }

  getTotalStorageCapacity(): number {
    let totalCapacity = 0;
    this.placedBuildings.forEach(placedBuilding => {
      const buildingData = this.getBuilding(placedBuilding.id);
      if (buildingData?.effects?.storageCapacity) {
        totalCapacity += buildingData.effects.storageCapacity;
      }
    });
    return totalCapacity;
  }

  getPlacedBuildings(): PlacedBuilding[] {
    return this.placedBuildings;
  }

  getSaveData(): { placedBuildings: Array<{ id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; dimensions: { x: number; y: number; z: number }; }> } {
    return {
      placedBuildings: this.placedBuildings.map(building => ({
        id: building.id,
        position: { x: building.position.x, y: building.position.y, z: building.position.z },
        rotation: { x: building.rotation.x, y: building.rotation.y, z: building.rotation.z },
        dimensions: { x: building.dimensions.x, y: building.dimensions.y, z: building.dimensions.z },
      })),
    };
  }

  loadSaveData(data: { placedBuildings: Array<{ id: string; position: { x: number; y: number; z: number }; rotation: { x: number; y: number; z: number }; dimensions: { x: number; y: number; z: number }; }> }): void {
    if (!data || !data.placedBuildings) return;
    
    this.placedBuildings = data.placedBuildings.map(saved => ({
      id: saved.id,
      position: new Vector3(saved.position.x, saved.position.y, saved.position.z),
      rotation: new Vector3(saved.rotation.x, saved.rotation.y, saved.rotation.z),
      dimensions: new Vector3(saved.dimensions.x, saved.dimensions.y, saved.dimensions.z),
    }));
  }
}
