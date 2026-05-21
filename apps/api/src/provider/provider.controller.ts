import { Body, Controller, Post } from '@nestjs/common';

import { ProviderGenerateDto } from './dto/provider-generate.dto.js';
import { ProviderSelectionDto } from './dto/provider-selection.dto.js';
import { ProviderService } from './provider.service.js';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post('selection')
  selection(@Body() dto: ProviderSelectionDto) {
    return this.providerService.describeSelection(dto);
  }

  @Post('generate')
  async generate(@Body() dto: ProviderGenerateDto) {
    const result = await this.providerService.generate(dto);
    return { data: result };
  }

  @Post('stream')
  async stream(@Body() dto: ProviderGenerateDto) {
    const textStream = await this.providerService.stream(dto);
    let text = '';
    for await (const chunk of textStream) {
      text += chunk;
    }

    return {
      data: {
        model: dto.model,
        text,
      },
    };
  }
}
