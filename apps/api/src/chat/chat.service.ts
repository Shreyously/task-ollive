import { randomUUID } from 'node:crypto';

import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { InferenceObserver } from '@repo/inference-sdk';

import { AppLogger } from '../common/logging/logger.service.js';
import { serializeError } from '../common/logging/error-serializer.js';
import { ConversationRepository } from '../conversation/conversation.repository.js';
import { IngestionService } from '../ingestion/ingestion.service.js';
import { MessageRepository } from '../message/message.repository.js';
import { ProviderService } from '../provider/provider.service.js';
import type { SendMessageDto } from './dto/send-message.dto.js';
import type { StreamMessageDto } from './dto/stream-message.dto.js';

@Injectable()
export class ChatService {
  private readonly canceledStreams = new Set<string>();
  private readonly observer: InferenceObserver;

  constructor(
    @Inject(ConversationRepository)
    private readonly conversations: ConversationRepository,
    @Inject(MessageRepository)
    private readonly messages: MessageRepository,
    @Inject(ProviderService)
    private readonly providers: ProviderService,
    @Inject(IngestionService)
    private readonly ingestion: IngestionService,
    @Inject(AppLogger)
    private readonly logger: AppLogger,
  ) {
    this.observer = new InferenceObserver({
      onEmit: (envelope) => this.ingestion.enqueue(envelope),
    });
  }

  // Provider routing + streaming implementation intentionally deferred.
  async sendMessage(dto: SendMessageDto) {
    let conversationId = dto.conversationId ?? null;
    let conversation = conversationId ? await this.conversations.findById(conversationId) : null;

    if (!conversation) {
      conversation = await this.conversations.create(dto.sessionId, dto.content.slice(0, 80));
      conversationId = conversation.id;
    } else if (conversation.sessionId !== dto.sessionId) {
      throw new ForbiddenException('Session does not own this conversation');
    }

    const userMessage = await this.messages.create(conversation.id, MessageRole.USER, dto.content);
    const assistantMessage = await this.messages.create(
      conversation.id,
      MessageRole.ASSISTANT,
      'Provider execution is not implemented yet. This is a persisted placeholder response.',
    );

    return {
      data: {
        accepted: true,
        conversationId,
        sessionId: dto.sessionId,
        queuedAt: new Date().toISOString(),
        userMessage,
        assistantMessage,
      },
    };
  }

  cancelStream(streamId: string): void {
    this.canceledStreams.add(streamId);
  }

  async streamMessage(
    dto: StreamMessageDto,
    onEvent: (event: { event: string; data: unknown }) => void,
  ): Promise<void> {
    const streamId = randomUUID();
    let conversationId = dto.conversationId ?? null;
    let conversation = conversationId ? await this.conversations.findById(conversationId) : null;

    if (!conversation) {
      conversation = await this.conversations.create(dto.sessionId, dto.content.slice(0, 80));
      conversationId = conversation.id;
    } else if (conversation.sessionId !== dto.sessionId) {
      throw new ForbiddenException('Session does not own this conversation');
    }

    const userMessage = await this.messages.create(conversation.id, MessageRole.USER, dto.content);
    onEvent({
      event: 'started',
      data: {
        streamId,
        conversationId: conversation.id,
        userMessage,
      },
    });

    const recent = await this.messages.findRecentByConversation(conversation.id, 12);
    const prompt = this.buildPromptFromRecentMessages(recent);
    
    this.logger.withContext().info({
      streamId,
      conversationId: conversation.id,
      sessionId: dto.sessionId,
      model: dto.model,
      fallbackEnabled: !dto.disableFallback,
    }, 'stream.started');

    const stream = await this.observer.wrapStream(
      {
        conversationId: conversation.id,
        correlationId: streamId,
        sessionId: dto.sessionId,
        provider: dto.model.startsWith('llama') ? 'groq' : 'google',
        model: dto.model,
        inputPreview: dto.content.slice(0, 200),
      },
      () => this.providers.stream({
        model: dto.model,
        prompt,
        disableFallback: dto.disableFallback,
        correlationId: streamId,
      }),
      {
        onComplete: (accumulatedText) => {
          const promptTokens = Math.ceil(prompt.length / 4);
          const completionTokens = Math.ceil(accumulatedText.length / 4);
          return {
            tokenUsage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
          };
        },
      },
    );

    let accumulatedText = '';

    try {
      for await (const chunk of stream) {
        if (this.canceledStreams.has(streamId)) {
          onEvent({ event: 'canceled', data: { streamId } });
          this.logger.withContext().warn({
            streamId,
            conversationId: conversation.id,
          }, 'stream.canceled');
          return;
        }
        accumulatedText += chunk;
        onEvent({ event: 'token', data: { token: chunk } });
      }

      const assistantText = accumulatedText.trim().length
        ? accumulatedText
        : 'No output produced.';
      const assistantMessage = await this.messages.create(
        conversation.id,
        MessageRole.ASSISTANT,
        assistantText,
      );

      onEvent({
        event: 'completed',
        data: {
          streamId,
          conversationId: conversation.id,
          assistantMessage,
        },
      });

      this.logger.withContext().info({
        streamId,
        conversationId: conversation.id,
        assistantMessageId: assistantMessage.id,
        tokenCountEstimated: Math.ceil(assistantText.length / 4),
      }, 'stream.completed');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error).message)
            : 'Streaming failed';

      this.logger.withContext().error({
        streamId,
        conversationId: conversation.id,
        error: serializeError(error),
      }, 'stream.error');

      // If we accumulated some text before the error, still save it
      if (accumulatedText.trim().length) {
        await this.messages.create(
          conversation.id,
          MessageRole.ASSISTANT,
          accumulatedText,
        );
      }

      onEvent({
        event: 'error',
        data: {
          streamId,
          message: errorMessage,
        },
      });
    } finally {
      this.canceledStreams.delete(streamId);
    }
  }

  private buildPromptFromRecentMessages(
    recentMessages: { role: MessageRole; content: string }[],
  ): string {
    const inOrder = [...recentMessages].reverse();
    const lines = inOrder.map((message) => `${message.role}: ${message.content}`);
    lines.push('ASSISTANT:');
    return lines.join('\n');
  }
}
