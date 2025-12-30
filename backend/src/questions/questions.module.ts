import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question.entity';
import { QuestionTranslation } from './question-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionTranslation])],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule { }