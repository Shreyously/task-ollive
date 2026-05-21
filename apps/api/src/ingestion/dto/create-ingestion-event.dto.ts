import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class CreateIngestionEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  eventType!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

