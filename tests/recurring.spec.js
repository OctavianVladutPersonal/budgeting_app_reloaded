// @ts-check
const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, check, getAllTextContents } = require('./helpers');

test.describe('Recurring Transactions Page', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
        await page.locator(selectors.recurringNavLink).click();
    });

    test('recurring page is visible after navigation', async ({ page }) => {
        await toBeVisible(page, selectors.recurringPage);
    });

    test('recurring transactions table is visible', async ({ page }) => {
        await toBeVisible(page, selectors.recurringTransactionsTable);
    });

    test('recurring table has expected column headers', async ({ page }) => {
        const headers = await getAllTextContents(page, selectors.recurringPageTableHeaders);
        const lower = headers.map(h => h.toLowerCase());
        expect(lower.some(h => h.includes('payee'))).toBeTruthy();
        expect(lower.some(h => h.includes('amount'))).toBeTruthy();
        expect(lower.some(h => h.includes('frequency'))).toBeTruthy();
        expect(lower.some(h => h.includes('next due') || h.includes('due'))).toBeTruthy();
        expect(lower.some(h => h.includes('status'))).toBeTruthy();
    });

    test('refresh button is visible on recurring page', async ({ page }) => {
        await toBeVisible(page, selectors.refreshRecurringBtn);
    });

    test('recurring page title is visible', async ({ page }) => {
        await expect(page.locator(selectors.recurringPageTitle)).toBeVisible();
    });
});

test.describe('Recurring Transaction Modal (from Home Form)', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
    });

    test('checking "Make this recurring" on home form shows recurring fields', async ({ page }) => {
        await check(page, selectors.isRecurring);
        await toBeVisible(page, selectors.recurringOptions);
    });

    test('recurring frequency dropdown has all options', async ({ page }) => {
        await check(page, selectors.isRecurring);
        const options = await getAllTextContents(page, selectors.frequencyOptions);
        const lower = options.map(o => o.toLowerCase());
        expect(lower.some(o => o.includes('daily'))).toBeTruthy();
        expect(lower.some(o => o.includes('weekly'))).toBeTruthy();
        expect(lower.some(o => o.includes('bi-weekly') || o.includes('biweekly'))).toBeTruthy();
        expect(lower.some(o => o.includes('monthly'))).toBeTruthy();
        expect(lower.some(o => o.includes('quarterly'))).toBeTruthy();
        expect(lower.some(o => o.includes('yearly'))).toBeTruthy();
    });

    test('next due date is read-only', async ({ page }) => {
        await check(page, selectors.isRecurring);
        await expect(page.locator(selectors.nextDueDate)).toHaveAttribute('readonly', '');
    });
});

test.describe('Delete Transaction Modal', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
    });

    test('delete modal is hidden by default', async ({ page }) => {
        await toBeHidden(page, selectors.deleteModal);
    });

    test('edit modal is hidden by default', async ({ page }) => {
        await toBeHidden(page, selectors.editModal);
    });
});

test.describe('Edit Transaction Modal', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
    });

    test('edit modal form has all expected input IDs in the DOM', async ({ page }) => {
        // Verify the edit modal fields exist in the DOM (no need to open it visually)
        await expect(page.locator(selectors.editAmount)).toHaveCount(1);
        await expect(page.locator(selectors.editPayee)).toHaveCount(1);
        await expect(page.locator(selectors.editCategory)).toHaveCount(1);
        await expect(page.locator(selectors.editDate)).toHaveCount(1);
        await expect(page.locator(selectors.editAccount)).toHaveCount(1);
        await expect(page.locator(selectors.editType)).toHaveCount(1);
    });

    test('edit modal close button exists in the DOM', async ({ page }) => {
        await expect(page.locator(selectors.editModalClose)).toHaveCount(1);
    });
});
