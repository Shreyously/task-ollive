import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { ListConversationsQueryDto } from './dto/list-conversations-query.dto.js';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListConversationsQueryDto) {
    return this.prisma.conversation.findMany({
      where: query.sessionId ? { sessionId: query.sessionId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

