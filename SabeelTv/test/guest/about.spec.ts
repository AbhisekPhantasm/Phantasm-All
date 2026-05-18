import { test } from '@playwright/test';
import { runAboutChecks } from '../about-helper.ts';

const BASE_URL = 'http://31.97.61.59:3010';

test('Guest About Us Page Flow', async ({ page }) => {
    test.setTimeout(600000); 
    const aboutUrl = `${BASE_URL}/about-us`;
    await runAboutChecks(page, 'guest', aboutUrl);
});
