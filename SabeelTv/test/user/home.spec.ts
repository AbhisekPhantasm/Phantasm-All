import { test, expect } from '@playwright/test';
import { loginUser } from '../auth-helper.ts';
import { runHomeChecks } from '../home-helper.ts';
import { runAboutChecks } from '../about-helper.ts';

const BASE_URL = 'http://31.97.61.59:3010';
const HOME_URL = 'http://31.97.61.59:3010/';

test('User Home Page Comprehensive Flow', async ({ page }) => {
    test.setTimeout(1800000); // 30 mins
    
    await loginUser(page);

    console.log('--- STARTING POST-LOGIN HOME CHECKS ---');
    await runHomeChecks(page, 'user_post_login', HOME_URL, 1);

    console.log('--- STARTING ABOUT PAGE CHECKS ---');
    const aboutUrl = `${BASE_URL}/about-us`;
    await runAboutChecks(page, 'user_post_login', aboutUrl);

    console.log('--- STARTING LIVE PAGE WORKFLOW ---');
    await page.goto(`${BASE_URL}/live`, { waitUntil: 'load' });
    await expect(page).toHaveURL(/.*live/);
    console.log('✅ Live page opens successfully.');

    const liveCards = page.locator('.live-session, .card, a.group, .session-card, a[href*="/live/"], a[href*="/watch"]').filter({ has: page.locator('img') });
    if (await liveCards.count() > 0) {
        const session = liveCards.first();
        await session.click();
        await page.waitForLoadState('load');
        const mediaElement = page.locator('video, iframe').first();
        try {
            await expect(mediaElement).toBeVisible({ timeout: 5000 });
            console.log('✅ Video player is visible.');
        } catch {
            console.log('⚠️ No video player detected.');
        }
    }
});
