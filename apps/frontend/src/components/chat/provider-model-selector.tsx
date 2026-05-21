import type { ModelId, ProviderId } from '../../lib/types';

const providerModels: Record<ProviderId, ModelId[]> = {
  google: ['gemini-2.0-flash'],
  groq: ['llama-3.3-70b', 'gemma2-9b'],
};

interface ProviderModelSelectorProps {
  provider: ProviderId;
  model: ModelId;
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: ModelId) => void;
}

export function ProviderModelSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: ProviderModelSelectorProps) {
  const models = providerModels[provider] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-md border border-app-border bg-slate-900 px-3 py-2 text-sm"
        value={provider}
        onChange={(event) => onProviderChange(event.target.value as ProviderId)}
      >
        <option value="google">Google</option>
        <option value="groq">Groq</option>
      </select>
      <select
        className="rounded-md border border-app-border bg-slate-900 px-3 py-2 text-sm"
        value={model}
        onChange={(event) => onModelChange(event.target.value as ModelId)}
      >
        {models.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
