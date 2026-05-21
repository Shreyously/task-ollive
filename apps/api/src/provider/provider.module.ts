import { Module } from '@nestjs/common';

import { ProviderController } from './provider.controller.js';
import { GoogleLlmProvider } from './providers/google-llm.provider.js';
import { GroqLlmProvider } from './providers/groq-llm.provider.js';
import { ProviderService } from './provider.service.js';

@Module({
  controllers: [ProviderController],
  providers: [ProviderService, GoogleLlmProvider, GroqLlmProvider],
  exports: [ProviderService],
})
export class ProviderModule {}
