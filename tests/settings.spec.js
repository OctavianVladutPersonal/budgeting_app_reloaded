// @ts-check
const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, click, selectOption } = require('./helpers');

test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
        await page.locator(selectors.settingsNavLink).click();
    });

    test('settings page is visible after navigation', async ({ page }) => {
        await toBeVisible(page, selectors.settingsPage);
    });

    test('settings page has Appearance section', async ({ page }) => {
        await expect(page.locator(selectors.settingsAppearanceHeading)).toBeVisible();
    });

    test('settings page has Configuration section', async ({ page }) => {
        await expect(page.locator(selectors.settingsConfigurationHeading)).toBeVisible();
    });

    test('settings page has Actions section', async ({ page }) => {
        await expect(page.locator(selectors.settingsActionsHeading)).toBeVisible();
    });

    test('dark mode toggle is present in the DOM', async ({ page }) => {
        // The checkbox is CSS-hidden (styled via slider span); verify it exists in DOM
        await expect(page.locator(selectors.themeToggle)).toHaveCount(1);
        await toBeVisible(page, selectors.themeToggleSlider);
    });

    test('dark mode can be enabled via toggle', async ({ page }) => {
        await page.evaluate(() => {
            const checkbox = /** @type {HTMLInputElement|null} */ (document.getElementById('themeToggle'));
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    });

    test('dark mode can be disabled after enabling', async ({ page }) => {
        await page.evaluate(() => {
            const cb = /** @type {HTMLInputElement|null} */ (document.getElementById('themeToggle'));
            if (cb) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
                cb.checked = false;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        const theme = await page.locator('body').getAttribute('data-theme');
        expect(theme === null || theme === 'light').toBeTruthy();
    });

    test('language selector is visible', async ({ page }) => {
        await toBeVisible(page, selectors.languageSelector);
    });

    test('language selector has English and Romanian', async ({ page }) => {
        const options = await page.locator(selectors.languageSelectorOptions).allTextContents();
        expect(options).toContain('English');
        expect(options).toContain('Română');
    });

    test('language can be switched to Romanian', async ({ page }) => {
        await selectOption(page, selectors.languageSelector, 'ro');
        // UI should update - check the page title or a known translated element
        await expect(page.locator(selectors.navTitle)).not.toHaveText('Spending Tracker');
    });

    test('"View Spreadsheet" button is visible in actions', async ({ page }) => {
        // Scope to settings page to avoid matching the home page button with same i18n key
        await expect(page.locator(selectors.settingsPageViewSpreadsheetBtn)).toBeVisible();
    });

    test('"Reconfigure Settings" button is visible', async ({ page }) => {
        await expect(page.locator(selectors.settingsReconfigureBtn)).toBeVisible();
    });

    test('"Reset All Data" button is visible', async ({ page }) => {
        await expect(page.locator(selectors.settingsResetBtn)).toBeVisible();
    });

    test('clicking "Reconfigure Settings" opens reconfigure modal', async ({ page }) => {
        await click(page, selectors.settingsReconfigureBtn);
        await toBeVisible(page, selectors.reconfigureModal);
    });

    test('reconfigure modal has Cancel and Reconfigure buttons', async ({ page }) => {
        await click(page, 'button[data-i18n="settings.reconfigure"]');
        await expect(page.locator(selectors.reconfigureModalCancel)).toBeVisible();
        await expect(page.locator(selectors.reconfigureModalConfirm)).toBeVisible();
    });

    test('reconfigure modal Cancel closes the modal', async ({ page }) => {
        await click(page, 'button[data-i18n="settings.reconfigure"]');
        await click(page, 'button[data-i18n="reconfigure.cancel"]');
        await toBeHidden(page, selectors.reconfigureModal);
    });

    test('clicking "Reset All Data" opens reset confirmation modal', async ({ page }) => {
        await click(page, selectors.settingsResetBtn);
        await toBeVisible(page, selectors.resetModal);
    });

    test('reset modal has Cancel and Reset Everything buttons', async ({ page }) => {
        await click(page, 'button[data-i18n="settings.reset"]');
        await expect(page.locator(selectors.resetModalCancel)).toBeVisible();
        await expect(page.locator(selectors.resetModalConfirm)).toBeVisible();
    });

    test('reset modal Cancel closes the modal', async ({ page }) => {
        await click(page, 'button[data-i18n="settings.reset"]');
        await click(page, selectors.resetModalCancel);
        await toBeHidden(page, selectors.resetModal);
    });

    test('obfuscate button toggles visibility mode', async ({ page }) => {
        // Navigate back to home to see the obfuscation effect
        await click(page, 'a[data-i18n="nav.home"]');
        const btn = page.locator(selectors.obfuscateBtn);
        // App uses the 'obfuscate-mode' class on body; default (no localStorage key) = obfuscated ON
        const hasClassBefore = await page.evaluate(() => document.body.classList.contains('obfuscate-mode'));
        await btn.click();
        const hasClassAfter = await page.evaluate(() => document.body.classList.contains('obfuscate-mode'));
        // Clicking should toggle the class
        expect(hasClassAfter).toBe(!hasClassBefore);
    });

    test('config section displays the configured spreadsheet info', async ({ page }) => {
        const configDisplay = page.locator(selectors.configDisplay);
        await expect(configDisplay).not.toBeEmpty();
    });
});
