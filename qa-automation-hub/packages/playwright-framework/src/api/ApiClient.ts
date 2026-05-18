import type { APIRequestContext, APIResponse } from '@playwright/test';

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get(path: string, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    return this.request.get(path, { headers: options?.headers });
  }

  async post(
    path: string,
    options?: { data?: unknown; headers?: Record<string, string> },
  ): Promise<APIResponse> {
    return this.request.post(path, {
      data: options?.data,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  }
}
