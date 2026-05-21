import { Inject, Injectable } from '@nestjs/common';

import type { ApiResponse } from '../common/http/api-response.js';
import { ConversationRepository } from './conversation.repository.js';
import type { CreateConversationDto } from './dto/create-conversation.dto.js';
import type { ListConversationsQueryDto } from './dto/list-conversations-query.dto.js';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(ConversationRepository)
    private readonly conversations: ConversationRepository,
  ) {}

  async create(dto: CreateConversationDto): Promise<ApiResponse<{ id: string; sessionId: string; title: string | null; createdAt: Date; updatedAt: Date }>> {
    const created = await this.conversations.create(dto.sessionId, dto.title);
    return { data: created };
  }

  async list(query: ListConversationsQueryDto): Promise<ApiResponse<{ id: string; sessionId: string; title: string | null; createdAt: Date; updatedAt: Date }[]>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.conversations.findManyBySession(query.sessionId, skip, pageSize),
      this.conversations.countBySession(query.sessionId),
    ]);

    return {
      data,
      meta: { page, pageSize, total },
    };
  }
}
