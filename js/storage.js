// Storage Module for User Configuration

/**
 * User configuration storage and management
 */
class UserConfig {
    static CONFIG_KEY = 'budgetApp_userConfig';
    static ONBOARDING_KEY = 'budgetApp_onboardingComplete';
    
    /**
     * Get user configuration from localStorage
     */
    static getConfig() {
        try {
            const config = localStorage.getItem(this.CONFIG_KEY);
            return config ? JSON.parse(config) : null;
        } catch (error) {
            console.error('Error loading user config:', error);
            return null;
        }
    }
    
    /**
     * Save user configuration to localStorage
     */
    static saveConfig(config) {
        try {
            console.log('UserConfig.saveConfig() - saving config:', config);
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
            console.log('UserConfig.saveConfig() - config saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving user config:', error);
            return false;
        }
    }
    
    /**
     * Check if user has completed onboarding
     */
    static isOnboardingComplete() {
        const value = localStorage.getItem(this.ONBOARDING_KEY);
        console.log('UserConfig.isOnboardingComplete() - localStorage value:', value);
        console.log('UserConfig.isOnboardingComplete() - returning:', value === 'true');
        return value === 'true';
    }
    
    /**
     * Mark onboarding as complete
     */
    static setOnboardingComplete() {
        console.log('UserConfig.setOnboardingComplete() - setting localStorage key:', this.ONBOARDING_KEY, 'to: true');
        localStorage.setItem(this.ONBOARDING_KEY, 'true');
        
        // Verify it was set
        const verification = localStorage.getItem(this.ONBOARDING_KEY);
        console.log('UserConfig.setOnboardingComplete() - verification, value is now:', verification);
    }
    
    /**
     * Clear all user data (for testing or reset)
     */
    static clearUserData() {
        localStorage.removeItem(this.CONFIG_KEY);
        localStorage.removeItem(this.ONBOARDING_KEY);
    }
    
    /**
     * Get default configuration template
     */
    static getDefaultConfig() {
        return {
            spreadsheetId: '',
            scriptURL: '',
            spreadsheetURL: '',
            accounts: ['Checking', 'Savings', 'Credit Card'],
            categories: {
                expense: [
                    'Childcare & School', 'Debt', 'Education', 'Entertainment',
                    'Going out', 'Groceries', 'Healthcare', 'Housing',
                    'Insurance', 'Others', 'Personal Care', 'Savings & Investments',
                    'Transportation', 'Utilities', 'Vacation'
                ],
                income: ['Account']
            },
            userInfo: {
                name: '',
                currency: 'RON'
            }
        };
    }
    
    /**
     * Generate script and spreadsheet URLs from spreadsheet ID
     */
    static generateURLsFromSpreadsheetId(spreadsheetId, scriptId) {
        return {
            spreadsheetURL: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
            scriptURL: scriptId ? `https://script.google.com/macros/s/${scriptId}/exec` : ''
        };
    }
}

// Export for use in other modules
window.UserConfig = UserConfig;