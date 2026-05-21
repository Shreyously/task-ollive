import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListConversationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;
}

