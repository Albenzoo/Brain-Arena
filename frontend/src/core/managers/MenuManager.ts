import * as THREE from 'three';
import { Button3D } from '../../components/shared/Button3D';
import { LogoPanel3D } from '../../components/menu/LogoPanel3D';
import { LocalizationService } from '../../services/LocalizationService';

export type MenuAction = 'start_game' | 'exit_ar' | 'toggle_language';

export class MenuManager {
    private scene: THREE.Scene;
    private menuGroup: THREE.Group;
    private logo: LogoPanel3D | null = null;
    private buttons: Button3D[] = [];
    private isVisible: boolean = false;
    private interactionBlocked: boolean = false;
    private readonly localization = LocalizationService.getInstance();

    private onActionCallback: ((action: MenuAction) => void) | null = null;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.menuGroup = new THREE.Group();
        this.menuGroup.visible = false;
        this.scene.add(this.menuGroup);

        // Listen for language changes to update menu
        this.localization.onLanguageChange(() => {
            if (this.isVisible) {
                this.recreateMenu();
            }
        });
    }

    public show(): void {
        if (this.isVisible) return;

        this.createMenu();
        this.menuGroup.visible = true;
        this.isVisible = true;

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

    private recreateMenu(): void {
        this.clearMenu();
        this.createMenu();
    }

    private createMenu(): void {
        const translations = this.localization.getTranslations();
        const menuZ = -2.5;
        const menuY = 1.8;

        // Logo
        this.logo = new LogoPanel3D();
        this.logo.position.set(0, menuY + 0.3, menuZ);
        this.logo.setLogoImage('/assets/image/logo-brainarena.png');
        this.menuGroup.add(this.logo);

        // Buttons with localized labels
        const buttonConfigs: Array<{ label: string; actionId: MenuAction }> = [
            { label: translations.menu.startGame, actionId: 'start_game' },
            { label: translations.menu.language, actionId: 'toggle_language' },
            { label: translations.menu.exitAR, actionId: 'exit_ar' }
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