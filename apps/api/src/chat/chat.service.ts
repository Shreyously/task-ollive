import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { MessageRole } from '@prisma/client';

import { ConversationRepository } from '../conversation/conversation.repository.js';
import { MessageRepository } from '../message/message.repository.js';
import type { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class ChatService {
  constructor(
    @Inject(ConversationRepository)
    private readonly conversations: ConversationRepository,
    @Inject(MessageRepository)
    private readonly messages: MessageRepository,
  ) {}

  // Provider routing + streaming implementation intentionally deferred.
  async sendMessage(dto: SendMessageDto) {
    let conversationId = dto.conversationId ?? null;
    let conversation = conversationId ? await this.conversations.findById(conversationId) : null;

    if (!conversation) {
      conversation = await this.conversations.create(dto.sessionId, dto.content.slice(0, 80));
      conversationId = conversation.id;
    } else if (conversation.sessionId !== dto.sessionId) {
      throw new ForbiddenException('Session does not own this conversation');
    }

    const userMessage = await this.messages.create(conversation.id, MessageRole.USER, dto.content);
    const assistantMessage = await this.messages.create(
      conversation.id,
      MessageRole.ASSISTANT,
      'Provider execution is not implemented yet. This is a persisted placeholder response.',
    );

    return {
      data: {
        accepted: true,
        conversationId,
        sessionId: dto.sessionId,
        queuedAt: new Date().toISOString(),
        userMessage,
        assistantMessage,
      },
    };
  }
}
