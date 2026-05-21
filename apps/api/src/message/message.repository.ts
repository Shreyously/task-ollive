import { Inject, Injectable } from '@nestjs/common';
import { MessageRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MessageRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(conversationId: string, role: MessageRole, content: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  findManyByConversation(conversationId: string, skip: number, take: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  }

  countByConversation(conversationId: string) {
    return this.prisma.message.count({ where: { conversationId } });
  }
}
