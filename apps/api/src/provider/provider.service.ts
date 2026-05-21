import { Injectable } from '@nestjs/common';

import type { ProviderSelectionDto } from './dto/provider-selection.dto.js';

@Injectable()
export class ProviderService {
  // Provider execution logic intentionally deferred.
  describeSelection(selection: ProviderSelectionDto) {
    return {
      provider: selection.provider,
      model: selection.model,
      ready: false,
      note: 'Provider integration not implemented yet.',
    };
  }
}

