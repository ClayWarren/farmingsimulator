export type EquipmentType = 'tool' | 'vehicle' | 'storage' | 'processing';

export type ToolType = 'basic_hoe' | 'iron_hoe' | 'steel_hoe' | 'watering_can' | 'fertilizer_spreader';
export type VehicleType = 'basic_tractor' | 'advanced_tractor' | 'harvester';
export type StorageType = 'small_silo' | 'large_silo' | 'warehouse';
export type ProcessingType = 'grain_mill' | 'food_processor' | 'packaging_plant';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  type: EquipmentType;
  subtype: ToolType | VehicleType | StorageType | ProcessingType;
  price: number;
  owned: boolean;
  effects: EquipmentEffects;
}

export interface EquipmentEffects {
  plantingSpeed?: number; // Multiplier for planting speed
  harvestSpeed?: number; // Multiplier for harvest speed
  cropYield?: number; // Multiplier for crop yield
  storageCapacity?: number; // Additional storage slots
  fuelEfficiency?: number; // Vehicle fuel efficiency
  processingRate?: number; // Rate of processing crops
}

export interface EquipmentCategory {
  name: string;
  description: string;
  items: Equipment[];
}

export class EquipmentSystem {
  private ownedEquipment: Set<string> = new Set();
  private equipmentCatalog: Equipment[] = [];

  constructor() {
    this.initializeEquipmentCatalog();
  }

  initialize(): void {
    // Start with basic hoe
    this.ownedEquipment.add('basic_hoe');
    console.log('Equipment system initialized');
  }

  private initializeEquipmentCatalog(): void {
    this.equipmentCatalog = [
      // Tools
      {
        id: 'basic_hoe',
        name: 'Basic Hoe',
        description: 'A simple farming hoe for basic planting.',
        type: 'tool',
        subtype: 'basic_hoe',
        price: 0, // Starting tool
        owned: true,
        effects: {
          plantingSpeed: 1.0,
          harvestSpeed: 1.0,
          cropYield: 1.0,
        },
      },
      {
        id: 'iron_hoe',
        name: 'Iron Hoe',
        description: 'An upgraded hoe that plants faster and yields more crops.',
        type: 'tool',
        subtype: 'iron_hoe',
        price: 2500,
        owned: false,
        effects: {
          plantingSpeed: 1.5,
          harvestSpeed: 1.3,
          cropYield: 1.2,
        },
      },
      {
        id: 'steel_hoe',
        name: 'Steel Hoe',
        description: 'Premium hoe with maximum efficiency and crop yield.',
        type: 'tool',
        subtype: 'steel_hoe',
        price: 8000,
        owned: false,
        effects: {
          plantingSpeed: 2.0,
          harvestSpeed: 1.8,
          cropYield: 1.5,
        },
      },
      {
        id: 'watering_can',
        name: 'Watering Can',
        description: 'Speeds up crop growth when used.',
        type: 'tool',
        subtype: 'watering_can',
        price: 1200,
        owned: false,
        effects: {
          cropYield: 1.1,
        },
      },
      {
        id: 'fertilizer_spreader',
        name: 'Fertilizer Spreader',
        description: 'Significantly boosts crop yield.',
        type: 'tool',
        subtype: 'fertilizer_spreader',
        price: 3500,
        owned: false,
        effects: {
          cropYield: 1.4,
        },
      },
      
      // Vehicles
      {
        id: 'advanced_tractor',
        name: 'Advanced Tractor',
        description: 'Faster tractor with better fuel efficiency.',
        type: 'vehicle',
        subtype: 'advanced_tractor',
        price: 15000,
        owned: false,
        effects: {
          plantingSpeed: 1.8,
          harvestSpeed: 1.6,
          fuelEfficiency: 1.5,
        },
      },
      {
        id: 'harvester',
        name: 'Combine Harvester',
        description: 'Specialized vehicle for efficient mass harvesting.',
        type: 'vehicle',
        subtype: 'harvester',
        price: 35000,
        owned: false,
        effects: {
          harvestSpeed: 3.0,
          cropYield: 1.3,
        },
      },

      // Storage
      {
        id: 'small_silo',
        name: 'Small Silo',
        description: 'Increases crop storage capacity.',
        type: 'storage',
        subtype: 'small_silo',
        price: 5000,
        owned: false,
        effects: {
          storageCapacity: 1000,
        },
      },
      {
        id: 'large_silo',
        name: 'Large Silo',
        description: 'Massive storage capacity for your crops.',
        type: 'storage',
        subtype: 'large_silo',
        price: 12000,
        owned: false,
        effects: {
          storageCapacity: 5000,
        },
      },
      {
        id: 'warehouse',
        name: 'Warehouse',
        description: 'Ultimate storage solution with climate control.',
        type: 'storage',
        subtype: 'warehouse',
        price: 25000,
        owned: false,
        effects: {
          storageCapacity: 15000,
          cropYield: 1.1, // Prevents spoilage
        },
      },

      // Processing
      {
        id: 'grain_mill',
        name: 'Grain Mill',
        description: 'Process wheat into flour for higher profits.',
        type: 'processing',
        subtype: 'grain_mill',
        price: 18000,
        owned: false,
        effects: {
          processingRate: 1.0,
        },
      },
      {
        id: 'food_processor',
        name: 'Food Processor',
        description: 'Process vegetables into premium products.',
        type: 'processing',
        subtype: 'food_processor',
        price: 22000,
        owned: false,
        effects: {
          processingRate: 1.2,
        },
      },
      {
        id: 'packaging_plant',
        name: 'Packaging Plant',
        description: 'Package processed goods for maximum value.',
        type: 'processing',
        subtype: 'packaging_plant',
        price: 45000,
        owned: false,
        effects: {
          processingRate: 2.0,
        },
      },
    ];
  }

