import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { MessageRole } from '@prisma/client';
import type { ApiResponse } from '../common/http/api-response.js';
import { ConversationRepository } from '../conversation/conversation.repository.js';
import type { CreateMessageDto } from './dto/create-message.dto.js';
import type { GetConversationMessagesQueryDto } from './dto/get-conversation-messages-query.dto.js';
import type { ListMessagesQueryDto } from './dto/list-messages-query.dto.js';
import { MessageRepository } from './message.repository.js';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MessageRepository)
    private readonly messages: MessageRepository,
    @Inject(ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async create(dto: CreateMessageDto): Promise<ApiResponse<{ id: string; conversationId: string; role: MessageRole; content: string; createdAt: Date; updatedAt: Date }>> {
    const conversation = await this.conversations.findById(dto.conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const created = await this.messages.create(dto.conversationId, dto.role, dto.content);
    return { data: created };
  }

  async list(query: ListMessagesQueryDto): Promise<ApiResponse<{ id: string; conversationId: string; role: MessageRole; content: string; createdAt: Date; updatedAt: Date }[]>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 50);
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.messages.findManyByConversation(query.conversationId, skip, pageSize),
      this.messages.countByConversation(query.conversationId),
    ]);

    return { data, meta: { page, pageSize, total } };
  }

  async listForConversation(conversationId: string, query: GetConversationMessagesQueryDto) {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (query.sessionId && conversation.sessionId !== query.sessionId) {
      throw new ForbiddenException('Session does not own this conversation');
    }

    return this.list({
      conversationId,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}
