import { Scene, Vector3, PBRMaterial, DynamicTexture, Texture, Color3, Mesh } from '@babylonjs/core';
import { CropSystem, CropType } from './CropSystem';
import { TimeSystem } from './TimeSystem';

export type FieldState = 'untilled' | 'tilled' | 'planted' | 'growing' | 'mature' | 'harvested' | 'stubble';

export interface FieldData {
  position: Vector3;
  state: FieldState;
  cropType?: CropType;
  lastStateChange: number; // Day when state last changed
  mesh?: Mesh;
}

export class FieldStateSystem {
  private scene: Scene;
  private cropSystem: CropSystem;
  private timeSystem: TimeSystem;
  private fields: Map<string, FieldData> = new Map();
  private fieldMeshes: Map<string, Mesh> = new Map();

  constructor(scene: Scene, cropSystem: CropSystem, timeSystem: TimeSystem) {
    this.scene = scene;
    this.cropSystem = cropSystem;
    this.timeSystem = timeSystem;
  }

  initialize(): void {
    console.log('Field State System initialized');
  }

  // Create a field at a position with initial state
  createField(position: Vector3, initialState: FieldState = 'untilled'): void {
    const key = `${position.x}_${position.z}`;
    const timeData = this.timeSystem.getTimeData();
    
    const fieldData: FieldData = {
      position: position.clone(),
      state: initialState,
      lastStateChange: timeData.day,
    };

    this.fields.set(key, fieldData);
    this.updateFieldVisual(key, fieldData);
  }

  // Update field state when farming activities occur
  updateFieldState(position: Vector3, newState: FieldState, cropType?: CropType): void {
    const key = `${position.x}_${position.z}`;
    const fieldData = this.fields.get(key);
    
    if (!fieldData) {
      // Create new field if it doesn't exist
      this.createField(position, newState);
      return;
    }

    const timeData = this.timeSystem.getTimeData();
    fieldData.state = newState;
    fieldData.lastStateChange = timeData.day;
    if (cropType) {
      fieldData.cropType = cropType;
    }

    this.updateFieldVisual(key, fieldData);
  }

  // Update field visuals based on crop states
  update(): void {
    // Check crop states and update field visuals accordingly
    const crops = this.cropSystem.getAllCrops();
    
    crops.forEach(crop => {
      const key = `${crop.position.x}_${crop.position.z}`;
      const fieldData = this.fields.get(key);
      
      if (fieldData) {
        let newState: FieldState;
        
        if (crop.growthStage === 0) {
          newState = 'planted';
        } else if (crop.growthStage < 3) {
          newState = 'growing';
        } else {
          newState = 'mature';
        }
        
        if (fieldData.state !== newState) {
          this.updateFieldState(crop.position, newState, crop.type);
        }
      }
    });

    // Check for harvested fields (where crops were removed)
    this.fields.forEach((fieldData) => {
      if (fieldData.state === 'mature' || fieldData.state === 'growing') {
        const crop = this.cropSystem.getCropAt(fieldData.position);
        if (!crop) {
          // Crop was harvested
          this.updateFieldState(fieldData.position, 'harvested');
        }
      }
    });
  }

  private updateFieldVisual(key: string, fieldData: FieldData): void {
    // Remove existing field mesh if it exists
    const existingMesh = this.fieldMeshes.get(key);
    if (existingMesh) {
      existingMesh.dispose();
      this.fieldMeshes.delete(key);
    }

    // Create appropriate visual for the field state
    const fieldMesh = this.createFieldMesh(fieldData);
    if (fieldMesh) {
      this.fieldMeshes.set(key, fieldMesh);
    }
  }

