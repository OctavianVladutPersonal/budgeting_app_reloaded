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
    } else if (page === 'charts') {
        document.getElementById('chartsPage').classList.add('active');
        console.log('Navigating to charts page - forcing fresh data load...');
        // Force fresh data load every time user visits charts
        chartsInitialized = false;
        isLoadingCharts = false;
        allTransactions = [];
        // Use requestAnimationFrame to ensure DOM is rendered before loading charts
        requestAnimationFrame(() => {
            setTimeout(() => {
                loadAndDisplayCharts();
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
            <span class="config-label">Spreadsheet ID:</span>
            <span class="config-value${sensitiveClass}">${userConfig.spreadsheetId || 'Not set'}</span>
        </div>
        <div class="config-item">
            <span class="config-label">Accounts:</span>
            <span class="config-value${sensitiveClass}">${userConfig.accounts ? userConfig.accounts.join(', ') : 'None'}</span>
        </div>
        <div class="config-item">
            <span class="config-label">Categories:</span>
            <span class="config-value">${userConfig.categories ? userConfig.categories.expense.length + ' expense categories' : 'None'}</span>
        </div>
        <div class="config-item">
            <span class="config-label">User Name:</span>
            <span class="config-value${sensitiveClass}">${userConfig.userInfo?.name || 'Not set'}</span>
        </div>
        <div class="config-item">
            <span class="config-label">Currency:</span>
            <span class="config-value">${userConfig.userInfo?.currency || 'USD'}</span>
        </div>
    `;
    
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
        alert('No spreadsheet URL configured.');
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
