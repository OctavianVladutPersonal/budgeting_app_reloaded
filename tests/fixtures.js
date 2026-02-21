// Shared test fixtures and helpers

/**
 * Mock user config injected into localStorage to bypass onboarding.
 * Matches the shape of UserConfig.getDefaultConfig().
 */
const MOCK_USER_CONFIG = {
    spreadsheetId: 'mock_sheet_id_for_tests',
    scriptURL: 'https://script.google.com/macros/s/mock_script_id/exec',
    spreadsheetURL: 'https://docs.google.com/spreadsheets/d/mock_sheet_id_for_tests/edit',
    accounts: ['Ale', 'Tavi'],
    categories: {
        expense: [
            'Childcare & School', 'Debt', 'Education', 'Entertainment',
            'Going out', 'Groceries', 'Healthcare', 'Housing',
            'Insurance', 'Others', 'Personal Care', 'Savings & Investments',
            'Sport', 'Transportation', 'Utilities', 'Vacation'
        ],
        income: ['Account']
    },
    userInfo: {
        name: 'Test User',
        currency: 'RON',
        language: 'en'
    }
};

/**
 * Seeds localStorage so the app skips onboarding and loads the main UI.
 * Call this in a beforeEach via page.addInitScript.
 */
async function seedCompletedOnboarding(page) {
    await page.addInitScript((config) => {
        localStorage.setItem('budgetApp_onboardingComplete', 'true');
        localStorage.setItem('budgetApp_userConfig', JSON.stringify(config));
        // Disable obfuscation mode so form and action buttons are enabled in tests
        localStorage.setItem('obfuscateMode', 'false');
    }, MOCK_USER_CONFIG);
}

/**
 * Clears all app-related localStorage keys so onboarding runs fresh.
 */
async function clearAppStorage(page) {
    await page.addInitScript(() => {
        localStorage.removeItem('budgetApp_onboardingComplete');
        localStorage.removeItem('budgetApp_userConfig');
        localStorage.removeItem('budgetApp_transactionsCache');
        localStorage.removeItem('budgetApp_recurringCache');
        localStorage.removeItem('budgetApp_chartsCache');
    });
}

module.exports = { MOCK_USER_CONFIG, seedCompletedOnboarding, clearAppStorage };
