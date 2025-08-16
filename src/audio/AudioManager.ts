export type SoundType =
  | 'ambient_wind'
  | 'ambient_birds'
  | 'weather_rain'
  | 'weather_storm'
  | 'interaction_plant'
  | 'interaction_harvest'
  | 'interaction_click'
  | 'vehicle_engine'
  | 'vehicle_start'
  | 'vehicle_stop'
  | 'economy_sell'
  | 'economy_buy';

export interface AudioSettings {
  masterVolume: number;
  ambientVolume: number;
  effectVolume: number;
  musicVolume: number;
  enabled: boolean;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private effectGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private ambientLoops: Map<string, AudioBufferSourceNode> = new Map();

  private settings: AudioSettings = {
    masterVolume: 0.7,
    ambientVolume: 0.5,
    effectVolume: 0.8,
    musicVolume: 0.6,
    enabled: true,
  };

  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.settings.enabled) {
      return;
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create gain nodes for volume control
      this.masterGain = this.audioContext.createGain();
      this.ambientGain = this.audioContext.createGain();
      this.effectGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();

      // Connect gain nodes
      this.ambientGain.connect(this.masterGain);
      this.effectGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Set initial volumes
      this.updateVolumes();

      this.isInitialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.warn('Failed to initialize audio system:', error);
      this.settings.enabled = false;
    }
  }

  private updateVolumes(): void {
    if (!this.audioContext || !this.isInitialized) return;

    this.masterGain!.gain.value = this.settings.masterVolume;
    this.ambientGain!.gain.value = this.settings.ambientVolume;
    this.effectGain!.gain.value = this.settings.effectVolume;
    this.musicGain!.gain.value = this.settings.musicVolume;
  }

  // Procedural sound generation methods
  private createWindSound(duration: number = 2): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, frameCount, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // Generate filtered noise for wind
        const noise = (Math.random() * 2 - 1) * 0.1;
        const lowFreq = Math.sin(i * 0.001) * 0.05;
        channelData[i] = noise + lowFreq;
      }
    }
    return buffer;
  }

  private createBirdSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5 + Math.random() * 1; // 0.5-1.5 seconds
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);
    const frequency = 800 + Math.random() * 1200; // 800-2000 Hz

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // Exponential decay
      const chirp = Math.sin(2 * Math.PI * frequency * t * (1 + t * 2));
      channelData[i] = chirp * envelope * 0.1;
    }
    return buffer;
  }

  private createRainSound(intensity: number = 0.5): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 3;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, frameCount, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // High-frequency noise for rain
        const noise = (Math.random() * 2 - 1) * intensity * 0.2;
        const filtered = noise * (0.5 + Math.sin(i * 0.01) * 0.3);
        channelData[i] = filtered;
      }
    }
    return buffer;
  }

  private createClickSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 50);
      const click =
        Math.sin(2 * Math.PI * 1000 * t) + Math.sin(2 * Math.PI * 2000 * t);
      channelData[i] = click * envelope * 0.3;
    }
    return buffer;
  }

  private createPlantSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      // Soft thud sound
      const thud =
        Math.sin(2 * Math.PI * 80 * t) + Math.sin(2 * Math.PI * 120 * t);
      channelData[i] = thud * envelope * 0.2;
    }
    return buffer;
  }

  private createHarvestSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5);
      // Rustling/cutting sound
      const rustle =
        (Math.random() * 2 - 1) * 0.3 + Math.sin(2 * Math.PI * 200 * t);
      channelData[i] = rustle * envelope * 0.25;
    }
    return buffer;
  }

  private createEngineSound(rpm: number = 1000): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);
    const baseFreq = (rpm / 60) * 2; // Convert RPM to Hz

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      // Engine harmonics
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.5;
      const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.1;

      channelData[i] = (fundamental + harmonic2 + harmonic3 + noise) * 0.15;
    }
    return buffer;
  }

  private createCoinSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);

    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      // Bell-like sound for money
      const bell =
        Math.sin(2 * Math.PI * 660 * t) + Math.sin(2 * Math.PI * 880 * t) * 0.7;
      channelData[i] = bell * envelope * 0.2;
    }
    return buffer;
  }

  private playBuffer(
    buffer: AudioBuffer,
    gainNode: GainNode,
    loop: boolean = false,
    id?: string
  ): AudioBufferSourceNode {
    if (!this.audioContext || !this.isInitialized || !this.settings.enabled) {
      return {} as AudioBufferSourceNode;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(gainNode);

    if (id) {
      // Stop existing sound with same ID
      this.stopSound(id);
      this.activeSounds.set(id, source);

      source.onended = () => {
        this.activeSounds.delete(id);
      };
    }

    source.start();
    return source;
  }

  // Public API methods
  playSound(
    soundType: SoundType,
    options: { volume?: number; id?: string } = {}
  ): void {
    if (!this.isInitialized || !this.settings.enabled) return;

    try {
      let buffer: AudioBuffer;
      let gainNode = this.effectGain!;

      switch (soundType) {
        case 'ambient_wind':
          buffer = this.createWindSound(5);
          gainNode = this.ambientGain!;
          break;
        case 'ambient_birds':
          buffer = this.createBirdSound();
          gainNode = this.ambientGain!;
          break;
        case 'weather_rain':
          buffer = this.createRainSound(0.7);
          gainNode = this.ambientGain!;
          break;
        case 'weather_storm':
          buffer = this.createRainSound(1.0);
          gainNode = this.ambientGain!;
          break;
        case 'interaction_click':
          buffer = this.createClickSound();
          break;
        case 'interaction_plant':
          buffer = this.createPlantSound();
          break;
        case 'interaction_harvest':
          buffer = this.createHarvestSound();
          break;
        case 'vehicle_engine':
          buffer = this.createEngineSound(1200);
          break;
        case 'vehicle_start':
          buffer = this.createEngineSound(800);
          break;
        case 'vehicle_stop':
          buffer = this.createEngineSound(400);
          break;
        case 'economy_sell':
        case 'economy_buy':
          buffer = this.createCoinSound();
          break;
        default:
          console.warn(`Unknown sound type: ${soundType}`);
          return;
      }

      if (options.volume !== undefined && gainNode) {
        const tempGain = this.audioContext!.createGain();
        tempGain.gain.value = options.volume;
        tempGain.connect(gainNode);
        gainNode = tempGain;
      }

      this.playBuffer(buffer, gainNode, false, options.id);
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }

  startAmbientLoop(soundType: SoundType, id: string): void {
    if (!this.isInitialized || !this.settings.enabled) return;

    this.stopAmbientLoop(id);

    try {
      let buffer: AudioBuffer;

      switch (soundType) {
        case 'ambient_wind':
          buffer = this.createWindSound(10);
          break;
        case 'weather_rain':
          buffer = this.createRainSound(0.5);
          break;
        case 'weather_storm':
          buffer = this.createRainSound(0.8);
          break;
        default:
          console.warn(`Cannot loop sound type: ${soundType}`);
          return;
      }

      const source = this.playBuffer(buffer, this.ambientGain!, true, id);
      this.ambientLoops.set(id, source);
    } catch (error) {
      console.warn(`Failed to start ambient loop ${soundType}:`, error);
    }
  }

  stopAmbientLoop(id: string): void {
    const source = this.ambientLoops.get(id);
    if (source) {
      try {
        source.stop();
      } catch (_error) {
        // Source might already be stopped
      }
      this.ambientLoops.delete(id);
    }
  }

  stopSound(id: string): void {
    const source = this.activeSounds.get(id);
    if (source) {
      try {
        source.stop();
      } catch (_error) {
        // Source might already be stopped
      }
      this.activeSounds.delete(id);
    }
  }

  stopAllSounds(): void {
    this.activeSounds.forEach((source, _id) => {
      try {
        source.stop();
      } catch (_error) {
        // Source might already be stopped
      }
    });
    this.activeSounds.clear();

    this.ambientLoops.forEach((source, _id) => {
      try {
        source.stop();
      } catch (_error) {
        // Source might already be stopped
      }
    });
    this.ambientLoops.clear();
  }

  setVolume(
    type: 'master' | 'ambient' | 'effect' | 'music',
    volume: number
  ): void {
    volume = Math.max(0, Math.min(1, volume));

    switch (type) {
      case 'master':
        this.settings.masterVolume = volume;
        break;
      case 'ambient':
        this.settings.ambientVolume = volume;
        break;
      case 'effect':
        this.settings.effectVolume = volume;
        break;
      case 'music':
        this.settings.musicVolume = volume;
        break;
    }

    this.updateVolumes();
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  // Resume audio context (required for some browsers)
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  dispose(): void {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}
