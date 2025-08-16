import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh, InstancedMesh } from '@babylonjs/core';
import { TimeSystem } from './TimeSystem';
import { EconomySystem } from './EconomySystem';
import { FarmExpansionSystem } from './FarmExpansionSystem';

export type AnimalType = 'chicken' | 'cow' | 'pig' | 'sheep';

export interface AnimalData {
  id: string;
  type: AnimalType;
  position: Vector3;
  age: number; // in days
  happiness: number; // 0-100
  health: number; // 0-100
  lastFed: number; // day number when last fed
  mesh?: Mesh | InstancedMesh;
}

export interface AnimalInfo {
  name: string;
  purchasePrice: number;
  dailyUpkeep: number; // daily food cost
  maturityAge: number; // days to reach maturity
  productType: string;
  productValue: number;
  productionRate: number; // products per day when mature and happy
  color: string;
}

export interface LivestockBuilding {
  id: string;
  type: 'coop' | 'barn' | 'pen';
  position: Vector3;
  capacity: number;
  animals: string[]; // animal IDs housed in this building
}

export class LivestockSystem {
  private scene: Scene;
  private timeSystem: TimeSystem;
  private economySystem: EconomySystem;
  private farmExpansionSystem: FarmExpansionSystem;
  private animals: Map<string, AnimalData> = new Map();
  private animalTemplates: Map<AnimalType, Mesh> = new Map();
  private nextAnimalId: number = 1;

  private readonly animalInfo: Record<AnimalType, AnimalInfo> = {
    chicken: {
      name: 'Chicken',
      purchasePrice: 50,
      dailyUpkeep: 2,
      maturityAge: 10,
      productType: 'eggs',
      productValue: 5,
      productionRate: 0.8, // 0.8 eggs per day
      color: '#FFFFFF',
    },
    cow: {
      name: 'Cow',
      purchasePrice: 1000,
      dailyUpkeep: 15,
      maturityAge: 30,
      productType: 'milk',
      productValue: 25,
      productionRate: 1.2, // 1.2 liters per day
      color: '#8B4513',
    },
    pig: {
      name: 'Pig',
      purchasePrice: 300,
      dailyUpkeep: 8,
      maturityAge: 20,
      productType: 'meat',
      productValue: 150,
      productionRate: 0.1, // occasional meat production
      color: '#FFC0CB',
    },
    sheep: {
      name: 'Sheep',
      purchasePrice: 200,
      dailyUpkeep: 5,
      maturityAge: 15,
      productType: 'wool',
      productValue: 30,
      productionRate: 0.3, // wool every few days
      color: '#FFFAF0',
    },
  };

  constructor(
    scene: Scene,
    timeSystem: TimeSystem,
    economySystem: EconomySystem,
    farmExpansionSystem: FarmExpansionSystem
  ) {
    this.scene = scene;
    this.timeSystem = timeSystem;
    this.economySystem = economySystem;
    this.farmExpansionSystem = farmExpansionSystem;
  }

  initialize(): void {
    this.createAnimalTemplates();
    console.log('Livestock System initialized');
  }

  private createAnimalTemplates(): void {
    Object.entries(this.animalInfo).forEach(([type, info]) => {
      const animalType = type as AnimalType;

      // Create simple geometric representations for different animals
      let template: Mesh;
      switch (animalType) {
        case 'chicken':
          template = MeshBuilder.CreateSphere(
            `${animalType}_template`,
            { diameter: 0.8 },
            this.scene
          );
          break;
        case 'cow':
          template = MeshBuilder.CreateBox(
            `${animalType}_template`,
            { width: 2, height: 1.5, depth: 3 },
            this.scene
          );
          break;
        case 'pig':
          template = MeshBuilder.CreateCylinder(
            `${animalType}_template`,
            { height: 1, diameter: 1.5 },
            this.scene
          );
          break;
        case 'sheep':
          template = MeshBuilder.CreateSphere(
            `${animalType}_template`,
            { diameter: 1.2 },
            this.scene
          );
          break;
        default:
          template = MeshBuilder.CreateSphere(
            `${animalType}_template`,
            { diameter: 1 },
            this.scene
          );
      }

      const material = new StandardMaterial(`${animalType}_material`, this.scene);
      material.diffuseColor = Color3.FromHexString(info.color);
      material.emissiveColor = Color3.FromHexString(info.color).scale(0.1);

      template.material = material;
      template.setEnabled(false);

      this.animalTemplates.set(animalType, template);
    });
  }

