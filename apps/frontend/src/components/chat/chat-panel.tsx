import { useState } from 'react';

import type { ChatMessage } from '../../lib/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isSending: boolean;
  onSend: (content: string) => void;
}

export function ChatPanel({ messages, isSending, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState('');

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onSend(content);
    setDraft('');
  }

  return (
    <section className="flex h-[70vh] flex-col rounded-lg border border-app-border bg-app-panel">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
              message.role === 'user' ? 'ml-auto bg-cyan-500/20 text-cyan-100' : 'bg-slate-900 text-slate-200'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="border-t border-app-border p-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-md border border-app-border bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            disabled={isSending}
            onClick={submit}
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  );
}
