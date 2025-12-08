import * as THREE from 'three';
import { toWorldWidth, toWorldHeight, nearestPowerOfTwo, wrapText } from '../utils/TextPanelUtils';
import type { PanelSizingConfig } from '../utils/TextPanelUtils';
import { QuestionPanelTheme, drawRoundedRect, createVerticalGradient, applySoftShadow, resetShadow } from '../styles/Theme';

export class QuestionPanel3D extends THREE.Mesh {
    private static readonly CANVAS_WIDTH = 512;
    private static readonly MIN_CANVAS_HEIGHT = 160;
    private static readonly H_PADDING = 36;
    private static readonly V_PADDING = 28;
    private static readonly LINE_HEIGHT = 36;
    private static readonly BASE_PLANE_WIDTH = 1.8;
    private static readonly BASE_PLANE_HEIGHT = 0.5;
    private static readonly MIN_WORLD_WIDTH = 0.9;

    private static readonly PANEL_CONFIG: PanelSizingConfig = {
        basePlaneWidth: QuestionPanel3D.BASE_PLANE_WIDTH,
        basePlaneHeight: QuestionPanel3D.BASE_PLANE_HEIGHT,
        canvasWidth: QuestionPanel3D.CANVAS_WIDTH,
        minCanvasHeight: QuestionPanel3D.MIN_CANVAS_HEIGHT,
        minWorldWidth: QuestionPanel3D.MIN_WORLD_WIDTH
    };

    private canvas: HTMLCanvasElement;

    constructor(question: string) {
        const canvas = document.createElement('canvas');
        canvas.width = QuestionPanel3D.CANVAS_WIDTH;
        canvas.height = QuestionPanel3D.MIN_CANVAS_HEIGHT;

        const { contentWidth, contentHeight } = QuestionPanel3D.drawQuestion(canvas, question);
        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(
            toWorldWidth(contentWidth, QuestionPanel3D.PANEL_CONFIG),
            toWorldHeight(contentHeight, QuestionPanel3D.PANEL_CONFIG)
        );
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

        super(geometry, material);

        this.canvas = canvas;
        this.position.set(0, 1.8, -1.8);
    }

    public setQuestion(question: string) {
        const { contentWidth, contentHeight } = QuestionPanel3D.drawQuestion(this.canvas, question);
        (this.material as THREE.MeshBasicMaterial).map!.needsUpdate = true;

        const newWidth = toWorldWidth(contentWidth, QuestionPanel3D.PANEL_CONFIG);
        const newHeight = toWorldHeight(contentHeight, QuestionPanel3D.PANEL_CONFIG);

        this.geometry.dispose();
        this.geometry = new THREE.PlaneGeometry(newWidth, newHeight);
    }

    private static drawQuestion(
        canvas: HTMLCanvasElement,
        question: string
    ): { contentWidth: number; contentHeight: number } {
        const tempCtx = canvas.getContext('2d');
        if (!tempCtx) {
            throw new Error('Unable to acquire 2D context');
        }

        const theme = QuestionPanelTheme;
        tempCtx.font = theme.text.font;
        const maxTextWidth = this.CANVAS_WIDTH - this.H_PADDING * 2;

        // Separate progress (first line) from the rest of the question
        const paragraphs = question.split(/\n+/);
        const hasProgress = paragraphs.length > 1 && paragraphs[0].startsWith('Question');

        const lines = paragraphs
            .flatMap((paragraph, index) => {
                const wrapped = wrapText(tempCtx, paragraph, maxTextWidth);
                if (index < paragraphs.length - 1) {
                    return [...wrapped, ''];
                }
                return wrapped;
            })
            .filter((line, index, arr) => !(line === '' && index === arr.length - 1));

        const safeLineCount = Math.max(lines.length, 1);
        const widestLine = lines.reduce((max, line) => Math.max(max, tempCtx.measureText(line).width), 0);
        const contentWidth = Math.max(
            widestLine + this.H_PADDING * 2,
            this.CANVAS_WIDTH * 0.5
        );

        // Add space for separator if there is progress
        const separatorSpace = hasProgress ? theme.separator.marginY * 2 + theme.separator.height : 0;
        const contentHeight = safeLineCount * this.LINE_HEIGHT + this.V_PADDING * 2 + separatorSpace;
        const requiredHeight = nearestPowerOfTwo(
            Math.max(contentHeight, this.MIN_CANVAS_HEIGHT)
        );

        if (canvas.width !== this.CANVAS_WIDTH) {
            canvas.width = this.CANVAS_WIDTH;
        }
        if (canvas.height !== requiredHeight) {
            canvas.height = requiredHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to acquire 2D context after resize');
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const borderWidth = theme.border.width;
        const borderRadius = theme.border.radius;
        const padding = borderWidth / 2;
        const rectX = padding;
        const rectY = padding;
        const rectWidth = canvas.width - borderWidth;
        const rectHeight = canvas.height - borderWidth;

        // Background with gradient and rounded borders
        const gradient = createVerticalGradient(
            ctx,
            canvas.height,
            theme.background.gradientStart,
            theme.background.gradientEnd
        );

        // Draw background with soft shadow
        applySoftShadow(ctx, 'rgba(0, 0, 0, 0.4)', 15, 5);
        drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius);
        ctx.fillStyle = gradient;
        ctx.fill();
        resetShadow(ctx);

        // Gold border
        drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius);
        ctx.strokeStyle = theme.border.color;
        ctx.lineWidth = borderWidth;
        ctx.stroke();

        // Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const totalTextHeight = (safeLineCount - 1) * this.LINE_HEIGHT;
        let startY = (canvas.height - totalTextHeight) / 2;

        // If there is progress, we move it slightly higher
        if (hasProgress) {
            startY = this.V_PADDING + this.LINE_HEIGHT / 2;
        }

        lines.forEach((line, index) => {
            const y = startY + index * this.LINE_HEIGHT;

            // First line (progress) in yellow with different font
            if (hasProgress && index === 0) {
                ctx.font = theme.text.progressFont;
                ctx.fillStyle = theme.text.progressColor;
                ctx.fillText(line, canvas.width / 2, y);

                // Draw gold separator below progress
                const separatorY = y + this.LINE_HEIGHT / 2 + theme.separator.marginY;
                const separatorWidth = canvas.width * 0.7;
                const separatorX = (canvas.width - separatorWidth) / 2;

                ctx.fillStyle = theme.separator.color;
                ctx.fillRect(separatorX, separatorY, separatorWidth, theme.separator.height);

            } else {
                // Question in white with shadow
                ctx.font = theme.text.font;

                // Text shadow
                ctx.fillStyle = theme.text.shadowColor;
                ctx.fillText(line, canvas.width / 2 + theme.text.shadowOffset, y + theme.text.shadowOffset);

                // Main text
                ctx.fillStyle = theme.text.color;
                ctx.fillText(line, canvas.width / 2, y);
            }
        });

        return { contentWidth, contentHeight };
    }

    public dispose(): void {
        this.geometry.dispose();

        const material = this.material as THREE.MeshBasicMaterial;
        if (material.map) {
            material.map.dispose();
        }
        material.dispose();
    }
}