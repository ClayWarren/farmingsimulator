import { 
  Scene, 
  DirectionalLight, 
  HemisphericLight, 
  Vector3, 
  Color3,
  ShadowGenerator,
  Mesh
} from '@babylonjs/core';
import { TimeSystem } from './TimeSystem';

export interface LightingConfig {
  enableShadows: boolean;
  shadowMapSize: number;
  maxShadowDistance: number;
}

export class LightingSystem {
  private scene: Scene;
  private timeSystem: TimeSystem;
  private config: LightingConfig;
  
  // Lighting components
  private sunLight!: DirectionalLight;
  private ambientLight!: HemisphericLight;
  private shadowGenerator: ShadowGenerator | null = null;
  
  // Sun path parameters
  private sunRadius = 100; // Distance from center for sun position calculation
  private sunHeight = 50;  // Maximum height of sun at noon

  constructor(scene: Scene, timeSystem: TimeSystem) {
    this.scene = scene;
    this.timeSystem = timeSystem;
    
    this.config = {
      enableShadows: true,
      shadowMapSize: 2048,
      maxShadowDistance: 100
    };

    this.createLights();
    this.setupShadows();
  }

  initialize(): void {
    console.log('Lighting System initialized');
    this.updateLighting();
  }

  private createLights(): void {
    // Remove existing lights if any
    this.scene.lights.forEach(light => {
      if (light.name === 'sunLight' || light.name === 'ambientLight') {
        light.dispose();
      }
    });

    // Create directional light (sun)
    this.sunLight = new DirectionalLight('sunLight', new Vector3(-1, -1, -1), this.scene);
    this.sunLight.intensity = 1.2;
    this.sunLight.diffuse = Color3.FromHexString('#FFE4B5'); // Warm white
    this.sunLight.specular = Color3.FromHexString('#FFFFFF');

    // Create ambient light
    this.ambientLight = new HemisphericLight('ambientLight', new Vector3(0, 1, 0), this.scene);
    this.ambientLight.intensity = 0.3;
    this.ambientLight.diffuse = Color3.FromHexString('#87CEEB'); // Sky blue
    this.ambientLight.groundColor = Color3.FromHexString('#8B7355'); // Earth brown
  }

  private setupShadows(): void {
    if (!this.config.enableShadows) return;

    try {
      // Create shadow generator
      this.shadowGenerator = new ShadowGenerator(this.config.shadowMapSize, this.sunLight);
      this.shadowGenerator.bias = 0.0001;
      this.shadowGenerator.normalBias = 0.02;
      this.shadowGenerator.usePercentageCloserFiltering = true;
      this.shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
      
      // Set shadow distance
      this.shadowGenerator.setDarkness(0.3); // Softer shadows
      
      console.log('Shadow system initialized');
    } catch (error) {
      console.warn('Shadow initialization failed, continuing without shadows:', error);
      this.config.enableShadows = false;
    }
  }

  update(): void {
    this.updateLighting();
  }

  private updateLighting(): void {
    const timeData = this.timeSystem.getTimeData();
    
    // Calculate sun position based on time (0-24 hours)
    const timeOfDay = timeData.hour + (timeData.minute / 60);
    const sunAngle = this.calculateSunAngle(timeOfDay);
    const sunPosition = this.calculateSunPosition(sunAngle);
    
    // Update sun direction (pointing toward ground)
    const sunDirection = Vector3.Zero().subtract(sunPosition).normalize();
    this.sunLight.direction = sunDirection;
    
    // Update lighting colors and intensities based on time
    this.updateLightingColors(timeOfDay, sunAngle);
    
    // Update shadow casting
    this.updateShadows();
  }

  private calculateSunAngle(timeOfDay: number): number {
    // Sun rises at 6 AM (90°), peaks at noon (0°), sets at 6 PM (-90°)
    // Convert time to angle: 6AM = -π/2, 12PM = 0, 6PM = π/2, 12AM = π
    const normalizedTime = (timeOfDay - 6) / 12; // -0.5 to 1.5 range
    return normalizedTime * Math.PI; // -π/2 to 3π/2
  }

  private calculateSunPosition(sunAngle: number): Vector3 {
    // Calculate sun position in 3D space
    const x = Math.cos(sunAngle) * this.sunRadius;
    const y = Math.max(0, Math.sin(sunAngle) * this.sunHeight); // Never go below horizon
    const z = 0; // Sun moves east-west
    
    return new Vector3(x, y, z);
  }

