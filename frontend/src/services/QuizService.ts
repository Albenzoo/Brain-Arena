import type { Question } from '../models/Question';
import { LocalizationService } from './LocalizationService';

export class QuizService {
  private readonly BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  private readonly localization = LocalizationService.getInstance();

  public async getRandomQuestion(): Promise<Question> {
    try {
      const lang = this.localization.getCurrentLanguage();
      const response = await fetch(`${this.BASE_API_URL}/questions/random?lang=${lang}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const question = await response.json() as Question;
      return question;
    } catch (error) {
      console.error('Error fetching random question:', error);
      throw error;
    }
  }

  public async checkAnswer(payload: { questionId: number; selectedAnswer: string }): Promise<{ isCorrect: boolean }> {
    const lang = this.localization.getCurrentLanguage();
    const response = await fetch(`${this.BASE_API_URL}/questions/check?lang=${lang}`, {
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