  getAllEquipment(): Equipment[] {
    return this.equipmentCatalog.map(item => ({
      ...item,
      owned: this.ownedEquipment.has(item.id),
    }));
  }

  getEquipmentByCategory(): EquipmentCategory[] {
    const categories: EquipmentCategory[] = [
      {
        name: 'Tools',
        description: 'Hand tools and farming implements',
        items: [],
      },
      {
        name: 'Vehicles',
        description: 'Tractors and specialized farming vehicles',
        items: [],
      },
      {
        name: 'Storage',
        description: 'Silos and storage facilities',
        items: [],
      },
      {
        name: 'Processing',
        description: 'Equipment for processing crops into products',
        items: [],
      },
    ];

    this.getAllEquipment().forEach(item => {
      switch (item.type) {
        case 'tool':
          categories[0].items.push(item);
          break;
        case 'vehicle':
          categories[1].items.push(item);
          break;
        case 'storage':
          categories[2].items.push(item);
          break;
        case 'processing':
          categories[3].items.push(item);
          break;
      }
    });

    return categories;
  }

  getOwnedEquipment(): Equipment[] {
    return this.getAllEquipment().filter(item => item.owned);
  }

  ownsEquipment(equipmentId: string): boolean {
    return this.ownedEquipment.has(equipmentId);
  }

  purchaseEquipment(equipmentId: string): boolean {
    if (this.ownedEquipment.has(equipmentId)) {
      return false; // Already owned
    }

    const equipment = this.equipmentCatalog.find(item => item.id === equipmentId);
    if (!equipment) {
      return false; // Equipment not found
    }

    this.ownedEquipment.add(equipmentId);
    console.log(`Purchased ${equipment.name}`);
    return true;
  }

  getEquipmentEffects(): EquipmentEffects {
    const combinedEffects: EquipmentEffects = {
      plantingSpeed: 1.0,
      harvestSpeed: 1.0,
      cropYield: 1.0,
      storageCapacity: 0,
      fuelEfficiency: 1.0,
      processingRate: 1.0,
    };

    this.getOwnedEquipment().forEach(equipment => {
      const effects = equipment.effects;
      
      // Multiply speed and yield bonuses
      if (effects.plantingSpeed) {
        combinedEffects.plantingSpeed! *= effects.plantingSpeed;
      }
      if (effects.harvestSpeed) {
        combinedEffects.harvestSpeed! *= effects.harvestSpeed;
      }
      if (effects.cropYield) {
        combinedEffects.cropYield! *= effects.cropYield;
      }
      if (effects.fuelEfficiency) {
        combinedEffects.fuelEfficiency! *= effects.fuelEfficiency;
      }
      if (effects.processingRate) {
        combinedEffects.processingRate! *= effects.processingRate;
      }
      
      // Add storage capacity
      if (effects.storageCapacity) {
        combinedEffects.storageCapacity! += effects.storageCapacity;
      }
    });

    return combinedEffects;
  }

  getBestTool(): Equipment | null {
    const tools = this.getOwnedEquipment().filter(item => item.type === 'tool');
    if (tools.length === 0) return null;

    // Find tool with highest combined efficiency
    return tools.reduce((best, current) => {
      const bestEfficiency = (best.effects.plantingSpeed || 1) * (best.effects.harvestSpeed || 1) * (best.effects.cropYield || 1);
      const currentEfficiency = (current.effects.plantingSpeed || 1) * (current.effects.harvestSpeed || 1) * (current.effects.cropYield || 1);
      return currentEfficiency > bestEfficiency ? current : best;
    });
  }

  getBestVehicle(): Equipment | null {
    const vehicles = this.getOwnedEquipment().filter(item => item.type === 'vehicle');
    if (vehicles.length === 0) return null;

    // Find vehicle with highest speed
    return vehicles.reduce((best, current) => {
      const bestSpeed = Math.max(best.effects.plantingSpeed || 0, best.effects.harvestSpeed || 0);
      const currentSpeed = Math.max(current.effects.plantingSpeed || 0, current.effects.harvestSpeed || 0);
      return currentSpeed > bestSpeed ? current : best;
    });
  }

  getTotalStorageCapacity(): number {
    const baseCapacity = 500; // Base inventory capacity
    const bonusCapacity = this.getEquipmentEffects().storageCapacity || 0;
    return baseCapacity + bonusCapacity;
  }

  // Save/Load functionality
  getSaveData(): {
    ownedEquipment: string[];
  } {
    return {
      ownedEquipment: Array.from(this.ownedEquipment),
    };
  }

  loadSaveData(saveData: {
    ownedEquipment: string[];
  }): void {
    this.ownedEquipment.clear();
    
    // Ensure basic hoe is always owned
    this.ownedEquipment.add('basic_hoe');
    
    saveData.ownedEquipment?.forEach(equipmentId => {
      this.ownedEquipment.add(equipmentId);
    });

    console.log(`Equipment system loaded: ${this.ownedEquipment.size} items owned`);
  }
}