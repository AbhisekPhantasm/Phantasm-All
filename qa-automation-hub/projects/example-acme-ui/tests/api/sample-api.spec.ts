import { test, expect, ApiClient } from '@qa-hub/playwright-framework';

test.describe('@api Example API', () => {
  test('GET jsonplaceholder sample', async ({ api, logger }) => {
    logger.info('Calling public sample API');
    const client = new ApiClient(api);
    const res = await client.get('https://jsonplaceholder.typicode.com/todos/1');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ id: 1 });
  });
});
