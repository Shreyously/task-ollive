import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { ChatPanel } from '../components/chat/chat-panel';
import { ConversationSidebar } from '../components/chat/conversation-sidebar';
import { ProviderModelSelector } from '../components/chat/provider-model-selector';
import { ErrorState, LoadingState } from '../components/common/state';
import { useConversations, useCreateConversation, useMessages } from '../hooks/use-chat-data';
import { useSessionId } from '../hooks/use-session-id';
import { cancelStream, streamMessage } from '../lib/api/chat-api';
import type { ApiResponse, ChatMessage, ModelId, ProviderId } from '../lib/types';

export function ChatPage() {
  const queryClient = useQueryClient();
  const sessionId = useSessionId();
  const [provider, setProvider] = useState<ProviderId>('google');
  const [model, setModel] = useState<ModelId>('gemini-2.0-flash');
  const conversationsQuery = useConversations(sessionId);
  const conversations = conversationsQuery.data ?? [];
  const createConversationMutation = useCreateConversation(sessionId);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]!.id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (provider === 'google') setModel('gemini-2.0-flash');
    if (provider === 'groq' && model === 'gemini-2.0-flash') setModel('llama-3.3-70b-versatile');
  }, [provider, model]);

  const messagesQuery = useMessages(selectedConversationId, sessionId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamAbortController, setStreamAbortController] = useState<AbortController | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);

  const messages = useMemo<ChatMessage[]>(() => {
    const baseMessages = messagesQuery.data ?? [];
    if (streamingConversationId && selectedConversationId === streamingConversationId) {
      return baseMessages;
    }
    return baseMessages;
  }, [messagesQuery.data, selectedConversationId, streamingConversationId]);

  const onCreateConversation = () => {
    createConversationMutation.mutate(
      { title: 'New conversation' },
      {
        onSuccess: (createdConversation) => {
          setSelectedConversationId(createdConversation.id);
        },
      },
    );
  };

  const upsertMessages = (conversationId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    const key = ['messages', conversationId, sessionId];
    const previous = queryClient.getQueryData<ApiResponse<ChatMessage[]>>(key);
    const previousMessages = previous?.data ?? [];
    queryClient.setQueryData(key, { ...previous, data: updater(previousMessages) });
  };

  const onSend = async (content: string) => {
    if (isStreaming) return;
    const abortController = new AbortController();
    setStreamAbortController(abortController);
    setIsStreaming(true);

    let activeConversationId = selectedConversationId;
    const streamingAssistantTempId = `streaming_${Date.now()}`;

    try {
      console.log('[chat.stream.request]', {
        provider,
        model,
        sessionId,
        conversationId: selectedConversationId ?? null,
      });

      await streamMessage(
        {
          sessionId,
          conversationId: selectedConversationId ?? undefined,
          content,
          provider,
          model,
        },
        {
          signal: abortController.signal,
          onEvent: (event) => {
            if (event.event === 'started') {
              const startedData = event.data;
              activeConversationId = startedData.conversationId;
              setActiveStreamId(startedData.streamId);
              setStreamingConversationId(startedData.conversationId);
              setSelectedConversationId(startedData.conversationId);

              upsertMessages(startedData.conversationId, (prev) => [
                ...prev,
                startedData.userMessage,
                {
                  id: streamingAssistantTempId,
                  role: 'assistant',
                  content: '',
                  createdAt: new Date().toISOString(),
                  isStreaming: true,
                },
              ]);
              return;
            }

            if (event.event === 'token' && activeConversationId) {
              upsertMessages(activeConversationId, (prev) =>
                prev.some((message) => message.id === streamingAssistantTempId)
                  ? prev.map((message) =>
                      message.id === streamingAssistantTempId
                        ? { ...message, content: `${message.content}${event.data.token}` }
                        : message,
                    )
                  : [
                      ...prev,
                      {
                        id: streamingAssistantTempId,
                        role: 'assistant',
                        content: event.data.token,
                        createdAt: new Date().toISOString(),
                        isStreaming: true,
                      },
                    ],
              );
              return;
            }

            if (event.event === 'completed') {
              const { conversationId, assistantMessage } = event.data;
              upsertMessages(conversationId, (prev) =>
                prev.some((message) => message.id === streamingAssistantTempId)
                  ? prev.map((message) =>
                      message.id === streamingAssistantTempId ? assistantMessage : message,
                    )
                  : [...prev, assistantMessage],
              );
              void queryClient.invalidateQueries({
                queryKey: ['messages', conversationId, sessionId],
              });
              void queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
              return;
            }

            if (event.event === 'canceled' && activeConversationId) {
              upsertMessages(activeConversationId, (prev) =>
                prev.map((message) =>
                  message.id === streamingAssistantTempId
                    ? { ...message, content: '[canceled]', isStreaming: false }
                    : message,
                ),
              );
              return;
            }

            if (event.event === 'error' && activeConversationId) {
              upsertMessages(activeConversationId, (prev) =>
                prev.map((message) =>
                  message.id === streamingAssistantTempId
                    ? { ...message, content: `[error] ${event.data.message}`, isStreaming: false }
                    : message,
                ),
              );
            }
          },
        },
      );
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (activeConversationId) {
          upsertMessages(activeConversationId, (prev) =>
            prev.map((message) =>
              message.id === streamingAssistantTempId
                ? { ...message, content: '[canceled]', isStreaming: false }
                : message,
            ),
          );
        }
      } else if (activeConversationId) {
        upsertMessages(activeConversationId, (prev) =>
          prev.map((message) =>
            message.id === streamingAssistantTempId
              ? { ...message, content: '[stream failed]', isStreaming: false }
              : message,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamAbortController(null);
      setActiveStreamId(null);
      setStreamingConversationId(null);
    }
  };

  const onCancel = () => {
    if (activeStreamId) {
      void cancelStream(activeStreamId);
    }
    streamAbortController?.abort();
    setIsStreaming(false);
    setStreamAbortController(null);
    setActiveStreamId(null);
  };

  if (conversationsQuery.isLoading) return <LoadingState label="Loading conversations..." />;
  if (conversationsQuery.error) return <ErrorState label="Unable to load conversations." />;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <ConversationSidebar
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
        onCreate={onCreateConversation}
        creating={createConversationMutation.isPending}
      />
      <div className="space-y-3">
        <ProviderModelSelector
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
        />
        {messagesQuery.isLoading ? (
          <LoadingState label="Loading messages..." />
        ) : messagesQuery.error ? (
          <ErrorState label="Unable to load chat history." />
        ) : (
          <ChatPanel messages={messages} isSending={isStreaming} onSend={(content) => { void onSend(content); }} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
}
