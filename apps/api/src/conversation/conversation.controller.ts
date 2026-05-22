import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';

import { ConversationService } from './conversation.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto.js';

@Controller('conversations')
export class ConversationController {
  constructor(
    @Inject(ConversationService)
    private readonly conversationService: ConversationService,
  ) {}

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.conversationService.create(dto);
  }

  @Get()
  list(@Query() query: ListConversationsQueryDto) {
    return this.conversationService.list(query);
  }
}