  private updateLightingColors(timeOfDay: number, sunAngle: number): void {
    const sunHeight = Math.sin(sunAngle);
    
    // Determine time period
    const isNight = timeOfDay < 5.5 || timeOfDay > 18.5;
    const isSunrise = timeOfDay >= 5.5 && timeOfDay < 7;
    const isSunset = timeOfDay >= 17 && timeOfDay <= 18.5;
    const isDay = timeOfDay >= 7 && timeOfDay < 17;
    
    if (isNight) {
      // Night lighting - cool, dim
      this.sunLight.intensity = 0.1;
      this.sunLight.diffuse = Color3.FromHexString('#4169E1'); // Cool blue
      this.ambientLight.intensity = 0.15;
      this.ambientLight.diffuse = Color3.FromHexString('#191970'); // Midnight blue
      this.ambientLight.groundColor = Color3.FromHexString('#2F2F2F'); // Dark gray
      this.scene.clearColor = Color3.FromHexString('#0F0F23').toColor4(); // Dark night sky
      
    } else if (isSunrise) {
      // Sunrise lighting - warm, soft
      const sunriseProgress = (timeOfDay - 5.5) / 1.5; // 0 to 1
      this.sunLight.intensity = 0.3 + (sunriseProgress * 0.9);
      this.sunLight.diffuse = Color3.Lerp(
        Color3.FromHexString('#FF6347'), // Warm orange-red
        Color3.FromHexString('#FFE4B5'), // Warm white
        sunriseProgress
      );
      this.ambientLight.intensity = 0.2 + (sunriseProgress * 0.3);
      this.ambientLight.diffuse = Color3.Lerp(
        Color3.FromHexString('#FF8C69'), // Salmon
        Color3.FromHexString('#87CEEB'), // Sky blue
        sunriseProgress
      );
      this.scene.clearColor = Color3.Lerp(
        Color3.FromHexString('#FF6B35'), // Orange
        Color3.FromHexString('#87CEEB'), // Sky blue
        sunriseProgress
      ).toColor4();
      
    } else if (isSunset) {
      // Sunset lighting - warm, golden
      const sunsetProgress = (timeOfDay - 17) / 1.5; // 0 to 1
      this.sunLight.intensity = 1.2 - (sunsetProgress * 0.9);
      this.sunLight.diffuse = Color3.Lerp(
        Color3.FromHexString('#FFE4B5'), // Warm white
        Color3.FromHexString('#FF4500'), // Orange-red
        sunsetProgress
      );
      this.ambientLight.intensity = 0.5 - (sunsetProgress * 0.2);
      this.ambientLight.diffuse = Color3.Lerp(
        Color3.FromHexString('#87CEEB'), // Sky blue
        Color3.FromHexString('#FF8C69'), // Salmon
        sunsetProgress
      );
      this.scene.clearColor = Color3.Lerp(
        Color3.FromHexString('#87CEEB'), // Sky blue
        Color3.FromHexString('#FF6347'), // Tomato
        sunsetProgress
      ).toColor4();
      
    } else if (isDay) {
      // Daytime lighting - bright, neutral
      this.sunLight.intensity = 1.2;
      this.sunLight.diffuse = Color3.FromHexString('#FFFACD'); // Light yellow
      this.ambientLight.intensity = 0.5;
      this.ambientLight.diffuse = Color3.FromHexString('#87CEEB'); // Sky blue
      this.ambientLight.groundColor = Color3.FromHexString('#8B7355'); // Earth brown
      this.scene.clearColor = Color3.FromHexString('#87CEEB').toColor4(); // Sky blue
    }
    
    // Adjust intensity based on sun height (dimmer when sun is low)
    const heightMultiplier = Math.max(0.1, sunHeight + 0.1);
    this.sunLight.intensity *= heightMultiplier;
  }

  private updateShadows(): void {
    if (!this.shadowGenerator) return;
    
    // Adjust shadow intensity based on sun intensity
    const shadowIntensity = Math.max(0.1, Math.min(0.6, this.sunLight.intensity * 0.5));
    this.shadowGenerator.setDarkness(1.0 - shadowIntensity);
  }

  // Add meshes to cast shadows
  addShadowCaster(mesh: Mesh): void {
    if (this.shadowGenerator && this.config.enableShadows) {
      this.shadowGenerator.getShadowMap()?.renderList?.push(mesh);
    }
  }

  // Add meshes to receive shadows
  addShadowReceiver(mesh: Mesh): void {
    if (this.config.enableShadows) {
      mesh.receiveShadows = true;
    }
  }

  // Enable/disable shadows
  setShadowsEnabled(enabled: boolean): void {
    this.config.enableShadows = enabled;
    if (!enabled && this.shadowGenerator) {
      this.shadowGenerator.dispose();
      this.shadowGenerator = null;
    } else if (enabled && !this.shadowGenerator) {
      this.setupShadows();
    }
  }

  // Get current lighting info for debugging
  getLightingInfo(): {
    timeOfDay: number;
    sunIntensity: number;
    ambientIntensity: number;
    sunDirection: Vector3;
    sunColor: Color3;
  } {
    const timeData = this.timeSystem.getTimeData();
    const timeOfDay = timeData.hour + (timeData.minute / 60);
    
    return {
      timeOfDay,
      sunIntensity: this.sunLight.intensity,
      ambientIntensity: this.ambientLight.intensity,
      sunDirection: this.sunLight.direction.clone(),
      sunColor: this.sunLight.diffuse.clone()
    };
  }

  dispose(): void {
    if (this.shadowGenerator) {
      this.shadowGenerator.dispose();
    }
    if (this.sunLight) {
      this.sunLight.dispose();
    }
    if (this.ambientLight) {
      this.ambientLight.dispose();
    }
  }
}