import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class StreamMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  conversationId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;

  @IsString()
  @IsIn(['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'])
  model!: 'gemini-2.0-flash' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';

  @IsOptional()
  @IsBoolean()
  disableFallback?: boolean;
}
