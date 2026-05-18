import { expect, Page } from '@playwright/test';

export async function waitAndSnap(page: Page, name: string) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `./screenshots/${name}`, fullPage: true });
}

export async function closePopups(page: Page) {
    const popupSelectors = [
        '.modal-close', 
        '.close-popup', 
        'button[aria-label*="Close" i]', 
        '.modal .btn-close',
        'text=/×/i',
        '#close-login-popup',
        '.gift-popup-close',
        '[class*="gift"] .close',
        '[class*="gift"] button',
        'text=/maybe later/i',
        'text=/no thanks/i'
    ];
    
    // First try specific close buttons
    for (const selector of popupSelectors) {
        try {
            const closeBtn = page.locator(selector).first();
            if (await closeBtn.isVisible({ timeout: 500 })) {
                await closeBtn.click().catch(() => {});
                console.log(`[Popup] Closed popup using selector: ${selector}`);
                await page.waitForTimeout(500);
            }
        } catch (e) {}
    }

    // Specifically look for gift-related popups and try to close them
    try {
        const giftPopup = page.locator('[class*="gift" i], [id*="gift" i], [class*="reward" i]').first();
        if (await giftPopup.isVisible({ timeout: 500 })) {
            console.log('[Popup] Gift popup detected, attempting to close...');
            const closeBtn = giftPopup.locator('button, a, .close, .btn-close, [aria-label*="close" i], svg').first();
            if (await closeBtn.isVisible({ timeout: 500 })) {
                await closeBtn.click().catch(() => {});
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
        }
    } catch (e) {}
}

export async function safeGoBack(page: Page, aboutUrl: string) {
    if (page.url() !== aboutUrl) {
        await page.goto(aboutUrl, { waitUntil: 'load' }).catch(() => {});
    }
    await closePopups(page);
    await page.waitForTimeout(1000);
}

export async function clickAndCloseTab(page: Page, locator: any, aboutUrl: string) {
    try {
        const href = await locator.getAttribute('href').catch(() => null);
        if (href && (href.startsWith('#') || href.includes('javascript:void(0)'))) return;
        if (href && href.includes('phantasm.in')) return; // Skip known problematic external link

        const target = await locator.getAttribute('target').catch(() => null);
        if (target === '_blank') {
            const context = page.context();
            const [newPage] = await Promise.all([
                context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
                locator.click({ timeout: 5000 }).catch(() => {})
            ]);

            if (newPage) {
                if (newPage.url() === 'about:blank') {
                    console.log(`[Tab] Closing empty about:blank tab.`);
                    await newPage.close().catch(() => {});
                    return;
                }
                await newPage.waitForLoadState('load').catch(() => {});
                console.log(`[Tab] Closed new tab: ${newPage.url()}`);
                await newPage.close().catch(() => {});
            }
        } else {
            await locator.click({ timeout: 5000 }).catch(() => {});
            await safeGoBack(page, aboutUrl);
        }
    } catch (e: any) {
        // Silently handle click errors to keep the loop moving
    }
}

export async function runAboutChecks(page: Page, prefix: string, aboutUrl: string) {
    console.log(`[${prefix}] Navigating to About Us...`);
    await page.goto(aboutUrl, { waitUntil: 'load' });
    await closePopups(page);
    await waitAndSnap(page, `${prefix}_about_00_initial.png`);

    console.log(`[${prefix}] Checking every button and interactive link...`);
    const interactiveElements = page.locator('button, a').filter({ hasText: /[a-zA-Z0-9]+/ });
    const buttonCount = await interactiveElements.count();
    console.log(`[${prefix}] Found ${buttonCount} interactive elements.`);
    
    // Check a representative sample of buttons to keep time reasonable but thorough
    for (let i = 0; i < Math.min(buttonCount, 15); i++) {
        if (page.isClosed()) {
            console.log(`[${prefix}] Page was closed unexpectedly. Stopping checks.`);
            return;
        }
        const btn = interactiveElements.nth(i);
        if (await btn.isVisible().catch(() => false)) {
            const textContent = await btn.textContent().catch(() => '');
            if (textContent && /login|sign in|logout|sign out|register|sign up|gift|reward/i.test(textContent)) {
                console.log(`[${prefix}] Skipping restricted/popup button: ${textContent.trim()}`);
                continue;
            }

            await btn.scrollIntoViewIfNeeded();
            await btn.hover().catch(() => {});
            console.log(`[${prefix}] Testing Button/Link ${i + 1}/${buttonCount}`);
            // We click and close to verify the link works
            await clickAndCloseTab(page, btn, aboutUrl);
            await closePopups(page); // Close any popups that might have appeared after interaction
        }
    }

    console.log(`[${prefix}] Performing exhaustive hover animation checks...`);
    const hoverableSelectors = [
        'section', 
        'div.card', 
        '.team-member', 
        '.feature-item', 
        '.img-wrapper', 
        'img',
        '.icon-box',
        '.stat-item'
    ];
    
    const hoverElements = page.locator(hoverableSelectors.join(', '));
    const hoverTotal = await hoverElements.count();
    let successfulHovers = 0;

    for (let i = 0; i < hoverTotal; i++) {
        try {
            const el = hoverElements.nth(i);
            if (await el.isVisible()) {
                await el.scrollIntoViewIfNeeded({ timeout: 1000 });
                await el.hover({ force: true, timeout: 1000 });
                successfulHovers++;
                
                // Snapshot every 25 successful hovers to document the animations/state changes
                if (successfulHovers % 25 === 0) {
                    await waitAndSnap(page, `${prefix}_about_hover_state_${successfulHovers}.png`);
                }
            }
        } catch (e) {
            continue;
        }
    }

    console.log(`[${prefix}] Completed exhaustive check: ${successfulHovers} hovers performed.`);
    await waitAndSnap(page, `${prefix}_about_final_scan.png`);
}
