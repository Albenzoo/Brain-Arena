import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { QuestionTranslation } from './question-translation.entity';

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 'easy' })
    difficulty: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ nullable: true })
    category?: string;

    // one-to-many relationship with QuestionTranslation
    @OneToMany(() => QuestionTranslation, translation => translation.question, {
        cascade: true,
        eager: true, // Load translations automatically with the question
    })
    translations: QuestionTranslation[];
}