  private createFieldMesh(fieldData: FieldData): Mesh | null {
    const mesh = Mesh.CreatePlane(`field_${fieldData.state}_${fieldData.position.x}_${fieldData.position.z}`, 2, this.scene);
    
    // Position the field mesh slightly above ground
    mesh.position = fieldData.position.clone();
    mesh.position.y = 0.01;
    mesh.rotation.x = Math.PI / 2; // Rotate to lie flat

    // Create material based on field state
    const material = new PBRMaterial(`fieldStateMaterial_${fieldData.state}`, this.scene);
    const texture = this.createStateTexture(fieldData.state, fieldData.cropType);
    
    material.albedoTexture = texture;
    material.roughness = 0.9;
    material.metallic = 0.0;
    
    // Set base color based on state
    switch (fieldData.state) {
      case 'untilled':
        material.albedoColor = Color3.FromHexString('#228B22'); // Green grass
        break;
      case 'tilled':
        material.albedoColor = Color3.FromHexString('#8B4513'); // Brown soil
        break;
      case 'planted':
        material.albedoColor = Color3.FromHexString('#654321'); // Dark soil with seeds
        break;
      case 'growing':
        material.albedoColor = Color3.FromHexString('#556B2F'); // Green with soil
        break;
      case 'mature':
        material.albedoColor = Color3.FromHexString('#32CD32'); // Bright green
        break;
      case 'harvested':
        material.albedoColor = Color3.FromHexString('#8FBC8F'); // Light green
        break;
      case 'stubble':
        material.albedoColor = Color3.FromHexString('#DAA520'); // Golden stubble
        break;
    }

    mesh.material = material;
    mesh.receiveShadows = true;
    
    return mesh;
  }

  private createStateTexture(state: FieldState, cropType?: CropType): DynamicTexture {
    const texture = new DynamicTexture(`fieldTexture_${state}`, { width: 128, height: 128 }, this.scene);
    const context = texture.getContext() as CanvasRenderingContext2D;
    
    // Base color fill
    let baseColor = '#228B22'; // Default green
    
    switch (state) {
      case 'untilled':
        baseColor = '#228B22'; // Green grass
        this.drawGrassPattern(context);
        break;
      case 'tilled':
        baseColor = '#8B4513'; // Brown soil
        this.drawTilledPattern(context);
        break;
      case 'planted':
        baseColor = '#654321'; // Dark soil
        this.drawPlantedPattern(context);
        break;
      case 'growing':
        baseColor = '#556B2F'; // Mixed green/brown
        this.drawGrowingPattern(context, cropType);
        break;
      case 'mature':
        baseColor = '#32CD32'; // Bright green
        this.drawMaturePattern(context, cropType);
        break;
      case 'harvested':
        baseColor = '#8FBC8F'; // Light green
        this.drawHarvestedPattern(context);
        break;
      case 'stubble':
        baseColor = '#DAA520'; // Golden
        this.drawStubblePattern(context);
        break;
    }
    
    context.fillStyle = baseColor;
    context.fillRect(0, 0, 128, 128);
    
    texture.update();
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    
    return texture;
  }

