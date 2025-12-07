import type { Question } from '../models/Question';

export class QuizService {
  private readonly BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  public async getRandomQuestion(): Promise<Question> {
    try {
      const response = await fetch(`${this.BASE_API_URL}/questions/random`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const question = await response.json() as Question;
      return question;
    } catch (error) {
      console.error('Error fetching random question:', error);
      throw error; // Rilancia l'errore
    }
  }


  public async checkAnswer(payload: { questionId: number; selectedAnswer: string }): Promise<{ isCorrect: boolean }> {
    const response = await fetch(`${this.BASE_API_URL}/questions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<{ isCorrect: boolean }>;
  }
}
