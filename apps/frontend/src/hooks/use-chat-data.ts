import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listConversations, listMessages, sendMessage, type SendMessageInput } from '../lib/api/chat-api';
import type { ChatMessage } from '../lib/types';

export function useConversations(sessionId: string) {
  return useQuery({
    queryKey: ['conversations', sessionId],
    queryFn: () => listConversations(sessionId),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => listMessages(conversationId ?? ''),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(input),
    onSuccess: (assistantMessage, variables) => {
      const key = ['messages', variables.conversationId];
      const previous = queryClient.getQueryData<ChatMessage[]>(key) ?? [];
      queryClient.setQueryData(key, [...previous, assistantMessage]);
    },
  });
}
