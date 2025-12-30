export interface QuestionPublicDto {
    id: number;
    text: string;
    options: string[];
    difficulty: string;
    category?: string;
    imageUrl?: string;
    language: string;
    // correctAnswer intentionally omitted for security
}