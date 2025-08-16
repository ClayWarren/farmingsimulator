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
import { TimeSystem } from '../systems/TimeSystem';
import { WeatherSystem } from '../systems/WeatherSystem';
import { CropSystem } from '../systems/CropSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { VehicleSystem } from '../systems/VehicleSystem';
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
  private uiManager!: UIManager;
  private isPaused: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
  }

  async initialize(): Promise<void> {
    await this.createEngine();
    this.createScene();
    this.initializeSystems();
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

  private initializeSystems(): void {
    this.sceneManager = new SceneManager(this.scene);
    this.timeSystem = new TimeSystem();
    this.weatherSystem = new WeatherSystem(this.scene);
    this.economySystem = new EconomySystem();
    this.vehicleSystem = new VehicleSystem(this.scene);
    this.cropSystem = new CropSystem(this.scene, this.timeSystem);
    this.inputManager = new InputManager(
      this.scene,
      this.canvas,
      this.cropSystem,
      this.economySystem,
      this.vehicleSystem
    );
    this.uiManager = new UIManager(
      this.timeSystem,
      this.weatherSystem,
      this.cropSystem,
      this.economySystem
    );

    this.sceneManager.initialize();
    this.inputManager.initialize();
    this.timeSystem.initialize();
    this.weatherSystem.initialize();
    this.economySystem.initialize();
    this.vehicleSystem.initialize();
    this.cropSystem.initialize();
    this.uiManager.initialize();

    this.inputManager.setCropSelectionCallback(cropType => {
      this.uiManager.updateSelectedCrop(cropType);
    });

    this.inputManager.setPauseCallback(() => {
      this.togglePause();
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

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
    this.cropSystem.update();
    this.inputManager.update(deltaTime);
    this.uiManager.update();
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
    this.cropSystem.initialize();
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
