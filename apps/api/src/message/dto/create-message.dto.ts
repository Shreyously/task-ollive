import { MessageRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
