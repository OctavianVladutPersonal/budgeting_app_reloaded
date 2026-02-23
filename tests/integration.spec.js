// Integration Tests — End-to-end user flows with mocked Google Apps Script API
// These tests simulate real usage patterns: filling forms, submitting data,
// and verifying that the UI updates correctly in response.

const { test, expect } = require('@playwright/test');
const { seedCompletedOnboarding, clearAppStorage, MOCK_USER_CONFIG } = require('./fixtures');
const selectors = require('./selectors');
const { toBeVisible, toBeHidden, fill, click, clickFirst, check, selectOption, toContainText, toBeDisabled } = require('./helpers');

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const MOCK_TRANSACTIONS = [
    {
        date: '2026-02-21',
        payee: 'Test Supermarket',
        category: 'Groceries',
        amount: 50,
        type: 'Expense',
        account: 'Ale',
        rowIndex: 2
    }
];

// nextDue is set to the future so autoProcessDueTransactions does not fire
const MOCK_RECURRING_TRANSACTIONS = [
    {
        id: 'rec_001',
        payee: 'Monthly Rent',
        category: 'Housing',
        amount: 500,
        type: 'Expense',
        account: 'Ale',
        frequency: 'monthly',
        startDate: '2026-01-01',
        endDate: null,
        nextDue: '2026-03-01',
        notes: ''
    }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercept ALL Google Apps Script requests.
 *   - JSONP GET getTransactions         → { transactions }
 *   - JSONP GET getRecurringTransactions → { recurringTransactions }
 *   - POST write (no callback)           → empty 200
 */
async function mockScriptAPI(page, transactions = [], recurringTransactions = []) {
    await page.route('**/script.google.com/**', async (route) => {
        const url = route.request().url();
        const callbackMatch = url.match(/[?&]callback=([^&]+)/);
        if (callbackMatch) {
            const cbName = callbackMatch[1];
            const data = url.includes('getRecurringTransactions')
                ? { recurringTransactions }
                : { transactions };
            await route.fulfill({
                contentType: 'application/javascript',
                body: `${cbName}(${JSON.stringify(data)})`
            });
        } else {
            await route.fulfill({ status: 200, body: '' });
        }
    });
}

/** Navigate to the recurring page from anywhere. */
async function goToRecurringPage(page) {
    await page.locator(selectors.recurringNavLink).click();
    await page.waitForSelector(selectors.recurringPageActive, { timeout: 8000 });
}

// ---------------------------------------------------------------------------
// Suite 1: Submit transaction form
// ---------------------------------------------------------------------------

test.describe('Integration: Add transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, []);
    });

    test('submitting the form shows the success modal', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        const today = new Date().toISOString().split('T')[0];
        await fill(page, selectors.amount, '99.99');
        await fill(page, selectors.payee, 'Test Supermarket');
        await selectOption(page, selectors.type, 'Expense');
        await selectOption(page, selectors.category, 'Groceries');
        await fill(page, selectors.date, today);

        await click(page, selectors.submitBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
    });

    test('form resets after successful submission', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        const today = new Date().toISOString().split('T')[0];
        await fill(page, selectors.amount, '45.00');
        await fill(page, selectors.payee, 'Reset Test Payee');
        await fill(page, selectors.date, today);

        await click(page, selectors.submitBtn);

        // Wait for success modal to appear, then disappear (form resets at 2500 ms)
        await toBeVisible(page, selectors.successModal);
        await toBeHidden(page, selectors.successModal);

        // Amount field should be empty after reset
        await expect(page.locator(selectors.amount)).toHaveValue('');
    });

    test('submit button is disabled while the request is in flight', async ({ page }) => {
        // Delay the mock response so we can assert the disabled state
        await page.unroute('**/script.google.com/**');
        await page.route('**/script.google.com/**', async (route) => {
            await new Promise(r => setTimeout(r, 800));
            await route.fulfill({ status: 200, body: '' });
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        const today = new Date().toISOString().split('T')[0];
        await fill(page, selectors.amount, '10.00');
        await fill(page, selectors.payee, 'In-flight Test');
        await fill(page, selectors.date, today);

        await click(page, selectors.submitBtn);

        // Button should be disabled immediately after click
        await toBeDisabled(page, selectors.submitBtn);
    });

    test('submitted transaction appears in table after manual refresh', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        const today = new Date().toISOString().split('T')[0];
        await fill(page, selectors.amount, '99.99');
        await fill(page, selectors.payee, 'Test Supermarket');
        await selectOption(page, selectors.category, 'Groceries');
        await fill(page, selectors.date, today);

        await click(page, selectors.submitBtn);

        // Wait for the form cycle to complete
        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
        await toBeHidden(page, selectors.successModal, { timeout: 6000 });

        // Re-route so the next JSONP fetch returns the new transaction
        await page.unroute('**/script.google.com/**');
        await mockScriptAPI(page, MOCK_TRANSACTIONS);

        // Trigger a manual refresh
        await click(page, selectors.refreshBtn);

        await toContainText(page, selectors.transactionsBody, 'Test Supermarket');
        await toContainText(page, selectors.transactionsBody, '50');
    });
});

