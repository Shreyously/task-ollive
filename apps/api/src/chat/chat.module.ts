import { Module } from '@nestjs/common';

import { ConversationModule } from '../conversation/conversation.module.js';
import { MessageModule } from '../message/message.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [ConversationModule, MessageModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
