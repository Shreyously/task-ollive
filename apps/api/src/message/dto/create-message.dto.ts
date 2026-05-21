import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MessageRole } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  conversationId!: string;

  @IsEnum(MessageRole)
  role!: MessageRole;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}
