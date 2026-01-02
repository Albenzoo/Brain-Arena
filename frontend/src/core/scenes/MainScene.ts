import * as THREE from 'three';
import { QuizService } from '../../services/QuizService';
import { GameStateService } from '../../services/GameStateService';
import { LocalizationService } from '../../services/LocalizationService';
import { LoadingSpinner3D } from '../../components/shared/LoadingSpinner3D';
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
    private readonly localization = LocalizationService.getInstance();
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

        // Listen for AR session start
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
        light.position.set(0, 3, 0);
        this.scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(2, 3, 2);
        this.scene.add(directionalLight);
    }

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
            case 'toggle_language':
                this.localization.toggleLanguage();
                // Menu will auto-update via listener in MenuManager
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
        const translations = this.localization.getTranslations();
        this.loadingSpinner.show(new THREE.Vector3(0, 1.5, -2));

        try {
            const question = await this.quizService.getRandomQuestion();
            this.currentQuestion = question;

            const progressText = this.gameStateService.getProgressLabel();
            const fullQuestion = `${progressText}\n\n${question.text}`;

            // Mostra tutto in un unico pannello
            this.uiManager.showQuestion(fullQuestion, question.options ?? []);

            this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());
            this.isProcessingAnswer = false;

        } catch (error) {
            console.error('Loading error:', error);
            this.uiManager.showQuestion(translations.errors.connectionError, []);
        } finally {
            this.loadingSpinner.hide();
        }
    }

    private handleObjectSelection(obj: THREE.Object3D, intersectionPoint: THREE.Vector3): void {
        if (this.menuManager.isMenuVisible()) {
            if (obj instanceof Button3D) {
                this.menuManager.handleSelection(obj);
            }
            return;
        }


        const selectedIndex = this.uiManager.getSelectedOptionIndex(intersectionPoint);

        if (selectedIndex >= 0) {
            // Manage end-game selections
            if (this.gameStateService.isGameOver() || this.gameStateService.isVictory()) {
                this.handleEndGameSelection(selectedIndex);
                return;
            }

            // Manage answer selection
            if (this.gameStateService.isPlaying() && !this.isProcessingAnswer) {
                this.isProcessingAnswer = true;
                this.uiManager.setFeedback(selectedIndex);
                void this.verifyAnswerByIndex(selectedIndex);
            }
        }
    }
    private handleEndGameSelection(selectedIndex: number): void {
        if (selectedIndex === 0) {
            // Restart / New Game
            void this.startNewGame();
        } else if (selectedIndex === 1) {
            // Main Menu
            this.showMainMenu();
        }
    }
    private async verifyAnswerByIndex(selectedIndex: number): Promise<void> {
        if (!this.currentQuestion || !this.currentQuestion.options) return;

        try {
            const selectedAnswer = this.currentQuestion.options[selectedIndex];
            const result = await this.quizService.checkAnswer({
                questionId: this.currentQuestion.id,
                selectedAnswer
            });

            //BUGFIX: fix answer index for correct answer
            const correctIndex = this.currentQuestion.options.indexOf(this.currentQuestion.text);

            if (result.isCorrect) {
                const correctSound = new Audio('/assets/sounds/correct_answer.m4a');
                this.uiManager.setFeedback(selectedIndex, selectedIndex);
                correctSound.currentTime = 0;
                correctSound.play();
                this.gameStateService.advanceLevel();

                setTimeout(() => {
                    if (this.gameStateService.isVictory()) {
                        this.handleVictory();
                    } else {
                        void this.loadNextQuestion();
                    }
                }, 1500);
            } else {
                const wrongSound = new Audio('/assets/sounds/wrong_answer.wav');
                this.uiManager.setFeedback(selectedIndex, correctIndex);
                wrongSound.currentTime = 0;
                wrongSound.play();
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
        const translations = this.localization.getTranslations();
        this.uiManager.showQuestion(
            `${translations.game.gameOver}\n\n${translations.game.gameOverMessage}`,
            [translations.game.restart, translations.game.mainMenu]
        );
        this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());
    }

    private handleVictory(): void {
        const translations = this.localization.getTranslations();
        const victorySound = new Audio('/assets/sounds/victory.wav');
        victorySound.currentTime = 0;
        victorySound.play();
        this.uiManager.showQuestion(
            `${translations.game.victory}\n\n${translations.game.victoryMessage}`,
            [translations.game.newGame, translations.game.mainMenu]
        );
        this.interactionManager.setInteractiveObjects(this.uiManager.getInteractiveObjects());
    }

    private setupRenderer(container: Element, animate: () => void): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true // Migliore gestione profondità per AR
        });


        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
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