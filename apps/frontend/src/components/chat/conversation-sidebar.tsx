import type { ConversationItem } from '../../lib/types';

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating?: boolean;
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onCreate,
  creating = false,
}: ConversationSidebarProps) {
  return (
    <aside className="h-full rounded-lg border border-app-border bg-app-panel p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Conversations</h2>
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="rounded-md border border-app-border bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          {creating ? '...' : 'New'}
        </button>
      </div>
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
