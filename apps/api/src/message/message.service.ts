import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { ListMessagesQueryDto } from './dto/list-messages-query.dto.js';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListMessagesQueryDto) {
    return this.prisma.message.findMany({
      where: { conversationId: query.conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

