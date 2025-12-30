import { IsNumber, IsString } from 'class-validator';

export class CheckAnswerDto {
    @IsNumber()
    questionId: number;

    @IsString()
    selectedAnswer: string;

    @IsString()
    language?: string; // Default: 'it'
}