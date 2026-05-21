import { Module } from '@nestjs/common';

import { ConversationModule } from '../conversation/conversation.module.js';
import { MessageController } from './message.controller.js';
import { MessageRepository } from './message.repository.js';
import { MessageService } from './message.service.js';

@Module({
  imports: [ConversationModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
  exports: [MessageService, MessageRepository],
})
export class MessageModule {}
