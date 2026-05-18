import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://31.97.61.59:3010';
const STATE_FILE = path.join(__dirname, 'state.json');

export async function loginUser(page: Page) {
    if (fs.existsSync(STATE_FILE)) {
        console.log('Restoring saved login state from state.json...');
        try {
            // Navigate to /login first to establish the origin context and prevent SecurityError on localStorage
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
            
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            if (state.cookies) {
                await page.context().addCookies(state.cookies);
            }
            if (state.origins) {
                for (const origin of state.origins) {
                    await page.evaluate((data) => {
                        for (const item of data.localStorage) {
                            localStorage.setItem(item.name, item.value);
                        }
                    }, origin);
                }
            }
            console.log('Restored state! Verifying session...');
            await page.goto(`${BASE_URL}/tv`, { waitUntil: 'load' });
            await page.waitForLoadState('load').catch(() => {});
            
            if (!page.url().includes('login')) {
                console.log('✅ Session restored successfully!');
                return;
            }
            console.log('Session expired or invalid, proceeding with full login...');
        } catch (err: any) {
            console.log('Failed to restore session:', err.message);
        }
    }

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Navigating to Login page (Attempt ${attempt}/${maxAttempts})...`);
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
            await page.waitForLoadState('load').catch(() => {});

            console.log("Filling the login form...");
            const loginForm = page.locator('form').first();
            await loginForm.getByPlaceholder('Enter your email').fill('thisisvamsi9@gmail.com');
            await loginForm.getByPlaceholder('Enter your password').fill('Vamsi@1234');

            console.log('Clicking the Sign In button once...');
            await page.waitForTimeout(1000); // Wait for React hydration/event handlers to attach
            const signInBtn = loginForm.getByRole('button', { name: 'Sign In' });
            await signInBtn.click({ force: true }).catch(() => {});
            await signInBtn.dispatchEvent('click').catch(() => {});

            console.log('Waiting for redirect...');
            // Wait up to 40s for the URL to change from /login to confirm success (accommodates slow backend API)
            await page.waitForURL(url => !url.toString().includes('login'), { timeout: 40000, waitUntil: 'load' });

            console.log('✅ Login successful. Saving authenticated state...');
            await page.waitForLoadState('load').catch(() => { });
            await page.context().storageState({ path: STATE_FILE }).catch(() => {});
            return; // Success! Exit helper
        } catch (e: any) {
            console.log(`⚠️ Login attempt ${attempt} failed: ${e.message}`);
            if (attempt === maxAttempts) {
                console.log(`❌ All ${maxAttempts} login attempts failed.`);
                await page.screenshot({ path: `./screenshots/login_failure_final_${Date.now()}.png` }).catch(() => {});
                throw e; // Propagate error on final failure
            }
            console.log('Retrying login flow with a clean page reload...');
            await page.waitForTimeout(1000);
        }
    }
}
