import { Body, Controller, Post } from '@nestjs/common';

import { ProviderSelectionDto } from './dto/provider-selection.dto.js';
import { ProviderService } from './provider.service.js';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post('selection')
  selection(@Body() dto: ProviderSelectionDto) {
    return this.providerService.describeSelection(dto);
  }
}

