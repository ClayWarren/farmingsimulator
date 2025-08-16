import { Scene, Color3, HemisphericLight } from '@babylonjs/core';

export type WeatherType = 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';

export interface WeatherData {
    type: WeatherType;
    temperature: number;
    humidity: number;
    windSpeed: number;
}

export class WeatherSystem {
    private scene: Scene;
    private weatherData: WeatherData;
    private light!: HemisphericLight;
    private weatherChangeTimer: number = 0;
    private weatherChangeDuration: number = 300;

    constructor(scene: Scene) {
        this.scene = scene;
        this.weatherData = {
            type: 'Sunny',
            temperature: 22,
            humidity: 45,
            windSpeed: 5
        };
    }

    initialize(): void {
        this.light = this.scene.lights[0] as HemisphericLight;
        this.updateLighting();
        console.log('Weather system initialized');
    }

    update(deltaTime: number): void {
        this.weatherChangeTimer += deltaTime;
        
        if (this.weatherChangeTimer >= this.weatherChangeDuration) {
            this.weatherChangeTimer = 0;
            this.considerWeatherChange();
        }
        
        this.updateLighting();
    }

    private considerWeatherChange(): void {
        if (Math.random() < 0.3) {
            this.changeWeather();
        }
    }

    private changeWeather(): void {
        const weatherTypes: WeatherType[] = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
        const currentIndex = weatherTypes.indexOf(this.weatherData.type);
        
        let newWeatherIndex: number;
        do {
            newWeatherIndex = Math.floor(Math.random() * weatherTypes.length);
        } while (newWeatherIndex === currentIndex);
        
        this.weatherData.type = weatherTypes[newWeatherIndex];
        this.updateWeatherParameters();
        
        console.log(`Weather changed to: ${this.weatherData.type}`);
    }

    private updateWeatherParameters(): void {
        switch (this.weatherData.type) {
            case 'Sunny':
                this.weatherData.temperature = 20 + Math.random() * 15;
                this.weatherData.humidity = 30 + Math.random() * 20;
                this.weatherData.windSpeed = 2 + Math.random() * 8;
                break;
            case 'Cloudy':
                this.weatherData.temperature = 15 + Math.random() * 10;
                this.weatherData.humidity = 50 + Math.random() * 20;
                this.weatherData.windSpeed = 5 + Math.random() * 10;
                break;
            case 'Rainy':
                this.weatherData.temperature = 10 + Math.random() * 10;
                this.weatherData.humidity = 70 + Math.random() * 20;
                this.weatherData.windSpeed = 8 + Math.random() * 12;
                break;
            case 'Stormy':
                this.weatherData.temperature = 8 + Math.random() * 8;
                this.weatherData.humidity = 80 + Math.random() * 15;
                this.weatherData.windSpeed = 15 + Math.random() * 20;
                break;
        }
    }

    private updateLighting(): void {
        if (!this.light) return;

        let intensity: number;
        let color: Color3;

        switch (this.weatherData.type) {
            case 'Sunny':
                intensity = 1.2;
                color = Color3.FromHexString('#FFF8DC');
                break;
            case 'Cloudy':
                intensity = 0.8;
                color = Color3.FromHexString('#E6E6FA');
                break;
            case 'Rainy':
                intensity = 0.6;
                color = Color3.FromHexString('#778899');
                break;
            case 'Stormy':
                intensity = 0.4 + Math.random() * 0.4;
                color = Color3.FromHexString('#696969');
                break;
        }

        this.light.intensity = intensity;
        this.light.diffuse = color;
        
        this.updateSkyColor();
    }

    private updateSkyColor(): void {
        let skyColor: Color3;

        switch (this.weatherData.type) {
            case 'Sunny':
                skyColor = Color3.FromHexString('#87CEEB');
                break;
            case 'Cloudy':
                skyColor = Color3.FromHexString('#B0C4DE');
                break;
            case 'Rainy':
                skyColor = Color3.FromHexString('#708090');
                break;
            case 'Stormy':
                skyColor = Color3.FromHexString('#2F4F4F');
                break;
        }

        this.scene.clearColor = skyColor.toColor4();
    }

    getWeatherData(): WeatherData {
        return { ...this.weatherData };
    }

    setWeather(weatherType: WeatherType): void {
        this.weatherData.type = weatherType;
        this.updateWeatherParameters();
        this.updateLighting();
    }
}