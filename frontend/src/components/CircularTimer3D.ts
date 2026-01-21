import * as THREE from 'three';

/**
 * Countdown timer rendered as a circular progress indicator
 */
export class CircularTimer3D extends THREE.Group {
    private static readonly RADIUS = 0.12;
    private static readonly SIZE = 256;

    private canvas: HTMLCanvasElement;
    private texture: THREE.CanvasTexture;
    private timerMesh: THREE.Mesh;
    private timeRemaining: number = 25;
    private maxTime: number = 25;

    constructor() {
        super();

        // Fixed-size canvas for consistent timer rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = CircularTimer3D.SIZE;
        this.canvas.height = CircularTimer3D.SIZE;

        this.texture = new THREE.CanvasTexture(this.canvas);
        // Optimize texture filtering for circular shapes
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneGeometry(
            CircularTimer3D.RADIUS * 2,
            CircularTimer3D.RADIUS * 2
        );
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.timerMesh = new THREE.Mesh(geometry, material);
        this.add(this.timerMesh);

        this.updateVisual();
    }

    /**
     * Update the timer with new time value
     */
    public setTime(seconds: number): void {
        this.timeRemaining = Math.max(0, seconds);
        this.updateVisual();
    }

    /**
     * Reset the timer to initial state
     */
    public reset(maxTime: number = 20): void {
        this.maxTime = maxTime;
        this.timeRemaining = maxTime;
        this.updateVisual();
    }

    /**
     * Get current time remaining
     */
    public getTimeRemaining(): number {
        return this.timeRemaining;
    }

    /**
     * Render the circular timer visualization
     */
    private updateVisual(): void {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 20;
        const lineWidth = 16;

        const percentage = this.timeRemaining / this.maxTime;
        const angle = Math.PI * 2 * percentage;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background ring (gray base for progress arc)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.8)';
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Draw progress arc (colored based on time remaining)
        const color = this.getColorForPercentage(percentage);

        ctx.beginPath();
        ctx.arc(
            centerX,
            centerY,
            radius,
            -Math.PI / 2, // Start at top
            -Math.PI / 2 + angle, // End based on time remaining
            false
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw inner circle (background for text)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - lineWidth - 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.fill();

        // Draw time text
        const timeText = Math.ceil(this.timeRemaining).toString();
        ctx.font = 'bold 72px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(timeText, centerX + 2, centerY + 2);

        // Main text
        ctx.fillStyle = color;
        ctx.fillText(timeText, centerX, centerY);

        // Add pulsing effect when time is low
        if (percentage < 0.25 && this.timeRemaining > 0) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#FF2B6D';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.globalAlpha = 1.0;
        }

        this.texture.needsUpdate = true;
    }

    /**
     * Get color based on time percentage remaining
     */
    private getColorForPercentage(percentage: number): string {
        if (percentage > 0.5) {
            return '#00FFBF'; // Green/Cyan
        } else if (percentage > 0.25) {
            return '#FFC93C'; // Yellow/Orange
        } else if (percentage > 0) {
            return '#FF2B6D'; // Red/Pink
        } else {
            return '#666666'; // Gray (expired)
        }
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.timerMesh.geometry.dispose();
        this.texture.dispose();
        (this.timerMesh.material as THREE.Material).dispose();
    }
}