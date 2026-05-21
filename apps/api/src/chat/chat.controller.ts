import { Body, Controller, Post } from '@nestjs/common';

import { SendMessageDto } from './dto/send-message.dto.js';
import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }
}

