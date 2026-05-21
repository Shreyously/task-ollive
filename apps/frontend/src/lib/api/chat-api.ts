import type { ChatMessage, ConversationItem, ModelId, ProviderId } from '../types';
import { apiClient } from './client';

export interface SendMessageInput {
  sessionId: string;
  conversationId: string;
  content: string;
  provider: ProviderId;
  model: ModelId;
}

const mockConversations: ConversationItem[] = [
  { id: 'conv_1', title: 'Latency debugging', updatedAt: new Date().toISOString() },
  { id: 'conv_2', title: 'Prompt tests', updatedAt: new Date(Date.now() - 3600_000).toISOString() },
];

const mockMessages: Record<string, ChatMessage[]> = {
  conv_1: [
    { id: 'm_1', role: 'user', content: 'Show me p95 trends.', createdAt: new Date().toISOString() },
    {
      id: 'm_2',
      role: 'assistant',
      content: 'Dashboard wiring pending. This is a frontend scaffold response.',
      createdAt: new Date().toISOString(),
    },
  ],
  conv_2: [],
};

export async function listConversations(_sessionId: string): Promise<ConversationItem[]> {
  void apiClient.baseUrl;
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockConversations;
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockMessages[conversationId] ?? [];
}

export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    id: `m_${Date.now()}`,
    role: 'assistant',
    content: `Mock stream complete via ${input.provider}/${input.model}.`,
    createdAt: new Date().toISOString(),
  };
}