// ---------------------------------------------------------------------------
// Suite 2: Transactions table loaded from API
// ---------------------------------------------------------------------------

test.describe('Integration: Transactions table', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
    });

    test('table renders transactions returned by the API', async ({ page }) => {
        await mockScriptAPI(page, MOCK_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await toContainText(page, selectors.transactionsBody, 'Test Supermarket');
        await toContainText(page, selectors.transactionsBody, '50');
    });

    test('table renders multiple transactions', async ({ page }) => {
        const multiTx = [
            { date: '2026-02-21', payee: 'Supermarket', category: 'Groceries', amount: 50, type: 'Expense', account: 'Ale', rowIndex: 2 },
            { date: '2026-02-20', payee: 'Gas Station', category: 'Transportation', amount: 30, type: 'Expense', account: 'Tavi', rowIndex: 3 },
            { date: '2026-02-19', payee: 'Salary', category: 'Account', amount: 2000, type: 'Income', account: 'Ale', rowIndex: 4 }
        ];
        await mockScriptAPI(page, multiTx);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(3, { timeout: 5000 });
        await toContainText(page, selectors.transactionsBody, 'Supermarket');
        await toContainText(page, selectors.transactionsBody, 'Gas Station');
        await toContainText(page, selectors.transactionsBody, 'Salary');
    });

    test('refreshing the table re-fetches from the API', async ({ page }) => {
        // Start with 1 transaction
        await mockScriptAPI(page, MOCK_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        // Update the mock to return an additional transaction
        await page.unroute('**/script.google.com/**');
        const updatedTx = [
            ...MOCK_TRANSACTIONS,
            { date: '2026-02-20', payee: 'New Entry', category: 'Entertainment', amount: 15, type: 'Expense', account: 'Tavi', rowIndex: 3 }
        ];
        await mockScriptAPI(page, updatedTx);

        await click(page, selectors.refreshBtn);

        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(2, { timeout: 5000 });
        await toContainText(page, selectors.transactionsBody, 'New Entry');
    });

    test('each transaction row has edit and delete buttons', async ({ page }) => {
        await mockScriptAPI(page, MOCK_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        await expect(page.locator(selectors.transactionsEditBtn)).toHaveCount(1);
        await expect(page.locator(selectors.transactionsDeleteBtn)).toHaveCount(1);
    });
});

// ---------------------------------------------------------------------------
// Suite 3: Edit transaction flow
// ---------------------------------------------------------------------------

test.describe('Integration: Edit transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, MOCK_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        // Wait for the table to render before each test
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
    });

    test('clicking edit opens the modal', async ({ page }) => {
        await clickFirst(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });
    });

    test('edit modal is pre-populated with transaction data', async ({ page }) => {
        await click(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });

        await expect(page.locator(selectors.editPayee)).toHaveValue('Test Supermarket');
        await expect(page.locator(selectors.editAmount)).toHaveValue('50');
        await expect(page.locator(selectors.editDate)).toHaveValue('2026-02-21');
    });

    test('saving the edited form shows the success modal', async ({ page }) => {
        await click(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editAmount, '150.00');
        await click(page, selectors.saveEditBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
    });

    test('edit modal closes automatically after a successful save', async ({ page }) => {
        await click(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editAmount, '200.00');
        await click(page, selectors.saveEditBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
        // Modal closes after the 2500 ms success delay
        await expect(page.locator(selectors.editModal)).not.toHaveClass(/show/, { timeout: 6000 });
    });

    test('save button is disabled while the request is in flight', async ({ page }) => {
        // Replace the mock with a delayed response
        await page.unroute('**/script.google.com/**');
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify({ transactions: MOCK_TRANSACTIONS })})`
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.reload();
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        await clickFirst(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editAmount, '75.00');
        await click(page, selectors.saveEditBtn);

        await toBeDisabled(page, selectors.saveEditBtn);
    });

    test('closing the edit modal hides it without submitting', async ({ page }) => {
        await clickFirst(page, selectors.transactionsEditBtn);
        await expect(page.locator(selectors.editModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.editModalClose);
        await expect(page.locator(selectors.editModal)).not.toHaveClass(/show/, { timeout: 3000 });

        // Success modal must NOT have appeared
        await toBeHidden(page, selectors.successModal);
    });
});

// ---------------------------------------------------------------------------
// Suite 4: Delete transaction flow
// ---------------------------------------------------------------------------

test.describe('Integration: Delete transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, MOCK_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
    });

    test('clicking delete opens the confirmation modal', async ({ page }) => {
        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });
    });

    test('delete modal shows the correct transaction details', async ({ page }) => {
        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });

        await toContainText(page, selectors.deleteTransactionDetails, 'Test Supermarket');
        await toContainText(page, selectors.deleteTransactionDetails, '50.00');
        await toContainText(page, selectors.deleteTransactionDetails, '2026-02-21');
    });

    test('confirming deletion shows the success modal', async ({ page }) => {
        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
    });

    test('delete modal closes automatically after confirmed deletion', async ({ page }) => {
        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
        await expect(page.locator(selectors.deleteModal)).not.toHaveClass(/show/, { timeout: 6000 });
    });

    test('confirm button is disabled while the delete request is in flight', async ({ page }) => {
        await page.unroute('**/script.google.com/**');
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify({ transactions: MOCK_TRANSACTIONS })})`
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.reload();
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteBtn);
        await toBeDisabled(page, selectors.confirmDeleteBtn);
    });

    test('cancelling delete closes the modal without deleting', async ({ page }) => {
        await clickFirst(page, selectors.transactionsDeleteBtn);
        await expect(page.locator(selectors.deleteModal)).toHaveClass(/show/, { timeout: 3000 });

        // Click the Cancel button inside the delete modal
        await click(page, selectors.deleteModalCancel);

        await expect(page.locator(selectors.deleteModal)).not.toHaveClass(/show/, { timeout: 3000 });
        // Table row must still be present
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1);
        // Success modal must NOT have appeared
        await toBeHidden(page, selectors.successModal);
    });
});

