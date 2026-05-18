import { test } from '@playwright/test';
import { loginUser } from '../auth-helper.ts';
import { runAboutChecks } from '../about-helper.ts';

const BASE_URL = 'http://31.97.61.59:3010';

test('User About Us Page Flow', async ({ page }) => {
    test.setTimeout(1200000); 
    
    await loginUser(page);

    console.log('--- STARTING POST-LOGIN ABOUT CHECKS ---');
    const aboutUrl = `${BASE_URL}/about-us`;
    await runAboutChecks(page, 'user_post_login', aboutUrl);
});
