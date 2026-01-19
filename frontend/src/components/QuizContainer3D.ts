import * as THREE from 'three';
import { drawRoundedRect, createVerticalGradient, applySoftShadow, resetShadow, QuestionPanelTheme } from '../styles/Theme';
import { wrapText } from '../utils/TextPanelUtils';

export interface QuizContainerData {
    question: string;
    options: string[];
    selectedIndex?: number;
    correctIndex?: number;
}

export class QuizContainer3D extends THREE.Mesh {
    private canvas: HTMLCanvasElement;
    private texture: THREE.CanvasTexture;
    private currentData: QuizContainerData | null = null;
    private isBackgroundDrawn: boolean = false;

    constructor() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;

        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(1.6, 1.6);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

        super(geometry, material);

        this.canvas = canvas;
        this.texture = texture;
        this.position.set(0, 1.8, -2.5);

        // Draw static background once
        this.drawStaticBackground();
    }



    public updateQuiz(data: QuizContainerData, fullRedraw = false): void {
        this.currentData = data;
        if (fullRedraw) {
            this.redraw();
            return;
        }
        this.redrawDynamicContent();
    }

    private drawStaticBackground(): void {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        const theme = QuestionPanelTheme;
        const padding = 30;
        const borderRadius = theme.border.radius;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw main container background
        const gradient = createVerticalGradient(
            ctx,
            this.canvas.height,
            theme.background.gradientStart,
            theme.background.gradientEnd
        );

        applySoftShadow(ctx, 'rgba(0, 0, 0, 0.4)', 15, 5);
        drawRoundedRect(ctx, padding, padding, this.canvas.width - padding * 2, this.canvas.height - padding * 2, borderRadius);
        ctx.fillStyle = gradient;
        ctx.fill();
        resetShadow(ctx);

        // Draw border
        drawRoundedRect(ctx, padding, padding, this.canvas.width - padding * 2, this.canvas.height - padding * 2, borderRadius);
        ctx.strokeStyle = theme.border.color;
        ctx.lineWidth = theme.border.width;
        ctx.stroke();

        // Draw logo area
        const logoY = padding + 90;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFC93C';
        ctx.fillText('🧠 BRAIN ARENA', this.canvas.width / 2, logoY);

        this.isBackgroundDrawn = true;
        this.texture.needsUpdate = true;
    }

    private redrawDynamicContent(): void {
        if (!this.currentData || !this.isBackgroundDrawn) return;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        const theme = QuestionPanelTheme;
        const padding = 40;

        // Definisci l'area del contenuto dinamico (più precisa)
        const contentStartY = 200;
        const contentEndY = this.canvas.height - padding;
        const contentX = padding;
        const contentWidth = this.canvas.width - padding * 2;
        const contentHeight = contentEndY - contentStartY;

        // Salva lo stato del contesto
        ctx.save();

        // Crea un clipping path per evitare di disegnare fuori dall'area del container
        const borderRadius = theme.border.radius;
        drawRoundedRect(ctx, padding, padding, this.canvas.width - padding * 2, this.canvas.height - padding * 2, borderRadius);
        ctx.clip();

        // Clear solo l'area del contenuto dinamico
        ctx.clearRect(contentX, contentStartY, contentWidth, contentHeight);

        // Ridisegna il gradiente di sfondo nell'area pulita
        const gradient = createVerticalGradient(
            ctx,
            this.canvas.height,
            theme.background.gradientStart,
            theme.background.gradientEnd
        );
        ctx.fillStyle = gradient;
        ctx.fillRect(contentX, contentStartY, contentWidth, contentHeight);

        // Ripristina il contesto (rimuove il clipping)
        ctx.restore();

        // Disegna domanda e opzioni
        this.drawQuestion(ctx, this.currentData.question);
        this.drawOptions(ctx, this.currentData.options);

        this.texture.needsUpdate = true;
    }

    private redraw(): void {
        // Fallback: full redraw (useful if background needs update)
        this.drawStaticBackground();
        this.redrawDynamicContent();
    }

    private drawQuestion(ctx: CanvasRenderingContext2D, question: string): void {
        const questionY = 220;
        const maxWidth = this.canvas.width - 160;

        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const lines = wrapText(ctx, question, maxWidth);

        lines.forEach((line, index) => {
            const y = questionY + index * 50;

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(line, this.canvas.width / 2 + 2, y + 2);

            // Main text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, this.canvas.width / 2, y);
        });
    }

    private drawOptions(ctx: CanvasRenderingContext2D, options: string[]): void {
        const startY = 450;
        const optionHeight = 100;
        const optionSpacing = 20;
        const optionWidth = this.canvas.width - 160;
        const optionX = (this.canvas.width - optionWidth) / 2;

        options.forEach((option, index) => {
            const y = startY + index * (optionHeight + optionSpacing);

            // Determine state colors
            let bgStart = '#9B5DFF';
            let bgEnd = '#7B3FDF';
            let borderColor = '#D9A500';
            let textColor = '#FFFFFF';

            if (this.currentData?.selectedIndex === index) {
                bgStart = '#6B25C4';
                borderColor = '#FFC93C';
            }

            if (this.currentData?.correctIndex !== undefined) {
                if (this.currentData.correctIndex === index) {
                    bgStart = '#00FFBF';
                    bgEnd = '#00CC99';
                    borderColor = '#00CC99';
                    textColor = '#141414';
                } else if (this.currentData.selectedIndex === index) {
                    bgStart = '#FF2B6D';
                    bgEnd = '#CC2255';
                    borderColor = '#CC2255';
                }
            }

            // Draw option background
            const gradient = ctx.createLinearGradient(0, y, 0, y + optionHeight);
            gradient.addColorStop(0, bgStart);
            gradient.addColorStop(1, bgEnd);

            applySoftShadow(ctx, 'rgba(0, 0, 0, 0.35)', 10, 4);
            drawRoundedRect(ctx, optionX, y, optionWidth, optionHeight, 50);
            ctx.fillStyle = gradient;
            ctx.fill();
            resetShadow(ctx);

            // Draw border
            drawRoundedRect(ctx, optionX, y, optionWidth, optionHeight, 50);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw text
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillText(option, this.canvas.width / 2 + 1, y + optionHeight / 2 + 1);

            // Main text
            ctx.fillStyle = textColor;
            ctx.fillText(option, this.canvas.width / 2, y + optionHeight / 2);
        });
    }

    public dispose(): void {
        this.geometry.dispose();
        this.texture.dispose();
        (this.material as THREE.MeshBasicMaterial).dispose();
    }
}