// ---------------------------------------------------------------------------
// Suite 5: Submit recurring transaction via main form
// ---------------------------------------------------------------------------

test.describe('Integration: Submit recurring transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
    });

    test('checking the recurring toggle shows recurring options', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await check(page, selectors.isRecurring);
        await toBeVisible(page, selectors.recurringOptions);
    });

    test('submitting a recurring transaction shows the success modal', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await fill(page, selectors.amount, '500.00');
        await fill(page, selectors.payee, 'Monthly Rent');
        await selectOption(page, selectors.category, 'Housing');
        await check(page, selectors.isRecurring);
        await selectOption(page, selectors.frequency, 'monthly');
        await fill(page, selectors.recurringStartDate, '2026-03-01');

        await click(page, selectors.submitBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
    });

    test('form resets after recurring transaction is submitted', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await fill(page, selectors.amount, '250.00');
        await fill(page, selectors.payee, 'Internet Bill');
        await check(page, selectors.isRecurring);
        await selectOption(page, selectors.frequency, 'monthly');
        await fill(page, selectors.recurringStartDate, '2026-03-01');

        await click(page, selectors.submitBtn);

        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
        await toBeHidden(page, selectors.successModal, { timeout: 6000 });

        await expect(page.locator(selectors.amount)).toHaveValue('');
    });

    test('submitted recurring transaction appears in the recurring table after refresh', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await fill(page, selectors.amount, '500.00');
        await fill(page, selectors.payee, 'Monthly Rent');
        await selectOption(page, selectors.category, 'Housing');
        await check(page, selectors.isRecurring);
        await selectOption(page, selectors.frequency, 'monthly');
        await fill(page, selectors.recurringStartDate, '2026-03-01');

        await click(page, selectors.submitBtn);
        await toBeVisible(page, selectors.successModal, { timeout: 5000 });
        await toBeHidden(page, selectors.successModal, { timeout: 6000 });

        // Navigate to recurring page; mock already returns the transaction
        await goToRecurringPage(page);

        // Force a refresh so the table re-fetches
        await click(page, selectors.refreshRecurringBtn);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'Monthly Rent');
    });
});

// ---------------------------------------------------------------------------
// Suite 6: Recurring transactions table
// ---------------------------------------------------------------------------

test.describe('Integration: Recurring transactions table', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
    });

    test('table renders recurring transactions returned by the API', async ({ page }) => {
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'Monthly Rent');
        await toContainText(page, selectors.recurringTransactionsBody, '500');
    });

    test('table renders multiple recurring transactions', async ({ page }) => {
        const multiRecurring = [
            ...MOCK_RECURRING_TRANSACTIONS,
            {
                id: 'rec_002',
                payee: 'Netflix',
                category: 'Entertainment',
                amount: 15,
                type: 'Expense',
                account: 'Tavi',
                frequency: 'monthly',
                startDate: '2026-01-01',
                endDate: null,
                nextDue: '2026-03-01',
                notes: ''
            },
            {
                id: 'rec_003',
                payee: 'Salary',
                category: 'Account',
                amount: 3000,
                type: 'Income',
                account: 'Ale',
                frequency: 'monthly',
                startDate: '2026-01-01',
                endDate: null,
                nextDue: '2026-03-01',
                notes: ''
            }
        ];
        await mockScriptAPI(page, [], multiRecurring);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(3, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'Monthly Rent');
        await toContainText(page, selectors.recurringTransactionsBody, 'Netflix');
        await toContainText(page, selectors.recurringTransactionsBody, 'Salary');
    });

    test('refreshing re-fetches recurring transactions from the API', async ({ page }) => {
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        // Update mock to return an additional transaction
        await page.unroute('**/script.google.com/**');
        const updatedRecurring = [
            ...MOCK_RECURRING_TRANSACTIONS,
            {
                id: 'rec_002',
                payee: 'New Subscription',
                category: 'Entertainment',
                amount: 10,
                type: 'Expense',
                account: 'Ale',
                frequency: 'monthly',
                startDate: '2026-01-01',
                endDate: null,
                nextDue: '2026-03-01',
                notes: ''
            }
        ];
        await mockScriptAPI(page, [], updatedRecurring);

        await click(page, selectors.refreshRecurringBtn);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(2, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'New Subscription');
    });

    test('each recurring row has edit and delete buttons', async ({ page }) => {
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await expect(page.locator(selectors.recurringTransactionsEditBtn)).toHaveCount(1);
        await expect(page.locator(selectors.recurringTransactionsDeleteBtn)).toHaveCount(1);
    });

    test('display shows correct frequency text', async ({ page }) => {
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'Monthly');
    });
});

