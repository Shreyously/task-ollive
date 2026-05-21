const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export interface ApiClientConfig {
  baseUrl?: string;
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig = {}) {}

  get baseUrl(): string {
    return this.config.baseUrl ?? BASE_URL;
  }
}

export const apiClient = new ApiClient();
