import { Game } from './game/Game';

class FarmingSimulator {
    private game: Game;

    constructor() {
        this.game = new Game();
    }

    async start(): Promise<void> {
        try {
            await this.game.initialize();
            this.game.start();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to start farming simulator:', error);
            this.showError('Failed to load game. Please refresh and try again.');
        }
    }

    private hideLoading(): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    private showError(message: string): void {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.textContent = message;
            loading.style.color = '#e74c3c';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const simulator = new FarmingSimulator();
    simulator.start();
});