import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Question } from './question.entity';

@Entity()
@Index(['question', 'language'], { unique: true })
export class QuestionTranslation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Question, question => question.translations, {
        onDelete: 'CASCADE', // Delete translations if the question is deleted
    })
    question: Question;

    @Column({ length: 2 })
    language: string; // 'it', 'en', 'es', etc. (ISO 639-1)

    @Column('text')
    text: string;

    @Column('text', { array: true })
    options: string[]; // 4 options

    @Column()
    correctAnswer: string;
}