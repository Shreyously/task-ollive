import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';

import { CreateMessageDto } from './dto/create-message.dto.js';
import { GetConversationMessagesQueryDto } from './dto/get-conversation-messages-query.dto.js';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto.js';
import { MessageService } from './message.service.js';

@Controller('messages')
export class MessageController {
  constructor(
    @Inject(MessageService)
    private readonly messageService: MessageService,
  ) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }

  @Get()
  list(@Query() query: ListMessagesQueryDto) {
    return this.messageService.list(query);
  }

  @Get('/conversation/:conversationId')
  listByConversation(
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationMessagesQueryDto,
  ) {
    return this.messageService.listForConversation(conversationId, query);
  }
}
