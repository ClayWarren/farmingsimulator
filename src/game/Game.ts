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
