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
