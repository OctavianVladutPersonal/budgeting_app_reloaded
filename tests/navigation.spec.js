// @ts-check
const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, click } = require('./helpers');

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
    });

    test('shows navbar after onboarding is complete', async ({ page }) => {
        await toBeVisible(page, selectors.mainNavbar);
    });

    test('navbar has all main links', async ({ page }) => {
        await expect(page.locator(selectors.homeNavLink)).toBeVisible();
        await expect(page.locator(selectors.recurringNavLink)).toBeVisible();
        await expect(page.locator(selectors.chartsNavLink)).toBeVisible();
        await expect(page.locator(selectors.settingsNavLink)).toBeVisible();
    });

    test('home page is the default active page', async ({ page }) => {
        await toBeVisible(page, selectors.homePage);
        await expect(page.locator(selectors.onboardingPage)).not.toHaveClass(/active/);
    });

    test('navigates to Recurring page', async ({ page }) => {
        await click(page, selectors.recurringNavLink);
        await toBeVisible(page, selectors.recurringPage);
        await toBeHidden(page, selectors.homePage);
    });

    test('navigates to Charts page', async ({ page }) => {
        await click(page, selectors.chartsNavLink);
        await toBeVisible(page, selectors.chartsPage);
        await toBeHidden(page, selectors.homePage);
    });

    test('navigates to Settings page', async ({ page }) => {
        await click(page, selectors.settingsNavLink);
        await toBeVisible(page, selectors.settingsPage);
        await toBeHidden(page, selectors.homePage);
    });

    test('navigates back to Home from another page', async ({ page }) => {
        await click(page, selectors.chartsNavLink);
        await click(page, selectors.homeNavLink);
        await toBeVisible(page, selectors.homePage);
        await toBeHidden(page, selectors.chartsPage);
    });

    test('active nav link is highlighted when on home', async ({ page }) => {
        await expect(page.locator(selectors.homeNavLink)).toHaveClass(/active/);
    });

    test('active nav link updates when navigating', async ({ page }) => {
        await click(page, selectors.settingsNavLink);
        await expect(page.locator(selectors.settingsNavLink)).toHaveClass(/active/);
        await expect(page.locator(selectors.homeNavLink)).not.toHaveClass(/active/);
    });

    test('obfuscate button is visible in navbar', async ({ page }) => {
        await toBeVisible(page, selectors.obfuscateBtn);
    });

    test('app title is visible in navbar', async ({ page }) => {
        await toBeVisible(page, selectors.navTitle);
    });

    test('footer is visible', async ({ page }) => {
        await toBeVisible(page, selectors.appFooter);
    });

    test('footer has Buy me a coffee link', async ({ page }) => {
        const coffeeLink = page.locator(selectors.footerCoffeeBtn);
        await expect(coffeeLink).toBeVisible();
        await expect(coffeeLink).toHaveAttribute('href', /revolut/);
    });

    test('footer has Telegram contact link', async ({ page }) => {
        const telegramLink = page.locator(selectors.footerContactBtn);
        await expect(telegramLink).toBeVisible();
        await expect(telegramLink).toHaveAttribute('href', /t\.me/);
    });
});
