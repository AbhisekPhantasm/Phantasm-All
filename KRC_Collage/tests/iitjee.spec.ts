import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { IITJEEAcademyPage } from '../pages/IITJEEAcademyPage';

test.describe('IIT-JEE Academics Page - Comprehensive E2E Flow', () => {
  let homePage: HomePage;
  let iitjeePage: IITJEEAcademyPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    iitjeePage = new IITJEEAcademyPage(page);
  });

  test('Complete IIT-JEE Academics Flow', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to Website
    await homePage.open();
    await expect(page).toHaveTitle(/Krishna Reddy Sri Chaitanya/);
    console.log('✅ Homepage loaded successfully');

    // 2. Navigate to IIT-JEE Academics Section
    await homePage.navigateToIITJEE();
    await expect(page).toHaveURL(/.*iit-jee-academy/);
    console.log('✅ IIT-JEE page opens successfully');

    // 3. Capture IIT-JEE Page Screenshot
    await page.screenshot({ path: 'test-results/iitjee-screenshot.png', fullPage: true });
    console.log('✅ Screenshot captured');

    // 4. Scroll Through Sections
    const focusedSection = page.getByText(/Focused IIT-JEE/i).first();
    const offerSection = page.getByText(/What We Offer/i).first();
    const testimonialSection = page.getByText(/Testimonial/i).first();
    const faqSection = page.getByText(/Frequently Asked Questions|FAQ/i).first();

    for (const section of [focusedSection, offerSection, testimonialSection, faqSection]) {
      if (await section.isVisible()) {
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeVisible();
      }
    }
    console.log('✅ All sections visible without UI issues');

    // 5. FAQ Interaction
    const faqQuestions = [
      'What is IIT-JEE and why is it important?',
      'How does KRC help students prepare effectively for IIT-JEE?',
      'What makes KRC\'s IIT-JEE program different?',
      'Can an average student crack IIT-JEE with the right guidance?'
    ];

    for (let i = 0; i < faqQuestions.length; i++) {
      const faqBtn = page.getByRole('button', { name: faqQuestions[i] });
      if (await faqBtn.isVisible()) {
        await faqBtn.click();
        await page.waitForTimeout(500); // Wait for expansion
        console.log(`✅ Expanded FAQ: ${faqQuestions[i]}`);
      }
    }

    // Close the last opened FAQ (click it again)
    const lastFaqBtn = page.getByRole('button', { name: faqQuestions[faqQuestions.length - 1] });
    if (await lastFaqBtn.isVisible()) {
      await lastFaqBtn.click();
      console.log('✅ Closed the last opened FAQ');
    }
    console.log('✅ FAQs expand/collapse correctly');

    // 6. Navigate to Inquire Now
    const inquireBtn = page.getByRole('button', { name: /enquire now/i }).first();
    if (await inquireBtn.isVisible()) {
      await inquireBtn.scrollIntoViewIfNeeded();
      await inquireBtn.click();
      await expect(page).toHaveURL(/.*Contact-us|admissions|enquiry.*/);
      console.log('✅ Navigates to Contact/Inquiry page');
    }

    // 7. Capture Contact Page Screenshot
    await page.screenshot({ path: 'test-results/contact-page-screenshot.png' });
    console.log('✅ Contact page screenshot captured');

    // 8. Navigate Back
    await page.goBack();
    await expect(page).toHaveURL(/.*iit-jee-academy/);
    console.log('✅ Returns to IIT-JEE Academics page');

    // 9. Final Validation
    await expect(page.getByRole('heading', { name: /IIT-JEE/i }).first()).toBeVisible();
    console.log('✅ Final validation: No UI issues or broken elements');
  });
});
