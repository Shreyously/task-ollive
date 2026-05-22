import { IsIn, IsString } from 'class-validator';

export class ProviderSelectionDto {
  @IsString()
  @IsIn(['google', 'groq'])
  provider!: 'google' | 'groq';

  @IsString()
  @IsIn(['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'])
  model!: string;
}