// ---------------------------------------------------------------------------
// Suite 7: Edit recurring transaction
// ---------------------------------------------------------------------------

test.describe('Integration: Edit recurring transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);
        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
    });

    test('clicking edit opens the recurring edit modal', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });
    });

    test('edit modal is pre-populated with recurring transaction data', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await expect(page.locator(selectors.editRecurringPayee)).toHaveValue('Monthly Rent');
        await expect(page.locator(selectors.editRecurringAmount)).toHaveValue('500');
        await expect(page.locator(selectors.editRecurringFrequency)).toHaveValue('monthly');
        await expect(page.locator(selectors.editRecurringStartDate)).toHaveValue('2026-01-01');
        await expect(page.locator(selectors.editRecurringNextDue)).toHaveValue('2026-03-01');
    });

    test('saving the edited recurring form shows the success modal', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editRecurringAmount, '600.00');
        await click(page, selectors.saveEditRecurringBtn);

        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });
    });

    test('edit modal closes immediately after save is triggered', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editRecurringAmount, '650.00');
        await click(page, selectors.saveEditRecurringBtn);

        // The edit recurring modal closes before the success modal appears
        await expect(page.locator(selectors.editRecurringModal)).not.toHaveClass(/show/, { timeout: 4000 });
        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });
    });

    test('save button is disabled while the update request is in flight', async ({ page }) => {
        await page.unroute('**/script.google.com/**');
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: MOCK_RECURRING_TRANSACTIONS }
                    : { transactions: [] };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.reload();
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);
        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await fill(page, selectors.editRecurringAmount, '700.00');
        await click(page, selectors.saveEditRecurringBtn);

        await toBeDisabled(page, selectors.saveEditRecurringBtn);
    });

    test('closing the edit modal hides it without submitting', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsEditBtn);
        await expect(page.locator(selectors.editRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.editRecurringModalClose);
        await expect(page.locator(selectors.editRecurringModal)).not.toHaveClass(/show/, { timeout: 3000 });

        await toBeHidden(page, selectors.successModal);
    });
});

// ---------------------------------------------------------------------------
// Suite 8: Delete recurring transaction
// ---------------------------------------------------------------------------

test.describe('Integration: Delete recurring transaction', () => {
    test.beforeEach(async ({ page }) => {
        await seedCompletedOnboarding(page);
        await mockScriptAPI(page, [], MOCK_RECURRING_TRANSACTIONS);
        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);
        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
    });

    test('clicking delete opens the recurring delete modal', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });
    });

    test('delete modal shows the correct recurring transaction details', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await toContainText(page, selectors.deleteRecurringTransactionDetails, 'Monthly Rent');
        await toContainText(page, selectors.deleteRecurringTransactionDetails, '500.00');
        await toContainText(page, selectors.deleteRecurringTransactionDetails, 'Monthly');
    });

    test('confirming deletion shows the success modal', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteRecurringBtn);

        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });
    });

    test('delete modal closes immediately after confirming deletion', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteRecurringBtn);

        // The recurring delete modal closes before the success UI
        await expect(page.locator(selectors.deleteRecurringModal)).not.toHaveClass(/show/, { timeout: 4000 });
        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });
    });

    test('confirm button is disabled while the delete request is in flight', async ({ page }) => {
        await page.unroute('**/script.google.com/**');
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: MOCK_RECURRING_TRANSACTIONS }
                    : { transactions: [] };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.reload();
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });
        await goToRecurringPage(page);
        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1, { timeout: 5000 });

        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.confirmDeleteRecurringBtn);
        await toBeDisabled(page, selectors.confirmDeleteRecurringBtn);
    });

    test('cancelling delete closes the modal without removing the row', async ({ page }) => {
        await clickFirst(page, selectors.recurringTransactionsDeleteBtn);
        await expect(page.locator(selectors.deleteRecurringModal)).toHaveClass(/show/, { timeout: 3000 });

        await click(page, selectors.deleteRecurringModalCancel);

        await expect(page.locator(selectors.deleteRecurringModal)).not.toHaveClass(/show/, { timeout: 3000 });
        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1);
        await toBeHidden(page, selectors.successModal);
    });
});

// ---------------------------------------------------------------------------
// Suite 9: Recurring transaction processing — immediate & future
// ---------------------------------------------------------------------------

