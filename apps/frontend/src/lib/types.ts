export type ProviderId = 'google' | 'groq';

export type ModelId = 'gemini-2.0-flash' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';

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
  isStreaming?: boolean;
}

export interface DashboardSummary {
  totalRequests: number;
  errorRate: number;
  p95LatencyMs: number;
  avgTokens: number;
}

export interface DashboardOverview {
  totalRequests: number;
  errorRequests: number;
  errorRate: number;
  averageLatencyMs: number;
  requestsPerMinute: number;
  tokenConsumption: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  window: string;
}

export interface ProviderMetric {
  provider: string;
  count: number;
  avgLatencyMs: number;
}

export interface ModelMetric {
  model: string;
  count: number;
  avgLatencyMs: number;
}

export interface DashboardUsage {
  byProvider: ProviderMetric[];
  byModel: ModelMetric[];
  window: string;
}

export interface DashboardTrendItem {
  timestamp: string;
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  totalTokens: number;
  errorRate: number;
}

export interface DashboardTrends {
  trends: DashboardTrendItem[];
  window: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type TimeWindow = '1h' | '24h' | '7d' | '30d';


