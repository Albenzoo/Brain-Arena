import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { QuestionPublicDto } from './dto/question-public.dto';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Question } from './question.entity';
import { CheckAnswerDto } from './dto/check-answer.dto';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    /**
     * Get all questions in the specified language.
     * @param language - ISO 639-1 code (default: 'it')
     */
    @Get()
    async getAll(@Query('lang') language: string = 'it'): Promise<QuestionPublicDto[]> {
        return this.questionsService.findAll(language);
    }

    /**
     * Returns a random question in the specified language.
     */
    @Get('random')
    async getRandom(@Query('lang') language: string = 'it'): Promise<QuestionPublicDto> {
        return await this.questionsService.getRandom(language);
    }

    /**
     * Create a new question with translations.
     */
    @Post()
    async create(@Body() createDto: CreateQuestionDto): Promise<Question> {
        return await this.questionsService.create(createDto);
    }

    /**
     * Check if the selected answer is correct.
     */
    @Post('check')
    async checkAnswer(@Body() dto: CheckAnswerDto): Promise<{ isCorrect: boolean }> {
        try {
            return await this.questionsService.checkAnswer(dto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}