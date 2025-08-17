import { Vector3 } from '@babylonjs/core';
import { FieldStateSystem, FieldState } from '../systems/FieldStateSystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { FarmExpansionSystem, LandPlot } from '../systems/FarmExpansionSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { CropSystem } from '../systems/CropSystem';

export interface MiniMapConfig {
  worldSize: number;      // Size of the world area to show
  canvasWidth: number;    // Canvas width in pixels
  canvasHeight: number;   // Canvas height in pixels
  scale: number;          // Current zoom scale
}

export class MiniMapSystem {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private fieldStateSystem: FieldStateSystem;
  private vehicleSystem: VehicleSystem;
  private farmExpansionSystem: FarmExpansionSystem;
  private buildingSystem: BuildingSystem;
  private cropSystem: CropSystem;
  private isVisible: boolean = true;
  private config: MiniMapConfig;
  private lastPlayerPosition: Vector3 = Vector3.Zero();

  constructor(
    fieldStateSystem: FieldStateSystem,
    vehicleSystem: VehicleSystem,
    farmExpansionSystem: FarmExpansionSystem,
    buildingSystem: BuildingSystem,
    cropSystem: CropSystem
  ) {
    this.fieldStateSystem = fieldStateSystem;
    this.vehicleSystem = vehicleSystem;
    this.farmExpansionSystem = farmExpansionSystem;
    this.buildingSystem = buildingSystem;
    this.cropSystem = cropSystem;

    // Initialize canvas
    this.canvas = document.getElementById('mini-map-canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d')!;

    // Default configuration
    this.config = {
      worldSize: 120,      // Show 120x120 world units
      canvasWidth: 256,
      canvasHeight: 192,
      scale: 1.0
    };

    this.setupEventListeners();
  }

  initialize(): void {
    console.log('Mini-map system initialized');
    this.render();
  }

  private setupEventListeners(): void {
    // Toggle visibility
    const toggleButton = document.getElementById('mini-map-toggle');
    toggleButton?.addEventListener('click', () => {
      this.toggleVisibility();
    });

    // Zoom controls
    const zoomInButton = document.getElementById('mini-map-zoom-in');
    zoomInButton?.addEventListener('click', () => {
      this.zoomIn();
    });

    const zoomOutButton = document.getElementById('mini-map-zoom-out');
    zoomOutButton?.addEventListener('click', () => {
      this.zoomOut();
    });
  }

