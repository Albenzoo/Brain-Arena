/**
 * Manages quiz countdown timer with tick and expiration events
 */
export class TimerService {
    private timeRemaining: number = 0;
    private maxTime: number = 20;
    private isRunning: boolean = false;
    private clockTickSpeedUpAudio = new Audio('/assets/sounds/clock_tick_speed_up.mp3');
    private audioStarted: boolean = false;
    private onTickCallback: ((time: number) => void) | null = null;
    private onExpireCallback: (() => void) | null = null;

    /**
     * Start the countdown timer
     * @param duration Timer duration in seconds (default: 20)
     */
    public start(duration: number = 20): void {
        this.maxTime = duration;
        this.timeRemaining = duration;
        this.isRunning = true;
        this.audioStarted = false;
    }

    /**
     * Stop the timer without triggering expiration callback
     */
    public stop(): void {
        this.isRunning = false;
        this.resetClockAudio();

    }

    /**
     * Reset timer to initial state
     */
    public reset(): void {
        this.timeRemaining = this.maxTime;
        this.isRunning = false;
        this.resetClockAudio();
    }


    /**
     * Update timer state (called every frame from MainScene.update)
     * @param deltaSeconds Time elapsed since last frame
     */
    public update(deltaSeconds: number): void {
        if (!this.isRunning) return;

        this.timeRemaining -= deltaSeconds;

        // Notify listeners on every tick
        if (this.onTickCallback) {
            this.onTickCallback(Math.max(0, this.timeRemaining));
        }
        if (this.timeRemaining < 9 && !this.audioStarted) {
            this.audioStarted = true;
            this.clockTickSpeedUpAudio.play();
        }

        // Check if time expired
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.isRunning = false;
            this.resetClockAudio();

            if (this.onExpireCallback) {
                this.onExpireCallback();
            }
        }
    }

    /**
     * Register callback for timer tick events (called every frame)
     * @param callback Function that receives remaining time in seconds
     */
    public onTick(callback: (time: number) => void): void {
        this.onTickCallback = callback;
    }

    /**
     * Register callback for timer expiration event
     * @param callback Function called when timer reaches 0
     */
    public onExpire(callback: () => void): void {
        this.onExpireCallback = callback;
    }

    /**
     * Get current time remaining
     * @returns Time remaining in seconds
     */
    public getTimeRemaining(): number {
        return this.timeRemaining;
    }

    /**
     * Check if timer is currently running
     * @returns True if timer is active
     */
    public isActive(): boolean {
        return this.isRunning;
    }

    private resetClockAudio(): void {
        this.clockTickSpeedUpAudio.pause();
        this.clockTickSpeedUpAudio.currentTime = 0;
        this.audioStarted = false;
    }
}