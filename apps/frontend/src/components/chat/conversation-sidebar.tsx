import type { ConversationItem } from '../../lib/types';

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationSidebar({ conversations, selectedId, onSelect }: ConversationSidebarProps) {
  return (
    <aside className="h-full rounded-lg border border-app-border bg-app-panel p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">Conversations</h2>
      <div className="space-y-2">
        {conversations.map((conversation) => {
          const active = selectedId === conversation.id;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full rounded-md border px-3 py-2 text-left ${
                active
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-200'
                  : 'border-app-border bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              <p className="truncate text-sm font-medium">{conversation.title}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(conversation.updatedAt).toLocaleString()}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
