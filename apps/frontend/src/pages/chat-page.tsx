import { useEffect, useMemo, useState } from 'react';

import { ChatPanel } from '../components/chat/chat-panel';
import { ConversationSidebar } from '../components/chat/conversation-sidebar';
import { ProviderModelSelector } from '../components/chat/provider-model-selector';
import { ErrorState, LoadingState } from '../components/common/state';
import { useConversations, useCreateConversation, useMessages, useSendMessage } from '../hooks/use-chat-data';
import { useSessionId } from '../hooks/use-session-id';
import type { ModelId, ProviderId } from '../lib/types';

export function ChatPage() {
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
    if (provider === 'groq' && model === 'gemini-2.0-flash') setModel('llama-3.3-70b');
  }, [provider, model]);

  const messagesQuery = useMessages(selectedConversationId, sessionId);
  const sendMutation = useSendMessage();

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);

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

  const onSend = (content: string) => {
    sendMutation.mutate({
      sessionId,
      conversationId: selectedConversationId ?? undefined,
      content,
      provider,
      model,
    }, {
      onSuccess: (response) => {
        if (response.conversationId) {
          setSelectedConversationId(response.conversationId);
        }
      },
    });
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
          <ChatPanel messages={messages} isSending={sendMutation.isPending} onSend={onSend} />
        )}
      </div>
    </div>
  );
}
