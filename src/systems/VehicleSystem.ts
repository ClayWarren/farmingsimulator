import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  FreeCamera,
} from '@babylonjs/core';

export interface Vehicle {
  id: string;
  name: string;
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  speed: number;
  maxSpeed: number;
  isOccupied: boolean;
}

export class VehicleSystem {
  private scene: Scene;
  private vehicles: Map<string, Vehicle> = new Map();
  private playerCamera: FreeCamera;
  private currentVehicle: Vehicle | null = null;
  private vehicleCamera: FreeCamera | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.playerCamera = scene.activeCamera as FreeCamera;
  }

  initialize(): void {
    this.createTractor();
    this.createCombineHarvester();
    console.log('Vehicle system initialized with', this.vehicles.size, 'vehicles');
    this.vehicles.forEach((vehicle, id) => {
      console.log('Vehicle created:', id, 'at position', vehicle.position);
    });
  }

  private createTractor(): void {
    const tractorMesh = this.createTractorMesh();

    const tractor: Vehicle = {
      id: 'tractor_1',
      name: 'Farm Tractor',
      mesh: tractorMesh,
      position: new Vector3(15, 0, 15),
      rotation: Vector3.Zero(),
      speed: 0,
      maxSpeed: 25,
      isOccupied: false,
    };

    tractorMesh.position = tractor.position.clone();
    this.vehicles.set(tractor.id, tractor);
  }

  private createCombineHarvester(): void {
    const combineHarvesterMesh = this.createCombineHarvesterMesh();

    const combineHarvester: Vehicle = {
      id: 'combine_harvester_1',
      name: 'Combine Harvester',
      mesh: combineHarvesterMesh,
      position: new Vector3(25, 0, 15), // Position it near the tractor
      rotation: Vector3.Zero(),
      speed: 0,
      maxSpeed: 15, // Slower than tractor but more powerful
      isOccupied: false,
    };

    combineHarvesterMesh.position = combineHarvester.position.clone();
    this.vehicles.set(combineHarvester.id, combineHarvester);
  }

  private createTractorMesh(): Mesh {
    const tractor = MeshBuilder.CreateBox(
      'tractor',
      {
        width: 3,
        height: 2,
        depth: 5,
      },
      this.scene
    );

    const material = new StandardMaterial('tractorMaterial', this.scene);
    material.diffuseColor = Color3.FromHexString('#228B22');
    material.specularColor = Color3.FromHexString('#006400');
    tractor.material = material;

    tractor.position.y = 1;

    const cabin = MeshBuilder.CreateBox(
      'cabin',
      {
        width: 2.5,
        height: 1.5,
        depth: 2,
      },
      this.scene
    );

    const cabinMaterial = new StandardMaterial('cabinMaterial', this.scene);
    cabinMaterial.diffuseColor = Color3.FromHexString('#1F4F2F');
    cabin.material = cabinMaterial;
    cabin.position = new Vector3(0, 1.75, -0.5);
    cabin.parent = tractor;

    const frontWheel1 = MeshBuilder.CreateCylinder(
      'frontWheel1',
      {
        height: 0.5,
        diameter: 1.5,
      },
      this.scene
    );
    const frontWheel2 = MeshBuilder.CreateCylinder(
      'frontWheel2',
      {
        height: 0.5,
        diameter: 1.5,
      },
      this.scene
    );
    const backWheel1 = MeshBuilder.CreateCylinder(
      'backWheel1',
      {
        height: 0.6,
        diameter: 2,
      },
      this.scene
    );
    const backWheel2 = MeshBuilder.CreateCylinder(
      'backWheel2',
      {
        height: 0.6,
        diameter: 2,
      },
      this.scene
    );

    const wheelMaterial = new StandardMaterial('wheelMaterial', this.scene);
    wheelMaterial.diffuseColor = Color3.FromHexString('#2F2F2F');

    [frontWheel1, frontWheel2, backWheel1, backWheel2].forEach(wheel => {
      wheel.material = wheelMaterial;
      wheel.rotation.z = Math.PI / 2;
      wheel.parent = tractor;
    });

    frontWheel1.position = new Vector3(-1.75, -0.5, 1.5);
    frontWheel2.position = new Vector3(1.75, -0.5, 1.5);
    backWheel1.position = new Vector3(-1.75, -0.5, -1.5);
    backWheel2.position = new Vector3(1.75, -0.5, -1.5);

    return tractor;
  }

  private createCombineHarvesterMesh(): Mesh {
    // Main body - larger and longer than tractor
    const body = MeshBuilder.CreateBox(
      'combine_harvester_body',
      {
        width: 4,
        height: 3,
        depth: 8,
      },
      this.scene
    );

    const bodyMaterial = new StandardMaterial('combineBodyMaterial', this.scene);
    bodyMaterial.diffuseColor = Color3.FromHexString('#8B0000'); // Dark red
    bodyMaterial.specularColor = Color3.FromHexString('#660000');
    body.material = bodyMaterial;
    body.position.y = 1.5;

    // Cab - elevated cab at the back
    const cab = MeshBuilder.CreateBox(
      'combine_cab',
      {
        width: 3,
        height: 2.5,
        depth: 3,
      },
      this.scene
    );

    const cabMaterial = new StandardMaterial('combineCabMaterial', this.scene);
    cabMaterial.diffuseColor = Color3.FromHexString('#654321'); // Brown
    cab.material = cabMaterial;
    cab.position = new Vector3(0, 3.75, -2);
    cab.parent = body;

    // Header/cutting platform at front
    const header = MeshBuilder.CreateBox(
      'combine_header',
      {
        width: 5,
        height: 0.8,
        depth: 2,
      },
      this.scene
    );

    const headerMaterial = new StandardMaterial('combineHeaderMaterial', this.scene);
    headerMaterial.diffuseColor = Color3.FromHexString('#FFD700'); // Gold/yellow
    header.material = headerMaterial;
    header.position = new Vector3(0, 0.4, 4);
    header.parent = body;

    // Grain tank (elevated cylinder)
    const grainTank = MeshBuilder.CreateCylinder(
      'combine_grain_tank',
      {
        height: 2,
        diameter: 2.5,
      },
      this.scene
    );

    const tankMaterial = new StandardMaterial('combineTankMaterial', this.scene);
    tankMaterial.diffuseColor = Color3.FromHexString('#C0C0C0'); // Silver
    grainTank.material = tankMaterial;
    grainTank.position = new Vector3(0, 3, 1);
    grainTank.parent = body;

    // Large wheels - bigger than tractor
    const wheelMaterial = new StandardMaterial('combineWheelMaterial', this.scene);
    wheelMaterial.diffuseColor = Color3.FromHexString('#2F2F2F');

    const frontWheel1 = MeshBuilder.CreateCylinder('combine_frontWheel1', { height: 0.8, diameter: 2.5 }, this.scene);
    const frontWheel2 = MeshBuilder.CreateCylinder('combine_frontWheel2', { height: 0.8, diameter: 2.5 }, this.scene);
    const backWheel1 = MeshBuilder.CreateCylinder('combine_backWheel1', { height: 0.8, diameter: 2.5 }, this.scene);
    const backWheel2 = MeshBuilder.CreateCylinder('combine_backWheel2', { height: 0.8, diameter: 2.5 }, this.scene);

    [frontWheel1, frontWheel2, backWheel1, backWheel2].forEach(wheel => {
      wheel.material = wheelMaterial;
      wheel.parent = body;
      wheel.rotation.z = Math.PI / 2;
    });

    // Position wheels
    frontWheel1.position = new Vector3(-2.25, -1, 2);
    frontWheel2.position = new Vector3(2.25, -1, 2);
    backWheel1.position = new Vector3(-2.25, -1, -2);
    backWheel2.position = new Vector3(2.25, -1, -2);

    return body;
  }

  enterVehicle(vehicleId: string): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || vehicle.isOccupied) {
      return false;
    }

    vehicle.isOccupied = true;
    this.currentVehicle = vehicle;

    this.vehicleCamera = new FreeCamera(
      'vehicleCamera',
      vehicle.mesh.position.add(new Vector3(0, 3, -8)),
      this.scene
    );
    
    // Configure vehicle camera for mouse look
    this.vehicleCamera.setTarget(vehicle.mesh.position);
    
    // Set up proper mouse sensitivity for vehicle camera
    this.vehicleCamera.angularSensibility = 2000;
    
    this.scene.activeCamera = this.vehicleCamera;
    
    // Attach controls to canvas using the correct method
    this.vehicleCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    console.log(`Entered ${vehicle.name}`);
    return true;
  }

  exitVehicle(): boolean {
    if (!this.currentVehicle) {
      return false;
    }

    this.currentVehicle.isOccupied = false;
    this.currentVehicle.speed = 0;

    // Detach controls from vehicle camera before switching
    if (this.vehicleCamera) {
      this.vehicleCamera.detachControl();
      this.vehicleCamera.dispose();
      this.vehicleCamera = null;
    }

    // Switch back to player camera and reattach controls
    this.scene.activeCamera = this.playerCamera;
    this.playerCamera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    const exitPosition = this.currentVehicle.mesh.position.add(
      new Vector3(5, 2, 0)
    );
    this.playerCamera.position = exitPosition;

    console.log(`Exited ${this.currentVehicle.name}`);
    this.currentVehicle = null;
    return true;
  }

  update(deltaTime: number): void {
    this.vehicles.forEach(vehicle => {
      this.updateVehicle(vehicle, deltaTime);
    });

    if (this.currentVehicle && this.vehicleCamera) {
      this.updateVehicleCamera();
    }
  }

  private updateVehicle(vehicle: Vehicle, deltaTime: number): void {
    if (vehicle.speed !== 0) {
      const forward = vehicle.mesh.getDirection(Vector3.Forward());
      const movement = forward.scale(vehicle.speed * deltaTime);
      vehicle.mesh.position.addInPlace(movement);
      vehicle.position = vehicle.mesh.position.clone();

      vehicle.speed *= 0.95;
      if (Math.abs(vehicle.speed) < 0.1) {
        vehicle.speed = 0;
      }
    }
  }

  private updateVehicleCamera(): void {
    if (!this.currentVehicle || !this.vehicleCamera) return;

    const vehiclePosition = this.currentVehicle.mesh.position;
    const cameraOffset = new Vector3(0, 3, -8);

    const rotatedOffset = Vector3.TransformCoordinates(
      cameraOffset,
      this.currentVehicle.mesh.getWorldMatrix()
    );

    this.vehicleCamera.position = vehiclePosition.add(rotatedOffset);
    this.vehicleCamera.setTarget(vehiclePosition.add(new Vector3(0, 1, 0)));
  }

  handleVehicleInput(
    forward: boolean,
    backward: boolean,
    left: boolean,
    right: boolean
  ): void {
    if (!this.currentVehicle) return;

    const vehicle = this.currentVehicle;
    const acceleration = 15;
    const turnSpeed = 2;

    if (forward) {
      vehicle.speed = Math.min(vehicle.speed + acceleration, vehicle.maxSpeed);
    }
    if (backward) {
      vehicle.speed = Math.max(
        vehicle.speed - acceleration,
        -vehicle.maxSpeed * 0.5
      );
    }

    if (Math.abs(vehicle.speed) > 0.1) {
      if (left) {
        vehicle.mesh.rotation.y -= turnSpeed * 0.016;
      }
      if (right) {
        vehicle.mesh.rotation.y += turnSpeed * 0.016;
      }
    }
  }

  getNearestVehicle(
    position: Vector3,
    maxDistance: number = 5
  ): Vehicle | null {
    let nearestVehicle: Vehicle | null = null;
    let nearestDistance = maxDistance;

    this.vehicles.forEach(vehicle => {
      const distance = Vector3.Distance(position, vehicle.mesh.position);
      if (distance < nearestDistance) {
        nearestVehicle = vehicle;
        nearestDistance = distance;
      }
    });

    return nearestVehicle;
  }

  getCurrentVehicle(): Vehicle | null {
    return this.currentVehicle;
  }

  getVehicleCount(): number {
    return this.vehicles.size;
  }

  isInVehicle(): boolean {
    return this.currentVehicle !== null;
  }

  getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  getVehicleByMesh(mesh: Mesh): Vehicle | null {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.mesh === mesh) {
        return vehicle;
      }
    }
    return null;
  }

  // Save/Load functionality
  getSaveData(): {
    isInVehicle: boolean;
    currentVehicleId?: string;
    vehicles: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      speed: number;
      isOccupied: boolean;
    }>;
  } {
    const vehiclesData = Array.from(this.vehicles.values()).map(vehicle => ({
      id: vehicle.id,
      position: {
        x: vehicle.mesh.position.x,
        y: vehicle.mesh.position.y,
        z: vehicle.mesh.position.z,
      },
      rotation: {
        x: vehicle.mesh.rotation.x,
        y: vehicle.mesh.rotation.y,
        z: vehicle.mesh.rotation.z,
      },
      speed: vehicle.speed,
      isOccupied: vehicle.isOccupied,
    }));

    return {
      isInVehicle: this.isInVehicle(),
      currentVehicleId: this.currentVehicle?.id,
      vehicles: vehiclesData,
    };
  }

  loadSaveData(saveData: {
    isInVehicle: boolean;
    currentVehicleId?: string;
    vehicles: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      speed: number;
      isOccupied: boolean;
    }>;
  }): void {
    // Exit current vehicle if in one
    if (this.isInVehicle()) {
      this.exitVehicle();
    }

    // Update vehicle positions and states
    saveData.vehicles.forEach(vehicleData => {
      const vehicle = this.vehicles.get(vehicleData.id);
      if (vehicle) {
        vehicle.mesh.position = new Vector3(
          vehicleData.position.x,
          vehicleData.position.y,
          vehicleData.position.z
        );
        vehicle.mesh.rotation = new Vector3(
          vehicleData.rotation.x,
          vehicleData.rotation.y,
          vehicleData.rotation.z
        );
        vehicle.position = vehicle.mesh.position.clone();
        vehicle.rotation = vehicle.mesh.rotation.clone();
        vehicle.speed = vehicleData.speed;
        vehicle.isOccupied = vehicleData.isOccupied;
      }
    });

    // Re-enter vehicle if player was in one
    if (saveData.isInVehicle && saveData.currentVehicleId) {
      const vehicle = this.vehicles.get(saveData.currentVehicleId);
      if (vehicle) {
        this.enterVehicle(vehicle.id);
      }
    }

    console.log('Vehicle system data loaded');
  }
}
