import { Scene, Ray, Vector3 } from '@babylonjs/core';
import { TimeSystem } from '../systems/TimeSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { EquipmentSystem, Equipment } from '../systems/EquipmentSystem';
import { FarmExpansionSystem } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { LivestockSystem } from '../systems/LivestockSystem';
import { AttachmentSystem, Attachment } from '../systems/AttachmentSystem';

export class UIManager {
  private scene: Scene;
  private timeSystem: TimeSystem;
  private weatherSystem: WeatherSystem;
  private cropSystem: CropSystem;
  private economySystem: EconomySystem;
  private equipmentSystem: EquipmentSystem;
  private farmExpansionSystem: FarmExpansionSystem;
  private buildingSystem: BuildingSystem;
  private livestockSystem: LivestockSystem;
  private attachmentSystem: AttachmentSystem;
  private isShopOpen: boolean = false;
  private currentShopCategory: number = 0;
  private onBuildingSelected?: (buildingId: string) => void;

  constructor(
    scene: Scene,
    timeSystem: TimeSystem,
    weatherSystem: WeatherSystem,
    cropSystem: CropSystem,
    economySystem: EconomySystem,
    equipmentSystem: EquipmentSystem,
    farmExpansionSystem: FarmExpansionSystem,
    buildingSystem: BuildingSystem,
    livestockSystem: LivestockSystem,
    attachmentSystem: AttachmentSystem
  ) {
    this.scene = scene;
    this.timeSystem = timeSystem;
    this.weatherSystem = weatherSystem;
    this.cropSystem = cropSystem;
    this.economySystem = economySystem;
    this.equipmentSystem = equipmentSystem;
    this.farmExpansionSystem = farmExpansionSystem;
    this.buildingSystem = buildingSystem;
    this.livestockSystem = livestockSystem;
    this.attachmentSystem = attachmentSystem;
  }

  initialize(): void {
    this.updateUI();
    this.setupPauseScreen();
    this.setupShop();
    console.log('UI Manager initialized');
  }

  update(): void {
    this.updateUI();
    this.updatePlotInfo();
    this.updateVehicleStatus();
  }

  private updatePlotInfo(): void {
    const plotInfoElement = document.getElementById('plot-info');
    if (!plotInfoElement) return;

    if (!this.scene.activeCamera) return;
    
    const ray = new Ray(this.scene.activeCamera.position, this.scene.activeCamera.getDirection(Vector3.Forward()));
    const pickInfo = this.scene.pickWithRay(ray, mesh => mesh.name.startsWith('for_sale_sign'));

    if (pickInfo && pickInfo.hit && pickInfo.pickedMesh) {
      const plotId = pickInfo.pickedMesh.name.replace('for_sale_sign_', '');
      const plot = this.farmExpansionSystem.getPlot(plotId);
      if (plot) {
        const plotNameElement = document.getElementById('plot-name');
        const plotPriceElement = document.getElementById('plot-price');
        if (plotNameElement && plotPriceElement) {
          plotNameElement.textContent = plot.name;
          plotPriceElement.textContent = `${plot.price.toLocaleString()}`;
          plotInfoElement.classList.remove('hidden');
        }
      }
    } else {
      plotInfoElement.classList.add('hidden');
    }
  }

  private updateUI(): void {
    this.updateTimeDisplay();
    this.updateWeatherDisplay();
    this.updateMoneyDisplay();
    this.updateCropDisplay();
    this.updateInventoryDisplay();
    this.updateLivestockDisplay();
  }

  setBuildModeStatus(isBuildMode: boolean): void {
    console.log('Setting build mode status:', isBuildMode);
    
    const buildModeStatusElement = document.getElementById('build-mode-status');
    const buildModeTextElement = document.getElementById('build-mode-text');
    const buildingSelectionPanel = document.getElementById('building-selection-panel');

    if (buildModeStatusElement && buildModeTextElement) {
      buildModeStatusElement.classList.toggle('hidden', !isBuildMode);
      buildModeTextElement.textContent = isBuildMode ? 'ON' : 'OFF';
      console.log('Build mode status element updated');
    } else {
      console.log('Build mode status elements not found!');
    }

    if (buildingSelectionPanel) {
      buildingSelectionPanel.classList.toggle('hidden', !isBuildMode);
      console.log('Building selection panel visibility:', isBuildMode ? 'shown' : 'hidden');
      if (isBuildMode) {
        this.populateBuildingList();
      }
    } else {
      console.log('Building selection panel not found!');
    }
  }

