// @ts-check
const { test, expect } = require('@playwright/test');
const { clearAppStorage } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, fill, click } = require('./helpers');

test.describe('Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
        await clearAppStorage(page);
        await page.goto('/');
    });

    test('shows onboarding page on first visit', async ({ page }) => {
        await toBeVisible(page, selectors.onboardingPage);
        await expect(page.locator(selectors.homePage)).not.toHaveClass(/active/);
    });

    test('hides main navbar during onboarding', async ({ page }) => {
        await toBeHidden(page, selectors.mainNavbar);
    });

    test('step 1 - shows welcome title', async ({ page }) => {
        await toBeVisible(page, selectors.onboardingStep1);
        await expect(page.locator(selectors.onboardingWelcomeTitle)).toBeVisible();
    });

    test('step 1 - Continue button is disabled with empty input', async ({ page }) => {
        const continueBtn = page.locator(selectors.step1ContinueBtn);
        await expect(continueBtn).toBeDisabled();
    });

    test('step 1 - Continue button enables after entering a spreadsheet ID', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId, '1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0');
        const continueBtn = page.locator(selectors.step1ContinueBtn);
        await expect(continueBtn).toBeEnabled();
    });

    test('step 1 - accepts a full Google Sheets URL', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId,
            'https://docs.google.com/spreadsheets/d/1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0/edit'
        );
        await expect(page.locator(selectors.step1ContinueBtn)).toBeEnabled();
    });

    test('step 1 - language selector is present and has English/Romanian options', async ({ page }) => {
        const langSelect = page.locator(selectors.onboardingLanguage);
        await toBeVisible(page, selectors.onboardingLanguage);
        await expect(langSelect.locator('option[value="en"]')).toHaveCount(1);
        await expect(langSelect.locator('option[value="ro"]')).toHaveCount(1);
    });

    test('step 1 - "Learn About App Features" button opens the features modal', async ({ page }) => {
        await click(page, 'button[data-i18n="onboarding.features.button"]');
        await toBeVisible(page, selectors.appFeaturesModal);
    });

    test('features modal - can be closed with "Got it!" button', async ({ page }) => {
        await click(page, 'button[data-i18n="onboarding.features.button"]');
        await click(page, 'button[data-i18n="features.close"]');
        await toBeHidden(page, selectors.appFeaturesModal);
    });

    test('step 1 - progress bar shows step 1 of 5', async ({ page }) => {
        await expect(page.locator(selectors.currentStep)).toHaveText('1');
        await expect(page.locator(selectors.totalSteps)).toHaveText('5');
    });

    test('step 1 → step 2 - clicking Continue advances to step 2', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId, '1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0');
        await click(page, selectors.step1ContinueBtn);
        await toBeVisible(page, selectors.onboardingStep2);
        await expect(page.locator(selectors.currentStep)).toHaveText('2');
    });

    test('step 2 - shows Apps Script instructions', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId, '1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0');
        await click(page, selectors.step1ContinueBtn);
        await expect(page.locator(selectors.onboardingStep2InstructionList)).toBeVisible();
        await toBeVisible(page, selectors.onboardingScriptURL);
    });

    test('step 2 - Continue button is disabled with empty script URL', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId, '1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0');
        await click(page, selectors.step1ContinueBtn);
        await expect(page.locator(selectors.step2ContinueBtn)).toBeDisabled();
    });

    test('step 2 - Back button returns to step 1', async ({ page }) => {
        await fill(page, selectors.onboardingSpreadsheetId, '1mhryRG11GznN_hVCd85KlEXk6alGvG59wYYerqTIbU0');
        await click(page, selectors.step1ContinueBtn);
        await click(page, 'button[data-i18n="onboarding.step2.back"]');
        await toBeVisible(page, selectors.onboardingStep1);
        await expect(page.locator(selectors.currentStep)).toHaveText('1');
    });

    test('dark mode toggle works on onboarding page', async ({ page }) => {
        // The checkbox is CSS-hidden; trigger it via JS to avoid viewport/visibility issues
        await page.evaluate(() => {
            const checkbox = /** @type {HTMLInputElement|null} */ (document.getElementById('onboardingThemeToggle'));
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    });

    test('template spreadsheet link is present', async ({ page }) => {
        const link = page.locator(selectors.btnTemplate);
        await toBeVisible(page, selectors.btnTemplate);
        const href = await link.getAttribute('href');
        expect(href).toContain('docs.google.com/spreadsheets');
    });
});