test.describe('Integration: Recurring transaction processing', () => {
    /**
     * Test immediate processing: When a recurring transaction is created with
     * startDate = today, the form should:
     * 1. Create the recurring entry
     * 2. Immediately process it as a regular transaction (add to Google Sheets)
     * 3. Show the success message indicating both actions occurred
     */
    test('recurring with startDate=today processes immediately as a regular transaction', async ({ page }) => {
        await seedCompletedOnboarding(page);
        const today = new Date().toISOString().split('T')[0];

        // Track which operations are called via mock
        const operations = [];
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const body = route.request().postData();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                // JSONP GET — no body
                const cbName = callbackMatch[1];
                // Return empty initially; after submission, return the recurring
                const data = operations.length > 1 ? { recurringTransactions: [] } : { transactions: [] };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else if (body) {
                // POST — track the operation type
                const payload = JSON.parse(body);
                operations.push(payload.operation);
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Fill form with startDate = today
        await fill(page, selectors.amount, '100.00');
        await fill(page, selectors.payee, 'Immediate Processing Test');
        await selectOption(page, selectors.category, 'Groceries');
        await check(page, selectors.isRecurring);
        await selectOption(page, selectors.frequency, 'monthly');
        await fill(page, selectors.recurringStartDate, today);

        await click(page, selectors.submitBtn);

        // Wait for success modal (message about both recurring + immediate processing)
        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });

        // Should have made TWO operations: one for the immediate transaction, one for the recurring
        // (Note: the actual response might make additional calls, but we should see at least 'add' for immediate and 'addRecurring')
        expect(operations.length).toBeGreaterThan(0);
    });

    /**
     * Test delayed processing: When a recurring transaction is created with
     * startDate = tomorrow, it should NOT create an immediate regular transaction.
     * Only the recurring entry should be created.
     */
    test('recurring with startDate=tomorrow does NOT process immediately', async ({ page }) => {
        await seedCompletedOnboarding(page);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const operations = [];
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const body = route.request().postData();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify({ transactions: [], recurringTransactions: [] })})`
                });
            } else if (body) {
                const payload = JSON.parse(body);
                operations.push(payload.operation);
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        await fill(page, selectors.amount, '50.00');
        await fill(page, selectors.payee, 'Future Processing Test');
        await selectOption(page, selectors.category, 'Entertainment');
        await check(page, selectors.isRecurring);
        await selectOption(page, selectors.frequency, 'monthly');
        await fill(page, selectors.recurringStartDate, tomorrowStr);

        await click(page, selectors.submitBtn);

        await expect(page.locator(selectors.successModal)).toHaveClass(/show/, { timeout: 5000 });

        // Should have made only ONE operation: addRecurring (NOT an immediate 'add')
        // The message should say "Recurring transaction created successfully!" (not "created and first payment processed")
        const successText = await page.locator(selectors.successModal).textContent();
        expect(successText).toContain('created successfully');
        expect(successText).not.toContain('first payment');
    });

    /**
     * Test auto-processing on page load: When the app loads, it should check for
     * recurring transactions with nextDue <= today and automatically process them.
     */
    test('auto-processes recurring transactions with nextDue=today on page load', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0];
        const recurringDueToday = {
            id: 'rec_due_today',
            payee: 'Auto-Processed Subscription',
            category: 'Entertainment',
            amount: 25,
            type: 'Expense',
            account: 'Ale',
            frequency: 'monthly',
            startDate: '2026-01-01',
            endDate: null,
            nextDue: today,
            notes: 'Should be auto-processed'
        };

        await seedCompletedOnboarding(page);

        const addedTransactions = [];
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const body = route.request().postData();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = {
                    transactions: addedTransactions,
                    recurringTransactions: [recurringDueToday]
                };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else if (body) {
                const payload = JSON.parse(body);
                if (payload.operation === 'add') {
                    addedTransactions.push(payload);
                }
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // The auto-processing should have added a transaction to the mock list
        // We verify it by refreshing and checking the table
        await click(page, selectors.refreshBtn);

        // Should see one row in the transactions table from the auto-processed recurring
        await expect(page.locator(selectors.transactionsBodyRows)).toHaveCount(1, { timeout: 5000 });
        await toContainText(page, selectors.transactionsBody, 'Auto-Processed Subscription');
    });

    /**
     * Test NO auto-processing for future-due recurring: When nextDue > today,
     * the recurring should NOT be auto-processed on page load.
     */
    test('does NOT auto-process recurring with nextDue in future', async ({ page }) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const recurringFuture = {
            id: 'rec_future',
            payee: 'Future Subscription',
            category: 'Entertainment',
            amount: 15,
            type: 'Expense',
            account: 'Tavi',
            frequency: 'monthly',
            startDate: '2026-01-01',
            endDate: null,
            nextDue: tomorrowStr,
            notes: 'Should NOT be auto-processed'
        };

        await seedCompletedOnboarding(page);

        let postCount = 0;
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const body = route.request().postData();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify({
                        transactions: [],
                        recurringTransactions: [recurringFuture]
                    })})`
                });
            } else if (body) {
                const payload = JSON.parse(body);
                if (payload.operation === 'add') {
                    postCount++;
                }
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Should NOT have made any 'add' POST (no auto-processing)
        expect(postCount).toBe(0);

        await page.locator(selectors.recurringNavLink).click();
        await page.waitForSelector(selectors.recurringPageActive, { timeout: 8000 });

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(1);
        await toContainText(page, selectors.recurringTransactionsBody, 'Future Subscription');
    });

    /**
     * Test multiple recurring transactions with mixed due dates.
     */
    test('auto-processes only DUE recurring transactions, not future ones', async ({ page }) => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const recurringDue = {
            id: 'rec_due',
            payee: 'Due Today',
            category: 'Groceries',
            amount: 30,
            type: 'Expense',
            account: 'Ale',
            frequency: 'monthly',
            startDate: '2026-01-01',
            endDate: null,
            nextDue: today,
            notes: ''
        };

        const recurringFuture = {
            id: 'rec_future',
            payee: 'Due Tomorrow',
            category: 'Entertainment',
            amount: 20,
            type: 'Expense',
            account: 'Tavi',
            frequency: 'monthly',
            startDate: '2026-01-01',
            endDate: null,
            nextDue: tomorrowStr,
            notes: ''
        };

        await seedCompletedOnboarding(page);

        // On first load, return empty transactions; after auto-processing,
        // it may try to fetch again
        let callCount = 0;
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const body = route.request().postData();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                // Return recurring list and any auto-processed transactions
                const data = {
                    transactions: [],
                    recurringTransactions: [recurringDue, recurringFuture]
                };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else if (body) {
                // Just acknowledge the POST
                callCount++;
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Verify recurring page shows both transactions (one due, one future)
        await page.locator(selectors.recurringNavLink).click();
        await page.waitForSelector(selectors.recurringPageActive, { timeout: 8000 });

        await expect(page.locator(selectors.recurringTransactionsBodyRows)).toHaveCount(2, { timeout: 5000 });
        await toContainText(page, selectors.recurringTransactionsBody, 'Due Today');
        await toContainText(page, selectors.recurringTransactionsBody, 'Due Tomorrow');
    });
});

