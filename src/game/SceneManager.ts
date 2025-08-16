import { Scene, MeshBuilder, StandardMaterial, Color3, Texture, Vector3 } from '@babylonjs/core';

export class SceneManager {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    initialize(): void {
        this.createTerrain();
        this.createSkybox();
    }

    private createTerrain(): void {
        const ground = MeshBuilder.CreateGround('ground', {
            width: 200,
            height: 200,
            subdivisions: 50
        }, this.scene);

        const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
        groundMaterial.diffuseColor = Color3.FromHexString('#8B4513');
        groundMaterial.specularColor = Color3.FromHexString('#2F4F2F');
        
        try {
            groundMaterial.diffuseTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', this.scene);
        } catch {
            console.warn('Could not load ground texture, using solid color');
        }

        ground.material = groundMaterial;
        ground.position.y = 0;

        this.createFields();
    }

    private createFields(): void {
        const fieldPositions = [
            { x: -50, z: -50 },
            { x: 50, z: -50 },
            { x: -50, z: 50 },
            { x: 50, z: 50 }
        ];

        fieldPositions.forEach((pos, index) => {
            const field = MeshBuilder.CreateGround(`field_${index}`, {
                width: 40,
                height: 40,
                subdivisions: 10
            }, this.scene);

            const fieldMaterial = new StandardMaterial(`fieldMaterial_${index}`, this.scene);
            fieldMaterial.diffuseColor = Color3.FromHexString('#654321');
            fieldMaterial.emissiveColor = Color3.FromHexString('#2F1B14');
            
            field.material = fieldMaterial;
            field.position = new Vector3(pos.x, 0.1, pos.z);
        });
    }

    private createSkybox(): void {
        const skybox = MeshBuilder.CreateSphere('skyBox', { diameter: 500 }, this.scene);
        const skyboxMaterial = new StandardMaterial('skyBox', this.scene);
        
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.diffuseColor = Color3.FromHexString('#87CEEB');
        skyboxMaterial.emissiveColor = Color3.FromHexString('#4682B4');
        
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;
    }

    getScene(): Scene {
        return this.scene;
    }
}