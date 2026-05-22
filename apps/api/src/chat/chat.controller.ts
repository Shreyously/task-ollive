import { Body, Controller, Inject, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { StreamMessageDto } from './dto/stream-message.dto.js';

@Controller('chat')
export class ChatController {
  constructor(
    @Inject(ChatService)
    private readonly chatService: ChatService,
  ) {}

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @Post('stream')
  async stream(@Body() dto: StreamMessageDto, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let activeStreamId: string | null = null;
    res.on('close', () => {
      if (activeStreamId) {
        this.chatService.cancelStream(activeStreamId);
      }
      res.end();
    });

    try {
      await this.chatService.streamMessage(dto, ({ event, data }) => {
        if (event === 'started' && typeof data === 'object' && data !== null && 'streamId' in data) {
          activeStreamId = String((data as { streamId: string }).streamId);
        }
        writeEvent(event, data);
      });
    } catch (error: unknown) {
      writeEvent('error', {
        streamId: activeStreamId,
        message: error instanceof Error ? error.message : 'Streaming failed',
      });
    }

    res.end();
  }

  @Post('stream/:streamId/cancel')
  cancel(@Param('streamId') streamId: string) {
    this.chatService.cancelStream(streamId);
    return { data: { canceled: true, streamId } };
  }
}
