import * as THREE from 'three';
import { toWorldWidth, toWorldHeight, nearestPowerOfTwo, wrapText } from '../../utils/TextPanelUtils';
import type { PanelSizingConfig } from '../../utils/TextPanelUtils';
import { MenuButtonTheme, drawRoundedRect, createVerticalGradient, applySoftShadow, resetShadow } from '../../styles/Theme';

type ButtonState = 'idle' | 'hover' | 'pressed';

export class Button3D extends THREE.Mesh {
    private static readonly CANVAS_WIDTH = 400;
    private static readonly MIN_CANVAS_HEIGHT = 80;
    private static readonly H_PADDING = 40;
    private static readonly V_PADDING = 22;
    private static readonly LINE_HEIGHT = 34;
    private static readonly BASE_PLANE_WIDTH = 1.1;
    private static readonly BASE_PLANE_HEIGHT = 0.26;
    private static readonly MIN_WORLD_WIDTH = 0.55;

    private static readonly STATE_COLORS: Record<ButtonState, number> = {
        idle: MenuButtonTheme.states.idle,
        hover: MenuButtonTheme.states.hover,
        pressed: MenuButtonTheme.states.pressed
    };

    private static readonly PANEL_CONFIG: PanelSizingConfig = {
        basePlaneWidth: Button3D.BASE_PLANE_WIDTH,
        basePlaneHeight: Button3D.BASE_PLANE_HEIGHT,
        canvasWidth: Button3D.CANVAS_WIDTH,
        minCanvasHeight: Button3D.MIN_CANVAS_HEIGHT,
        minWorldWidth: Button3D.MIN_WORLD_WIDTH
    };

    private label: string;
    private actionId: string;
    private texture: THREE.CanvasTexture;

    constructor(label: string, actionId: string) {
        const canvas = document.createElement('canvas');
        canvas.width = Button3D.CANVAS_WIDTH;
        canvas.height = Button3D.MIN_CANVAS_HEIGHT;

        const { contentWidth, contentHeight } = Button3D.drawButton(canvas, label);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.NoColorSpace;

        const geometry = new THREE.PlaneGeometry(
            toWorldWidth(contentWidth, Button3D.PANEL_CONFIG),
            toWorldHeight(contentHeight, Button3D.PANEL_CONFIG)
        );
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

        super(geometry, material);

        this.label = label;
        this.actionId = actionId;
        this.texture = texture;
    }

    public getActionId(): string {
        return this.actionId;
    }

    public getLabel(): string {
        return this.label;
    }

    public setState(state: ButtonState): void {
        const material = this.material as THREE.MeshBasicMaterial;
        material.color.setHex(Button3D.STATE_COLORS[state]);
    }

    private static drawButton(
        canvas: HTMLCanvasElement,
        text: string
    ): { contentWidth: number; contentHeight: number } {
        const tempCtx = canvas.getContext('2d');
        if (!tempCtx) {
            throw new Error('Unable to acquire 2D context');
        }

        const theme = MenuButtonTheme;
        tempCtx.font = theme.text.font;
        const maxTextWidth = this.CANVAS_WIDTH - this.H_PADDING * 2;
        const lines = wrapText(tempCtx, text, maxTextWidth);
        const safeLineCount = Math.max(lines.length, 1);
        const widestLine = lines.reduce((max, line) => Math.max(max, tempCtx.measureText(line).width), 0);
        const contentWidth = Math.max(widestLine + this.H_PADDING * 2, this.CANVAS_WIDTH * 0.5);
        const contentHeight = safeLineCount * this.LINE_HEIGHT + this.V_PADDING * 2;
        const requiredHeight = nearestPowerOfTwo(Math.max(contentHeight, this.MIN_CANVAS_HEIGHT));

        canvas.width = this.CANVAS_WIDTH;
        canvas.height = requiredHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to acquire 2D context after resize');
        }

        // Pulisci canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const borderWidth = theme.border.width;
        const borderRadius = theme.borderRadius;
        const padding = borderWidth / 2 + 4;
        const rectX = padding;
        const rectY = padding;
        const rectWidth = canvas.width - padding * 2;
        const rectHeight = canvas.height - padding * 2;

        // Sfondo con gradiente pill
        const gradient = createVerticalGradient(
            ctx,
            canvas.height,
            theme.background.gradientStart,
            theme.background.gradientEnd
        );

        // Ombra soft
        applySoftShadow(ctx, 'rgba(0, 0, 0, 0.35)', 10, 4);
        drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius);
        ctx.fillStyle = gradient;
        ctx.fill();
        resetShadow(ctx);

        // Bordo oro
        drawRoundedRect(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius);
        ctx.strokeStyle = theme.border.color;
        ctx.lineWidth = borderWidth;
        ctx.stroke();

        // Testo
        ctx.font = theme.text.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const totalTextHeight = (safeLineCount - 1) * this.LINE_HEIGHT;
        const startY = (canvas.height - totalTextHeight) / 2;

        lines.forEach((line, index) => {
            const y = startY + index * this.LINE_HEIGHT;

            // Ombra testo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillText(line, canvas.width / 2 + 1, y + 1);

            // Testo principale
            ctx.fillStyle = theme.text.color;
            ctx.fillText(line, canvas.width / 2, y);
        });

        return { contentWidth, contentHeight };
    }

    public dispose(): void {
        this.geometry.dispose();
        this.texture.dispose();
        const material = this.material as THREE.MeshBasicMaterial;
        material.dispose();
    }
}