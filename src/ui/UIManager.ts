import { TimeSystem } from '../systems/TimeSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { EquipmentSystem, Equipment } from '../systems/EquipmentSystem';

export class UIManager {
  private timeSystem: TimeSystem;
  private weatherSystem: WeatherSystem;
  private cropSystem: CropSystem;
  private economySystem: EconomySystem;
  private equipmentSystem: EquipmentSystem;
  private isShopOpen: boolean = false;
  private currentShopCategory: number = 0;

  constructor(
    timeSystem: TimeSystem,
    weatherSystem: WeatherSystem,
    cropSystem: CropSystem,
    economySystem: EconomySystem,
    equipmentSystem: EquipmentSystem
  ) {
    this.timeSystem = timeSystem;
    this.weatherSystem = weatherSystem;
    this.cropSystem = cropSystem;
    this.economySystem = economySystem;
    this.equipmentSystem = equipmentSystem;
  }

  initialize(): void {
    this.updateUI();
    this.setupPauseScreen();
    this.setupShop();
    console.log('UI Manager initialized');
  }

  update(): void {
    this.updateUI();
  }

  private updateUI(): void {
    this.updateTimeDisplay();
    this.updateWeatherDisplay();
    this.updateMoneyDisplay();
    this.updateCropDisplay();
    this.updateInventoryDisplay();
  }

  private updateTimeDisplay(): void {
    const timeData = this.timeSystem.getTimeData();
    const timeElement = document.getElementById('time');
    const seasonElement = document.getElementById('season');

    if (timeElement) {
      timeElement.textContent = this.timeSystem.getFormattedTime();
    }

    if (seasonElement) {
      seasonElement.textContent = `${timeData.season} Day ${timeData.day}`;
    }
  }

  private updateWeatherDisplay(): void {
    const weatherData = this.weatherSystem.getWeatherData();
    const weatherElement = document.getElementById('weather');

    if (weatherElement) {
      weatherElement.textContent = `${weatherData.type} (${Math.round(weatherData.temperature)}°C)`;
    }
  }

  private updateMoneyDisplay(): void {
    const moneyElement = document.getElementById('money');
    if (moneyElement) {
      const money = this.economySystem.getMoney();
      moneyElement.textContent = `$${money.toLocaleString()}`;
    }
  }

  private updateCropDisplay(): void {
    const cropsElement = document.getElementById('crops');
    if (cropsElement) {
      const cropCount = this.cropSystem.getCropCount();
      const matureCropCount = this.cropSystem.getMatureCropCount();
      cropsElement.textContent = `${cropCount} planted, ${matureCropCount} ready`;
    }
  }

  updateSelectedCrop(cropType: string): void {
    const selectedCropElement = document.getElementById('selected-crop');
    if (selectedCropElement) {
      const cropInfo = this.cropSystem.getCropInfo(cropType as CropType);
      const seedPrice = this.economySystem.getSeedPrice(cropType as CropType);
      const canAfford = this.economySystem.canAffordSeeds(cropType as CropType);
      const affordText = canAfford ? '' : ' (💰)';
      selectedCropElement.textContent = `${cropInfo.name} ($${seedPrice})${affordText}`;
    }
  }

  private updateInventoryDisplay(): void {
    const inventory = this.economySystem.getInventory();
    const marketPrices = this.economySystem.getMarketPrices();

    const inventoryElement = document.getElementById('inventory');
    if (inventoryElement) {
      const inventoryItems: string[] = [];
      inventory.forEach((quantity, cropType) => {
        if (quantity > 0) {
          const price = marketPrices[cropType];
          inventoryItems.push(`${cropType}: ${quantity} ($${price})`);
        }
      });

      if (inventoryItems.length > 0) {
        inventoryElement.textContent = inventoryItems.join(', ');
      } else {
        inventoryElement.textContent = 'Empty';
      }
    }
  }

