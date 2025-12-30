import { IsArray, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class TranslationDto {
  @IsString()
  language: string;

  @IsString()
  text: string;

  @IsArray()
  @ArrayMinSize(4)
  options: string[];

  @IsString()
  correctAnswer: string;
}

export class CreateQuestionDto {
  @IsString()
  difficulty: string;

  @IsString()
  category?: string;

  @IsString()
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations: TranslationDto[];
}