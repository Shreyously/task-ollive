import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createConversation,
  listConversations,
  listMessages,
  type CreateConversationInput,
} from '../lib/api/chat-api';

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
