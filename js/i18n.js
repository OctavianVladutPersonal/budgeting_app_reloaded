// Internationalization (i18n) Module
// Handles language switching and translation application

class I18n {
    static LANGUAGE_KEY = 'budgetApp_language';
    static DEFAULT_LANGUAGE = 'en';
    static currentLanguage = null;
    
    /**
     * Initialize the i18n system
     */
    static init() {
        // Load saved language or use default
        this.currentLanguage = this.getStoredLanguage();
        
        // Apply translations to the page
        this.applyTranslations();
        
        // Update language selector if it exists
        this.updateLanguageSelector();
    }
    
    /**
     * Get the currently stored language preference
     */
    static getStoredLanguage() {
        try {
            const stored = localStorage.getItem(this.LANGUAGE_KEY);
            return stored || this.DEFAULT_LANGUAGE;
        } catch (error) {
            console.error('Error loading language preference:', error);
            return this.DEFAULT_LANGUAGE;
        }
    }
    
    /**
     * Save language preference to localStorage
     */
    static setLanguage(languageCode) {
        try {
            if (!window.translations || !window.translations[languageCode]) {
                console.error(`Language ${languageCode} not found`);
                return false;
            }
            
            this.currentLanguage = languageCode;
            localStorage.setItem(this.LANGUAGE_KEY, languageCode);
            
            // Apply translations immediately
            this.applyTranslations();
            
            // Update language selector
            this.updateLanguageSelector();
            
            return true;
        } catch (error) {
            console.error('Error saving language preference:', error);
            return false;
        }
    }
    
    /**
     * Get a translation for a specific key
     * @param {string} key - Translation key (e.g., 'nav.home')
     * @param {string} fallback - Optional fallback text if key not found
     * @returns {string} Translated text
     */
    static t(key, fallback = null) {
        try {
            const translations = window.translations;
            if (!translations || !translations[this.currentLanguage]) {
                return fallback || key;
            }
            
            const translation = translations[this.currentLanguage][key];
            return translation !== undefined ? translation : (fallback || key);
        } catch (error) {
            console.error('Error getting translation:', error);
            return fallback || key;
        }
    }
    
    /**
     * Apply translations to all elements with data-i18n attribute
     */
    static applyTranslations() {
        // Translate elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Check if element has data-i18n-attr to translate an attribute instead of text
            const attrName = element.getAttribute('data-i18n-attr');
            if (attrName) {
                element.setAttribute(attrName, translation);
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // For input elements, translate placeholder
                const placeholderKey = element.getAttribute('data-i18n-placeholder');
                if (placeholderKey) {
                    element.placeholder = this.t(placeholderKey);
                }
            } else {
                // For regular elements, translate innerHTML or textContent
                // Use innerHTML if translation contains HTML tags
                if (translation.includes('<')) {
                    element.innerHTML = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Translate select options with data-i18n
        const options = document.querySelectorAll('option[data-i18n]');
        options.forEach(option => {
            const key = option.getAttribute('data-i18n');
            option.textContent = this.t(key);
        });
        
        // Translate title attributes
        const titledElements = document.querySelectorAll('[data-i18n-title]');
        titledElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        // Update page title
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleElement.textContent = this.t('nav.title', 'Expense Tracker');
        }
    }
    
    /**
     * Update the language selector dropdown to reflect current language
     */
    static updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLanguage;
        }
        
        // Also update in onboarding if exists
        const onboardingSelector = document.getElementById('onboardingLanguageSelector');
        if (onboardingSelector) {
            onboardingSelector.value = this.currentLanguage;
        }
    }
    
    /**
     * Get translated category name
     * @param {string} categoryName - Original category name
     * @returns {string} Translated category name
     */
    static translateCategory(categoryName) {
        const categoryMap = {
            'Childcare & School': 'category.childcare',
            'Debt': 'category.debt',
            'Education': 'category.education',
            'Entertainment': 'category.entertainment',
            'Going out': 'category.goingout',
            'Groceries': 'category.groceries',
            'Healthcare': 'category.healthcare',
            'Housing': 'category.housing',
            'Insurance': 'category.insurance',
            'Others': 'category.others',
            'Personal Care': 'category.personalcare',
            'Savings & Investments': 'category.savings',
            'Sport': 'category.sport',
            'Transportation': 'category.transportation',
            'Utilities': 'category.utilities',
            'Vacation': 'category.vacation',
            'Account': 'category.account'
        };
        
        const key = categoryMap[categoryName];
        return key ? this.t(key) : categoryName;
    }
    
    /**
     * Get translated frequency
     * @param {string} frequency - Frequency value
     * @returns {string} Translated frequency
     */
    static translateFrequency(frequency) {
        const frequencyMap = {
            'daily': 'recurring.frequency.daily',
            'weekly': 'recurring.frequency.weekly',
            'biweekly': 'recurring.frequency.biweekly',
            'monthly': 'recurring.frequency.monthly',
            'quarterly': 'recurring.frequency.quarterly',
            'yearly': 'recurring.frequency.yearly'
        };
        
        const key = frequencyMap[frequency];
        return key ? this.t(key) : frequency;
    }
    
    /**
     * Get translated type (Expense/Income)
     * @param {string} type - Transaction type
     * @returns {string} Translated type
     */
    static translateType(type) {
        if (type === 'Expense') {
            return this.t('form.type.expense');
        } else if (type === 'Income') {
            return this.t('form.type.income');
        }
        return type;
    }
    
    /**
     * Get translated status
     * @param {string} status - Status value
     * @returns {string} Translated status
     */
    static translateStatus(status) {
        const statusMap = {
            'Active': 'recurring.status.active',
            'Inactive': 'recurring.status.inactive',
            'Due': 'recurring.status.due',
            'Overdue': 'recurring.status.overdue'
        };
        
        const key = statusMap[status];
        return key ? this.t(key) : status;
    }
    
    /**
     * Populate category select elements with translated options
     */
    static populateCategorySelects() {
        const categorySelects = document.querySelectorAll('select[id*="category" i], select[id*="Category" i]');
        
        categorySelects.forEach(select => {
            // Store current value
            const currentValue = select.value;
            
            // Get all options
            const options = Array.from(select.options);
            
            // Translate each option
            options.forEach(option => {
                if (option.value && !option.hasAttribute('data-income-only')) {
                    option.textContent = this.translateCategory(option.value);
                }
            });
            
            // Restore selected value
            select.value = currentValue;
        });
    }
    
    /**
     * Populate frequency select elements with translated options
     */
    static populateFrequencySelects() {
        const frequencySelects = document.querySelectorAll('select[id*="frequency" i], select[id*="Frequency" i]');
        
        frequencySelects.forEach(select => {
            const currentValue = select.value;
            const options = Array.from(select.options);
            
            options.forEach(option => {
                if (option.value) {
                    option.textContent = this.translateFrequency(option.value);
                } else {
                    // This is the "Select frequency" placeholder
                    option.textContent = this.t('recurring.frequency.select');
                }
            });
            
            select.value = currentValue;
        });
    }
    
    /**
     * Get current language code
     */
    static getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Get available languages
     */
    static getAvailableLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'ro', name: 'Română' }
        ];
    }
}

/**
 * Handle language selector change
 */
function changeLanguage(languageCode) {
    I18n.setLanguage(languageCode);
    
    // Reload the page to apply all language changes
    window.location.reload();
}

// Export for use in other modules
window.I18n = I18n;
window.changeLanguage = changeLanguage;
