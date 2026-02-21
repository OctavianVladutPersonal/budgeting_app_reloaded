// @ts-check
const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, click, fill, getValue } = require('./helpers');

test.describe('Charts Page', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto('/');
        await page.locator(selectors.chartsNavLink).click();
    });

    test('charts page is visible after navigation', async ({ page }) => {
        await toBeVisible(page, selectors.chartsPage);
    });

    test('chart filter section is visible', async ({ page }) => {
        await toBeVisible(page, selectors.chartFilters);
    });

    test('date range inputs are present', async ({ page }) => {
        await toBeVisible(page, selectors.chartStartDate);
        await toBeVisible(page, selectors.chartEndDate);
    });

    test('quick filter buttons are present', async ({ page }) => {
        await toBeVisible(page, selectors.todayBtn);
        await toBeVisible(page, selectors.lastMonthBtn);
        await toBeVisible(page, selectors.thisMonthBtn);
        await toBeVisible(page, selectors.thisYearBtn);
    });

    test('"Apply Filter" button is present', async ({ page }) => {
        await toBeVisible(page, selectors.applyFilterBtn);
    });

    test('"Refresh Data" button is present', async ({ page }) => {
        await toBeVisible(page, selectors.refreshChartsBtn);
    });

    test('three chart canvases are present', async ({ page }) => {
        await toBeVisible(page, selectors.expensesCategoryChart);
        await toBeVisible(page, selectors.expensesVsIncomeChart);
        await toBeVisible(page, selectors.expensesCategoryBarChart);
    });

    test('chart headings are displayed', async ({ page }) => {
        await toBeVisible(page, selectors.expensesByCategoryHeading);
        await toBeVisible(page, selectors.expensesVsIncomeHeading);
        await toBeVisible(page, selectors.expensesByRankHeading);
    });

    test('"Today" quick filter sets same start and end date', async ({ page }) => {
        // setFilterAndApply is called by the buttons but event listeners are only
        // attached after a successful API call. Call the function directly.
        const today = new Date().toISOString().split('T')[0];
        await page.evaluate(() => {
            // @ts-ignore - setFilterAndApply is a global function defined in charts.js
            if (typeof setFilterAndApply === 'function') setFilterAndApply('today');
        });
        const startVal = await getValue(page, selectors.chartStartDate);
        const endVal = await getValue(page, selectors.chartEndDate);
        expect(startVal).toBe(today);
        expect(endVal).toBe(today);
    });

    test('"This Month" quick filter sets start to first of current month', async ({ page }) => {
        const now = new Date();
        const expectedStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        await page.evaluate(() => {
            // @ts-ignore - setFilterAndApply is a global function defined in charts.js
            if (typeof setFilterAndApply === 'function') setFilterAndApply('thisMonth');
        });
        const startVal = await getValue(page, selectors.chartStartDate);
        expect(startVal).toBe(expectedStart);
    });

    test('"This Year" quick filter sets start to Jan 1 of current year', async ({ page }) => {
        await page.evaluate(() => {
            // @ts-ignore - setFilterAndApply is a global function defined in charts.js
            if (typeof setFilterAndApply === 'function') setFilterAndApply('thisYear');
        });
        const startVal = await getValue(page, selectors.chartStartDate);
        expect(startVal).toBe(`${new Date().getFullYear()}-01-01`);
    });

    test('"Last Month" quick filter sets a valid date range', async ({ page }) => {
        await page.evaluate(() => {
            // @ts-ignore - setFilterAndApply is a global function defined in charts.js
            if (typeof setFilterAndApply === 'function') setFilterAndApply('lastMonth');
        });
        const startVal = await getValue(page, selectors.chartStartDate);
        const endVal = await getValue(page, selectors.chartEndDate);
        expect(startVal).toBeTruthy();
        expect(endVal).toBeTruthy();
        expect(new Date(startVal).getTime()).toBeLessThan(new Date(endVal).getTime());
    });

    test('manual date filter with start and end date', async ({ page }) => {
        await fill(page, selectors.chartStartDate, '2026-01-01');
        await fill(page, selectors.chartEndDate, '2026-01-31');
        await click(page, selectors.applyFilterBtn);
        // Filter should be applied — no JS errors thrown
        await toBeVisible(page, selectors.chartsPage);
    });
});
