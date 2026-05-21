import { IsIn, IsOptional, IsString } from 'class-validator';

export class MetricsQueryDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsIn(['1h', '24h', '7d'])
  window?: '1h' | '24h' | '7d';
}

