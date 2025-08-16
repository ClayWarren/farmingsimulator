import { Vector3, BoundingBox } from '@babylonjs/core';

export interface LandPlot {
  id: string;
  name: string;
  price: number;
  isOwned: boolean;
  bounds: BoundingBox;
}

export class FarmExpansionSystem {
  private plots: LandPlot[] = [];

  constructor() {
    this.initializePlots();
  }

  initialize(): void {
    console.log('Farm Expansion System initialized');
  }

  private initializePlots(): void {
    // Define the land plots available for purchase
    this.plots = [
      {
        id: 'starter_plot',
        name: 'Starter Farmland',
        price: 0,
        isOwned: true, // The player starts with this plot
        bounds: new BoundingBox(new Vector3(-20, -1, -20), new Vector3(20, 1, 20)),
      },
      {
        id: 'north_plot',
        name: 'Northern Meadow',
        price: 15000,
        isOwned: false,
        bounds: new BoundingBox(new Vector3(-20, -1, 22), new Vector3(20, 1, 62)),
      },
      {
        id: 'west_plot',
        name: 'Western Fields',
        price: 25000,
        isOwned: false,
        bounds: new BoundingBox(new Vector3(-62, -1, -20), new Vector3(-22, 1, 20)),
      },
    ];
  }

  getPlots(): LandPlot[] {
    return this.plots;
  }

  getPlot(id: string): LandPlot | undefined {
    return this.plots.find(p => p.id === id);
  }

  purchasePlot(id: string): boolean {
    const plot = this.getPlot(id);
    if (plot && !plot.isOwned) {
      plot.isOwned = true;
      console.log(`Purchased ${plot.name}`);
      return true;
    }
    return false;
  }

  isPositionOnOwnedLand(position: Vector3): boolean {
    for (const plot of this.plots) {
      if (plot.isOwned && plot.bounds.intersectsPoint(position)) {
        return true;
      }
    }
    return false;
  }

  getSaveData(): { ownedPlots: string[] } {
    return {
      ownedPlots: this.plots.filter(p => p.isOwned).map(p => p.id),
    };
  }

  loadSaveData(data: { ownedPlots: string[] }): void {
    if (!data || !data.ownedPlots) return;

    for (const plot of this.plots) {
        // Starter plot is always owned
        if(plot.id === 'starter_plot'){
            plot.isOwned = true;
            continue;
        }
        plot.isOwned = data.ownedPlots.includes(plot.id);
    }
  }
}
