import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  type CreateConversationInput,
  type SendMessageInput,
} from '../lib/api/chat-api';
import type { ChatMessage } from '../lib/types';

export function useConversations(sessionId: string) {
  return useQuery({
    queryKey: ['conversations', sessionId],
    queryFn: () => listConversations(sessionId),
    select: (result) => result.data,
  });
}

export function useMessages(conversationId: string | null, sessionId: string) {
  return useQuery({
    queryKey: ['messages', conversationId, sessionId],
    queryFn: () => listMessages(conversationId ?? '', sessionId),
    select: (result) => result.data,
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: Omit<CreateConversationInput, 'sessionId'>) =>
      createConversation({ sessionId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(input),
    onSuccess: async (response, variables) => {
      const resolvedConversationId = response.conversationId ?? variables.conversationId ?? null;
      if (!resolvedConversationId) return;

      const key = ['messages', resolvedConversationId, variables.sessionId];
      const previous = queryClient.getQueryData<ChatMessage[]>(key) ?? [];
      queryClient.setQueryData(key, [...previous, response.userMessage, response.assistantMessage]);
      await queryClient.invalidateQueries({ queryKey: ['conversations', variables.sessionId] });
    },
  });
}
