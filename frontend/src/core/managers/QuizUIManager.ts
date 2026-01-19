import * as THREE from 'three';
import { QuizContainer3D } from '../../components/QuizContainer3D';

export class QuizUIManager {
    private scene: THREE.Scene;
    private quizContainer: QuizContainer3D | null = null;

    constructor(scene: THREE.Scene,) {
        this.scene = scene;
    }

    public showQuestion(text: string, options: readonly string[]): void {
        if (!this.quizContainer) {
            this.quizContainer = new QuizContainer3D();
            this.scene.add(this.quizContainer);
        }

        this.quizContainer.updateQuiz({
            question: text,
            options: [...options],
        });
    }

    public setFeedback(selectedIndex: number, correctIndex?: number): void {
        if (!this.quizContainer) return;

        const currentData = this.quizContainer['currentData'];
        if (!currentData) return;

        this.quizContainer.updateQuiz({
            ...currentData,
            selectedIndex,
            correctIndex
        });
    }

    public hideAll(): void {
        if (this.quizContainer) {
            this.scene.remove(this.quizContainer);
            this.quizContainer.dispose();
            this.quizContainer = null;
        }
    }

    public getInteractiveObjects(): THREE.Object3D[] {
        return this.quizContainer ? [this.quizContainer] : [];
    }

    /**
     * Determines which option was clicked based on the 3D intersection point
     * @param intersectionPoint The 3D point where the click occurred
     * @returns The index of the clicked option, or -1 if no option was clicked
     */
    public getSelectedOptionIndex(intersectionPoint: THREE.Vector3): number {
        if (!this.quizContainer) return -1;

        const currentData = this.quizContainer['currentData'];
        if (!currentData || !currentData.options) return -1;

        // Convert 3D point to container's local coordinates
        const localPoint = this.quizContainer.worldToLocal(intersectionPoint.clone());

        // Container has dimensions 1.6 x 1.6 (from -0.8 to +0.8 on both axes)
        // Canvas is 1024x1024 pixels
        // Map local coordinates to canvas coordinates
        const canvasX = ((localPoint.x + 0.8) / 1.6) * 1024; // -0.8..+0.8 → 0..1024
        const canvasY = ((0.8 - localPoint.y) / 1.6) * 1024; // -0.8..+0.8 → 0..1024

        // Options area (based on QuizContainer3D.drawOptions)
        const startY = 450;
        const optionHeight = 100;
        const optionSpacing = 20;
        const optionWidth = 1024 - 160;
        const optionX = (1024 - optionWidth) / 2;

        // Check if click is within options area
        if (canvasX < optionX || canvasX > optionX + optionWidth) {
            return -1;
        }

        // Calculate which option was clicked
        for (let i = 0; i < currentData.options.length; i++) {
            const optionY = startY + i * (optionHeight + optionSpacing);

            if (canvasY >= optionY && canvasY <= optionY + optionHeight) {
                return i;
            }
        }

        return -1;
    }
}