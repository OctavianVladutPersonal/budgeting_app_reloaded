// Navigation Module

/**
 * Navigate between pages
 */
function navigateTo(page) {
    event.preventDefault();
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show selected page
    if (page === 'home') {
        document.getElementById('homePage').classList.add('active');
    } else if (page === 'recurring') {
        document.getElementById('recurringPage').classList.add('active');
        // Load all recurring data in a single call
        setTimeout(async () => {
            if (typeof RecurringUI !== 'undefined') {
                await RecurringUI.loadAllRecurringData();
            }
        }, 100);
    } else if (page === 'charts') {
        document.getElementById('chartsPage').classList.add('active');
        // Reset chart state for fresh rendering but allow cache usage
        chartsInitialized = false;
        isLoadingCharts = false;
        allTransactions = [];
        // Use requestAnimationFrame to ensure DOM is rendered before loading charts
        requestAnimationFrame(() => {
            setTimeout(() => {
                loadAndDisplayCharts(); // Use cache if available, only fetch if needed
            }, 200);
        });
    } else if (page === 'settings') {
        document.getElementById('settingsPage').classList.add('active');
        // Load settings page content
        setTimeout(() => {
            loadSettingsPage();
        }, 100);
    }
}

/**
 * Load and display settings page content
 */
function loadSettingsPage() {
    const configDisplay = document.getElementById('configDisplay');
    const userConfig = UserConfig.getConfig();
    
    if (!userConfig) {
        configDisplay.innerHTML = '<p>No configuration found.</p>';
        return;
    }
    
    const isObfuscated = document.body.classList.contains('obfuscate-mode');
    const sensitiveClass = isObfuscated ? ' sensitive-data' : '';
    
    configDisplay.innerHTML = `
        <div class="config-item">
            <span class="config-label" data-i18n="settings.config.spreadsheetId">Spreadsheet ID:</span>
            <span class="config-value${sensitiveClass}">${userConfig.spreadsheetId || I18n.t('settings.config.notSet')}</span>
        </div>
        <div class="config-item">
            <span class="config-label" data-i18n="settings.config.accounts">Accounts:</span>
            <span class="config-value${sensitiveClass}">${userConfig.accounts ? userConfig.accounts.join(', ') : I18n.t('settings.config.none')}</span>
        </div>
        <div class="config-item">
            <span class="config-label" data-i18n="settings.config.categories">Categories:</span>
            <span class="config-value">${userConfig.categories ? userConfig.categories.expense.length + ' ' + I18n.t('settings.config.expenseCategories') : I18n.t('settings.config.none')}</span>
        </div>
        <div class="config-item">
            <span class="config-label" data-i18n="settings.config.userName">User Name:</span>
            <span class="config-value${sensitiveClass}">${userConfig.userInfo?.name || I18n.t('settings.config.notSet')}</span>
        </div>
        <div class="config-item">
            <span class="config-label" data-i18n="settings.config.currency">Currency:</span>
            <span class="config-value">${userConfig.userInfo?.currency || 'USD'}</span>
        </div>
    `;
    
    // Apply translations to dynamically created labels
    const configLabels = configDisplay.querySelectorAll('[data-i18n]');
    configLabels.forEach(label => {
        const key = label.getAttribute('data-i18n');
        if (key && I18n) {
            label.textContent = I18n.t(key);
        }
    });
    
    // Handle settings action buttons obfuscation
    const settingsActions = document.querySelector('.settings-actions');
    const actionButtons = settingsActions?.querySelectorAll('button');
    
    if (isObfuscated && actionButtons) {
        actionButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
        });
    } else if (actionButtons) {
        actionButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    }
}

/**
 * Settings page functions
 */
function viewSpreadsheet() {
    const userConfig = UserConfig.getConfig();
    if (userConfig && userConfig.spreadsheetURL) {
        window.open(userConfig.spreadsheetURL, '_blank');
    } else {
        alert(I18n.t('error.noSpreadsheetURL'));
    }
}

function showReconfigureModal() {
    document.getElementById('reconfigureModal').classList.add('show');
}

function closeReconfigureModal() {
    document.getElementById('reconfigureModal').classList.remove('show');
}

function confirmReconfigure() {
    closeReconfigureModal();
    restartOnboarding();
}

function showResetModal() {
    document.getElementById('resetModal').classList.add('show');
}

function closeResetModal() {
    document.getElementById('resetModal').classList.remove('show');
}

function confirmReset() {
    closeResetModal();
    resetApp();
}

function showAppFeaturesModal() {
    const modal = document.getElementById('appFeaturesModal');
    modal.classList.add('show');
    
    // Reset scroll position to top
    const modalContent = modal.querySelector('.delete-modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

function closeAppFeaturesModal() {
    document.getElementById('appFeaturesModal').classList.remove('show');
}

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', () => {
    const appFeaturesModal = document.getElementById('appFeaturesModal');
    if (appFeaturesModal) {
        appFeaturesModal.addEventListener('click', (e) => {
            if (e.target === appFeaturesModal) {
                closeAppFeaturesModal();
            }
        });
    }
});

function restartOnboarding() {
    // Get current user configuration
    const currentConfig = UserConfig.getConfig();
    
    // Clear onboarding completion but keep user data
    localStorage.removeItem('budgetApp_onboardingComplete');
    
    // Hide main pages and show onboarding
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('onboardingPage').classList.add('active');
    
    // Hide main navigation
    const navbar = document.getElementById('mainNavbar');
    if (navbar) navbar.style.display = 'none';
    
    // Initialize onboarding manager in reconfiguration mode
    window.onboardingManager = new OnboardingManager(true, currentConfig);
    window.onboardingManager.init();
}

function resetApp() {
    UserConfig.clearUserData();
    window.location.reload();
}
