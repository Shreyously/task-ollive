export type ProviderId = 'google' | 'groq';

export type ModelId = 'gemini-2.0-flash' | 'llama-3.3-70b' | 'gemma2-9b';

export interface ConversationItem {
  id: string;
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalRequests: number;
  errorRate: number;
  p95LatencyMs: number;
  avgTokens: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
