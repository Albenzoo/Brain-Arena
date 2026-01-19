export const GameStatus = {
    IDLE: 'IDLE',
    PLAYING: 'PLAYING',
    VICTORY: 'VICTORY',
    GAME_OVER: 'GAME_OVER'
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export class GameStateService {
    private readonly TOTAL_QUESTIONS = 10;
    private currentQuestionIndex: number = 0;
    private status: GameStatus = GameStatus.IDLE;

    public startNewGame(): void {
        this.currentQuestionIndex = 0;
        this.status = GameStatus.PLAYING;
    }

    public advanceLevel(): void {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.TOTAL_QUESTIONS) {
            this.status = GameStatus.VICTORY;
        }
    }

    public setGameOver(): void {
        this.status = GameStatus.GAME_OVER;
    }

    public isPlaying(): boolean {
        return this.status === GameStatus.PLAYING;
    }

    public isVictory(): boolean {
        return this.status === GameStatus.VICTORY;
    }

    public isGameOver(): boolean {
        return this.status === GameStatus.GAME_OVER;
    }

    public getProgressLabel(): string {
        return `${this.currentQuestionIndex + 1}/${this.TOTAL_QUESTIONS}`;
    }

    public getCurrentIndex(): number {
        return this.currentQuestionIndex;
    }
}