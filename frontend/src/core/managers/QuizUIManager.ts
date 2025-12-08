import * as THREE from 'three';
import { QuestionPanel3D } from '../../components/QuestionPanel3D';
import { AnswerOption3D } from '../../components/AnswerOption3D';


export class QuizUIManager {
    private scene: THREE.Scene;
    private questionPanel: QuestionPanel3D | null = null;
    private answerPanels: AnswerOption3D[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public showQuestion(text: string): void {
        if (!this.questionPanel) {
            this.questionPanel = new QuestionPanel3D(text);
            this.questionPanel.position.set(0, 2.3, -1.8);
            this.scene.add(this.questionPanel);
        } else {
            this.questionPanel.setQuestion(text);
        }
    }

    public showOptions(options: readonly string[]): void {
        this.clearOptions();

        if (!options.length || !this.questionPanel) return;

        const questionSize = this.getMeshSize(this.questionPanel);
        const questionBottomY = this.questionPanel.position.y - questionSize.height / 2;
        const baseZ = this.questionPanel.position.z;

        // Configurazione Layout
        // Usa 1 colonna se ci sono ≤2 opzioni, altrimenti 2 colonne
        const columns = options.length <= 2 ? 1 : Math.min(2, options.length);
        const verticalMargin = 0.12;
        const rowGap = 0.1;

        options.forEach((option, index) => {
            const panel = new AnswerOption3D(option);
            const panelSize = this.getMeshSize(panel);

            // Calcolo posizione griglia
            const row = Math.floor(index / columns);
            const column = index % columns;

            // Horizontal centering relative to question panel
            const maxOffset = Math.max(0, questionSize.width / 2 - panelSize.width / 2);
            const horizontalStep = columns > 1 ? (maxOffset * 2) / (columns - 1) : 0;

            // If there's a single column, force to center
            const x = columns === 1
                ? 0
                : -maxOffset + column * horizontalStep;

            const y = questionBottomY - verticalMargin - panelSize.height / 2 - row * (panelSize.height + rowGap);

            panel.position.set(x, y, baseZ);
            this.scene.add(panel);
            this.answerPanels.push(panel);
        });
    }

    public clearOptions(): void {
        this.answerPanels.forEach(panel => {
            this.scene.remove(panel);
            panel.geometry.dispose();
            if (Array.isArray(panel.material)) {
                panel.material.forEach(m => m.dispose());
            } else {
                panel.material.dispose();
            }
        });
        this.answerPanels = [];
    }
    /**
     * Hides the question panel
     */
    public clearQuestion(): void {
        if (this.questionPanel) {
            this.scene.remove(this.questionPanel);
            this.questionPanel.dispose();
            this.questionPanel = null;
        }
    }

    /**
     * Clears everything: question and options
     */
    public hideAll(): void {
        this.clearQuestion();
        this.clearOptions();
    }

    public getInteractiveObjects(): THREE.Object3D[] {
        return this.answerPanels;
    }

    public setFeedback(panel: AnswerOption3D, state: 'idle' | 'selected' | 'correct' | 'incorrect'): void {
        panel.setFeedbackState(state);
    }

    public resetFeedback(): void {
        this.answerPanels.forEach(p => p.setFeedbackState('idle'));
    }

    private getMeshSize(mesh: THREE.Mesh): { width: number; height: number } {
        const geometry = mesh.geometry;
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }
        const box = geometry.boundingBox;
        if (!box) return { width: 1, height: 0.4 };
        return {
            width: box.max.x - box.min.x,
            height: box.max.y - box.min.y
        };
    }
}