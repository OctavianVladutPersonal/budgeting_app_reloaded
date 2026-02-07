// Main Application Initialization

// DOM Elements
const dateInput = document.getElementById('date');
const dayInput = document.getElementById('dayOfWeek');
const today = new Date().toISOString().split('T')[0];

/**
 * Main initialization function
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if user needs onboarding
    const isOnboardingComplete = UserConfig.isOnboardingComplete();
    
    if (!isOnboardingComplete) {
        // Hide navigation during onboarding
        const navbar = document.getElementById('mainNavbar');
        if (navbar) navbar.style.display = 'none';
        
        // Show onboarding flow
        document.getElementById('homePage').classList.remove('active');
        document.getElementById('onboardingPage').classList.add('active');
        
        // Prevent navigation during onboarding
        history.pushState(null, null, window.location.pathname);
        
        // Initialize onboarding manager
        window.onboardingManager = new OnboardingManager();
        window.onboardingManager.init();
        return; // Don't initialize main app yet
    }
    
    // Switch from onboarding page to main app
    document.getElementById('onboardingPage').classList.remove('active');
    document.getElementById('homePage').classList.add('active');
    
    // Ensure navbar is visible for returning users
    const navbar = document.getElementById('mainNavbar');
    if (navbar) navbar.style.display = 'block';
    
    // Load user configuration and update app
    const userConfig = UserConfig.getConfig();
    if (userConfig) {
        // Store user config globally for access by other modules
        window.userConfig = userConfig;
        
        // Update global CONFIG with user's settings
        Object.assign(window.CONFIG, {
            scriptURL: userConfig.scriptURL,
            spreadsheetURL: userConfig.spreadsheetURL
        });
        
        // Update app UI with user's accounts and categories
        updateAppWithUserConfig(userConfig);
    }
    
    // Initialize main app
    initializeMainApp();
});

/**
 * Initialize the main application
 */
function initializeMainApp() {
    // Initialize date fields
    const dateInput = document.getElementById('date');
    const dayInput = document.getElementById('dayOfWeek');
    const today = new Date().toISOString().split('T')[0];
    
    dateInput.value = today;
    updateDay();
    
    // Load data
    loadPayeeHistory();
    loadRecentTransactions(); // Will check cache automatically
    
    // Setup event listeners
    setupEventListeners();
    setupRefreshButton();
    setupStickyButton();
    setupObfuscateButton();
    setupEditModalListeners();
    
    // Check for due recurring transactions in background 
    setTimeout(() => {
        checkAndNotifyDueRecurringTransactions();
    }, 2000);
    
    // Request notification permission for recurring transactions
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

/**
 * Update app UI with user configuration
 */
function updateAppWithUserConfig(userConfig) {
    // Update account dropdown
    const accountSelect = document.getElementById('account');
    const editAccountSelect = document.getElementById('editAccount');
    const recurringModalAccountSelect = document.getElementById('recurringModalAccount');
    const editRecurringAccountSelect = document.getElementById('editRecurringAccount');
    
    if (accountSelect && userConfig.accounts) {
        accountSelect.innerHTML = '';
        userConfig.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            accountSelect.appendChild(option);
        });
    }
    
    if (editAccountSelect && userConfig.accounts) {
        editAccountSelect.innerHTML = '';
        userConfig.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            editAccountSelect.appendChild(option);
        });
    }
    
    // Update recurring modal account dropdowns
    if (recurringModalAccountSelect && userConfig.accounts) {
        recurringModalAccountSelect.innerHTML = '';
        userConfig.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            recurringModalAccountSelect.appendChild(option);
        });
    }
    
    if (editRecurringAccountSelect && userConfig.accounts) {
        editRecurringAccountSelect.innerHTML = '';
        userConfig.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account;
            option.textContent = account;
            editRecurringAccountSelect.appendChild(option);
        });
    }

    // Update category dropdown
    const categorySelect = document.getElementById('category');
    const editCategorySelect = document.getElementById('editCategory');
    
    if (categorySelect && userConfig.categories) {
        const currentIncomeOption = categorySelect.querySelector('option[data-income-only="true"]');
        categorySelect.innerHTML = '';
        
        userConfig.categories.expense.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === 'Groceries') option.selected = true;
            categorySelect.appendChild(option);
        });
        
        // Re-add income option
        const incomeOption = document.createElement('option');
        incomeOption.value = 'Account';
        incomeOption.textContent = 'Account';
        incomeOption.setAttribute('data-income-only', 'true');
        incomeOption.disabled = true;
        incomeOption.style.display = 'none';
        categorySelect.appendChild(incomeOption);
    }
    
    // Update edit modal category dropdown
    if (editCategorySelect && userConfig.categories) {
        editCategorySelect.innerHTML = '';
        
        userConfig.categories.expense.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            editCategorySelect.appendChild(option);
        });
        
        // Re-add income option for edit modal
        const incomeOption = document.createElement('option');
        incomeOption.value = 'Account';
        incomeOption.textContent = 'Account';
        incomeOption.setAttribute('data-income-only', 'true');
        incomeOption.disabled = true;
        incomeOption.style.display = 'none';
        editCategorySelect.appendChild(incomeOption);
    }
}

/**
 * Check for due recurring transactions and notify user
 */
async function checkAndNotifyDueRecurringTransactions() {
    if (typeof RecurringTransactions === 'undefined') return;
    
    try {
        const dueTransactions = await RecurringTransactions.getDueTransactions();
        
        if (dueTransactions.length > 0) {
            const message = `You have ${dueTransactions.length} recurring transaction${dueTransactions.length > 1 ? 's' : ''} that ${dueTransactions.length > 1 ? 'are' : 'is'} due for processing.`;
            
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Recurring Transactions Due', {
                    body: message,
                    icon: 'data:,', // No icon for now
                    tag: 'recurring-due'
                });
            }
            
            // Optionally show a toast notification in the app
            showDueTransactionsToast(dueTransactions.length);
        }
    } catch (error) {
        console.error('Error checking due recurring transactions:', error);
    }
}

/**
 * Show in-app toast notification for due recurring transactions
 */
function showDueTransactionsToast(count) {
    const toast = document.createElement('div');
    toast.className = 'recurring-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🔄</span>
            <div class="toast-text">
                <strong>${count} recurring transaction${count > 1 ? 's' : ''} due</strong>
                <small>Click to process automatically</small>
            </div>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    toast.addEventListener('click', function(e) {
        if (e.target.classList.contains('toast-close')) return;
        
        // Navigate to recurring page
        navigateTo('recurring');
        toast.remove();
    });
    
    document.body.appendChild(toast);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 10000);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    setupFormListeners();
    setupPayeeListeners();
}
