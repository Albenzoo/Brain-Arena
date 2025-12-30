import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './question.entity';
import { QuestionTranslation } from './question-translation.entity';
import { Repository } from 'typeorm';
import { QuestionPublicDto } from './dto/question-public.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CheckAnswerDto } from './dto/check-answer.dto';

@Injectable()
export class QuestionsService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepo: Repository<Question>,
        @InjectRepository(QuestionTranslation)
        private readonly translationRepo: Repository<QuestionTranslation>,
    ) { }

    /**
     * Retrieves all questions in the specified language.
     * Filters questions that have a translation in the requested language.
     * 
     * @param language - ISO 639-1 language code (e.g., 'it', 'en')
     * @returns Array of questions with translations in the specified language
     */
    async findAll(language: string = 'it'): Promise<QuestionPublicDto[]> {
        const questions = await this.questionRepo
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.translations', 'translation')
            .where('translation.language = :language', { language })
            .getMany();

        return questions.map(q => this.mapToPublicDto(q, language));
    }

    /**
     * Returns a random question in the specified language.
     * Uses ORDER BY RANDOM() for true randomization across the entire dataset.
     * Simplified approach that works directly with the translation without requiring
     * the full question.translations array.
     * 
     * @param language - ISO 639-1 language code (e.g., 'it', 'en')
     * @returns Single random question with translation
     * @throws NotFoundException if no questions exist in the specified language
     */
    async getRandom(language: string = 'it'): Promise<QuestionPublicDto> {
        const translation = await this.translationRepo
            .createQueryBuilder('translation')
            .leftJoinAndSelect('translation.question', 'question')
            .where('translation.language = :language', { language })
            .orderBy('RANDOM()') // PostgreSQL syntax for random ordering
            .limit(1)
            .getOne();

        if (!translation) {
            throw new NotFoundException(`No questions available in language: ${language}`);
        }

        // Map directly from translation without using mapToPublicDto
        return {
            id: translation.question.id,
            text: translation.text,
            options: translation.options,
            difficulty: translation.question.difficulty,
            category: translation.question.category,
            imageUrl: translation.question.imageUrl,
            language: translation.language,
        };
    }

    /**
     * Creates a new question with translations.
     * Cascade save ensures translations are persisted automatically.
     * 
     * @param createDto - DTO containing question data and translations
     * @returns Saved question entity with all translations
     */
    async create(createDto: CreateQuestionDto): Promise<Question> {
        const question = this.questionRepo.create({
            difficulty: createDto.difficulty,
            category: createDto.category,
            imageUrl: createDto.imageUrl,
        });

        // Create translation entities and associate them with the question
        question.translations = createDto.translations.map(t =>
            this.translationRepo.create({
                language: t.language,
                text: t.text,
                options: t.options,
                correctAnswer: t.correctAnswer,
            })
        );

        return await this.questionRepo.save(question);
    }

    /**
     * Checks if the selected answer is correct for a given question.
     * Compares the user's answer with the stored correct answer in the specified language.
     * 
     * @param dto - Contains questionId, selectedAnswer, and language
     * @returns Object with isCorrect boolean flag
     * @throws NotFoundException if question or translation doesn't exist
     */
    async checkAnswer(dto: CheckAnswerDto): Promise<{ isCorrect: boolean }> {
        const translation = await this.translationRepo.findOne({
            where: {
                question: { id: dto.questionId },
                language: dto.language || 'it',
            },
        });

        if (!translation) {
            throw new NotFoundException('Question not found');
        }

        return { isCorrect: dto.selectedAnswer === translation.correctAnswer };
    }

    /**
     * Maps Question entity to public DTO in the specified language.
     * Filters out sensitive data like correct answers for security.
     * 
     * @param question - Question entity with eager-loaded translations
     * @param language - Target language code
     * @returns Public DTO without correct answer information
     * @throws NotFoundException if translation doesn't exist for the language
     */
    private mapToPublicDto(question: Question, language: string): QuestionPublicDto {
        const translation = question.translations.find(t => t.language === language);

        if (!translation) {
            throw new NotFoundException(`Translation not found for language: ${language}`);
        }

        return {
            id: question.id,
            text: translation.text,
            options: translation.options,
            difficulty: question.difficulty,
            category: question.category,
            imageUrl: question.imageUrl,
            language: translation.language,
        };
    }
}