  purchaseAnimal(animalType: AnimalType, position: Vector3): boolean {
    const info = this.animalInfo[animalType];
    
    if (!this.farmExpansionSystem.isPositionOnOwnedLand(position)) {
      console.log("You don't own this land!");
      return false;
    }

    if (this.economySystem.getMoney() < info.purchasePrice) {
      console.log(`Not enough money to buy ${info.name}. Need $${info.purchasePrice}`);
      return false;
    }

    const animalId = `animal_${this.nextAnimalId++}`;
    const template = this.animalTemplates.get(animalType);

    if (!template) {
      console.log(`Template not found for ${animalType}`);
      return false;
    }

    const animalMesh = template.createInstance(animalId);
    animalMesh.position = position.clone();

    const timeData = this.timeSystem.getTimeData();
    const animal: AnimalData = {
      id: animalId,
      type: animalType,
      position: position.clone(),
      age: 0,
      happiness: 100,
      health: 100,
      lastFed: timeData.day,
      mesh: animalMesh,
    };

    this.animals.set(animalId, animal);
    this.economySystem.setMoney(this.economySystem.getMoney() - info.purchasePrice);

    console.log(`Purchased ${info.name} for $${info.purchasePrice} at position (${position.x}, ${position.z})`);
    return true;
  }

  feedAnimals(): void {
    const timeData = this.timeSystem.getTimeData();
    let totalCost = 0;
    let fedCount = 0;

    this.animals.forEach(animal => {
      const info = this.animalInfo[animal.type];
      
      // Check if animal needs feeding (not fed today)
      if (animal.lastFed < timeData.day) {
        if (this.economySystem.getMoney() >= info.dailyUpkeep) {
          animal.lastFed = timeData.day;
          animal.happiness = Math.min(100, animal.happiness + 20);
          animal.health = Math.min(100, animal.health + 10);
          totalCost += info.dailyUpkeep;
          fedCount++;
        } else {
          // Can't afford to feed, reduce happiness and health
          animal.happiness = Math.max(0, animal.happiness - 10);
          animal.health = Math.max(0, animal.health - 5);
        }
      }
    });

    if (totalCost > 0) {
      this.economySystem.setMoney(this.economySystem.getMoney() - totalCost);
      console.log(`Fed ${fedCount} animals for $${totalCost}`);
    }
  }

  collectProducts(): { [productType: string]: number } {
    const products: { [productType: string]: number } = {};

    this.animals.forEach(animal => {
      const info = this.animalInfo[animal.type];
      
      // Only mature, healthy, and happy animals produce
      if (animal.age >= info.maturityAge && animal.health > 50 && animal.happiness > 30) {
        // Random chance based on production rate
        if (Math.random() < info.productionRate) {
          const productType = info.productType;
          products[productType] = (products[productType] || 0) + 1;
        }
      }
    });

    // Add products to economy (convert to money for now)
    let totalValue = 0;
    Object.entries(products).forEach(([productType, quantity]) => {
      // Find the value of this product type
      const productValue = Object.values(this.animalInfo).find(info => info.productType === productType)?.productValue || 0;
      totalValue += quantity * productValue;
    });

    if (totalValue > 0) {
      this.economySystem.setMoney(this.economySystem.getMoney() + totalValue);
      console.log(`Collected animal products worth $${totalValue}:`, products);
    }

    return products;
  }

  update(): void {
    const timeData = this.timeSystem.getTimeData();
    
    this.animals.forEach(animal => {
      this.updateAnimalAge(animal, timeData);
      this.updateAnimalHealth(animal, timeData);
      this.updateAnimalAppearance(animal);
    });
  }

