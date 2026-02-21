// Centralized selector constants for all tests
// Import this file and use the selector constants instead of hardcoding locators

const selectors = {
    // =========================================================================
    // Navigation & Layout
    // =========================================================================
    mainNavbar: '#mainNavbar',
    navTitle: '.nav-title',
    appFooter: 'footer.app-footer',
    footerCoffeeBtn: 'a.footer-coffee-btn',
    footerContactBtn: 'a.footer-contact-btn',
    homeNavLink: 'a[data-i18n="nav.home"]',
    chartsNavLink: 'a[data-i18n="nav.charts"]',
    recurringNavLink: 'a[data-i18n="nav.recurring"]',
    settingsNavLink: 'a[data-i18n="nav.settings"]',

    // =========================================================================
    // Pages
    // =========================================================================
    homePage: '#homePage',
    homePageActive: '#homePage.active',
    recurringPage: '#recurringPage',
    recurringPageActive: '#recurringPage.active',
    chartsPage: '#chartsPage',
    chartsPageActive: '#chartsPage.active',
    settingsPage: '#settingsPage',
    settingsPageActive: '#settingsPage.active',
    onboardingPage: '#onboardingPage',

    // =========================================================================
    // Onboarding
    // =========================================================================
    onboardingStep1: '#onboardingStep1',
    onboardingStep2: '#onboardingStep2',
    onboardingStep2InstructionList: '#onboardingStep2 .instruction-list',
    currentStep: '#currentStep',
    totalSteps: '#totalSteps',
    onboardingSpreadsheetId: '#onboardingSpreadsheetId',
    onboardingScriptURL: '#onboardingScriptURL',
    onboardingLanguage: '#onboardingLanguage',
    onboardingUserName: '#onboardingUserName',
    onboardingCurrency: '#onboardingCurrency',
    step1ContinueBtn: '#step1ContinueBtn',
    step2ContinueBtn: '#step2ContinueBtn',
    appFeaturesModal: '#appFeaturesModal',
    btnTemplate: 'a.btn-template',
    onboardingWelcomeTitle: 'h1[data-i18n="onboarding.welcome.title"]',

    // =========================================================================
    // Page Titles & Section Headings
    // =========================================================================
    recurringPageTitle: 'h2[data-i18n="recurring.title"]',
    settingsAppearanceHeading: 'h3[data-i18n="settings.appearance"]',
    settingsConfigurationHeading: 'h3[data-i18n="settings.configuration"]',
    settingsActionsHeading: 'h3[data-i18n="settings.actions"]',
    settingsReconfigureBtn: 'button[data-i18n="settings.reconfigure"]',
    settingsResetBtn: 'button[data-i18n="settings.reset"]',

    // =========================================================================
    // Transaction Form (Home Page)
    // =========================================================================
    trackerForm: '#trackerForm',
    amount: '#amount',
    payee: '#payee',
    category: '#category',
    notes: '#notes',
    date: '#date',
    dayOfWeek: '#dayOfWeek',
    account: '#account',
    type: '#type',
    isRecurring: '#isRecurring',
    recurringOptions: '#recurringOptions',
    frequency: '#frequency',
    recurringStartDate: '#recurringStartDate',
    recurringEndDate: '#recurringEndDate',
    nextDueDate: '#nextDueDate',
    submitBtn: '#submitBtn',
    refreshBtn: '#refreshBtn',
    viewSpreadsheetBtn: '#viewSpreadsheetBtn',

    // =========================================================================
    // Transactions Table
    // =========================================================================
    homeTransactionsTable: '#homePage .transactions-table',
    transactionsBody: '#transactionsBody',
    transactionsBodyRows: '#transactionsBody tr',
    transactionsEditBtn: '#transactionsBody .edit-btn',
    transactionsDeleteBtn: '#transactionsBody .delete-btn',
    transactionsTableHeaders: '.transactions-table thead th',

    // =========================================================================
    // Edit Modal (Regular)
    // =========================================================================
    editModal: '#editModal',
    editModalClose: '#editModal .edit-modal-close',
    editPayee: '#editPayee',
    editAmount: '#editAmount',
    editDate: '#editDate',
    editCategory: '#editCategory',
    editAccount: '#editAccount',
    editType: '#editType',
    saveEditBtn: '#saveEditBtn',

    // =========================================================================
    // Edit Modal (Recurring)
    // =========================================================================
    editRecurringModal: '#editRecurringModal',
    editRecurringModalClose: '#editRecurringModal .edit-modal-close',
    editRecurringPayee: '#editRecurringPayee',
    editRecurringAmount: '#editRecurringAmount',
    editRecurringFrequency: '#editRecurringFrequency',
    editRecurringStartDate: '#editRecurringStartDate',
    editRecurringNextDue: '#editRecurringNextDue',
    saveEditRecurringBtn: '#saveEditRecurringBtn',

    // =========================================================================
    // Delete Modal (Regular)
    // =========================================================================
    deleteModal: '#deleteModal',
    deleteModalCancel: '#deleteModal .btn-cancel',
    deleteTransactionDetails: '#deleteTransactionDetails',
    confirmDeleteBtn: '#confirmDeleteBtn',

    // =========================================================================
    // Delete Modal (Recurring)
    // =========================================================================
    deleteRecurringModal: '#deleteRecurringModal',
    deleteRecurringModalCancel: '#deleteRecurringModal .btn-cancel',
    deleteRecurringTransactionDetails: '#deleteRecurringTransactionDetails',
    confirmDeleteRecurringBtn: '#confirmDeleteRecurringBtn',

    // =========================================================================
    // Success Modal
    // =========================================================================
    successModal: '#successModal',

    // =========================================================================
    // Recurring Page
    // =========================================================================
    recurringTransactionsTable: '#recurringPage .transactions-table',
    recurringTransactionsBody: '#recurringTransactionsBody',
    recurringTransactionsBodyRows: '#recurringTransactionsBody tr',
    recurringTransactionsEditBtn: '#recurringTransactionsBody .edit-btn',
    recurringTransactionsDeleteBtn: '#recurringTransactionsBody .delete-btn',
    recurringPageTableHeaders: '#recurringPage .transactions-table thead th',
    refreshRecurringBtn: '#refreshRecurringBtn',

    // =========================================================================
    // Charts Page
    // =========================================================================
    chartFilters: '.chart-filters',
    chartStartDate: '#chartStartDate',
    chartEndDate: '#chartEndDate',
    todayBtn: '#todayBtn',
    thisMonthBtn: '#thisMonthBtn',
    thisYearBtn: '#thisYearBtn',
    lastMonthBtn: '#lastMonthBtn',
    applyFilterBtn: '#applyFilterBtn',
    refreshChartsBtn: '#refreshChartsBtn',
    expensesCategoryChart: '#expensesCategoryChart',
    expensesVsIncomeChart: '#expensesVsIncomeChart',
    expensesCategoryBarChart: '#expensesCategoryBarChart',
    expensesByCategoryHeading: 'h3[data-i18n="charts.expensesByCategory"]',
    expensesVsIncomeHeading: 'h3[data-i18n="charts.expensesVsIncome"]',
    expensesByRankHeading: 'h3[data-i18n="charts.expensesByRank"]',

    // =========================================================================
    // Settings Page
    // =========================================================================
    themeToggle: '#themeToggle',
    themeToggleSlider: '.theme-toggle-container .toggle-slider',
    languageSelector: '#languageSelector',
    languageSelectorOptions: '#languageSelector option',
    obfuscateBtn: '#obfuscateBtn',
    configDisplay: '#configDisplay',
    reconfigureModal: '#reconfigureModal',
    resetModal: '#resetModal',

    // =========================================================================
    // Category and Frequency Options
    // =========================================================================
    categoryOptions: '#category option',
    frequencyOptions: '#frequency option',
    
    // Modal Buttons
    // =========================================================================
    settingsPageViewSpreadsheetBtn: '#settingsPage button[data-i18n="settings.viewSpreadsheet"]',
    reconfigureModalCancel: '#reconfigureModal button[data-i18n="reconfigure.cancel"]',
    reconfigureModalConfirm: '#reconfigureModal button[data-i18n="reconfigure.confirm"]',
    resetModalCancel: '#resetModal button[data-i18n="reset.cancel"]',
    resetModalConfirm: '#resetModal button[data-i18n="reset.confirm"]',
    
    // Recurring Page
    // =========================================================================
    recurringPageTableHeaders: '#recurringPage .transactions-table thead th',
};

module.exports = selectors;
