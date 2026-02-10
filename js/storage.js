// Storage Module for User Configuration and Data Caching

/**
 * Data cache for API responses to avoid redundant calls
 */
class DataCache {
    static TRANSACTIONS_KEY = 'budgetApp_transactionsCache';
    static RECURRING_KEY = 'budgetApp_recurringCache';
    static CHARTS_KEY = 'budgetApp_chartsCache';
    static CACHE_TIMESTAMP_KEY = 'budgetApp_cacheTimestamp';
    static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    /**
     * Check if cached data is still valid (not expired)
     */
    static isCacheValid(key) {
        try {
            const timestamp = localStorage.getItem(`${key}_timestamp`);
            if (!timestamp) return false;
            
            const cacheAge = Date.now() - parseInt(timestamp);
            return cacheAge < this.CACHE_DURATION;
        } catch (error) {
            console.error('Error checking cache validity:', error);
            return false;
        }
    }
    
    /**
     * Get cached transactions data
     */
    static getCachedTransactions() {
        try {
            if (!this.isCacheValid(this.TRANSACTIONS_KEY)) {
                return null;
            }
            
            const cached = localStorage.getItem(this.TRANSACTIONS_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        } catch (error) {
            console.error('Error loading cached transactions:', error);
            return null;
        }
    }
    
    /**
     * Cache transactions data
     */
    static setCachedTransactions(data) {
        try {
            localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(data));
            localStorage.setItem(`${this.TRANSACTIONS_KEY}_timestamp`, Date.now().toString());
        } catch (error) {
            console.error('Error caching transactions:', error);
        }
    }
    
    /**
     * Get cached recurring transactions data
     */
    static getCachedRecurringTransactions() {
        try {
            if (!this.isCacheValid(this.RECURRING_KEY)) {
                return null;
            }
            
            const cached = localStorage.getItem(this.RECURRING_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        } catch (error) {
            console.error('Error loading cached recurring transactions:', error);
            return null;
        }
    }
    
    /**
     * Cache recurring transactions data
     */
    static setCachedRecurringTransactions(data) {
        try {
            localStorage.setItem(this.RECURRING_KEY, JSON.stringify(data));
            localStorage.setItem(`${this.RECURRING_KEY}_timestamp`, Date.now().toString());
        } catch (error) {
            console.error('Error caching recurring transactions:', error);
        }
    }
    
    /**
     * Clear transaction cache (call after add/edit/delete operations)
     */
    static clearTransactionCache() {
        try {
            localStorage.removeItem(this.TRANSACTIONS_KEY);
            localStorage.removeItem(`${this.TRANSACTIONS_KEY}_timestamp`);
        } catch (error) {
            console.error('Error clearing transaction cache:', error);
        }
    }
    
    /**
     * Get cached chart transactions data
     */
    static getCachedChartTransactions() {
        try {
            if (!this.isCacheValid(this.CHARTS_KEY)) {
                return null;
            }
            
            const cached = localStorage.getItem(this.CHARTS_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
            return null;
        } catch (error) {
            console.error('Error loading cached chart transactions:', error);
            return null;
        }
    }
    
    /**
     * Cache chart transactions data
     */
    static setCachedChartTransactions(data) {
        try {
            localStorage.setItem(this.CHARTS_KEY, JSON.stringify(data));
            localStorage.setItem(`${this.CHARTS_KEY}_timestamp`, Date.now().toString());
        } catch (error) {
            console.error('Error caching chart transactions:', error);
        }
    }
    
    /**
     * Clear chart transaction cache (call after add/edit/delete operations)
     */
    static clearChartCache() {
        try {
            localStorage.removeItem(this.CHARTS_KEY);
            localStorage.removeItem(`${this.CHARTS_KEY}_timestamp`);
        } catch (error) {
            console.error('Error clearing chart transaction cache:', error);
        }
    }
    
    /**
     * Clear recurring transaction cache (call after add/edit/delete operations)
     */
    static clearRecurringCache() {
        try {
            localStorage.removeItem(this.RECURRING_KEY);
            localStorage.removeItem(`${this.RECURRING_KEY}_timestamp`);
        } catch (error) {
            console.error('Error clearing recurring transaction cache:', error);
        }
    }
    
    /**
     * Clear all cached data
     */
    static clearAllCache() {
        this.clearTransactionCache();
        this.clearRecurringCache();
        this.clearChartCache();
    }
    
    /**
     * Get cache status info for debugging
     */
    static getCacheStatus() {
        return {
            transactions: {
                cached: localStorage.getItem(this.TRANSACTIONS_KEY) !== null,
                timestamp: localStorage.getItem(`${this.TRANSACTIONS_KEY}_timestamp`),
                valid: this.isCacheValid(this.TRANSACTIONS_KEY)
            },
            recurring: {
                cached: localStorage.getItem(this.RECURRING_KEY) !== null,
                timestamp: localStorage.getItem(`${this.RECURRING_KEY}_timestamp`),
                valid: this.isCacheValid(this.RECURRING_KEY)
            },
            charts: {
                cached: localStorage.getItem(this.CHARTS_KEY) !== null,
                timestamp: localStorage.getItem(`${this.CHARTS_KEY}_timestamp`),
                valid: this.isCacheValid(this.CHARTS_KEY)
            }
        };
    }
}

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
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
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
        return value === 'true';
    }
    
    /**
     * Mark onboarding as complete
     */
    static setOnboardingComplete() {
        localStorage.setItem(this.ONBOARDING_KEY, 'true');
        
        // Verify it was set
        const verification = localStorage.getItem(this.ONBOARDING_KEY);
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
                    'Sport', 'Transportation', 'Utilities', 'Vacation'
                ],
                income: ['Account']
            },
            userInfo: {
                name: '',
                currency: 'RON',
                language: 'en'
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
window.DataCache = DataCache;