import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export type AttachmentType = 'plow' | 'seeder' | 'cultivator';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  description: string;
  price: number;
  owned: boolean;
  effects: {
    tillingSpeed?: number;     // Multiplier for tilling speed
    plantingSpeed?: number;    // Multiplier for planting speed
    workingArea?: number;      // Area multiplier (1x1, 3x3, etc.)
    efficiency?: number;       // General efficiency bonus
  };
  visualOffset: Vector3;       // Position offset when attached to vehicle
}

export interface VehicleAttachmentState {
  vehicleId: string;
  currentAttachment: AttachmentType | null;
  attachmentMesh?: Mesh;
}

export class AttachmentSystem {
  private scene: Scene;
  private attachments: Map<string, Attachment> = new Map();
  private vehicleAttachments: Map<string, VehicleAttachmentState> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeAttachmentCatalog();
  }

  initialize(): void {
    console.log('Attachment System initialized');
  }

  private initializeAttachmentCatalog(): void {
    const attachmentCatalog: Attachment[] = [
      {
        id: 'heavy_plow',
        name: 'Heavy Plow',
        type: 'plow',
        description: 'Professional plowing attachment for deep soil preparation',
        price: 5000,
        owned: false,
        effects: {
          tillingSpeed: 2.0,
          workingArea: 3,
          efficiency: 1.5,
        },
        visualOffset: new Vector3(0, 0, -4), // Behind the vehicle, at vehicle level
      },
      {
        id: 'precision_seeder',
        name: 'Precision Seeder',
        type: 'seeder',
        description: 'Advanced seeding attachment for efficient crop planting',
        price: 7500,
        owned: false,
        effects: {
          plantingSpeed: 2.5,
          workingArea: 3,
          efficiency: 1.8,
        },
        visualOffset: new Vector3(0, 0, -4), // Behind the vehicle, at vehicle level
      },
      {
        id: 'field_cultivator',
        name: 'Field Cultivator',
        type: 'cultivator',
        description: 'Multi-purpose cultivator for field maintenance and soil conditioning',
        price: 4000,
        owned: false,
        effects: {
          tillingSpeed: 1.5,
          plantingSpeed: 1.3,
          workingArea: 2,
          efficiency: 1.3,
        },
        visualOffset: new Vector3(0, 0, -3.5), // Behind the vehicle, at vehicle level
      },
    ];

    attachmentCatalog.forEach(attachment => {
      this.attachments.set(attachment.id, { ...attachment });
    });
  }

  getAttachmentCatalog(): Attachment[] {
    return Array.from(this.attachments.values());
  }

  getOwnedAttachments(): Attachment[] {
    return Array.from(this.attachments.values()).filter(attachment => attachment.owned);
  }

  purchaseAttachment(attachmentId: string): boolean {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment || attachment.owned) {
      return false;
    }

    attachment.owned = true;
    console.log(`Purchased ${attachment.name} for $${attachment.price}`);
    
    // Auto-attach to tractor if no attachments are currently attached
    const tractorId = 'tractor_1';
    const currentAttachment = this.getCurrentAttachment(tractorId);
    if (!currentAttachment) {
      console.log(`Auto-attaching ${attachment.name} to tractor`);
      this.attachToVehicle(tractorId, attachment.type);
    }
    
    return true;
  }

  getAttachment(attachmentId: string): Attachment | undefined {
    return this.attachments.get(attachmentId);
  }

  attachToVehicle(vehicleId: string, attachmentType: AttachmentType): boolean {
    // Find owned attachment of the specified type
    const attachment = Array.from(this.attachments.values()).find(
      att => att.type === attachmentType && att.owned
    );

    if (!attachment) {
      console.log(`No owned ${attachmentType} attachment available`);
      return false;
    }

    // Remove current attachment if any
    this.detachFromVehicle(vehicleId);

    // Create attachment state
    const attachmentState: VehicleAttachmentState = {
      vehicleId,
      currentAttachment: attachmentType,
    };

    this.vehicleAttachments.set(vehicleId, attachmentState);
    this.createAttachmentVisual(vehicleId, attachment);

    console.log(`Attached ${attachment.name} to vehicle ${vehicleId}`);
    return true;
  }

  detachFromVehicle(vehicleId: string): void {
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    if (attachmentState) {
      // Remove visual attachment
      if (attachmentState.attachmentMesh) {
        attachmentState.attachmentMesh.dispose();
      }
      
      this.vehicleAttachments.delete(vehicleId);
      console.log(`Detached attachment from vehicle ${vehicleId}`);
    }
  }

  private createAttachmentVisual(vehicleId: string, attachment: Attachment): void {
    console.log(`Creating attachment visual for ${vehicleId}: ${attachment.name}`);
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    if (!attachmentState) {
      console.error(`No attachment state found for vehicle ${vehicleId}`);
      return;
    }

    let attachmentMesh: Mesh;

    try {
      switch (attachment.type) {
        case 'plow':
          attachmentMesh = this.createPlowMesh(attachment.id);
          break;
        case 'seeder':
          attachmentMesh = this.createSeederMesh(attachment.id);
          break;
        case 'cultivator':
          attachmentMesh = this.createCultivatorMesh(attachment.id);
          break;
        default:
          console.error(`Unknown attachment type: ${attachment.type}`);
          return;
      }

      // Position relative to vehicle and store the mesh
      attachmentMesh.position = attachment.visualOffset.clone();
      attachmentMesh.isVisible = true;
      attachmentMesh.setEnabled(true);
      attachmentState.attachmentMesh = attachmentMesh;
      
      console.log(`Successfully created attachment visual: ${attachment.name} for vehicle ${vehicleId}`, {
        meshId: attachmentMesh.id,
        position: attachmentMesh.position.toString(),
        visible: attachmentMesh.isVisible,
        enabled: attachmentMesh.isEnabled(),
        hasParent: !!attachmentMesh.parent
      });
    } catch (error) {
      console.error(`Error creating attachment visual for ${vehicleId}:`, error);
    }
  }

  private createPlowMesh(attachmentId: string): Mesh {
    // Create plow body
    const plowBody = MeshBuilder.CreateBox(`plow_body_${attachmentId}`, 
      { width: 2.5, height: 0.3, depth: 1.5 }, this.scene);
    
    // Create plow blades
    const blade1 = MeshBuilder.CreateBox(`plow_blade1_${attachmentId}`, 
      { width: 0.3, height: 0.8, depth: 0.1 }, this.scene);
    blade1.position = new Vector3(-0.8, -0.4, 0.7);
    blade1.rotation.z = Math.PI / 6; // Angled blade
    
    const blade2 = MeshBuilder.CreateBox(`plow_blade2_${attachmentId}`, 
      { width: 0.3, height: 0.8, depth: 0.1 }, this.scene);
    blade2.position = new Vector3(0.8, -0.4, 0.7);
    blade2.rotation.z = -Math.PI / 6; // Angled blade

    // Merge into single plow
    const plow = Mesh.MergeMeshes([plowBody, blade1, blade2], true, true);
    
    if (plow) {
      plow.name = `plow_${attachmentId}`;
      const material = new StandardMaterial(`plow_material_${attachmentId}`, this.scene);
      material.diffuseColor = Color3.FromHexString('#8B4513'); // Brown metal
      material.specularColor = Color3.FromHexString('#A0522D');
      plow.material = material;
      plow.isVisible = true;
      plow.setEnabled(true);
      
      // Make sure it's a reasonable size
      plow.scaling = new Vector3(1, 1, 1);
      
      console.log(`Created plow mesh for ${attachmentId}:`, {
        name: plow.name,
        position: plow.position.toString(),
        scaling: plow.scaling.toString(),
        visible: plow.isVisible,
        enabled: plow.isEnabled(),
        materialName: material.name
      });
      
      return plow;
    } else {
      console.error(`Failed to merge plow meshes for ${attachmentId}, creating fallback box`);
      
      // Create a fallback simple box if merging fails
      const fallbackPlow = MeshBuilder.CreateBox(`plow_fallback_${attachmentId}`, 
        { width: 2, height: 0.5, depth: 1 }, this.scene);
      
      const material = new StandardMaterial(`plow_fallback_material_${attachmentId}`, this.scene);
      material.diffuseColor = Color3.FromHexString('#8B4513');
      fallbackPlow.material = material;
      fallbackPlow.isVisible = true;
      fallbackPlow.setEnabled(true);
      
      console.log(`Created fallback plow mesh for ${attachmentId}`);
      return fallbackPlow;
    }
  }

  private createSeederMesh(attachmentId: string): Mesh {
    // Create seeder frame
    const frame = MeshBuilder.CreateBox(`seeder_frame_${attachmentId}`, 
      { width: 3, height: 0.4, depth: 1.2 }, this.scene);
    
    // Create seed hoppers
    const hopper1 = MeshBuilder.CreateCylinder(`seeder_hopper1_${attachmentId}`, 
      { height: 0.8, diameter: 0.6 }, this.scene);
    hopper1.position = new Vector3(-1, 0.6, 0);
    
    const hopper2 = MeshBuilder.CreateCylinder(`seeder_hopper2_${attachmentId}`, 
      { height: 0.8, diameter: 0.6 }, this.scene);
    hopper2.position = new Vector3(1, 0.6, 0);

    // Create planting discs
    const disc1 = MeshBuilder.CreateCylinder(`seeder_disc1_${attachmentId}`, 
      { height: 0.1, diameter: 0.8 }, this.scene);
    disc1.position = new Vector3(-1, -0.4, 0.5);
    disc1.rotation.x = Math.PI / 2;
    
    const disc2 = MeshBuilder.CreateCylinder(`seeder_disc2_${attachmentId}`, 
      { height: 0.1, diameter: 0.8 }, this.scene);
    disc2.position = new Vector3(1, -0.4, 0.5);
    disc2.rotation.x = Math.PI / 2;

    // Merge into single seeder
    const seeder = Mesh.MergeMeshes([frame, hopper1, hopper2, disc1, disc2], true, true);
    
    if (seeder) {
      const material = new StandardMaterial(`seeder_material_${attachmentId}`, this.scene);
      material.diffuseColor = Color3.FromHexString('#4169E1'); // Blue
      material.specularColor = Color3.FromHexString('#6495ED');
      seeder.material = material;
    }

    return seeder!;
  }

  private createCultivatorMesh(attachmentId: string): Mesh {
    // Create cultivator frame
    const frame = MeshBuilder.CreateBox(`cultivator_frame_${attachmentId}`, 
      { width: 2, height: 0.3, depth: 1 }, this.scene);
    
    // Create cultivator tines
    const tines: Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const tine = MeshBuilder.CreateCylinder(`cultivator_tine_${i}_${attachmentId}`, 
        { height: 0.6, diameter: 0.1 }, this.scene);
      tine.position = new Vector3((i - 2.5) * 0.4, -0.45, 0.3);
      tines.push(tine);
    }

    // Merge into single cultivator
    const cultivator = Mesh.MergeMeshes([frame, ...tines], true, true);
    
    if (cultivator) {
      const material = new StandardMaterial(`cultivator_material_${attachmentId}`, this.scene);
      material.diffuseColor = Color3.FromHexString('#32CD32'); // Green
      material.specularColor = Color3.FromHexString('#228B22');
      cultivator.material = material;
    }

    return cultivator!;
  }

  updateVehicleAttachment(vehicleId: string, vehicleMesh: Mesh): void {
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    if (attachmentState && attachmentState.attachmentMesh) {
      // Parent attachment to vehicle for movement
      if (!attachmentState.attachmentMesh.parent) {
        attachmentState.attachmentMesh.parent = vehicleMesh;
        console.log(`Parented attachment mesh to vehicle ${vehicleId}:`, {
          attachmentPosition: attachmentState.attachmentMesh.position.toString(),
          vehiclePosition: vehicleMesh.position.toString(),
          attachmentVisible: attachmentState.attachmentMesh.isVisible,
          attachmentEnabled: attachmentState.attachmentMesh.isEnabled()
        });
      }
    } else if (attachmentState && !attachmentState.attachmentMesh) {
      console.log(`Vehicle ${vehicleId} has attachment state but no mesh`);
    }
  }

  getCurrentAttachment(vehicleId: string): AttachmentType | null {
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    return attachmentState ? attachmentState.currentAttachment : null;
  }

  getAttachmentEffects(vehicleId: string): Attachment['effects'] {
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    if (!attachmentState || !attachmentState.currentAttachment) {
      return {};
    }

    const attachment = Array.from(this.attachments.values()).find(
      att => att.type === attachmentState.currentAttachment && att.owned
    );

    return attachment ? attachment.effects : {};
  }

  getNextAttachmentType(vehicleId: string): AttachmentType | null {
    const ownedAttachments = this.getOwnedAttachments();
    if (ownedAttachments.length === 0) return null;

    const currentAttachment = this.getCurrentAttachment(vehicleId);
    const attachmentTypes: AttachmentType[] = ['plow', 'seeder', 'cultivator'];
    
    if (!currentAttachment) {
      return ownedAttachments[0].type;
    }

    const currentIndex = attachmentTypes.indexOf(currentAttachment);
    const ownedTypes = ownedAttachments.map(att => att.type);
    
    // Find next owned attachment type
    for (let i = 1; i <= attachmentTypes.length; i++) {
      const nextIndex = (currentIndex + i) % attachmentTypes.length;
      const nextType = attachmentTypes[nextIndex];
      if (ownedTypes.includes(nextType)) {
        return nextType;
      }
    }

    return null;
  }

  switchAttachment(vehicleId: string): boolean {
    const nextAttachmentType = this.getNextAttachmentType(vehicleId);
    if (!nextAttachmentType) {
      this.detachFromVehicle(vehicleId);
      return false;
    }

    const result = this.attachToVehicle(vehicleId, nextAttachmentType);
    
    // Force immediate visual update
    console.log('Forcing visual update after attachment switch');
    this.forceAttachmentVisualUpdate(vehicleId);
    
    return result;
  }

  forceAttachmentVisualUpdate(vehicleId: string): void {
    // This method will be called from Game.ts to force visual updates
    const attachmentState = this.vehicleAttachments.get(vehicleId);
    if (attachmentState && attachmentState.attachmentMesh) {
      console.log(`Forcing visual update for vehicle ${vehicleId} - mesh exists: ${!!attachmentState.attachmentMesh}`);
    } else {
      console.log(`No attachment mesh found for vehicle ${vehicleId} during force update`);
    }
  }

  // Debug method to list all attachment meshes
  debugListAttachmentMeshes(): void {
    console.log('=== ATTACHMENT MESHES DEBUG ===');
    this.vehicleAttachments.forEach((state, vehicleId) => {
      console.log(`Vehicle ${vehicleId}:`, {
        hasAttachment: state.currentAttachment,
        attachmentType: state.currentAttachment,
        hasMesh: !!state.attachmentMesh,
        meshName: state.attachmentMesh?.name,
        meshPosition: state.attachmentMesh?.position.toString(),
        meshVisible: state.attachmentMesh?.isVisible,
        meshEnabled: state.attachmentMesh?.isEnabled(),
        meshParent: state.attachmentMesh?.parent?.name
      });
    });
    console.log('=== END ATTACHMENT DEBUG ===');
  }

  // Save/Load functionality
  getSaveData(): {
    ownedAttachments: string[];
    vehicleAttachments: Array<{
      vehicleId: string;
      currentAttachment: AttachmentType | null;
    }>;
  } {
    const ownedAttachments = Array.from(this.attachments.values())
      .filter(att => att.owned)
      .map(att => att.id);

    const vehicleAttachments = Array.from(this.vehicleAttachments.values()).map(state => ({
      vehicleId: state.vehicleId,
      currentAttachment: state.currentAttachment,
    }));

    return {
      ownedAttachments,
      vehicleAttachments,
    };
  }

  loadSaveData(saveData: {
    ownedAttachments: string[];
    vehicleAttachments: Array<{
      vehicleId: string;
      currentAttachment: AttachmentType | null;
    }>;
  }): void {
    // Clear current state
    this.vehicleAttachments.forEach((state) => {
      if (state.attachmentMesh) {
        state.attachmentMesh.dispose();
      }
    });
    this.vehicleAttachments.clear();

    // Reset owned status
    this.attachments.forEach(attachment => {
      attachment.owned = false;
    });

    // Restore owned attachments
    saveData.ownedAttachments.forEach(attachmentId => {
      const attachment = this.attachments.get(attachmentId);
      if (attachment) {
        attachment.owned = true;
      }
    });

    // Restore vehicle attachments (visuals will be recreated when vehicles are updated)
    saveData.vehicleAttachments.forEach(vehicleAttachment => {
      if (vehicleAttachment.currentAttachment) {
        const attachmentState: VehicleAttachmentState = {
          vehicleId: vehicleAttachment.vehicleId,
          currentAttachment: vehicleAttachment.currentAttachment,
        };
        this.vehicleAttachments.set(vehicleAttachment.vehicleId, attachmentState);
      }
    });

    console.log(`Attachment system data loaded: ${saveData.ownedAttachments.length} owned attachments`);
  }
}