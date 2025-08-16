import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, FreeCamera } from '@babylonjs/core';

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
        console.log('Vehicle system initialized');
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
            isOccupied: false
        };

        tractorMesh.position = tractor.position.clone();
        this.vehicles.set(tractor.id, tractor);
    }

    private createTractorMesh(): Mesh {
        const tractor = MeshBuilder.CreateBox('tractor', {
            width: 3,
            height: 2,
            depth: 5
        }, this.scene);

        const material = new StandardMaterial('tractorMaterial', this.scene);
        material.diffuseColor = Color3.FromHexString('#228B22');
        material.specularColor = Color3.FromHexString('#006400');
        tractor.material = material;

        tractor.position.y = 1;

        const cabin = MeshBuilder.CreateBox('cabin', {
            width: 2.5,
            height: 1.5,
            depth: 2
        }, this.scene);

        const cabinMaterial = new StandardMaterial('cabinMaterial', this.scene);
        cabinMaterial.diffuseColor = Color3.FromHexString('#1F4F2F');
        cabin.material = cabinMaterial;
        cabin.position = new Vector3(0, 1.75, -0.5);
        cabin.parent = tractor;

        const frontWheel1 = MeshBuilder.CreateCylinder('frontWheel1', {
            height: 0.5,
            diameter: 1.5
        }, this.scene);
        const frontWheel2 = MeshBuilder.CreateCylinder('frontWheel2', {
            height: 0.5,
            diameter: 1.5
        }, this.scene);
        const backWheel1 = MeshBuilder.CreateCylinder('backWheel1', {
            height: 0.6,
            diameter: 2
        }, this.scene);
        const backWheel2 = MeshBuilder.CreateCylinder('backWheel2', {
            height: 0.6,
            diameter: 2
        }, this.scene);

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

    enterVehicle(vehicleId: string): boolean {
        const vehicle = this.vehicles.get(vehicleId);
        if (!vehicle || vehicle.isOccupied) {
            return false;
        }

        vehicle.isOccupied = true;
        this.currentVehicle = vehicle;

        this.vehicleCamera = new FreeCamera('vehicleCamera', 
            vehicle.mesh.position.add(new Vector3(0, 3, -8)), this.scene);
        this.vehicleCamera.setTarget(vehicle.mesh.position);
        this.scene.activeCamera = this.vehicleCamera;

        console.log(`Entered ${vehicle.name}`);
        return true;
    }

    exitVehicle(): boolean {
        if (!this.currentVehicle) {
            return false;
        }

        this.currentVehicle.isOccupied = false;
        this.currentVehicle.speed = 0;

        this.scene.activeCamera = this.playerCamera;
        
        const exitPosition = this.currentVehicle.mesh.position.add(new Vector3(5, 2, 0));
        this.playerCamera.position = exitPosition;

        if (this.vehicleCamera) {
            this.vehicleCamera.dispose();
            this.vehicleCamera = null;
        }

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

    handleVehicleInput(forward: boolean, backward: boolean, left: boolean, right: boolean): void {
        if (!this.currentVehicle) return;

        const vehicle = this.currentVehicle;
        const acceleration = 15;
        const turnSpeed = 2;

        if (forward) {
            vehicle.speed = Math.min(vehicle.speed + acceleration, vehicle.maxSpeed);
        }
        if (backward) {
            vehicle.speed = Math.max(vehicle.speed - acceleration, -vehicle.maxSpeed * 0.5);
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

    getNearestVehicle(position: Vector3, maxDistance: number = 5): Vehicle | null {
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
}