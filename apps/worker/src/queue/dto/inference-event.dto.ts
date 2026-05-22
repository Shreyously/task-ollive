import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TokenUsageDto {
  @IsNumber()
  promptTokens!: number;

  @IsNumber()
  completionTokens!: number;

  @IsNumber()
  totalTokens!: number;
}

export class FallbackMetadataDto {
  @IsBoolean()
  fallbackUsed!: boolean;

  @IsOptional()
  @IsString()
  fallbackFromProvider?: string;

  @IsOptional()
  @IsString()
  fallbackFromModel?: string;
}

export class InferenceErrorDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  stack?: string;
}

export class InferenceEventPayloadDto {
  @IsString()
  requestId!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsString()
  sessionId!: string;

  @IsString()
  provider!: string;

  @IsString()
  model!: string;

  @IsNumber()
  latencyMs!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TokenUsageDto)
  tokenUsage?: TokenUsageDto;

  @IsString()
  startedAt!: string;

  @IsString()
  completedAt!: string;

  @IsIn(['success', 'error', 'canceled'])
  status!: 'success' | 'error' | 'canceled';

  @IsOptional()
  @ValidateNested()
  @Type(() => InferenceErrorDto)
  error?: InferenceErrorDto;

  @IsOptional()
  @IsString()
  inputPreview?: string;

  @IsOptional()
  @IsString()
  outputPreview?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FallbackMetadataDto)
  fallbackMetadata?: FallbackMetadataDto;
}

export class InferenceEventEnvelopeDto {
  @IsString()
  correlationId!: string;

  @IsString()
  createdAt!: string;

  @ValidateNested()
  @Type(() => InferenceEventPayloadDto)
  payload!: InferenceEventPayloadDto;

  @IsIn(['v1'])
  version!: 'v1';
}