  private updateAnimalAge(animal: AnimalData, timeData: any): void {
    // Age animals based on time progression
    const currentDay = timeData.season === 'Spring' ? timeData.day :
                      timeData.season === 'Summer' ? timeData.day + 28 :
                      timeData.season === 'Fall' ? timeData.day + 56 :
                      timeData.day + 84;
    
    // Simple aging - could be made more sophisticated
    if (currentDay > animal.age) {
      animal.age = currentDay;
    }
  }

  private updateAnimalHealth(animal: AnimalData, timeData: any): void {
    // Health decreases if not fed
    if (animal.lastFed < timeData.day - 1) {
      animal.health = Math.max(0, animal.health - 2);
      animal.happiness = Math.max(0, animal.happiness - 5);
    }

    // Happiness slowly decreases over time
    if (Math.random() < 0.1) {
      animal.happiness = Math.max(0, animal.happiness - 1);
    }
  }

  private updateAnimalAppearance(animal: AnimalData): void {
    if (!animal.mesh) return;

    // Scale animals based on age and health
    const info = this.animalInfo[animal.type];
    const maturityRatio = Math.min(1, animal.age / info.maturityAge);
    const healthRatio = animal.health / 100;
    
    const scale = 0.5 + (maturityRatio * 0.5); // Grow from 50% to 100% size
    animal.mesh.scaling = new Vector3(scale, scale, scale);

    // Adjust opacity based on health
    const material = animal.mesh.material as StandardMaterial;
    if (material) {
      material.alpha = 0.5 + (healthRatio * 0.5); // 50% to 100% opacity
    }
  }

  getAnimalCount(): number {
    return this.animals.size;
  }

  getAnimalsByType(): { [type: string]: number } {
    const counts: { [type: string]: number } = {};
    this.animals.forEach(animal => {
      counts[animal.type] = (counts[animal.type] || 0) + 1;
    });
    return counts;
  }

  getAnimalInfo(animalType: AnimalType): AnimalInfo {
    return this.animalInfo[animalType];
  }

  getAllAnimalTypes(): AnimalType[] {
    return Object.keys(this.animalInfo) as AnimalType[];
  }

  getSaveData(): {
    animals: Array<{
      id: string;
      type: AnimalType;
      position: { x: number; y: number; z: number };
      age: number;
      happiness: number;
      health: number;
      lastFed: number;
    }>;
  } {
    return {
      animals: Array.from(this.animals.values()).map(animal => ({
        id: animal.id,
        type: animal.type,
        position: { x: animal.position.x, y: animal.position.y, z: animal.position.z },
        age: animal.age,
        happiness: animal.happiness,
        health: animal.health,
        lastFed: animal.lastFed,
      })),
    };
  }

  loadSaveData(data: {
    animals: Array<{
      id: string;
      type: AnimalType;
      position: { x: number; y: number; z: number };
      age: number;
      happiness: number;
      health: number;
      lastFed: number;
    }>;
  }): void {
    if (!data || !data.animals) return;

    // Clear existing animals
    this.animals.forEach(animal => {
      if (animal.mesh) {
        animal.mesh.dispose();
      }
    });
    this.animals.clear();

    // Recreate animals from save data
    data.animals.forEach(savedAnimal => {
      const template = this.animalTemplates.get(savedAnimal.type);
      if (!template) return;

      const animalMesh = template.createInstance(savedAnimal.id);
      animalMesh.position = new Vector3(savedAnimal.position.x, savedAnimal.position.y, savedAnimal.position.z);

      const animal: AnimalData = {
        id: savedAnimal.id,
        type: savedAnimal.type,
        position: new Vector3(savedAnimal.position.x, savedAnimal.position.y, savedAnimal.position.z),
        age: savedAnimal.age,
        happiness: savedAnimal.happiness,
        health: savedAnimal.health,
        lastFed: savedAnimal.lastFed,
        mesh: animalMesh,
      };

      this.animals.set(savedAnimal.id, animal);
      this.updateAnimalAppearance(animal);
    });

    // Update nextAnimalId to avoid conflicts
    const maxId = Math.max(0, ...data.animals.map(a => parseInt(a.id.replace('animal_', '')) || 0));
    this.nextAnimalId = maxId + 1;

    console.log(`Livestock system data loaded: ${data.animals.length} animals restored`);
  }
}