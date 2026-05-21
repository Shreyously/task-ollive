import { IsIn, IsString } from 'class-validator';

export class ProviderSelectionDto {
  @IsString()
  @IsIn(['google', 'groq'])
  provider!: 'google' | 'groq';

  @IsString()
  model!: string;
}

