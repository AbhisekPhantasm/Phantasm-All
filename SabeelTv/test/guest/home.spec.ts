import { test } from '@playwright/test';
import { runHomeChecks } from '../home-helper.ts';

const HOME_URL = 'http://31.97.61.59:3010/';

test('Guest Home Page Flow', async ({ page }) => {
    test.setTimeout(1200000); 
    await runHomeChecks(page, 'guest', HOME_URL, 1);
});
