import { Page, Locator, test } from '@playwright/test';
import { logAction } from './logger';

// Track filled forms to avoid redundant filling
const filledFormFingerprints = new Set<string>();

export async function fillAndSubmitForms(page: Page, pageName: string, stepCounter: { value: number }, maxScreenshots: number, screenshotCount: { value: number }) {
    // Wait 1 sec before checking
    await page.waitForTimeout(1000);

    const formsLocator = page.locator('form:visible');
    let formsCount = await formsLocator.count();

    if (formsCount === 0) {
        const modalForms = page.locator('.modal:visible, .popup:visible, .dialog:visible, .wpforms-container:visible, .wpcf7-form:visible');
        if (await modalForms.count() === 0) {
            return;
        }
    }

    logAction(pageName, `Checking for forms...`);

    const originalUrl = page.url();

    for (let f = 0; f < formsCount; f++) {
        try {
            const form = formsLocator.nth(f);

            if (!(await form.isVisible())) continue;

            const fingerprint = await form.evaluate(node => {
                const inputs = Array.from(node.querySelectorAll('input, textarea, select'));
                return inputs.map(i => i.getAttribute('name') || i.getAttribute('placeholder') || i.className).join('|');
            }).catch(() => '');

            if (filledFormFingerprints.has(fingerprint)) {
                const closeButton = form.locator('.close, .close-button, .modal-close, .popup-close, [aria-label="Close"]:visible');
                if (await closeButton.count() > 0) {
                    await page.waitForTimeout(1000); // Wait 1 sec before clicking
                    await closeButton.first().click({ force: true }).catch(() => { });
                }
                continue;
            }

            logAction(pageName, `Interacting with form index ${f}`);
            await page.waitForTimeout(1000); // Wait 1 sec before scrolling
            await form.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => { });
            await page.waitForTimeout(1000);

            // Handle Selects
            const selects = form.locator('select:visible');
            const selectsCount = await selects.count();
            for (let s = 0; s < selectsCount; s++) {
                await selects.nth(s).selectOption({ index: 1 }).catch(() => { });
            }

            // Handle Text Inputs
            const textInputs = form.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):visible, textarea:visible');
            const inputCount = await textInputs.count();

            for (let i = 0; i < inputCount; i++) {
                const input = textInputs.nth(i);

                const isInteractable = await input.evaluate(node => {
                    const style = window.getComputedStyle(node);
                    return style.display !== 'none' && style.visibility !== 'hidden' && node.getBoundingClientRect().width > 0;
                }).catch(() => false);

                if (!isInteractable) continue;

                const name = await input.getAttribute('name') || '';
                const placeholder = await input.getAttribute('placeholder') || '';
                const label = await input.evaluate(node => {
                    const id = node.id;
                    if (id) {
                        const l = document.querySelector(`label[for="${id}"]`);
                        if (l) return l.textContent;
                    }
                    return node.closest('label')?.textContent || '';
                }).catch(() => '');

                const combinedContext = (name + ' ' + placeholder + ' ' + label).toLowerCase();

                if (combinedContext.includes('category') || combinedContext.includes('filter') || combinedContext.includes('search')) {
                    continue;
                }

                let valueToFill = 'QA Test Data';
                if (combinedContext.includes('email')) {
                    valueToFill = 'test-qa@phantasm.in';
                } else if (combinedContext.includes('phone') || combinedContext.includes('mobile') || combinedContext.includes('number')) {
                    valueToFill = '1234567890';
                } else if (combinedContext.includes('name')) {
                    valueToFill = 'QA Test User';
                }

                await page.waitForTimeout(1000); // Wait 1 sec before clicking/filling
                await input.fill(valueToFill).catch(async () => {
                    await input.click().catch(() => { });
                    await page.keyboard.type(valueToFill).catch(() => { });
                });
            }

            // Handle Checkboxes/Radios
            const checks = form.locator('input[type="checkbox"]:visible, input[type="radio"]:visible');
            const checksCount = await checks.count();
            for (let c = 0; c < checksCount; c++) {
                await page.waitForTimeout(1000);
                await checks.nth(c).check({ force: true }).catch(() => { });
            }

            // Click reCAPTCHA "I'm not a robot" if present
            const recaptchaIframe = page.frameLocator('iframe[title="reCAPTCHA"]').locator('.recaptcha-checkbox-border');
            if (await recaptchaIframe.count() > 0) {
                logAction(pageName, `Found reCAPTCHA, attempting to click...`);
                await page.waitForTimeout(1000); // Wait before clicking
                await recaptchaIframe.first().click({ force: true }).catch(() => { });
                await page.waitForTimeout(3000); // Wait for verification animation
            }

            // Submit
            const submitButton = form.locator('button[type="submit"]:visible, input[type="submit"]:visible, button:has-text("SUBMIT"):visible, button:has-text("Send"):visible, .submit-button:visible');
            await page.waitForTimeout(1000); // Wait 1 sec before clicking submit
            if (await submitButton.count() > 0) {
                logAction(pageName, `Clicking submit button for form ${f}`);
                await submitButton.first().click({ timeout: 5000, force: true }).catch(() => { });
            } else {
                await form.evaluate((f: HTMLFormElement) => {
                    if (typeof f.submit === 'function') f.submit();
                    else (f.querySelector('button, input[type="submit"]') as HTMLElement)?.click();
                }).catch(() => { });
            }

            filledFormFingerprints.add(fingerprint);
            await page.waitForTimeout(3000);

            if (screenshotCount.value < maxScreenshots) {
                await page.waitForTimeout(1000); // Wait 1 sec before ss
                const safePageName = pageName.replace(/\s+/g, '-').toLowerCase();
                const screenshotName = `${safePageName}-form-submit-${stepCounter.value++}`;
                const buffer = await page.screenshot({ path: `screenshots/${screenshotName}.png`, fullPage: true }).catch(() => null);
                if (buffer) await test.info().attach(screenshotName, { body: buffer, contentType: 'image/png' });
                screenshotCount.value++;
            }

            // Post-submit URL check
            if (page.url().split('#')[0] !== originalUrl.split('#')[0]) {
                logAction(pageName, `Form submission caused navigation. Returning...`);
                await page.goto(originalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });
                await page.waitForTimeout(2000);
            }

        } catch (error) {
            logAction(pageName, `Error in form ${f}: ${(error as Error).message}`);
        }
    }
}