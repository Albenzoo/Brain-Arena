import * as THREE from 'three';
import { Button3D } from '../../components/shared/Button3D';
import { LogoPanel3D } from '../../components/menu/LogoPanel3D';

export type MenuAction = 'start_game' | 'exit_ar';

export class MenuManager {
    private scene: THREE.Scene;
    private menuGroup: THREE.Group;
    private logo: LogoPanel3D | null = null;
    private buttons: Button3D[] = [];
    private isVisible: boolean = false;
    private interactionBlocked: boolean = false

    private onActionCallback: ((action: MenuAction) => void) | null = null;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.menuGroup = new THREE.Group();
        this.menuGroup.visible = false;
        this.scene.add(this.menuGroup);
    }

    public show(): void {
        if (this.isVisible) return;

        this.createMenu();
        this.menuGroup.visible = true;
        this.isVisible = true;

        // Block interactions to avoid accidental clicks
        this.interactionBlocked = true;
        setTimeout(() => {
            this.interactionBlocked = false;
        }, 500);
    }

    public hide(): void {
        if (!this.isVisible) return;

        this.clearMenu();
        this.menuGroup.visible = false;
        this.isVisible = false;
    }

    public onAction(callback: (action: MenuAction) => void): void {
        this.onActionCallback = callback;
    }

    public getInteractiveObjects(): THREE.Object3D[] {
        return this.buttons;
    }

    public handleSelection(obj: THREE.Object3D): boolean {
        if (this.interactionBlocked) return false;

        if (!(obj instanceof Button3D)) return false;

        const button = obj;
        const actionId = button.getActionId() as MenuAction;

        // Visual feedback
        button.setState('pressed');
        button.scale.set(0.95, 0.95, 1);

        setTimeout(() => {
            button.setState('idle');
            button.scale.set(1, 1, 1);

            if (this.onActionCallback) {
                this.onActionCallback(actionId);
            }
        }, 150);

        return true;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }

    private createMenu(): void {
        // Menu base position (in front of camera)
        const menuZ = -2.3;
        const menuY = 1.8;

        // Logo at the top
        this.logo = new LogoPanel3D();
        this.logo.position.set(0, menuY + 0.3, menuZ);
        this.logo.setLogoImage('/assets/logo-brainarena.png');
        this.menuGroup.add(this.logo);

        // Buttons below the logo
        const buttonConfigs: Array<{ label: string; actionId: MenuAction }> = [
            { label: 'Start Game', actionId: 'start_game' },
            { label: 'Exit AR', actionId: 'exit_ar' }
        ];

        const buttonSpacing = 0.38;
        const startY = menuY - 0.2;

        buttonConfigs.forEach((config, index) => {
            const button = new Button3D(config.label, config.actionId);
            button.position.set(0, startY - index * buttonSpacing, menuZ);
            this.menuGroup.add(button);
            this.buttons.push(button);
        });
    }

    private clearMenu(): void {
        if (this.logo) {
            this.menuGroup.remove(this.logo);
            this.logo.dispose();
            this.logo = null;
        }

        this.buttons.forEach(button => {
            this.menuGroup.remove(button);
            button.dispose();
        });
        this.buttons = [];
    }

    public dispose(): void {
        this.clearMenu();
        this.scene.remove(this.menuGroup);
    }
}