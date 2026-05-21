import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
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
}

