import type { ApiResponse, ChatMessage, ConversationItem, ModelId, ProviderId } from '../types';
import { apiClient } from './client';

export interface CreateConversationInput {
  sessionId: string;
  title?: string;
}

export interface SendMessageInput {
  sessionId: string;
  conversationId?: string;
  content: string;
  provider: ProviderId;
  model: ModelId;
}

export interface StreamEventStarted {
  streamId: string;
  conversationId: string;
  userMessage: ChatMessage;
}

export interface StreamEventCompleted {
  streamId: string;
  conversationId: string;
  assistantMessage: ChatMessage;
}

export type StreamEvent =
  | { event: 'started'; data: StreamEventStarted }
  | { event: 'token'; data: { token: string } }
  | { event: 'completed'; data: StreamEventCompleted }
  | { event: 'canceled'; data: { streamId: string } }
  | { event: 'error'; data: { streamId: string | null; message: string } };

export async function createConversation(input: CreateConversationInput): Promise<ConversationItem> {
  const response = await apiClient.request<ApiResponse<ConversationItem>>('/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function listConversations(sessionId: string, page = 1, pageSize = 20): Promise<ApiResponse<ConversationItem[]>> {
  return apiClient.request<ApiResponse<ConversationItem[]>>(
    `/conversations?sessionId=${encodeURIComponent(sessionId)}&page=${page}&pageSize=${pageSize}`,
  );
}

export async function listMessages(
  conversationId: string,
  sessionId: string,
  page = 1,
  pageSize = 50,
): Promise<ApiResponse<ChatMessage[]>> {
  return apiClient.request<ApiResponse<ChatMessage[]>>(
    `/messages/conversation/${encodeURIComponent(conversationId)}?sessionId=${encodeURIComponent(sessionId)}&page=${page}&pageSize=${pageSize}`,
  );
}

export interface SendMessageResponse {
  accepted: boolean;
  conversationId: string | null;
  sessionId: string;
  queuedAt: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResponse> {
  const response = await apiClient.request<ApiResponse<SendMessageResponse>>('/chat/messages', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function streamMessage(
  input: SendMessageInput,
  handlers: {
    onEvent: (event: StreamEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const response = await fetch(`${apiClient.baseUrl}/chat/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sessionId: input.sessionId,
      conversationId: input.conversationId,
      content: input.content,
      model: input.model,
    }),
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      const eventLine = rawEvent.split('\n').find((line) => line.startsWith('event: '));
      const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data: '));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace('event: ', '').trim() as StreamEvent['event'];
      const data = JSON.parse(dataLine.replace('data: ', '')) as Record<string, unknown>;
      handlers.onEvent({ event, data } as unknown as StreamEvent);
    }
  }
}

export async function cancelStream(streamId: string): Promise<void> {
  await apiClient.request(`/chat/stream/${encodeURIComponent(streamId)}/cancel`, {
    method: 'POST',
  });
}
