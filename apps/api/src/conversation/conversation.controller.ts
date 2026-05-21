import { Controller, Get, Query } from '@nestjs/common';

import { ListConversationsQueryDto } from './dto/list-conversations-query.dto.js';
import { ConversationService } from './conversation.service.js';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  list(@Query() query: ListConversationsQueryDto) {
    return this.conversationService.list(query);
  }
}

