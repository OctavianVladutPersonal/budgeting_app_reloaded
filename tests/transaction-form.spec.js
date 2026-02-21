// @ts-check
const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, check, fill, getValue, getAllTextContents } = require('./helpers');

test.describe('Transaction Form', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
    });

    test('form is visible on home page', async ({ page }) => {
        await toBeVisible(page, selectors.trackerForm);
    });

    test('all required form fields are present', async ({ page }) => {
        await toBeVisible(page, selectors.amount);
        await toBeVisible(page, selectors.payee);
        await toBeVisible(page, selectors.category);
        await toBeVisible(page, selectors.notes);
        await toBeVisible(page, selectors.date);
        await toBeVisible(page, selectors.dayOfWeek);
        await toBeVisible(page, selectors.account);
        await toBeVisible(page, selectors.type);
    });

    test('submit button is visible', async ({ page }) => {
        await toBeVisible(page, selectors.submitBtn);
    });

    test('date field is pre-filled with today', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0];
        const dateValue = await page.locator(selectors.amount).evaluate(() => {
            return /** @type {HTMLInputElement|null} */ (document.getElementById('date'))?.value;
        });
        expect(dateValue).toBe(today);
    });

    test('day of week field is read-only', async ({ page }) => {
        await expect(page.locator(selectors.dayOfWeek)).toHaveAttribute('readonly', '');
    });

    test('day of week is auto-filled when date changes', async ({ page }) => {
        await fill(page, selectors.date, '2026-02-16');
        const day = await getValue(page, selectors.dayOfWeek);
        expect(day).toBeTruthy();
        expect(day.toLowerCase()).toContain('mon');
    });

    test('type selector has Expense and Income options', async ({ page }) => {
        const typeSelect = page.locator(selectors.type);
        await expect(typeSelect.locator('option[value="Expense"]')).toHaveCount(1);
        await expect(typeSelect.locator('option[value="Income"]')).toHaveCount(1);
    });

    test('Expense is selected by default', async ({ page }) => {
        await expect(page.locator(selectors.type)).toHaveValue('Expense');
    });

    test('account selector contains injected accounts', async ({ page }) => {
        const accountSelect = page.locator(selectors.account);
        const options = await accountSelect.locator('option').allTextContents();
        expect(options.some(o => o === 'Ale')).toBeTruthy();
        expect(options.some(o => o === 'Tavi')).toBeTruthy();
    });

    test('category selector has expected options', async ({ page }) => {
        const options = await getAllTextContents(page, selectors.categoryOptions);
        expect(options).toContain('Groceries');
        expect(options).toContain('Entertainment');
        expect(options).toContain('Healthcare');
    });

    test('recurring checkbox is unchecked by default', async ({ page }) => {
        await expect(page.locator(selectors.isRecurring)).not.toBeChecked();
    });

    test('recurring options are hidden by default', async ({ page }) => {
        await toBeHidden(page, selectors.recurringOptions);
    });

    test('checking recurring shows recurring options', async ({ page }) => {
        await check(page, selectors.isRecurring);
        await toBeVisible(page, selectors.recurringOptions);
    });

    test('recurring options include frequency, start date, end date, next due', async ({ page }) => {
        await check(page, selectors.isRecurring);
        await toBeVisible(page, selectors.frequency);
        await toBeVisible(page, selectors.recurringStartDate);
        await toBeVisible(page, selectors.recurringEndDate);
        await toBeVisible(page, selectors.nextDueDate);
    });

    test('frequency selector has all expected options', async ({ page }) => {
        await check(page, selectors.isRecurring);
        const options = await getAllTextContents(page, selectors.frequencyOptions);
        expect(options.some(o => o.toLowerCase().includes('daily'))).toBeTruthy();
        expect(options.some(o => o.toLowerCase().includes('weekly'))).toBeTruthy();
        expect(options.some(o => o.toLowerCase().includes('monthly'))).toBeTruthy();
        expect(options.some(o => o.toLowerCase().includes('yearly'))).toBeTruthy();
    });

    test('unchecking recurring hides recurring options again', async ({ page }) => {
        await check(page, selectors.isRecurring);
        const { uncheck } = require('./helpers');
        await uncheck(page, selectors.isRecurring);
        await toBeHidden(page, selectors.recurringOptions);
    });

    test('transactions table is visible on home page', async ({ page }) => {
        // Scope to #homePage to avoid matching the recurring page's table
        await toBeVisible(page, selectors.homeTransactionsTable);
    });

    test('transactions table has expected column headers', async ({ page }) => {
        const headers = await getAllTextContents(page, selectors.transactionsTableHeaders);
        const lower = headers.map(h => h.toLowerCase());
        expect(lower.some(h => h.includes('date'))).toBeTruthy();
        expect(lower.some(h => h.includes('payee'))).toBeTruthy();
        expect(lower.some(h => h.includes('amount'))).toBeTruthy();
        expect(lower.some(h => h.includes('category'))).toBeTruthy();
    });

    test('refresh button is visible in transactions section', async ({ page }) => {
        await toBeVisible(page, selectors.refreshBtn);
    });

    test('"View Spreadsheet" button is present on home page', async ({ page }) => {
        await toBeVisible(page, selectors.viewSpreadsheetBtn);
    });
});
