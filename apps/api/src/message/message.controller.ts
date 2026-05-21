import { Controller, Get, Query } from '@nestjs/common';

import { ListMessagesQueryDto } from './dto/list-messages-query.dto.js';
import { MessageService } from './message.service.js';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  list(@Query() query: ListMessagesQueryDto) {
    return this.messageService.list(query);
  }
}