  private drawGrassPattern(context: CanvasRenderingContext2D): void {
    // Draw grass blades
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const height = Math.random() * 8 + 4;
      context.fillStyle = `rgba(${30 + Math.random() * 40}, ${120 + Math.random() * 40}, ${30 + Math.random() * 20}, 0.7)`;
      context.fillRect(x, y, 1, height);
    }
  }

  private drawTilledPattern(context: CanvasRenderingContext2D): void {
    // Draw prominent furrow lines with varied depths
    for (let i = 0; i < 8; i++) {
      const y = i * 16 + 8;
      const depth = Math.random() * 2 + 2; // Variable furrow depth
      
      // Dark furrow shadow
      context.fillStyle = `rgba(${60 + Math.random() * 20}, ${40 + Math.random() * 15}, ${25 + Math.random() * 15}, 0.9)`;
      context.fillRect(0, y, 128, depth + 2);
      
      // Lighter soil ridge beside furrow
      context.fillStyle = `rgba(${120 + Math.random() * 30}, ${80 + Math.random() * 20}, ${50 + Math.random() * 15}, 0.7)`;
      context.fillRect(0, y + depth + 2, 128, 2);
    }
    
    // Add some scattered soil clumps
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 3 + 1;
      context.fillStyle = `rgba(${90 + Math.random() * 40}, ${60 + Math.random() * 25}, ${35 + Math.random() * 20}, 0.6)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawPlantedPattern(context: CanvasRenderingContext2D): void {
    // Draw small seed dots
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      context.fillStyle = `rgba(${80 + Math.random() * 30}, ${50 + Math.random() * 20}, ${30 + Math.random() * 15}, 0.9)`;
      context.beginPath();
      context.arc(x, y, 1, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawGrowingPattern(context: CanvasRenderingContext2D, _cropType?: CropType): void {
    // Draw small plant sprouts
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 3 + 1;
      context.fillStyle = `rgba(${40 + Math.random() * 30}, ${100 + Math.random() * 30}, ${40 + Math.random() * 20}, 0.6)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawMaturePattern(context: CanvasRenderingContext2D, cropType?: CropType): void {
    // Draw dense vegetation
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 4 + 2;
      
      let color = `rgba(${20 + Math.random() * 40}, ${140 + Math.random() * 40}, ${20 + Math.random() * 30}, 0.8)`;
      
      // Adjust color based on crop type
      if (cropType === 'wheat') {
        color = `rgba(${180 + Math.random() * 40}, ${160 + Math.random() * 30}, ${60 + Math.random() * 40}, 0.8)`;
      } else if (cropType === 'corn') {
        color = `rgba(${40 + Math.random() * 30}, ${120 + Math.random() * 40}, ${40 + Math.random() * 20}, 0.8)`;
      }
      
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawHarvestedPattern(context: CanvasRenderingContext2D): void {
    // Draw sparse leftover vegetation
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const size = Math.random() * 2 + 1;
      context.fillStyle = `rgba(${100 + Math.random() * 40}, ${140 + Math.random() * 30}, ${80 + Math.random() * 20}, 0.5)`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawStubblePattern(context: CanvasRenderingContext2D): void {
    // Draw short stubble lines
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const height = Math.random() * 3 + 1;
      context.fillStyle = `rgba(${180 + Math.random() * 40}, ${150 + Math.random() * 30}, ${60 + Math.random() * 40}, 0.7)`;
      context.fillRect(x, y, 1, height);
    }
  }

  getFieldState(position: Vector3): FieldState | null {
    const key = `${position.x}_${position.z}`;
    const fieldData = this.fields.get(key);
    return fieldData ? fieldData.state : null;
  }

  // Transition harvested fields to stubble after time
  processFieldDecay(): void {
    const timeData = this.timeSystem.getTimeData();
    
    this.fields.forEach((fieldData) => {
      if (fieldData.state === 'harvested' && timeData.day - fieldData.lastStateChange > 2) {
        // After 2 days, harvested fields become stubble
        this.updateFieldState(fieldData.position, 'stubble');
      } else if (fieldData.state === 'stubble' && timeData.day - fieldData.lastStateChange > 5) {
        // After 5 more days, stubble returns to untilled grass
        this.updateFieldState(fieldData.position, 'untilled');
      }
    });
  }

  getSaveData(): Array<{
    position: { x: number; y: number; z: number };
    state: FieldState;
    cropType?: CropType;
    lastStateChange: number;
  }> {
    return Array.from(this.fields.values()).map(field => ({
      position: { x: field.position.x, y: field.position.y, z: field.position.z },
      state: field.state,
      cropType: field.cropType,
      lastStateChange: field.lastStateChange,
    }));
  }

  loadSaveData(saveData: Array<{
    position: { x: number; y: number; z: number };
    state: FieldState;
    cropType?: CropType;
    lastStateChange: number;
  }>): void {
    // Clear existing fields
    this.fieldMeshes.forEach(mesh => mesh.dispose());
    this.fieldMeshes.clear();
    this.fields.clear();

    // Load saved fields
    saveData.forEach(savedField => {
      const position = new Vector3(savedField.position.x, savedField.position.y, savedField.position.z);
      const key = `${position.x}_${position.z}`;
      
      const fieldData: FieldData = {
        position,
        state: savedField.state,
        cropType: savedField.cropType,
        lastStateChange: savedField.lastStateChange,
      };
      
      this.fields.set(key, fieldData);
      this.updateFieldVisual(key, fieldData);
    });

    console.log(`Field state system data loaded: ${saveData.length} fields restored`);
  }
}