export type HubBrowser = 'chromium' | 'firefox' | 'webkit';

export interface HubRunOptions {
  projectId: string;
  environmentId: string;
  browser: HubBrowser;
  tags?: string;
  headed: boolean;
  workers?: number;
  shardIndex?: number;
  shardTotal?: number;
}

export interface ResolvedEnvironment {
  id: string;
  baseUrl: string;
}