  private populateBuildingList(): void {
    const buildingListElement = document.getElementById('building-list');
    if (!buildingListElement) {
      console.log('Building list element not found!');
      return;
    }

    buildingListElement.innerHTML = ''; // Clear existing list

    const buildings = this.buildingSystem.getBuildingCatalog();
    console.log('Populating building list with', buildings.length, 'buildings');

    buildings.forEach(building => {
      const button = document.createElement('button');
      button.className = 'bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded text-sm pointer-events-auto';
      button.textContent = `${building.name} ($${building.price})`;
      button.addEventListener('click', () => {
        console.log('Building button clicked:', building.id);
        if (this.onBuildingSelected) {
          this.onBuildingSelected(building.id);
        } else {
          console.log('No onBuildingSelected callback set!');
        }
      });
      buildingListElement.appendChild(button);
    });
    
    console.log('Building list populated with', buildingListElement.children.length, 'buttons');
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

  private updateLivestockDisplay(): void {
    const livestockElement = document.getElementById('livestock');
    if (livestockElement) {
      const animalCount = this.livestockSystem.getAnimalCount();
      const animalsByType = this.livestockSystem.getAnimalsByType();
      
      if (animalCount > 0) {
        const typesList = Object.entries(animalsByType)
          .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
          .join(', ');
        livestockElement.textContent = `${animalCount} animals: ${typesList}`;
      } else {
        livestockElement.textContent = 'No animals';
      }
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
      loadButton.classList.toggle('opacity-50', !hasSave);
      loadButton.classList.toggle('cursor-not-allowed', !hasSave);
    }
  }

  setPauseState(isPaused: boolean): void {
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
      pauseScreen.classList.toggle('hidden', !isPaused);
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
      saveMessage.className = 'absolute top-24 left-1/2 -translate-x-1/2 bg-black/80 text-white py-3 px-6 rounded-md text-base font-bold z-[200] pointer-events-none opacity-0 transition-opacity duration-300';
      document.body.appendChild(saveMessage);
    }

    saveMessage.textContent = message;
    saveMessage.classList.remove('opacity-0');

    // Hide after 2 seconds
    setTimeout(() => {
      if (saveMessage) {
        saveMessage.classList.add('opacity-0');
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
      shopScreen.classList.toggle('hidden', !this.isShopOpen);
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
      const isActive = index === categoryIndex;
      tab.classList.toggle('active', isActive);
      tab.classList.toggle('bg-blue-600', isActive);
      tab.classList.toggle('text-white', isActive);
      tab.classList.toggle('bg-slate-700', !isActive);
      tab.classList.toggle('text-slate-400', !isActive);
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

    // Handle attachments category (index 4)
    if (this.currentShopCategory === 4) {
      equipmentGrid.innerHTML = '';
      const attachments = this.attachmentSystem.getAttachmentCatalog();
      attachments.forEach(attachment => {
        const card = this.createAttachmentCard(attachment);
        equipmentGrid.appendChild(card);
      });
      return;
    }
    
    // Handle regular equipment categories
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
    card.className = `bg-slate-900/80 border-2 border-slate-700 rounded-lg p-5 transition-all hover:border-blue-600 hover:-translate-y-1 ${equipment.owned ? 'border-green-600 bg-green-900/20' : ''}`;

    const effectsHtml = Object.entries(equipment.effects)
      .map(([key, value]) => {
        if (value === undefined) return '';
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const formattedValue = typeof value === 'number' 
          ? (key.includes('Speed') || key.includes('Yield') || key.includes('Efficiency') || key.includes('Rate'))
            ? `+${Math.round((value - 1) * 100)}%`
            : `+${value.toLocaleString()}`
          : value;
        return `<div class="text-xs text-slate-400 my-1">• ${formattedKey}: ${formattedValue}</div>`;
      })
      .filter(html => html !== '')
      .join('');

    const canAfford = this.economySystem.getMoney() >= equipment.price;
    
    card.innerHTML = `
      <div class="text-lg font-bold text-slate-100 mb-2">${equipment.name}</div>
      <div class="text-sm text-slate-300 mb-3 leading-snug">${equipment.description}</div>
      <div class="mb-4">${effectsHtml}</div>
      <div class="text-base font-bold text-amber-400 mb-3">${equipment.price.toLocaleString()}</div>
      ${equipment.owned 
        ? '<button class="w-full py-2 bg-green-600 text-white rounded-md text-sm font-bold cursor-default">Owned</button>'
        : `<button class="w-full py-2 bg-green-700 text-white rounded-md text-sm font-bold transition-colors hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed" ${!canAfford ? 'disabled' : ''} data-equipment-id="${equipment.id}">
             ${canAfford ? 'Buy' : 'Not enough money'}
           </button>`
      }
    `;

    // Add buy button event listener
    const buyButton = card.querySelector('button[data-equipment-id]');
    if (buyButton && !equipment.owned && canAfford) {
      buyButton.addEventListener('click', () => {
        this.purchaseEquipment(equipment.id);
      });
    }

    return card;
  }

  private createAttachmentCard(attachment: Attachment): HTMLElement {
    const card = document.createElement('div');
    card.className = `bg-slate-900/80 border-2 border-slate-700 rounded-lg p-5 transition-all hover:border-blue-600 hover:-translate-y-1 ${attachment.owned ? 'border-green-600 bg-green-900/20' : ''}`;

    const effectsHtml = Object.entries(attachment.effects)
      .map(([key, value]) => {
        if (value === undefined) return '';
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        const formattedValue = typeof value === 'number' 
          ? (key.includes('Speed') || key.includes('Efficiency'))
            ? `+${Math.round((value - 1) * 100)}%`
            : `${value}x`
          : value;
        return `<div class="text-xs text-slate-400 my-1">• ${formattedKey}: ${formattedValue}</div>`;
      })
      .filter(html => html !== '')
      .join('');

    const canAfford = this.economySystem.getMoney() >= attachment.price;
    
    card.innerHTML = `
      <div class="text-lg font-bold text-slate-100 mb-2">${attachment.name}</div>
      <div class="text-sm text-slate-300 mb-3 leading-snug">${attachment.description}</div>
      <div class="mb-4">${effectsHtml}</div>
      <div class="text-base font-bold text-amber-400 mb-3">$${attachment.price.toLocaleString()}</div>
      ${attachment.owned 
        ? '<button class="w-full py-2 bg-green-600 text-white rounded-md text-sm font-bold cursor-default">Owned</button>'
        : `<button class="w-full py-2 bg-green-700 text-white rounded-md text-sm font-bold transition-colors hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed" ${!canAfford ? 'disabled' : ''} data-attachment-id="${attachment.id}">
             ${canAfford ? 'Buy' : 'Not enough money'}
           </button>`
      }
    `;

    // Add buy button event listener
    if (!attachment.owned && canAfford) {
      const buyButton = card.querySelector('button') as HTMLButtonElement;
      if (buyButton) {
        buyButton.addEventListener('click', () => {
          (window as any).game?.getAudioManager()?.playSound('interaction_click');
          this.purchaseAttachment(attachment.id);
        });
      }
    }

    return card;
  }

  private purchaseAttachment(attachmentId: string): void {
    const attachment = this.attachmentSystem.getAttachment(attachmentId);
    if (!attachment || attachment.owned) {
      this.showSaveMessage('Purchase Failed!');
      return;
    }

    if (this.economySystem.getMoney() >= attachment.price) {
      this.economySystem.setMoney(this.economySystem.getMoney() - attachment.price);
      this.attachmentSystem.purchaseAttachment(attachmentId);
      (window as any).game?.getAudioManager()?.playSound('economy_buy');
      this.updateShop();
      this.showSaveMessage('Attachment Purchased!');
    } else {
      this.showSaveMessage('Not enough money!');
    }
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

  private updateVehicleStatus(): void {
    const vehicleElement = document.getElementById('current-vehicle');
    const attachmentElement = document.getElementById('current-attachment');
    
    if (vehicleElement) {
      vehicleElement.textContent = 'On Foot'; // This will be updated by the input manager when entering vehicles
    }

    if (attachmentElement) {
      // Get current attachment from attachment system
      // Check all vehicles for attachments and show the first one found
      let currentAttachment = 'None';
      const vehicles = ['tractor_1', 'combine_harvester_1'];
      
      for (const vehicleId of vehicles) {
        const attachmentType = this.attachmentSystem.getCurrentAttachment(vehicleId);
        if (attachmentType) {
          const attachment = Array.from(this.attachmentSystem.getAttachmentCatalog())
            .find(att => att.type === attachmentType);
          if (attachment) {
            currentAttachment = attachment.name;
            break;
          }
        }
      }
      
      attachmentElement.textContent = currentAttachment;
    }
  }

  updateVehicleDisplay(vehicleName: string): void {
    const vehicleElement = document.getElementById('current-vehicle');
    if (vehicleElement) {
      vehicleElement.textContent = vehicleName;
    }
  }

  public setOnBuildingSelectedCallback(callback: (buildingId: string) => void): void {
    this.onBuildingSelected = callback;
  }
}
