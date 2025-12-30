import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CheckAnswerDto } from './dto/check-answer.dto';
import { QuestionPublicDto } from './dto/question-public.dto';

/**
 * Questions Controller
 * Handles HTTP requests for quiz questions with multilingual support.
 * 
 * Endpoints:
 * - GET /questions?lang=it|en - List all questions in specified language
 * - GET /questions/random?lang=it|en - Get random question
 * - POST /questions/:id/check?lang=it|en - Verify answer (RESTful style)
 * - POST /questions/check?lang=it|en - Verify answer (alternative style with questionId in body)
 */
@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    /**
     * Get all questions in the specified language.
     * 
     * @param language - ISO 639-1 language code (default: 'it')
     * @returns Array of questions with translations
     * 
     * Example: GET /questions?lang=en
     */
    @Get()
    async findAll(@Query('lang') language: string = 'it'): Promise<QuestionPublicDto[]> {
        return this.questionsService.findAll(language);
    }

    /**
     * Get a random question in the specified language.
     * 
     * @param language - ISO 639-1 language code (default: 'it')
     * @returns Single random question
     * 
     * Example: GET /questions/random?lang=en
     */
    @Get('random')
    async getRandom(@Query('lang') language: string = 'it'): Promise<QuestionPublicDto> {
        return this.questionsService.getRandom(language);
    }

    /**
     * Check if the selected answer is correct (RESTful style).
     * Question ID is provided in the URL path.
     * 
     * @param id - Question ID from URL path
     * @param language - Language from query parameter (optional, defaults to 'it')
     * @param dto - Request body containing selectedAnswer
     * @returns Object indicating if answer is correct
     * 
     * Example:
     * POST /questions/1/check?lang=en
     * Body: { "selectedAnswer": "Mercury" }
     */
    @Post(':id/check')
    async checkAnswerById(
        @Param('id', ParseIntPipe) id: number,
        @Query('lang') language: string = 'it',
        @Body() dto: CheckAnswerDto,
    ): Promise<{ isCorrect: boolean }> {
        return this.questionsService.checkAnswer({
            questionId: id,
            selectedAnswer: dto.selectedAnswer,
            language: language,
        });
    }

    /**
     * Check if the selected answer is correct (alternative style).
     * Question ID is provided in the request body.
     * 
     * @param language - Language from query parameter (optional, defaults to 'it')
     * @param dto - Request body containing questionId, selectedAnswer, and optional language
     * @returns Object indicating if answer is correct
     * 
     * Example:
     * POST /questions/check?lang=en
     * Body: { "questionId": 1, "selectedAnswer": "Mercury" }
     */
    @Post('check')
    async checkAnswer(
        @Query('lang') queryLanguage: string,
        @Body() dto: CheckAnswerDto,
    ): Promise<{ isCorrect: boolean }> {
        // Query parameter takes precedence over body parameter
        const language = queryLanguage || dto.language || 'it';

        if (!dto.questionId) {
            throw new Error('questionId is required in request body');
        }

        return this.questionsService.checkAnswer({
            questionId: dto.questionId,
            selectedAnswer: dto.selectedAnswer,
            language: language,
        });
    }
}