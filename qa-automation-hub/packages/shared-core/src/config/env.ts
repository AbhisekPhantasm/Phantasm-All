import type { HubBrowser, ResolvedEnvironment } from '../types/run-options.js';

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  return v === '' ? undefined : v;
}

export function requireEnv(name: string): string {
  const v = readEnv(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function getBaseUrl(fallback: string): string {
  return readEnv('BASE_URL') ?? readEnv('PLAYWRIGHT_BASE_URL') ?? fallback;
}

export function getBrowserFromEnv(): HubBrowser {
  const b = (readEnv('BROWSER') ?? 'chromium').toLowerCase();
  if (b === 'firefox' || b === 'webkit' || b === 'chromium') return b;
  return 'chromium';
}

export function isHeadedFromEnv(): boolean {
  return readEnv('HEADED') === '1' || readEnv('HEADED') === 'true';
}

export function resolveEnvironment(
  environments: ResolvedEnvironment[],
  envId: string | undefined,
): ResolvedEnvironment {
  const id = envId ?? readEnv('TEST_ENV') ?? readEnv('ENVIRONMENT') ?? 'dev';
  const found = environments.find((e) => e.id === id);
  if (!found) {
    const ids = environments.map((e) => e.id).join(', ');
    throw new Error(`Unknown environment "${id}". Valid: ${ids}`);
  }
  return found;
}