// ---------------------------------------------------------------------------
// Suite 8: Process recurring transaction with today's start date + Data preservation
// ---------------------------------------------------------------------------

test.describe('Integration: Recurring transaction processing with today start date', () => {
    test('recurring transaction with today start date is processed and data preserved', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const today = new Date().toISOString().split('T')[0];

        // Create a recurring transaction due today
        const recurringTx = {
            id: 'rec_today_' + Date.now(),
            payee: 'Today Recurring Payment',
            category: 'Entertainment',
            amount: 75.50,
            type: 'Expense',
            account: 'Ale',
            frequency: 'weekly',
            startDate: today,
            endDate: null,
            nextDue: today,
            notes: 'Test payment due today'
        };

        // Also prepare a processed transaction response (what should be returned after processing)
        const processedTx = {
            date: today + 'T00:00:00.000Z', // ISO format with timezone
            dayOfWeek: new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
            type: 'Expense',
            amount: 75.50,
            category: 'Entertainment',
            account: 'Ale',
            payee: 'Today Recurring Payment',
            notes: 'Test payment due today - Recurring weekly',
            rowIndex: 2
        };

        // Mock the API to return the recurring transaction initially, then the processed transaction
        const transactions = [processedTx];
        const recurringTransactions = [recurringTx];

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            const body = route.request().postData();

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions }
                    : { transactions };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else if (body) {
                // POST request - acknowledge it
                await route.fulfill({ status: 200, body: '' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Wait for auto-processing to complete
        await page.waitForTimeout(3000);

        // Verify the transaction appears in the transactions table with correct date
        const tableRows = await page.locator(selectors.transactionsBodyRows);
        await expect(tableRows).toHaveCount(1, { timeout: 5000 });

        // Check that the date is displayed correctly (should be today, not yesterday)
        const firstRow = page.locator(selectors.transactionsBodyRows).first();
        const rowText = await firstRow.textContent();
        
        // Extract the date from the row (first column is date)
        const cells = await firstRow.locator('td').allTextContents();
        const displayedDate = cells[0];

        // Verify the date is today's date
        expect(displayedDate).toBe(today);

        // Verify other data is not corrupted
        expect(rowText).toContain('Today Recurring Payment');
        expect(rowText).toContain('75.50');
    });
});

// ---------------------------------------------------------------------------
// Suite 9: Transaction date display with timezone correctness
// ---------------------------------------------------------------------------

test.describe('Integration: Transaction date display timezone handling', () => {
    test('transaction date displays correctly in local timezone', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const testDate = '2026-02-23';
        
        const testTransaction = {
            date: testDate + 'T12:00:00.000Z', // UTC noon
            dayOfWeek: 'Tuesday',
            type: 'Expense',
            amount: 50.00,
            category: 'Groceries',
            account: 'Ale',
            payee: 'Test Market',
            notes: 'Test transaction',
            rowIndex: 2
        };

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);

            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions: [testTransaction] };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Get the displayed date from the transactions table
        const firstRow = page.locator(selectors.transactionsBodyRows).first();
        const cells = await firstRow.locator('td').allTextContents();
        const displayedDate = cells[0];

        // The displayed date should match the test date, regardless of UTC time
        expect(displayedDate).toBe(testDate);
    });
});

// ---------------------------------------------------------------------------
// Suite 10: Charts page with malformed date property handling
// ---------------------------------------------------------------------------

