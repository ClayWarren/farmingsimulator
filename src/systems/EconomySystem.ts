import { CropType } from './CropSystem';

export interface InventoryItem {
  type: CropType;
  quantity: number;
}

export interface MarketPrices {
  wheat: number;
  corn: number;
  potato: number;
  carrot: number;
}

export interface SeedPrices {
  wheat: number;
  corn: number;
  potato: number;
  carrot: number;
}

export class EconomySystem {
  private money: number = 10000;
  private inventory: Map<CropType, number> = new Map();
  private marketPrices!: MarketPrices;
  private seedPrices!: SeedPrices;
  private lastPriceUpdate: number = 0;
  private priceUpdateInterval: number = 300;

  constructor() {
    this.initializeInventory();
    this.initializePrices();
  }

  initialize(): void {
    console.log('Economy system initialized');
  }

  private initializeInventory(): void {
    this.inventory.set('wheat', 0);
    this.inventory.set('corn', 0);
    this.inventory.set('potato', 0);
    this.inventory.set('carrot', 0);
  }

  private initializePrices(): void {
    this.seedPrices = {
      wheat: 2,
      corn: 3,
      potato: 4,
      carrot: 1,
    };

    this.marketPrices = {
      wheat: 8,
      corn: 12,
      potato: 10,
      carrot: 6,
    };
  }

  update(deltaTime: number): void {
    this.lastPriceUpdate += deltaTime;

    if (this.lastPriceUpdate >= this.priceUpdateInterval) {
      this.updateMarketPrices();
      this.lastPriceUpdate = 0;
    }
  }

  private updateMarketPrices(): void {
    const basePrices = {
      wheat: 8,
      corn: 12,
      potato: 10,
      carrot: 6,
    };

    Object.keys(this.marketPrices).forEach(cropType => {
      const crop = cropType as CropType;
      const basePrice = basePrices[crop];
      const variation = (Math.random() - 0.5) * 0.4;
      this.marketPrices[crop] = Math.round(basePrice * (1 + variation));
    });

    console.log('Market prices updated:', this.marketPrices);
  }

  buySeeds(cropType: CropType, quantity: number = 1): boolean {
    const totalCost = this.seedPrices[cropType] * quantity;

    if (this.money >= totalCost) {
      this.money -= totalCost;
      console.log(`Bought ${quantity} ${cropType} seeds for $${totalCost}`);
      return true;
    } else {
      console.log(
        `Not enough money to buy ${quantity} ${cropType} seeds (need $${totalCost}, have $${this.money})`
      );
      return false;
    }
  }

  sellCrop(cropType: CropType, quantity: number): boolean {
    const currentInventory = this.inventory.get(cropType) || 0;

    if (currentInventory >= quantity) {
      const revenue = this.marketPrices[cropType] * quantity;
      this.inventory.set(cropType, currentInventory - quantity);
      this.money += revenue;

      console.log(`Sold ${quantity} ${cropType}(s) for $${revenue}`);
      return true;
    } else {
      console.log(
        `Not enough ${cropType} in inventory (have ${currentInventory}, trying to sell ${quantity})`
      );
      return false;
    }
  }

  addToInventory(cropType: CropType, quantity: number): void {
    const currentQuantity = this.inventory.get(cropType) || 0;
    this.inventory.set(cropType, currentQuantity + quantity);
    console.log(`Added ${quantity} ${cropType}(s) to inventory`);
  }

  getMoney(): number {
    return this.money;
  }

  setMoney(amount: number): void {
    this.money = Math.max(0, amount);
  }

  getInventory(): Map<CropType, number> {
    return new Map(this.inventory);
  }

  getInventoryQuantity(cropType: CropType): number {
    return this.inventory.get(cropType) || 0;
  }

  getMarketPrices(): MarketPrices {
    return { ...this.marketPrices };
  }

  getSeedPrices(): SeedPrices {
    return { ...this.seedPrices };
  }

  getSeedPrice(cropType: CropType): number {
    return this.seedPrices[cropType];
  }

  getMarketPrice(cropType: CropType): number {
    return this.marketPrices[cropType];
  }

  getTotalInventoryValue(): number {
    let totalValue = 0;
    this.inventory.forEach((quantity, cropType) => {
      totalValue += quantity * this.marketPrices[cropType];
    });
    return totalValue;
  }

  getNetWorth(): number {
    return this.money + this.getTotalInventoryValue();
  }

  canAffordSeeds(cropType: CropType, quantity: number = 1): boolean {
    return this.money >= this.seedPrices[cropType] * quantity;
  }

  sellAllOfType(cropType: CropType): number {
    const quantity = this.inventory.get(cropType) || 0;
    if (quantity > 0) {
      this.sellCrop(cropType, quantity);
      return quantity;
    }
    return 0;
  }

  sellAllCrops(): { [key in CropType]: number } {
    const results: { [key in CropType]: number } = {
      wheat: 0,
      corn: 0,
      potato: 0,
      carrot: 0,
    };

    Object.keys(results).forEach(cropType => {
      const crop = cropType as CropType;
      results[crop] = this.sellAllOfType(crop);
    });

    return results;
  }

  // Save/Load functionality
  getSaveData(): {
    money: number;
    inventory: { [key: string]: number };
    marketPrices: MarketPrices;
    lastPriceUpdate: number;
  } {
    const inventoryObj: { [key: string]: number } = {};
    this.inventory.forEach((value, key) => {
      inventoryObj[key] = value;
    });

    return {
      money: this.money,
      inventory: inventoryObj,
      marketPrices: { ...this.marketPrices },
      lastPriceUpdate: this.lastPriceUpdate,
    };
  }

  loadSaveData(saveData: {
    money: number;
    inventory: { [key: string]: number };
    marketPrices: MarketPrices;
    lastPriceUpdate: number;
  }): void {
    this.money = saveData.money || 10000;

    // Load inventory
    this.inventory.clear();
    Object.entries(saveData.inventory || {}).forEach(([cropType, quantity]) => {
      this.inventory.set(cropType as CropType, quantity);
    });

    // Ensure all crop types exist in inventory
    this.initializeInventory();
    Object.entries(saveData.inventory || {}).forEach(([cropType, quantity]) => {
      this.inventory.set(cropType as CropType, quantity);
    });

    // Load market prices
    this.marketPrices = { ...saveData.marketPrices };
    this.lastPriceUpdate = saveData.lastPriceUpdate || 0;

    console.log('Economy system data loaded');
  }
}
