const BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

export interface ApiClientConfig {
  baseUrl?: string;
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig = {}) {}

  get baseUrl(): string {
    return this.config.baseUrl ?? BASE_URL;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return (await response.json()) as T;
  }
}

export const apiClient = new ApiClient();
