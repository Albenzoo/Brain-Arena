import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { QuestionsService } from '../questions.service';
import { AppModule } from 'src/app.module';

/**
 * Seeds the database with multilingual quiz questions from JSON file.
 * 
 * Run with: 
 * - Development: npm run seed
 * - Production: npm run seed:prod
 */
async function seedQuestions(): Promise<void> {
    console.log('\n🌱 BrainArena Database Seeding');
    console.log('================================\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const questionsService = app.get(QuestionsService);

    try {
        // Load questions from JSON file
        const dataPath = path.join(__dirname, 'questions.json');

        console.log(`📂 Loading questions from: ${dataPath}\n`);

        if (!fs.existsSync(dataPath)) {
            throw new Error(`Questions file not found at: ${dataPath}`);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const questions: CreateQuestionDto[] = JSON.parse(rawData);

        console.log(`🌱 Seeding ${questions.length} questions...\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const [index, question] of questions.entries()) {
            try {
                await questionsService.create(question);

                const itText = question.translations.find(t => t.language === 'it')?.text || 'N/A';
                const progress = `[${index + 1}/${questions.length}]`;

                console.log(`✅ ${progress} ${question.difficulty.padEnd(6)} | ${question.category!.padEnd(15)} | ${itText}`);
                successCount++;
            } catch (error) {
                const itText = question.translations.find(t => t.language === 'it')?.text || 'Unknown';
                console.error(`❌ Error inserting: ${itText}`);
                console.error(`   ${error.message}`);
                errorCount++;
            }
        }

        // Summary
        console.log(`\n${'='.repeat(50)}`);
        console.log('📊 Seeding Summary:');
        console.log(`   ✅ Successfully inserted: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📝 Total processed: ${questions.length}`);
        console.log(`   📈 Success rate: ${((successCount / questions.length) * 100).toFixed(1)}%`);
        console.log(`${'='.repeat(50)}\n`);

        await app.close();
    } catch (error) {
        console.error('\n💥 Fatal error during seeding:');
        console.error(error);

        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check that questions.json exists and is valid JSON');
        console.error('   2. Verify database connection in .env file');
        console.error('   3. Ensure database tables exist (run migrations)');

        await app.close();
        process.exit(1);
    }
}

// Execute the seeding function
seedQuestions()
    .then(() => {
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });