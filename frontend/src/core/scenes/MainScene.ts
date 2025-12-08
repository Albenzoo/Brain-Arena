import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { QuizService } from '../../services/QuizService';
import { GameStateService } from '../../services/GameStateService';
import { LoadingSpinner3D } from '../../components/shared/LoadingSpinner3D';
import { AnswerOption3D } from '../../components/AnswerOption3D';
import type { Question } from '../../models/Question';
import { QuizUIManager } from '../managers/QuizUIManager';
import { InteractionManager } from '../managers/InteractionManager';
import { MenuManager, type MenuAction } from '../managers/MenuManager';
import { Button3D } from '../../components/shared/Button3D';


export class MainScene {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    // Managers
    private interactionManager: InteractionManager;
    private uiManager: QuizUIManager;
    private menuManager: MenuManager;

    // Services & State
    private readonly quizService = new QuizService();
    private readonly gameStateService = new GameStateService();
    private readonly loadingSpinner = new LoadingSpinner3D();

    private currentQuestion: Question | null = null;
    private isProcessingAnswer: boolean = false;

    constructor(container: Element, animate: () => void) {
        this.renderer = this.setupRenderer(container, animate);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        this.setupLighting();
        this.scene.add(this.loadingSpinner);

        // Initialize Managers
        this.uiManager = new QuizUIManager(this.scene);
        this.menuManager = new MenuManager(this.scene);
        this.interactionManager = new InteractionManager(this.renderer, this.camera, this.scene);

        // Setup Events
        this.interactionManager.onObjectSelected(this.handleObjectSelection.bind(this));
        this.menuManager.onAction(this.handleMenuAction.bind(this));

        // Listen for AR session start event
        this.renderer.xr.addEventListener('sessionstart', () => {
            this.showMainMenu();
        });

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    public update(delta: number): void {
        this.loadingSpinner.tick(delta);
    }

    private setupLighting(): void {
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
        light.position.set(0.5, 1, 0.25);
        this.scene.add(light);
    }

    private onARButtonClick = (): void => {
        // Show main menu when entering AR
        this.showMainMenu();
    };

    private showMainMenu(): void {
        this.uiManager.hideAll();
        this.menuManager.show();
        this.interactionManager.setInteractiveObjects(this.menuManager.getInteractiveObjects());
    }

    private handleMenuAction(action: MenuAction): void {
        switch (action) {
            case 'start_game':
                this.menuManager.hide();
                void this.startNewGame();
                break;
            case 'exit_ar':
                this.exitAR();
                break;
        }
    }
    private exitAR(): void {
        const session = this.renderer.xr.getSession();
        if (session) {
            void session.end();
        }
        this.menuManager.hide();
    }
    private async startNewGame(): Promise<void> {
        this.gameStateService.startNewGame();
        this.isProcessingAnswer = false;
        await this.loadNextQuestion();
    }

    private async loadNextQuestion(): Promise<void> {
        this.loadingSpinner.show(new THREE.Vector3(0, 1.5, -2));
        this.uiManager.clearOptions(); // Clear immediately to avoid clicks during loading
        this.interactionManager.setInteractiveObjects([]); // Disable interactions

        try {
            const question = await this.quizService.getRandomQuestion();
            this.currentQuestion = question;

            const progressText = this.gameStateService.getProgressLabel();
            this.uiManager.showQuestion(`${progressText}\n\n${question.text}`);
            this.uiManager.showOptions(question.options ?? []);

            // Update interactive objects for Raycaster
            this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());

            this.isProcessingAnswer = false;

        } catch (error) {
            console.error('Loading error:', error);
            this.uiManager.showQuestion("Connection error.");
        } finally {
            this.loadingSpinner.hide();
        }
    }

    private handleObjectSelection(obj: THREE.Object3D): void {
        // Menu handling
        if (this.menuManager.isMenuVisible()) {
            if (obj instanceof Button3D) {
                this.menuManager.handleSelection(obj);
            }
            return;
        }

        // Verify it's an answer panel
        if (!(obj instanceof AnswerOption3D)) return;

        const panel = obj;

        // Restart / Return to Menu handling
        if (!this.gameStateService.isPlaying()) {
            const label = panel.getLabel();
            if (label === "Restart" || label === "New Game") {
                void this.startNewGame();
            } else if (label === "Main Menu") {
                this.showMainMenu();
            }
            return;
        }

        if (this.isProcessingAnswer) return;

        this.isProcessingAnswer = true;

        this.uiManager.resetFeedback();
        this.uiManager.setFeedback(panel, 'selected');
        panel.scale.set(1.05, 1.05, 1);

        this.verifyAnswer(panel);
    }

    private async verifyAnswer(panel: AnswerOption3D): Promise<void> {
        if (!this.currentQuestion) return;

        try {
            const result = await this.quizService.checkAnswer({
                questionId: this.currentQuestion.id,
                selectedAnswer: panel.getLabel()
            });

            if (result.isCorrect) {
                this.uiManager.setFeedback(panel, 'correct');
                this.gameStateService.advanceLevel();

                setTimeout(() => {
                    if (this.gameStateService.isVictory()) {
                        this.handleVictory();
                    } else {
                        void this.loadNextQuestion();
                    }
                }, 1500);
            } else {
                this.uiManager.setFeedback(panel, 'incorrect');
                this.gameStateService.setGameOver();

                setTimeout(() => {
                    this.handleGameOver();
                }, 2000);
            }
        } catch (error) {
            console.error('Error checking answer:', error);
            this.isProcessingAnswer = false;
        }
    }

    private handleGameOver(): void {
        this.uiManager.showQuestion("GAME OVER\n\nYou answered incorrectly.\nWould you like to try again?");
        this.uiManager.showOptions(["Restart", "Main Menu"]);
        this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());
    }

    private handleVictory(): void {
        this.uiManager.showQuestion("CONGRATULATIONS!\n\nYou completed all the questions!");
        this.uiManager.showOptions(["New Game", "Main Menu"]);
        this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());
    }

    private setupRenderer(container: Element, animate: () => void): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animate);
        renderer.xr.enabled = true;
        container.appendChild(renderer.domElement);
        return renderer;
    }
    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}