  private toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    const container = document.getElementById('mini-map-container');
    if (container) {
      container.style.display = this.isVisible ? 'block' : 'none';
    }
  }

  private zoomIn(): void {
    this.config.scale = Math.min(this.config.scale * 1.2, 3.0);
    this.render();
  }

  private zoomOut(): void {
    this.config.scale = Math.max(this.config.scale / 1.2, 0.3);
    this.render();
  }

  update(playerPosition: Vector3): void {
    if (!this.isVisible) return;

    // Only re-render if player moved significantly or every few frames
    const distance = Vector3.Distance(playerPosition, this.lastPlayerPosition);
    if (distance > 1.0) {
      this.lastPlayerPosition = playerPosition.clone();
      this.render();
    }
  }

  private render(): void {
    if (!this.isVisible) return;

    // Clear canvas
    this.context.fillStyle = '#1a1a1a';
    this.context.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // Calculate visible world bounds
    const scaledWorldSize = this.config.worldSize / this.config.scale;
    const centerX = this.lastPlayerPosition.x;
    const centerZ = this.lastPlayerPosition.z;
    
    const minX = centerX - scaledWorldSize / 2;
    const maxX = centerX + scaledWorldSize / 2;
    const minZ = centerZ - scaledWorldSize / 2;
    const maxZ = centerZ + scaledWorldSize / 2;

    // Render land plots
    this.renderLandPlots(minX, maxX, minZ, maxZ);

    // Render field states
    this.renderFieldStates(minX, maxX, minZ, maxZ);

    // Render crops
    this.renderCrops(minX, maxX, minZ, maxZ);

    // Render buildings
    this.renderBuildings(minX, maxX, minZ, maxZ);

    // Render vehicles
    this.renderVehicles(minX, maxX, minZ, maxZ);

    // Render player
    this.renderPlayer(minX, maxX, minZ, maxZ);

    // Render grid (optional)
    this.renderGrid(minX, maxX, minZ, maxZ);
  }

  private worldToCanvas(worldX: number, worldZ: number, minX: number, maxX: number, minZ: number, maxZ: number): { x: number; y: number } {
    const normalizedX = (worldX - minX) / (maxX - minX);
    const normalizedZ = (worldZ - minZ) / (maxZ - minZ);
    
    return {
      x: normalizedX * this.config.canvasWidth,
      y: (1 - normalizedZ) * this.config.canvasHeight // Flip Z axis
    };
  }

  private renderLandPlots(minX: number, maxX: number, minZ: number, maxZ: number): void {
    const plots = this.farmExpansionSystem.getPlots();
    
    plots.forEach((plot: LandPlot) => {
      const { x: x1, y: y1 } = this.worldToCanvas(plot.bounds.minimum.x, plot.bounds.minimum.z, minX, maxX, minZ, maxZ);
      const { x: x2, y: y2 } = this.worldToCanvas(plot.bounds.maximum.x, plot.bounds.maximum.z, minX, maxX, minZ, maxZ);
      
      // Fill owned plots with a green tint, unowned with gray
      this.context.fillStyle = plot.isOwned ? 'rgba(0, 100, 0, 0.2)' : 'rgba(100, 100, 100, 0.1)';
      this.context.fillRect(x1, y2, x2 - x1, y1 - y2);
      
      // Draw plot borders
      this.context.strokeStyle = plot.isOwned ? '#00aa00' : '#666666';
      this.context.lineWidth = 1;
      this.context.strokeRect(x1, y2, x2 - x1, y1 - y2);
    });
  }

  private renderFieldStates(minX: number, maxX: number, minZ: number, maxZ: number): void {
    // Get field states from the field state system
    const fields = this.getAllFieldStates();
    
    fields.forEach(field => {
      if (field.position.x < minX || field.position.x > maxX || 
          field.position.z < minZ || field.position.z > maxZ) {
        return; // Skip if outside visible area
      }

      const { x, y } = this.worldToCanvas(field.position.x, field.position.z, minX, maxX, minZ, maxZ);
      const size = Math.max(2, 4 * this.config.scale);

      this.context.fillStyle = this.getFieldStateColor(field.state);
      this.context.fillRect(x - size/2, y - size/2, size, size);
    });
  }

  private getFieldStateColor(state: FieldState): string {
    switch (state) {
      case 'untilled': return '#228B22';
      case 'tilled': return '#8B4513';
      case 'planted': return '#654321';
      case 'growing': return '#556B2F';
      case 'mature': return '#32CD32';
      case 'harvested': return '#8FBC8F';
      case 'stubble': return '#DAA520';
      default: return '#333333';
    }
  }

  private renderCrops(minX: number, maxX: number, minZ: number, maxZ: number): void {
    const crops = this.cropSystem.getAllCrops();
    
    crops.forEach(crop => {
      if (crop.position.x < minX || crop.position.x > maxX || 
          crop.position.z < minZ || crop.position.z > maxZ) {
        return;
      }

      const { x, y } = this.worldToCanvas(crop.position.x, crop.position.z, minX, maxX, minZ, maxZ);
      const size = Math.max(1, 2 * this.config.scale);

      // Different colors based on crop type and growth stage
      this.context.fillStyle = this.getCropColor(crop.type, crop.growthStage);
      this.context.fillRect(x - size/2, y - size/2, size, size);
    });
  }

  private getCropColor(cropType: string, growthStage: number): string {
    const opacity = Math.min(1.0, 0.3 + (growthStage * 0.2));
    
    switch (cropType) {
      case 'wheat': return `rgba(218, 165, 32, ${opacity})`;
      case 'corn': return `rgba(255, 215, 0, ${opacity})`;
      case 'potato': return `rgba(139, 69, 19, ${opacity})`;
      case 'carrot': return `rgba(255, 140, 0, ${opacity})`;
      default: return `rgba(50, 205, 50, ${opacity})`;
    }
  }

  private renderBuildings(minX: number, maxX: number, minZ: number, maxZ: number): void {
    const buildings = this.buildingSystem.getPlacedBuildings();
    
    buildings.forEach(building => {
      if (building.position.x < minX || building.position.x > maxX || 
          building.position.z < minZ || building.position.z > maxZ) {
        return;
      }

      const { x, y } = this.worldToCanvas(building.position.x, building.position.z, minX, maxX, minZ, maxZ);
      const size = Math.max(3, 6 * this.config.scale);

      this.context.fillStyle = '#8B4513';
      this.context.fillRect(x - size/2, y - size/2, size, size);
      
      // Add border
      this.context.strokeStyle = '#654321';
      this.context.lineWidth = 1;
      this.context.strokeRect(x - size/2, y - size/2, size, size);
    });
  }

  private renderVehicles(minX: number, maxX: number, minZ: number, maxZ: number): void {
    const vehicles = this.vehicleSystem.getVehicles();
    
    vehicles.forEach((vehicle, vehicleId) => {
      const pos = vehicle.mesh.position;
      if (pos.x < minX || pos.x > maxX || pos.z < minZ || pos.z > maxZ) {
        return;
      }

      const { x, y } = this.worldToCanvas(pos.x, pos.z, minX, maxX, minZ, maxZ);
      const size = Math.max(4, 8 * this.config.scale);

      // Different colors for different vehicles
      this.context.fillStyle = vehicleId.includes('tractor') ? '#ff4444' : '#ff8844';
      this.context.fillRect(x - size/2, y - size/2, size, size);
      
      // Add direction indicator
      const rotation = vehicle.mesh.rotation.y;
      const dirX = Math.sin(rotation) * size;
      const dirY = -Math.cos(rotation) * size;
      
      this.context.strokeStyle = '#ffffff';
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x + dirX, y + dirY);
      this.context.stroke();
    });
  }

  private renderPlayer(minX: number, maxX: number, minZ: number, maxZ: number): void {
    const { x, y } = this.worldToCanvas(this.lastPlayerPosition.x, this.lastPlayerPosition.z, minX, maxX, minZ, maxZ);
    const size = Math.max(4, 8 * this.config.scale);

    // Player dot
    this.context.fillStyle = '#4488ff';
    this.context.beginPath();
    this.context.arc(x, y, size/2, 0, Math.PI * 2);
    this.context.fill();
    
    // Player border
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 2;
    this.context.stroke();
  }

  private renderGrid(minX: number, maxX: number, minZ: number, maxZ: number): void {
    if (this.config.scale < 0.8) return; // Only show grid when zoomed in
    
    this.context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.context.lineWidth = 1;
    
    const gridSize = 10; // 10 unit grid
    const startX = Math.floor(minX / gridSize) * gridSize;
    const startZ = Math.floor(minZ / gridSize) * gridSize;
    
    // Vertical lines
    for (let x = startX; x <= maxX; x += gridSize) {
      const { x: canvasX1 } = this.worldToCanvas(x, minZ, minX, maxX, minZ, maxZ);
      const { x: canvasX2 } = this.worldToCanvas(x, maxZ, minX, maxX, minZ, maxZ);
      
      this.context.beginPath();
      this.context.moveTo(canvasX1, 0);
      this.context.lineTo(canvasX2, this.config.canvasHeight);
      this.context.stroke();
    }
    
    // Horizontal lines
    for (let z = startZ; z <= maxZ; z += gridSize) {
      const { y: canvasY1 } = this.worldToCanvas(minX, z, minX, maxX, minZ, maxZ);
      const { y: canvasY2 } = this.worldToCanvas(maxX, z, minX, maxX, minZ, maxZ);
      
      this.context.beginPath();
      this.context.moveTo(0, canvasY1);
      this.context.lineTo(this.config.canvasWidth, canvasY2);
      this.context.stroke();
    }
  }

  private getAllFieldStates(): Array<{ position: Vector3; state: FieldState }> {
    return this.fieldStateSystem.getAllFields();
  }

  toggleMiniMap(): void {
    this.toggleVisibility();
  }

  setVisible(visible: boolean): void {
    this.isVisible = visible;
    const container = document.getElementById('mini-map-container');
    if (container) {
      container.style.display = visible ? 'block' : 'none';
    }
  }
}