  private setupPauseScreen(): void {
    const resumeButton = document.getElementById('resume-button');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const restartButton = document.getElementById('restart-button');

    if (resumeButton) {
      resumeButton.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        this.setPauseState(false);
        (window as any).game?.togglePause();
      });
    }

    if (saveButton) {
      saveButton.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        (window as any).game?.saveGame();
      });
    }

    if (loadButton) {
      loadButton.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        const success = (window as any).game?.loadGame();
        if (success) {
          this.setPauseState(false);
          (window as any).game?.togglePause();
        }
      });
    }

    if (restartButton) {
      restartButton.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        this.setPauseState(false);
        (window as any).game?.restartGame();
      });
    }

    this.updateLoadButtonState();
  }

  private updateLoadButtonState(): void {
    const loadButton = document.getElementById(
      'load-button'
    ) as HTMLButtonElement;
    if (loadButton) {
      const hasSave = (window as any).game?.hasSaveData();
      loadButton.disabled = !hasSave;
      loadButton.style.opacity = hasSave ? '1' : '0.5';
      loadButton.style.cursor = hasSave ? 'pointer' : 'not-allowed';
    }
  }

  setPauseState(isPaused: boolean): void {
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
      pauseScreen.style.display = isPaused ? 'flex' : 'none';
      if (isPaused) {
        this.updateLoadButtonState();
      }
    }
  }

  showSaveMessage(message: string): void {
    // Create or update save message element
    let saveMessage = document.getElementById('save-message');
    if (!saveMessage) {
      saveMessage = document.createElement('div');
      saveMessage.id = 'save-message';
      saveMessage.style.cssText = `
        position: absolute;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        z-index: 200;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(saveMessage);
    }

    saveMessage.textContent = message;
    saveMessage.style.opacity = '1';

    // Hide after 2 seconds
    setTimeout(() => {
      if (saveMessage) {
        saveMessage.style.opacity = '0';
      }
    }, 2000);
  }

  private setupShop(): void {
    const shopClose = document.getElementById('shop-close');
    if (shopClose) {
      shopClose.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        this.toggleShop();
      });
    }

    // Setup category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        (window as any).game?.getAudioManager()?.playSound('interaction_click');
        this.switchCategory(index);
      });
    });

    this.updateShop();
  }

  toggleShop(): void {
    this.isShopOpen = !this.isShopOpen;
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) {
      shopScreen.style.display = this.isShopOpen ? 'block' : 'none';
      if (this.isShopOpen) {
        this.updateShop();
      }
    }
  }

  private switchCategory(categoryIndex: number): void {
    this.currentShopCategory = categoryIndex;

    // Update tab appearance
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach((tab, index) => {
      if (index === categoryIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.updateShopItems();
  }

  private updateShop(): void {
    this.updateShopMoney();
    this.updateShopItems();
  }

  private updateShopMoney(): void {
    const shopMoney = document.getElementById('shop-money');
    if (shopMoney) {
      shopMoney.textContent = this.economySystem.getMoney().toLocaleString();
    }
  }

  private updateShopItems(): void {
    const equipmentGrid = document.getElementById('equipment-grid');
    if (!equipmentGrid) return;

    const categories = this.equipmentSystem.getEquipmentByCategory();
    const currentCategory = categories[this.currentShopCategory];
    
    if (!currentCategory) return;

    equipmentGrid.innerHTML = '';

    currentCategory.items.forEach(equipment => {
      const card = this.createEquipmentCard(equipment);
      equipmentGrid.appendChild(card);
    });
  }

  private createEquipmentCard(equipment: Equipment): HTMLElement {
    const card = document.createElement('div');
    card.className = `equipment-card ${equipment.owned ? 'owned' : ''}`;

    const effectsHtml = Object.entries(equipment.effects)
      .map(([key, value]) => {
        if (value === undefined) return '';
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const formattedValue = typeof value === 'number' 
          ? (key.includes('Speed') || key.includes('Yield') || key.includes('Efficiency') || key.includes('Rate'))
            ? `+${Math.round((value - 1) * 100)}%`
            : `+${value.toLocaleString()}`
          : value;
        return `<div class="equipment-effect">• ${formattedKey}: ${formattedValue}</div>`;
      })
      .filter(html => html !== '')
      .join('');

    const canAfford = this.economySystem.getMoney() >= equipment.price;
    
    card.innerHTML = `
      <div class="equipment-name">${equipment.name}</div>
      <div class="equipment-description">${equipment.description}</div>
      <div class="equipment-effects">${effectsHtml}</div>
      <div class="equipment-price">$${equipment.price.toLocaleString()}</div>
      ${equipment.owned 
        ? '<button class="equipment-owned">Owned</button>'
        : `<button class="equipment-buy" ${!canAfford ? 'disabled' : ''} data-equipment-id="${equipment.id}">
             ${canAfford ? 'Buy' : 'Not enough money'}
           </button>`
      }
    `;

    // Add buy button event listener
    const buyButton = card.querySelector('.equipment-buy');
    if (buyButton && !equipment.owned && canAfford) {
      buyButton.addEventListener('click', () => {
        this.purchaseEquipment(equipment.id);
      });
    }

    return card;
  }

  private purchaseEquipment(equipmentId: string): void {
    const success = (window as any).game?.purchaseEquipment(equipmentId);
    if (success) {
      this.updateShop();
      this.showSaveMessage('Equipment Purchased!');
    } else {
      this.showSaveMessage('Purchase Failed!');
    }
  }
}
