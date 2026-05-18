import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { createLogger } from '@qa-hub/shared-core';

export type HubWorkerFixtures = {
  logger: ReturnType<typeof createLogger>;
  api: APIRequestContext;
};

export const test = base.extend<HubWorkerFixtures>({
  logger: async ({}, use) => {
    await use(createLogger('playwright'));
  },
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
