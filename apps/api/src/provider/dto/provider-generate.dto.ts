import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import type { ModelId } from '../provider.types.js';

export class ProviderGenerateDto {
  @IsString()
  @IsIn(['gemini-2.0-flash', 'llama-3.3-70b', 'gemma2-9b'])
  model!: ModelId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  prompt!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(8192)
  maxOutputTokens?: number;

  @IsOptional()
  @IsBoolean()
  disableFallback?: boolean;
}
