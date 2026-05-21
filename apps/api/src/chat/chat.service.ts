import { Injectable } from '@nestjs/common';

import type { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class ChatService {
  // Provider routing + streaming implementation intentionally deferred.
  async sendMessage(dto: SendMessageDto) {
    return {
      accepted: true,
      conversationId: dto.conversationId ?? null,
      sessionId: dto.sessionId,
      queuedAt: new Date().toISOString(),
    };
  }
}

