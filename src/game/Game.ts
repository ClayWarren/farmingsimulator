import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  Color3,
  WebGPUEngine,
} from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { SaveManager, GameSaveData } from './SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { TimeSystem } from '../systems/TimeSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { CropSystem } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { FarmExpansionSystem } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { LivestockSystem } from '../systems/LivestockSystem';
import { FieldStateSystem } from '../systems/FieldStateSystem';
import { AttachmentSystem } from '../systems/AttachmentSystem';
import { UIManager } from '../ui/UIManager';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine!: Engine;
  private scene!: Scene;
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private timeSystem!: TimeSystem;
  private weatherSystem!: WeatherSystem;
  private cropSystem!: CropSystem;
  private economySystem!: EconomySystem;
  private vehicleSystem!: VehicleSystem;
  private equipmentSystem!: EquipmentSystem;
  private farmExpansionSystem!: FarmExpansionSystem;
  private buildingSystem!: BuildingSystem;
  private livestockSystem!: LivestockSystem;
  private fieldStateSystem!: FieldStateSystem;
  private attachmentSystem!: AttachmentSystem;
  private uiManager!: UIManager;
  private audioManager!: AudioManager;
  private isPaused: boolean = false;
  private lastWeatherType: string = '';
  private lastAutoSaveTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
  }

  async initialize(): Promise<void> {
    await this.createEngine();
    this.createScene();
    await this.initializeSystems();
    this.setupEventListeners();
  }

  private async createEngine(): Promise<void> {
    try {
      if (await WebGPUEngine.IsSupportedAsync) {
        const webgpuEngine = new WebGPUEngine(this.canvas, {
          adaptToDeviceRatio: true,
          antialias: true,
        });
        await webgpuEngine.initAsync();
        this.engine = webgpuEngine as unknown as Engine;
      } else {
        this.engine = new Engine(this.canvas, true, {
          adaptToDeviceRatio: true,
          antialias: true,
        });
      }
    } catch (error) {
      console.warn('WebGPU not available, falling back to WebGL:', error);
      this.engine = new Engine(this.canvas, true, {
        adaptToDeviceRatio: true,
        antialias: true,
      });
    }

    this.engine.setHardwareScalingLevel(1);
  }

  private createScene(): void {
    this.scene = new Scene(this.engine);
    this.scene.clearColor = Color3.FromHexString('#87CEEB').toColor4();

    const camera = new FreeCamera(
      'camera',
      new Vector3(0, 10, -20),
      this.scene
    );
    camera.setTarget(Vector3.Zero());
    camera.attachControl(this.canvas, true);
    camera.speed = 0.5;

    const light = new HemisphericLight(
      'light',
      new Vector3(0.5, 1, 0.3),
      this.scene
    );
    light.intensity = 1.2;
    light.diffuse = Color3.FromHexString('#FFF8DC');
    light.specular = Color3.FromHexString('#FFE4B5');
  }

  private async initializeSystems(): Promise<void> {
    this.farmExpansionSystem = new FarmExpansionSystem();
    this.buildingSystem = new BuildingSystem();
    this.timeSystem = new TimeSystem();
    this.weatherSystem = new WeatherSystem(this.scene);
    this.economySystem = new EconomySystem();
    this.economySystem.setBuildingSystem(this.buildingSystem);
    this.vehicleSystem = new VehicleSystem(this.scene);
    this.equipmentSystem = new EquipmentSystem();
    this.attachmentSystem = new AttachmentSystem(this.scene);
    this.cropSystem = new CropSystem(this.scene, this.timeSystem, this.equipmentSystem, this.farmExpansionSystem, this.weatherSystem, this.attachmentSystem);
    this.fieldStateSystem = new FieldStateSystem(this.scene, this.cropSystem, this.timeSystem);
    this.livestockSystem = new LivestockSystem(this.scene, this.timeSystem, this.economySystem, this.farmExpansionSystem);
    this.sceneManager = new SceneManager(this.scene, this.farmExpansionSystem, this.buildingSystem);
    this.audioManager = new AudioManager();
    this.inputManager = new InputManager(
      this.scene,
      this.canvas,
      this.cropSystem,
      this.economySystem,
      this.vehicleSystem,
      this.equipmentSystem,
      this.farmExpansionSystem,
      this.buildingSystem,
      this.livestockSystem,
      this.fieldStateSystem,
      this.attachmentSystem,
      this.audioManager
    );
    this.uiManager = new UIManager(
      this.scene,
      this.timeSystem,
      this.weatherSystem,
      this.cropSystem,
      this.economySystem,
      this.equipmentSystem,
      this.farmExpansionSystem,
      this.buildingSystem,
      this.livestockSystem,
      this.attachmentSystem
    );

    this.sceneManager.initialize();
    await this.audioManager.initialize();
    this.inputManager.initialize();
    this.timeSystem.initialize();
    this.weatherSystem.initialize();
    this.economySystem.initialize();
    this.vehicleSystem.initialize();
    this.equipmentSystem.initialize();
    this.attachmentSystem.initialize();
    this.farmExpansionSystem.initialize();
    this.buildingSystem.initialize();
    this.livestockSystem.initialize();
    this.cropSystem.initialize();
    this.fieldStateSystem.initialize();
    this.uiManager.initialize();

    // Start ambient sounds
    this.startAmbientSounds();

    this.inputManager.setCropSelectionCallback(cropType => {
      this.uiManager.updateSelectedCrop(cropType);
    });

    this.inputManager.setPauseCallback(() => {
      this.togglePause();
    });

    this.inputManager.setShopCallback(() => {
      this.uiManager.toggleShop();
    });

    this.inputManager.setToggleBuildModeCallback(isBuildMode => {
      this.uiManager.setBuildModeStatus(isBuildMode);
    });

    this.inputManager.setBuildingPlacedCallback(() => {
      this.sceneManager.refreshPlacedBuildings();
    });

    this.uiManager.setOnBuildingSelectedCallback(buildingId => {
      this.inputManager.setSelectedBuilding(buildingId);
    });

    this.vehicleSystem.setVehicleEnterCallback((vehicleName: string) => {
      this.uiManager.updateVehicleDisplay(vehicleName);
    });

    this.vehicleSystem.setVehicleExitCallback(() => {
      this.uiManager.updateVehicleDisplay('On Foot');
    });

    // Auto-load existing save on startup
    this.autoLoadOnStartup();
  }

  private startAmbientSounds(): void {
    // Start wind ambient loop
    this.audioManager.startAmbientLoop('ambient_wind', 'wind_loop');

    // Schedule random bird sounds
    this.scheduleBirdSounds();

    // Update ambient sounds based on weather
    this.updateWeatherSounds();
  }

  private scheduleBirdSounds(): void {
    const playBird = () => {
      if (!this.isPaused && this.timeSystem.isDaytime()) {
        this.audioManager.playSound('ambient_birds');
      }

      // Schedule next bird sound (5-15 seconds)
      const nextBirdDelay = 5000 + Math.random() * 10000;
      setTimeout(playBird, nextBirdDelay);
    };

    // Start first bird sound after 2-8 seconds
    const initialDelay = 2000 + Math.random() * 6000;
    setTimeout(playBird, initialDelay);
  }

  private updateWeatherSounds(): void {
    const weatherData = this.weatherSystem.getWeatherData();

    // Stop all weather loops first
    this.audioManager.stopAmbientLoop('rain_loop');
    this.audioManager.stopAmbientLoop('storm_loop');

    switch (weatherData.type) {
      case 'Rainy':
        this.audioManager.startAmbientLoop('weather_rain', 'rain_loop');
        break;
      case 'Stormy':
        this.audioManager.startAmbientLoop('weather_storm', 'storm_loop');
        break;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    // Resume audio context on first user interaction
    const resumeAudio = () => {
      this.audioManager.resume();
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });
  }

  private update(): void {
    if (this.isPaused) {
      return;
    }

    const deltaTime = this.engine.getDeltaTime() / 1000;

    this.timeSystem.update(deltaTime);
    this.weatherSystem.update(deltaTime);
    this.economySystem.update(deltaTime);
    this.vehicleSystem.update(deltaTime);
    this.livestockSystem.update();
    this.cropSystem.update();
    this.fieldStateSystem.update();
    this.fieldStateSystem.processFieldDecay();
    this.inputManager.update(deltaTime);
    this.uiManager.update();

    // Update vehicle attachments - ensure all attachments are properly parented
    const vehicles = this.vehicleSystem.getVehicles();
    vehicles.forEach((vehicle, vehicleId) => {
      this.attachmentSystem.updateVehicleAttachment(vehicleId, vehicle.mesh);
    });

    // Update weather sounds when weather changes
    const currentWeather = this.weatherSystem.getWeatherData().type;
    if (currentWeather !== this.lastWeatherType) {
      this.updateWeatherSounds();
      this.lastWeatherType = currentWeather;
    }

    // Auto-save every 5 minutes of game time
    this.handleAutoSave();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.uiManager.setPauseState(this.isPaused);

    if (this.isPaused) {
      this.scene.detachControl();
    } else {
      this.scene.attachControl();
    }
  }

  restartGame(): void {
    this.timeSystem.initialize();
    this.weatherSystem.initialize();
    this.economySystem.initialize();
    this.vehicleSystem.initialize();
    this.equipmentSystem.initialize();
    this.attachmentSystem.initialize();
    this.farmExpansionSystem.initialize();
    this.buildingSystem.initialize();
    this.livestockSystem.initialize();
    this.cropSystem.initialize();
    this.fieldStateSystem.initialize();
    this.isPaused = false;
    this.uiManager.setPauseState(false);
    this.scene.attachControl();
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  saveGame(): boolean {
    try {
      const camera = this.scene.activeCamera as FreeCamera;

      const saveData: GameSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        timeData: this.timeSystem.getSaveData(),
        economyData: this.economySystem.getSaveData(),
        cropsData: this.cropSystem.getSaveData(),
        weatherData: this.weatherSystem.getSaveData(),
        vehicleData: this.vehicleSystem.getSaveData(),
        equipmentData: this.equipmentSystem.getSaveData(),
        farmExpansionData: this.farmExpansionSystem.getSaveData(),
        buildingData: this.buildingSystem.getSaveData(),
        livestockData: this.livestockSystem.getSaveData(),
        fieldStateData: this.fieldStateSystem.getSaveData(),
        attachmentData: this.attachmentSystem.getSaveData(),
        playerPosition: SaveManager.vector3ToObject(camera.position),
        playerRotation: SaveManager.vector3ToObject(camera.rotation),
      };

      const success = SaveManager.saveGame(saveData);
      if (success) {
        console.log('Game saved successfully!');
        this.uiManager.showSaveMessage('Game Saved!');
      } else {
        console.error('Failed to save game');
        this.uiManager.showSaveMessage('Save Failed!');
      }
      return success;
    } catch (error) {
      console.error('Error saving game:', error);
      this.uiManager.showSaveMessage('Save Error!');
      return false;
    }
  }

  loadGame(): boolean {
    try {
      const saveData = SaveManager.loadGame();
      if (!saveData) {
        console.log('No save data found');
        this.uiManager.showSaveMessage('No Save Found!');
        return false;
      }

      // Load all systems
      this.timeSystem.loadSaveData(saveData.timeData);
      this.economySystem.loadSaveData(saveData.economyData);
      this.cropSystem.loadSaveData(saveData.cropsData);
      this.weatherSystem.loadSaveData(saveData.weatherData);
      this.vehicleSystem.loadSaveData(saveData.vehicleData);
      this.equipmentSystem.loadSaveData(saveData.equipmentData);
      this.farmExpansionSystem.loadSaveData(saveData.farmExpansionData);
      this.buildingSystem.loadSaveData(saveData.buildingData);
      this.livestockSystem.loadSaveData(saveData.livestockData);
      
      // Load field state data if available
      if (saveData.fieldStateData) {
        this.fieldStateSystem.loadSaveData(saveData.fieldStateData);
      }

      // Load attachment data if available
      if (saveData.attachmentData) {
        this.attachmentSystem.loadSaveData(saveData.attachmentData);
      }

      // Restore player position and rotation
      const camera = this.scene.activeCamera as FreeCamera;
      camera.position = SaveManager.objectToVector3(saveData.playerPosition);
      camera.rotation = SaveManager.objectToVector3(saveData.playerRotation);

      // Update UI
      this.uiManager.update();

      console.log('Game loaded successfully!');
      this.uiManager.showSaveMessage('Game Loaded!');
      return true;
    } catch (error) {
      console.error('Error loading game:', error);
      this.uiManager.showSaveMessage('Load Error!');
      return false;
    }
  }

  hasSaveData(): boolean {
    return SaveManager.hasSaveData();
  }

  deleteSave(): boolean {
    const success = SaveManager.deleteSave();
    if (success) {
      this.uiManager.showSaveMessage('Save Deleted!');
    }
    return success;
  }

  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  private handleAutoSave(): void {
    const currentTime = Date.now();
    const autoSaveInterval = 300000; // 5 minutes in milliseconds
    
    if (currentTime - this.lastAutoSaveTime >= autoSaveInterval) {
      this.saveGame();
      console.log('Auto-saved game progress');
      this.lastAutoSaveTime = currentTime;
    }
  }

  private autoLoadOnStartup(): void {
    // Check if there's existing save data and load it automatically
    if (this.hasSaveData()) {
      const success = this.loadGame();
      if (success) {
        console.log('Auto-loaded previous game save');
      } else {
        console.log('Auto-load failed, starting fresh');
      }
    } else {
      console.log('No existing save data, starting new game');
    }
  }

  purchaseEquipment(equipmentId: string): boolean {
    const equipment = this.equipmentSystem.getAllEquipment().find(e => e.id === equipmentId);
    if (!equipment || equipment.owned) {
      return false;
    }

    if (this.economySystem.getMoney() >= equipment.price) {
      this.economySystem.setMoney(this.economySystem.getMoney() - equipment.price);
      this.equipmentSystem.purchaseEquipment(equipmentId);
      this.audioManager.playSound('economy_buy');
      return true;
    }

    return false;
  }

  start(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  dispose(): void {
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
