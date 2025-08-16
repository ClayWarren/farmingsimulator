export interface TimeData {
  hour: number;
  minute: number;
  day: number;
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: number;
}

export class TimeSystem {
  private timeData: TimeData;
  private timeScale: number = 60;
  private realTimeAccumulator: number = 0;

  constructor() {
    this.timeData = {
      hour: 6,
      minute: 0,
      day: 1,
      season: 'Spring',
      year: 1,
    };
  }

  initialize(): void {
    console.log('Time system initialized');
  }

  update(deltaTime: number): void {
    this.realTimeAccumulator += deltaTime;

    const gameMinutesPerSecond = this.timeScale / 60;
    const minutesToAdd = Math.floor(
      this.realTimeAccumulator * gameMinutesPerSecond
    );

    if (minutesToAdd > 0) {
      this.realTimeAccumulator -= minutesToAdd / gameMinutesPerSecond;
      this.addMinutes(minutesToAdd);
    }
  }

  private addMinutes(minutes: number): void {
    this.timeData.minute += minutes;

    while (this.timeData.minute >= 60) {
      this.timeData.minute -= 60;
      this.timeData.hour++;

      if (this.timeData.hour >= 24) {
        this.timeData.hour = 0;
        this.timeData.day++;

        if (this.timeData.day > this.getDaysInSeason()) {
          this.timeData.day = 1;
          this.advanceSeason();
        }
      }
    }
  }

  private getDaysInSeason(): number {
    return 30;
  }

  private advanceSeason(): void {
    const seasons: Array<'Spring' | 'Summer' | 'Fall' | 'Winter'> = [
      'Spring',
      'Summer',
      'Fall',
      'Winter',
    ];
    const currentIndex = seasons.indexOf(this.timeData.season);
    const nextIndex = (currentIndex + 1) % seasons.length;

    this.timeData.season = seasons[nextIndex];

    if (this.timeData.season === 'Spring') {
      this.timeData.year++;
    }
  }

  getTimeData(): TimeData {
    return { ...this.timeData };
  }

  getFormattedTime(): string {
    const hour12 =
      this.timeData.hour === 0
        ? 12
        : this.timeData.hour > 12
          ? this.timeData.hour - 12
          : this.timeData.hour;
    const ampm = this.timeData.hour < 12 ? 'AM' : 'PM';
    const minute = this.timeData.minute.toString().padStart(2, '0');

    return `${hour12}:${minute} ${ampm}`;
  }

  isDaytime(): boolean {
    return this.timeData.hour >= 6 && this.timeData.hour < 20;
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(1, Math.min(3600, scale));
  }

  getTimeScale(): number {
    return this.timeScale;
  }
}
