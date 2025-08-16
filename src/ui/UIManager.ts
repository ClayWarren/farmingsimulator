import { TimeSystem } from '../systems/TimeSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { CropSystem, CropType } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';

export class UIManager {
    private timeSystem: TimeSystem;
    private weatherSystem: WeatherSystem;
    private cropSystem: CropSystem;
    private economySystem: EconomySystem;

    constructor(timeSystem: TimeSystem, weatherSystem: WeatherSystem, cropSystem: CropSystem, economySystem: EconomySystem) {
        this.timeSystem = timeSystem;
        this.weatherSystem = weatherSystem;
        this.cropSystem = cropSystem;
        this.economySystem = economySystem;
    }

    initialize(): void {
        this.updateUI();
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
}