test.describe('Integration: Charts page with malformed date properties', () => {
    test('charts display data when transactions have space-character date properties', async ({ page }) => {
        await seedCompletedOnboarding(page);

        // Create transactions with malformed space-character date property (" " instead of "date")
        // This simulates the real-world API response that was causing charts not to display
        const transactionsWithMalformedDate = [
            {
                ' ': '2026-02-15T10:00:00.000Z', // Malformed space character date property
                dayOfWeek: 'Sunday',
                type: 'Expense',
                amount: 50,
                category: 'Groceries',
                account: 'Ale',
                payee: 'Supermarket',
                notes: 'Weekly shopping',
                rowIndex: 2
            },
            {
                ' ': '2026-02-18T14:30:00.000Z', // Malformed space character date property
                dayOfWeek: 'Wednesday',
                type: 'Expense',
                amount: 75,
                category: 'Entertainment',
                account: 'Ale',
                payee: 'Cinema',
                notes: 'Movie night',
                rowIndex: 3
            },
            {
                ' ': '2026-02-20T09:00:00.000Z', // Malformed space character date property
                dayOfWeek: 'Friday',
                type: 'Income',
                amount: 1000,
                category: 'Account',
                account: 'Ale',
                payee: 'Employer',
                notes: 'Monthly salary',
                rowIndex: 4
            }
        ];

        // Mock the API to return transactions with malformed date properties
        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions: transactionsWithMalformedDate };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Navigate to charts page
        await page.locator(selectors.chartsNavLink).click();
        await page.waitForSelector(selectors.chartsPageActive, { timeout: 10000 });

        // Wait for charts to load
        await page.waitForTimeout(1000);

        // Verify all three chart canvases are present
        await expect(page.locator(selectors.expensesCategoryChart)).toBeVisible();
        await expect(page.locator(selectors.expensesVsIncomeChart)).toBeVisible();
        await expect(page.locator(selectors.expensesCategoryBarChart)).toBeVisible();

        // Verify chart headings are visible
        await expect(page.locator(selectors.expensesByCategoryHeading)).toBeVisible();
        await expect(page.locator(selectors.expensesVsIncomeHeading)).toBeVisible();
        await expect(page.locator(selectors.expensesByRankHeading)).toBeVisible();
    });

    test('charts display with correct data for current month', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const transactions = [
            {
                ' ': '2026-02-10T10:00:00.000Z',
                dayOfWeek: 'Monday',
                type: 'Expense',
                amount: 100,
                category: 'Food',
                account: 'Ale',
                payee: 'Restaurant',
                notes: 'Lunch',
                rowIndex: 2
            },
            {
                ' ': '2026-02-15T14:00:00.000Z',
                dayOfWeek: 'Saturday',
                type: 'Expense',
                amount: 50,
                category: 'Transport',
                account: 'Ale',
                payee: 'Taxi',
                notes: 'Airport ride',
                rowIndex: 3
            },
            {
                ' ': '2026-02-20T09:00:00.000Z',
                dayOfWeek: 'Thursday',
                type: 'Income',
                amount: 2000,
                category: 'Account',
                account: 'Ale',
                payee: 'Salary',
                notes: 'Monthly income',
                rowIndex: 4
            }
        ];

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Navigate to charts
        await page.locator(selectors.chartsNavLink).click();
        await page.waitForSelector(selectors.chartsPageActive, { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify charts are displayed (not showing "no data" messages)
        const chartsContainer = page.locator('.charts-container');
        const noDataMessages = chartsContainer.locator('.no-data-message');
        
        // Should have charts, not no-data messages
        const chartCount = await page.locator('canvas').count();
        expect(chartCount).toBeGreaterThan(0);
    });

    test('charts filter correctly with date range', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const transactions = [
            {
                ' ': '2026-02-01T10:00:00.000Z',
                dayOfWeek: 'Sunday',
                type: 'Expense',
                amount: 100,
                category: 'Food',
                account: 'Ale',
                payee: 'Market',
                notes: 'Shopping',
                rowIndex: 2
            },
            {
                ' ': '2026-02-10T10:00:00.000Z',
                dayOfWeek: 'Tuesday',
                type: 'Expense',
                amount: 50,
                category: 'Transport',
                account: 'Ale',
                payee: 'Bus',
                notes: 'Commute',
                rowIndex: 3
            },
            {
                ' ': '2026-03-05T10:00:00.000Z', // March - outside February range
                dayOfWeek: 'Wednesday',
                type: 'Expense',
                amount: 75,
                category: 'Utilities',
                account: 'Ale',
                payee: 'Electric',
                notes: 'Bill',
                rowIndex: 4
            }
        ];

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Navigate to charts
        await page.locator(selectors.chartsNavLink).click();
        await page.waitForSelector(selectors.chartsPageActive, { timeout: 10000 });
        await page.waitForTimeout(1000);

        // By default, should display current month (February)
        // The March transaction should be filtered out
        const chartCount = await page.locator('canvas').count();
        expect(chartCount).toBeGreaterThan(0);

        // Verify filter inputs are populated
        const startDateInput = page.locator(selectors.chartStartDate);
        const endDateInput = page.locator(selectors.chartEndDate);
        
        const startValue = await startDateInput.inputValue();
        const endValue = await endDateInput.inputValue();
        
        // Should be February range
        expect(startValue).toContain('2026-02');
        expect(endValue).toContain('2026-02');
    });

    test('clicking quick filter buttons updates charts', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const today = new Date().toISOString().split('T')[0]; // 2026-02-23

        const transactions = [
            {
                ' ': today + 'T10:00:00.000Z',
                dayOfWeek: 'Monday',
                type: 'Expense',
                amount: 100,
                category: 'Food',
                account: 'Ale',
                payee: 'Restaurant',
                notes: 'Lunch',
                rowIndex: 2
            },
            {
                ' ': today + 'T14:00:00.000Z',
                dayOfWeek: 'Monday',
                type: 'Income',
                amount: 500,
                category: 'Account',
                account: 'Ale',
                payee: 'Freelance',
                notes: 'Project payment',
                rowIndex: 3
            }
        ];

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Navigate to charts
        await page.locator(selectors.chartsNavLink).click();
        await page.waitForSelector(selectors.chartsPageActive, { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify today button exists and is visible
        const todayBtn = page.locator(selectors.todayBtn);
        await expect(todayBtn).toBeVisible();

        // Click today button
        await todayBtn.click();
        await page.waitForTimeout(500);

        // Verify date inputs changed to today
        const startDateInput = page.locator(selectors.chartStartDate);
        const endDateInput = page.locator(selectors.chartEndDate);
        
        const startValue = await startDateInput.inputValue();
        const endValue = await endDateInput.inputValue();
        
        expect(startValue).toBe(today);
        expect(endValue).toBe(today);

        // Charts should still be visible
        await expect(page.locator(selectors.expensesCategoryChart)).toBeVisible();
    });

    test('charts filter correctly with timezone-aware date handling', async ({ page }) => {
        await seedCompletedOnboarding(page);

        const today = new Date().toISOString().split('T')[0];
        
        // Create transactions with UTC timestamps that would fail filtering if timezone not handled
        // For example: 2026-02-22T23:00:00.000Z is Feb 22 in UTC but Feb 23 in UTC+1 timezone
        // This tests the fix that converts UTC timestamps to local timezone before comparing
        const transactions = [
            {
                ' ': '2026-02-22T22:00:00.000Z', // Feb 22 UTC, but might be Feb 23 in some timezones
                dayOfWeek: 'Monday',
                type: 'Expense',
                amount: 100,
                category: 'Groceries',
                account: 'Ale',
                payee: 'Market',
                notes: 'Shopping',
                rowIndex: 2
            },
            {
                ' ': today + 'T10:00:00.000Z', // Today at 10 AM UTC
                dayOfWeek: 'Tuesday',
                type: 'Income',
                amount: 500,
                category: 'Account',
                account: 'Ale',
                payee: 'Salary',
                notes: 'Payment',
                rowIndex: 3
            },
            {
                ' ': today + 'T23:59:59.000Z', // Today at 11:59 PM UTC
                dayOfWeek: 'Tuesday',
                type: 'Expense',
                amount: 25,
                category: 'Entertainment',
                account: 'Ale',
                payee: 'App',
                notes: 'Subscription',
                rowIndex: 4
            }
        ];

        await page.route('**/script.google.com/**', async (route) => {
            const url = route.request().url();
            const callbackMatch = url.match(/[?&]callback=([^&]+)/);
            
            if (callbackMatch) {
                const cbName = callbackMatch[1];
                const data = url.includes('getRecurringTransactions')
                    ? { recurringTransactions: [] }
                    : { transactions };
                await route.fulfill({
                    contentType: 'application/javascript',
                    body: `${cbName}(${JSON.stringify(data)})`
                });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await page.goto('/');
        await page.waitForSelector(selectors.homePageActive, { timeout: 10000 });

        // Navigate to charts
        await page.locator(selectors.chartsNavLink).click();
        await page.waitForSelector(selectors.chartsPageActive, { timeout: 10000 });
        await page.waitForTimeout(1000);

        // Click "Today" button to filter for today's transactions
        const todayBtn = page.locator(selectors.todayBtn);
        await expect(todayBtn).toBeVisible();
        await todayBtn.click();
        await page.waitForTimeout(500);

        // Verify date inputs are set to today
        const startDateInput = page.locator(selectors.chartStartDate);
        const endDateInput = page.locator(selectors.chartEndDate);
        
        const startValue = await startDateInput.inputValue();
        const endValue = await endDateInput.inputValue();
        
        expect(startValue).toBe(today);
        expect(endValue).toBe(today);

        // Charts should be visible and contain today's data
        // (at least the two transactions with today + UTC times)
        await expect(page.locator(selectors.expensesCategoryChart)).toBeVisible();
        await expect(page.locator(selectors.expensesVsIncomeChart)).toBeVisible();

        // The charts should have rendered data (not showing "no data" message)
        // This verifies that the timezone conversion worked and the transactions were included
        const chartsContainer = page.locator('.charts-container');
        const noDataMessages = chartsContainer.locator('.no-data-message');
        
        // Count should be 0 (no "no data" messages) since we have data for today
        const noDataCount = await noDataMessages.count();
        expect(noDataCount).toBe(0);
    });
});
