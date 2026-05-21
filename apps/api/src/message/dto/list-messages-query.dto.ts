import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ListMessagesQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  conversationId!: string;
}

