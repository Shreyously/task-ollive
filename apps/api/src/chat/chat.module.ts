import { Module } from '@nestjs/common';

import { ConversationModule } from '../conversation/conversation.module.js';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { MessageModule } from '../message/message.module.js';
import { ProviderModule } from '../provider/provider.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [ConversationModule, MessageModule, ProviderModule, IngestionModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
