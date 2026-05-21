import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ConversationRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(sessionId: string, title?: string) {
    return this.prisma.conversation.create({
      data: { sessionId, title },
    });
  }

  findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  findManyBySession(sessionId: string | undefined, skip: number, take: number) {
    return this.prisma.conversation.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    });
  }

  countBySession(sessionId?: string) {
    return this.prisma.conversation.count({
      where: sessionId ? { sessionId } : undefined,
    });
  }
}
