// Onboarding Module

/**
 * Onboarding Flow Management
 */
class OnboardingManager {
    constructor(isReconfiguring = false, existingConfig = null) {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.isReconfiguring = isReconfiguring;
        this.config = existingConfig || UserConfig.getDefaultConfig();
    }

    /**
     * Initialize onboarding flow
     */
    init() {
        // Reset steps to initial state if reconfiguring
        if (this.isReconfiguring) {
            this.resetOnboardingSteps();
        }
        
        this.updateProgressBar();
        this.loadDefaultCategories();
        this.loadDefaultAccounts();
        this.setupEventListeners();
        this.hideNavbar();
        
        // Prefill form fields if reconfiguring
        if (this.isReconfiguring) {
            this.prefillFormFields();
        }
        
        // Initialize validation states
        this.validateStep1();
        this.validateStep3();
    }

    /**
     * Prefill form fields with existing configuration data
     */
    prefillFormFields() {
        // Step 1: Spreadsheet ID
        const spreadsheetIdInput = document.getElementById('onboardingSpreadsheetId');
        if (spreadsheetIdInput && this.config.spreadsheetId) {
            spreadsheetIdInput.value = this.config.spreadsheetId;
        }

        // Step 2: Script URL
        const scriptUrlInput = document.getElementById('onboardingScriptURL');
        if (scriptUrlInput && this.config.scriptURL) {
            scriptUrlInput.value = this.config.scriptURL;
            // Trigger validation after prefilling to enable tab navigation
            setTimeout(() => this.validateStep2(), 100);
        }

        // Step 5: User Info
        const userNameInput = document.getElementById('onboardingUserName');
        if (userNameInput && this.config.userInfo.name) {
            userNameInput.value = this.config.userInfo.name;
        }

        const currencySelect = document.getElementById('onboardingCurrency');
        if (currencySelect && this.config.userInfo.currency) {
            currencySelect.value = this.config.userInfo.currency;
        }
    }

    /**
     * Reset onboarding steps to their initial state
     */
    resetOnboardingSteps() {
        // Reset all steps to non-active state
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`onboardingStep${i}`);
            if (step) {
                step.classList.remove('active');
            }
        }
        
        // Make step 1 active
        document.getElementById('onboardingStep1')?.classList.add('active');
        this.currentStep = 1;
        
        // Reset step 2 tabs to initial state
        this.resetStep2Tabs();
        
        // Reset step 5 to original content (in case it was showing completion message)
        const step5 = document.getElementById('onboardingStep5');
        if (step5) {
            const content = step5.querySelector('.onboarding-content');
            if (content) {
                content.innerHTML = `
                    <h2>Almost Done! ✨</h2>
                    <p>Just a few final details to personalize your experience.</p>
                    
                    <form id="personalInfoForm" class="onboarding-form">
                        <label>Your Name (optional)</label>
                        <input type="text" id="onboardingUserName" placeholder="How should we address you?">
                        
                        <label>Currency</label>
                        <select id="onboardingCurrency">
                            <option value="RON" selected>RON (lei)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD ($)</option>
                            <option value="AUD">AUD ($)</option>
                        </select>
                        
                        <div class="onboarding-buttons">
                            <button type="button" class="btn-secondary" onclick="prevOnboardingStep()">Back</button>
                            <button type="button" class="btn-primary" onclick="completeOnboarding()">Complete Setup</button>
                        </div>
                    </form>
                `;
            }
        }
    }

    /**
     * Reset step 2 tabs to initial state
     */
    resetStep2Tabs() {
        // Reset to first tab (script setup)
        showSetupTab('script');
        
        // Reset connection test state
        const connectionTest = document.getElementById('connectionTest');
        if (connectionTest) {
            connectionTest.className = 'connection-result';
            connectionTest.innerHTML = '<span>Click "Test Connection" to verify your setup</span>';
        }
        
        // Disable continue button until connection is tested
        const continueBtn = document.getElementById('step2ContinueBtn');
        if (continueBtn) {
            continueBtn.disabled = true;
        }
        
        // Disable tab navigation button initially
        const tabNextBtn = document.querySelector('#scriptTab .tab-next');
        if (tabNextBtn) {
            tabNextBtn.disabled = true;
        }
    }

    /**
     * Load the Apps Script code into the textarea with the user's spreadsheet ID
     */
    loadAppsScriptCode() {
        const codeTextarea = document.getElementById('appsScriptCode');
        const spreadsheetId = this.config.spreadsheetId || document.getElementById('onboardingSpreadsheetId')?.value.trim();
        
        if (codeTextarea && spreadsheetId) {
            // Generate code with the actual spreadsheet ID directly embedded
            const code = this.getAppsScriptCode(spreadsheetId);
            codeTextarea.value = code;
        }
    }

    /**
     * Get the Apps Script code that users need to deploy
     */
    getAppsScriptCode(spreadsheetId = 'YOUR_SPREADSHEET_ID') {
        return `var SPREADSHEET_ID = '${spreadsheetId}';

function doPost(e) {
  try {
    // Get the spreadsheet by ID
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getActiveSheet();
    
    // Parse the incoming data
    var data = JSON.parse(e.postData.contents);
    
    // Handle different operations
    if (data.operation === 'update') {
      return handleUpdateTransaction(sheet, data);
    } else if (data.operation === 'delete') {
      return handleDeleteTransaction(sheet, data);
    } else {
      // Default: add new transaction (operation === 'add' or no operation specified)
      return handleAddTransaction(sheet, data);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddTransaction(sheet, data) {
  try {
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Add a new row with the transaction data
    sheet.appendRow([
      data.date,
      data.dayOfWeek,
      data.type,
      parseFloat(data.amount),
      data.category,
      data.account,
      data.payee,
      data.notes || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Transaction added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    throw error;
  }
}

function handleUpdateTransaction(sheet, data) {
  try {
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Get the row index (add 1 because spreadsheet rows are 1-indexed, and +1 more for header)
    var rowIndex = parseInt(data.rowIndex) + 1;
    
    // Check if row exists
    var lastRow = sheet.getLastRow();
    if (rowIndex <= lastRow && rowIndex > 1) {
      // Update the existing row with new data
      var range = sheet.getRange(rowIndex, 1, 1, 8);
      range.setValues([[
        data.date,
        data.dayOfWeek,
        data.type,
        parseFloat(data.amount),
        data.category,
        data.account,
        data.payee,
        data.notes || ''
      ]]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transaction updated successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Transaction not found or invalid row index'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    throw error;
  }
}

function handleDeleteTransaction(sheet, data) {
  try {
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Get the row index (add 1 because spreadsheet rows are 1-indexed with header)
    var rowIndex = parseInt(data.rowIndex) + 1;
    
    // Check if row exists
    var lastRow = sheet.getLastRow();
    if (rowIndex <= lastRow && rowIndex > 1) {
      sheet.deleteRow(rowIndex);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transaction deleted successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Transaction not found or invalid row index'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    throw error;
  }
}

function doGet(e) {
  try {
    // Get the spreadsheet by ID
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getActiveSheet();
    
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Handle different actions
    var action = e.parameter.action;
    var callback = e.parameter.callback;
    var response;
    
    if (action === 'getAllTransactions' || !action) {
      response = getAllTransactions(sheet, callback);
    } else if (action === 'testConnection') {
      response = testConnection(callback);
    } else {
      // Default behavior - return all transactions
      response = getAllTransactions(sheet, callback);
    }
    
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
    
  } catch (error) {
    var errorResponse = JSON.stringify({
      status: 'error',
      message: error.toString(),
      transactions: []
    });
    
    if (e.parameter.callback) {
      errorResponse = e.parameter.callback + '(' + errorResponse + ')';
    }
    
    return ContentService.createTextOutput(errorResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

function getAllTransactions(sheet, callback) {
  try {
    // Get all data from the sheet
    var data = sheet.getDataRange().getValues();
    
    // Convert to JSON format with lowercase property names
    var transactions = [];
    
    if (data.length > 1) {  // Check if there's data beyond headers
      var headers = data[0] || ['Date', 'Day', 'Type', 'Amount', 'Category', 'Account', 'Payee', 'Notes'];
      
      for (var i = 1; i < data.length; i++) {
        var transaction = {};
        
        for (var j = 0; j < headers.length && j < data[i].length; j++) {
          var headerKey = headers[j];
          var value = data[i][j];
          
          // Convert header names to lowercase for consistency with frontend
          switch (headerKey) {
            case 'Date':
              transaction.date = formatDateForFrontend(value);
              break;
            case 'Day':
              transaction.dayOfWeek = value;
              break;
            case 'Type':
              transaction.type = value;
              break;
            case 'Amount':
              transaction.amount = parseFloat(value) || 0;
              break;
            case 'Category':
              transaction.category = value || 'Uncategorized';
              break;
            case 'Account':
              transaction.account = value;
              break;
            case 'Payee':
              transaction.payee = value;
              break;
            case 'Notes':
              transaction.notes = value || '';
              break;
            default:
              // Handle any additional columns
              transaction[headerKey.toLowerCase()] = value;
          }
        }
        
        // Only add non-empty transactions
        if (transaction.date || transaction.amount) {
          transactions.push(transaction);
        }
      }
    }
    
    // Return in the format expected by the frontend
    var responseData = {
      status: 'success',
      transactions: transactions,
      count: transactions.length
    };
    
    var response = JSON.stringify(responseData);
    
    if (callback) {
      response = callback + '(' + response + ')';
    }
    
    return response;
    
  } catch (error) {
    var errorData = {
      status: 'error',
      message: error.toString(),
      transactions: []
    };
    
    var response = JSON.stringify(errorData);
    
    if (callback) {
      response = callback + '(' + response + ')';
    }
    
    return response;
  }
}

function formatDateForFrontend(dateValue) {
  try {
    var date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return dateValue; // Return as-is if we can't parse it
    }
    
    // Return in YYYY-MM-DD format for consistency
    if (!isNaN(date.getTime())) {
      return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      return dateValue; // Return original if invalid date
    }
  } catch (error) {
    return dateValue; // Return original if any error occurs
  }
}

function setupHeaders(sheet) {
  // This function sets up the spreadsheet headers if they don't exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Day', 'Type', 'Amount', 'Category', 'Account', 'Payee', 'Notes']);
    
    // Format the header row
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
  }
}

function testConnection(callback) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getActiveSheet();
    setupHeaders(sheet);
    
    var responseData = {
      status: 'success',
      message: 'Connection test successful! Spreadsheet: ' + spreadsheet.getName(),
      spreadsheetName: spreadsheet.getName(),
      sheetName: sheet.getName()
    };
    
    var response = JSON.stringify(responseData);
    
    if (callback) {
      response = callback + '(' + response + ')';
    }
    
    return response;
    
  } catch (error) {
    var errorData = {
      status: 'error',
      message: 'Connection test failed: ' + error.toString()
    };
    
    var response = JSON.stringify(errorData);
    
    if (callback) {
      response = callback + '(' + response + ')';
    }
    
    return response;
  }
}`;
    }

    /**
     * Hide main navigation during onboarding
     */
    hideNavbar() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            navbar.style.display = 'none';
        }
    }

    /**
     * Show main navigation after onboarding
     */
    showNavbar() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            navbar.style.display = 'block';
        }
    }

    /**
     * Setup event listeners for onboarding
     */
    setupEventListeners() {
        // Enter key support for account/category inputs
        document.getElementById('newAccountName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addAccount();
            }
        });

        document.getElementById('newCategoryName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCategory();
            }
        });

        // Real-time validation for step 1
        document.getElementById('onboardingSpreadsheetId')?.addEventListener('input', () => {
            this.validateSpreadsheetInput();
            this.validateStep1();
        });

        // Real-time validation for step 2
        document.getElementById('onboardingScriptURL')?.addEventListener('input', () => {
            this.validateStep2();
        });

        // Prevent form submission on step 2 form
        document.getElementById('spreadsheetForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Prevent form submission on step 5 form
        document.getElementById('personalInfoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Disable browser back button during onboarding
        window.addEventListener('beforeunload', (e) => {
            if (!UserConfig.isOnboardingComplete()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Prevent navigation during onboarding
        window.addEventListener('popstate', (e) => {
            if (!UserConfig.isOnboardingComplete()) {
                e.preventDefault();
                history.pushState(null, null, window.location.pathname);
            }
        });
    }

    /**
     * Validate spreadsheet ID input
     */
    validateSpreadsheetInput() {
        const input = document.getElementById('onboardingSpreadsheetId');
        const value = input.value.trim();
        
        // Remove invalid characters and show warning if needed
        if (value && (value.includes('/') || value.includes(' '))) {
            // Extract ID from URL if user pasted full URL
            const match = value.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match) {
                input.value = match[1];
            }
        }
    }

    /**
     * Validate script ID input
     */
    validateScriptInput() {
        const input = document.getElementById('onboardingScriptId');
        const value = input.value.trim();
        
        // Extract script ID from URL if user pasted full URL
        if (value.includes('/macros/s/')) {
            const match = value.match(/\/macros\/s\/([a-zA-Z0-9-_]+)/);
            if (match) {
                input.value = match[1];
            }
        }
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();
            
            if (this.currentStep < this.totalSteps) {
                document.getElementById(`onboardingStep${this.currentStep}`).classList.remove('active');
                this.currentStep++;
                document.getElementById(`onboardingStep${this.currentStep}`).classList.add('active');
                this.updateProgressBar();
                
                // Load Apps Script code when entering step 2
                if (this.currentStep === 2) {
                    this.loadAppsScriptCode();
                }
            }
        }
    }

    /**
     * Navigate to previous step
     */
    prevStep() {
        if (this.currentStep > 1) {
            document.getElementById(`onboardingStep${this.currentStep}`).classList.remove('active');
            this.currentStep--;
            document.getElementById(`onboardingStep${this.currentStep}`).classList.add('active');
            this.updateProgressBar();
        }
    }

    /**
     * Validate current step data
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
                
            case 2:
                return this.validateStep2();
                
            case 3:
                return this.validateStep3();
                
            case 4:
                return true; // Categories are optional
                
            case 5:
                return true; // Personal info is optional
                
            default:
                return true;
        }
    }

    /**
     * Validate step 1 (Spreadsheet ID)
     */
    validateStep1() {
        const spreadsheetId = document.getElementById('onboardingSpreadsheetId')?.value.trim() || '';
        const continueBtn = document.getElementById('step1ContinueBtn');
        
        const isValid = spreadsheetId.length >= 40;
        
        if (continueBtn) {
            continueBtn.disabled = !isValid;
        }
        
        if (!isValid && spreadsheetId) {
            if (spreadsheetId.length < 40) {
                this.showFieldError('onboardingSpreadsheetId', 'Spreadsheet ID seems too short');
            }
        } else {
            this.clearFieldErrors();
        }
        
        return isValid;
    }

    /**
     * Validate step 2 (Apps Script Configuration)
     */
    validateStep2() {
        const scriptURL = document.getElementById('onboardingScriptURL')?.value.trim() || '';
        
        // Update tab navigation buttons
        const tab1Next = document.querySelector('#scriptTab .tab-next');
        
        const hasScriptURL = scriptURL.includes('script.google.com') && scriptURL.includes('/macros/');
        
        if (tab1Next) tab1Next.disabled = !hasScriptURL;
        
        // Note: step2ContinueBtn should only be enabled after successful connection test
        // This is handled in the testConnection function
        
        return hasScriptURL;
    }

    /**
     * Validate step 3 (Account Setup)
     */
    validateStep3() {
        const hasAccounts = this.config.accounts.length > 0;
        const continueBtn = document.getElementById('step3ContinueBtn');
        
        if (continueBtn) {
            continueBtn.disabled = !hasAccounts;
        }
        
        return hasAccounts;
    }

    /**
     * Show field-specific error
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        
        // Add error styling to field
        field.style.borderColor = '#dc3545';
    }

    /**
     * Clear all field errors in current step
     */
    clearFieldErrors() {
        const currentStepDiv = document.getElementById(`onboardingStep${this.currentStep}`);
        if (!currentStepDiv) return;
        
        // Remove error messages
        currentStepDiv.querySelectorAll('.field-error').forEach(error => error.remove());
        
        // Reset field styling
        currentStepDiv.querySelectorAll('input, select').forEach(field => {
            field.style.borderColor = '';
        });
    }

    /**
     * Save current step data to config
     */
    saveCurrentStepData() {
        switch (this.currentStep) {
            case 1:
                // Save spreadsheet ID from step 1
                const spreadsheetId = document.getElementById('onboardingSpreadsheetId').value.trim();
                this.config.spreadsheetId = spreadsheetId;
                this.config.spreadsheetURL = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
                break;
                
            case 2:
                // Save script URL from step 2
                const scriptURL = document.getElementById('onboardingScriptURL').value.trim();
                this.config.scriptURL = scriptURL;
                break;
                
            case 5:
                // Save personal info
                this.config.userInfo.name = document.getElementById('onboardingUserName').value.trim();
                this.config.userInfo.currency = document.getElementById('onboardingCurrency').value;
                break;
        }
    }

    /**
     * Complete onboarding process
     */
    complete() {
        console.log('OnboardingManager: Starting completion process');
        console.log('Current step:', this.currentStep);
        console.log('Config:', this.config);
        
        if (this.validateCurrentStep()) {
            console.log('OnboardingManager: Step validation passed');
            this.saveCurrentStepData();
            
            // Save final configuration
            console.log('OnboardingManager: Saving configuration...');
            if (UserConfig.saveConfig(this.config)) {
                console.log('OnboardingManager: Configuration saved successfully');
                console.log('OnboardingManager: Setting onboarding as complete...');
                UserConfig.setOnboardingComplete();
                console.log('OnboardingManager: Onboarding marked as complete');
                
                // Verify it was saved
                const isComplete = UserConfig.isOnboardingComplete();
                console.log('OnboardingManager: Verification - onboarding complete?', isComplete);
                
                this.showCompletionSuccess();
                
                // Redirect to main app after short delay
                setTimeout(() => {
                    this.finishOnboarding();
                }, 2000);
            } else {
                console.error('OnboardingManager: Failed to save configuration');
                this.showStepError('Failed to save configuration. Please try again.');
            }
        } else {
            console.log('OnboardingManager: Step validation failed');
        }
    }

    /**
     * Finish onboarding and show main app
     */
    finishOnboarding() {
        // Always go to home page after onboarding completion
        document.getElementById('onboardingPage').classList.remove('active');
        document.getElementById('homePage').classList.add('active');
        
        // Update navigation state to reflect home page
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.textContent.trim() === 'Home') {
                link.classList.add('active');
            }
        });
        
        // Show main navigation
        this.showNavbar();
        
        // Update global CONFIG with user's configuration
        Object.assign(window.CONFIG, {
            scriptURL: this.config.scriptURL,
            spreadsheetURL: this.config.spreadsheetURL
        });
        
        // Update form with user's accounts and categories
        this.updateAppWithUserConfig();
        
        // Initialize date fields after DOM is ready
        setTimeout(() => {
            const dateInput = document.getElementById('date');
            const dayInput = document.getElementById('dayOfWeek');
            
            if (dateInput && dayInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
                
                // Trigger updateDay function if it exists
                if (typeof updateDay === 'function') {
                    updateDay();
                }
            }
            
            // Initialize main app components and event listeners
            if (typeof loadPayeeHistory === 'function') loadPayeeHistory();
            if (typeof loadRecentTransactions === 'function') loadRecentTransactions();
            if (typeof setupEventListeners === 'function') setupEventListeners();
            if (typeof setupRefreshButton === 'function') setupRefreshButton();
            if (typeof setupStickyButton === 'function') setupStickyButton();
            if (typeof setupObfuscateButton === 'function') setupObfuscateButton();
            if (typeof setupEditModalListeners === 'function') setupEditModalListeners();
        }, 100);
    }

    /**
     * Update app UI with user configuration
     */
    updateAppWithUserConfig() {
        // Update account dropdown
        const accountSelect = document.getElementById('account');
        const editAccountSelect = document.getElementById('editAccount');
        
        if (accountSelect) {
            accountSelect.innerHTML = '';
            this.config.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account;
                option.textContent = account;
                accountSelect.appendChild(option);
            });
        }
        
        if (editAccountSelect) {
            editAccountSelect.innerHTML = '';
            this.config.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account;
                option.textContent = account;
                editAccountSelect.appendChild(option);
            });
        }

        // Update category dropdown
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            const currentIncome = categorySelect.querySelector('option[data-income-only="true"]');
            categorySelect.innerHTML = '';
            
            this.config.categories.expense.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (category === 'Groceries') option.selected = true;
                categorySelect.appendChild(option);
            });
            
            // Re-add income option
            if (currentIncome) {
                categorySelect.appendChild(currentIncome);
            } else {
                const incomeOption = document.createElement('option');
                incomeOption.value = 'Account';
                incomeOption.textContent = 'Account';
                incomeOption.setAttribute('data-income-only', 'true');
                incomeOption.disabled = true;
                incomeOption.style.display = 'none';
                categorySelect.appendChild(incomeOption);
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const currentStepSpan = document.getElementById('currentStep');
        const totalStepsSpan = document.getElementById('totalSteps');
        
        if (progressFill) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (currentStepSpan) currentStepSpan.textContent = this.currentStep;
        if (totalStepsSpan) totalStepsSpan.textContent = this.totalSteps;
    }

    /**
     * Load default categories into the UI
     */
    loadDefaultCategories() {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        categoriesList.innerHTML = '';
        this.config.categories.expense.forEach(category => {
            this.addCategoryToList(category);
        });
    }

    /**
     * Load default accounts into the UI
     */
    loadDefaultAccounts() {
        const accountsList = document.getElementById('accountsList');
        if (!accountsList) return;
        
        accountsList.innerHTML = '';
        this.config.accounts.forEach(account => {
            this.addAccountToList(account);
        });
    }

    /**
     * Add category to the visual list
     */
    addCategoryToList(categoryName) {
        const categoriesList = document.getElementById('categoriesList');
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span>${categoryName}</span>
            <button type="button" class="remove-btn" onclick="removeCategory('${categoryName}')">×</button>
        `;
        categoriesList.appendChild(item);
    }

    /**
     * Add account to the visual list
     */
    addAccountToList(accountName) {
        const accountsList = document.getElementById('accountsList');
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span>${accountName}</span>
            <button type="button" class="remove-btn" onclick="removeAccount('${accountName}')">×</button>
        `;
        accountsList.appendChild(item);
    }

    /**
     * Show error message for current step
     */
    showStepError(message) {
        // Remove any existing error
        const existingError = document.querySelector('.step-error');
        if (existingError) existingError.remove();
        
        // Add new error message
        const currentStepDiv = document.getElementById(`onboardingStep${this.currentStep}`);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'step-error';
        errorDiv.textContent = message;
        
        const content = currentStepDiv.querySelector('.onboarding-content');
        content.insertBefore(errorDiv, content.querySelector('.onboarding-buttons'));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Show completion success message
     */
    showCompletionSuccess() {
        const step5 = document.getElementById('onboardingStep5');
        const successDiv = document.createElement('div');
        successDiv.className = 'completion-success';
        successDiv.innerHTML = `
            <div class="success-icon">✅</div>
            <h3>Setup Complete!</h3>
            <p>Your budgeting app is now personalized and ready to use.</p>
        `;
        
        const content = step5.querySelector('.onboarding-content');
        content.innerHTML = '';
        content.appendChild(successDiv);
    }
}

// Global onboarding manager instance will be created by main.js

/**
 * Global functions for onboarding navigation
 */
function nextOnboardingStep() {
    if (window.onboardingManager) {
        window.onboardingManager.nextStep();
    }
}

function prevOnboardingStep() {
    if (window.onboardingManager) {
        window.onboardingManager.prevStep();
    }
}

function completeOnboarding() {
    if (window.onboardingManager) {
        window.onboardingManager.complete();
    }
}

/**
 * Account management functions
 */
function addAccount() {
    const input = document.getElementById('newAccountName');
    const accountName = input.value.trim();
    
    if (!accountName) return;
    
    if (window.onboardingManager && window.onboardingManager.config.accounts.includes(accountName)) {
        alert('This account already exists.');
        return;
    }
    
    if (window.onboardingManager) {
        window.onboardingManager.config.accounts.push(accountName);
        window.onboardingManager.addAccountToList(accountName);
        input.value = '';
        
        // Trigger validation
        window.onboardingManager.validateStep3();
    }
}

function removeAccount(accountName) {
    if (!window.onboardingManager) return;
    
    const index = window.onboardingManager.config.accounts.indexOf(accountName);
    if (index > -1) {
        window.onboardingManager.config.accounts.splice(index, 1);
        
        // Remove from UI
        const accountsList = document.getElementById('accountsList');
        const items = accountsList.querySelectorAll('.list-item');
        items.forEach(item => {
            if (item.querySelector('span').textContent === accountName) {
                item.remove();
            }
        });
        
        // Trigger validation
        if (window.onboardingManager) {
            window.onboardingManager.validateStep3();
        }
    }
}

/**
 * Category management functions
 */
function addCategory() {
    const input = document.getElementById('newCategoryName');
    const categoryName = input.value.trim();
    
    if (!categoryName) return;
    
    if (window.onboardingManager && window.onboardingManager.config.categories.expense.includes(categoryName)) {
        alert('This category already exists.');
        return;
    }
    
    if (window.onboardingManager) {
        window.onboardingManager.config.categories.expense.push(categoryName);
        window.onboardingManager.addCategoryToList(categoryName);
        input.value = '';
    }
}

function removeCategory(categoryName) {
    if (!window.onboardingManager) return;
    
    const index = window.onboardingManager.config.categories.expense.indexOf(categoryName);
    if (index > -1) {
        window.onboardingManager.config.categories.expense.splice(index, 1);
        
        // Remove from UI
        const categoriesList = document.getElementById('categoriesList');
        const items = categoriesList.querySelectorAll('.list-item');
        items.forEach(item => {
            if (item.querySelector('span').textContent === categoryName) {
                item.remove();
            }
        });
    }
}

/**
 * Setup tab management functions
 */
function showSetupTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.setup-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab and activate button
    const targetTab = document.getElementById(tabName + 'Tab');
    const targetBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

/**
 * Copy Apps Script code to clipboard
 */
function copyAppsScript() {
    const codeTextarea = document.getElementById('appsScriptCode');
    
    if (codeTextarea) {
        codeTextarea.select();
        document.execCommand('copy');
        
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
        
        // Show success message
        const message = document.createElement('div');
        message.className = 'copy-success-message';
        message.innerHTML = '✅ Personalized code copied with your Spreadsheet ID!';
        document.querySelector('.code-container').appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
}

/**
 * Test connection to the spreadsheet and Apps Script
 */
function testConnection() {
    const spreadsheetId = document.getElementById('onboardingSpreadsheetId').value.trim();
    const scriptURL = document.getElementById('onboardingScriptURL').value.trim();
    const resultDiv = document.getElementById('connectionTest');
    const continueBtn = document.getElementById('step2ContinueBtn');
    
    if (!spreadsheetId || !scriptURL) {
        resultDiv.className = 'connection-result error';
        resultDiv.textContent = 'Please provide both Spreadsheet ID and Script URL';
        return;
    }
    
    resultDiv.className = 'connection-result testing';
    resultDiv.innerHTML = '🔍 Testing connection... Please wait';
    
    // Test the connection by making a simple GET request
    const testScript = document.createElement('script');
    const callbackName = 'connectionTest_' + Date.now();
    
    window[callbackName] = function(response) {
        document.head.removeChild(testScript);
        delete window[callbackName];
        
        if (response && (Array.isArray(response) || response.status !== 'error')) {
            resultDiv.className = 'connection-result success';
            resultDiv.innerHTML = '✅ Connection successful! Your setup is working correctly.';
            continueBtn.disabled = false;
        } else {
            resultDiv.className = 'connection-result error';
            resultDiv.innerHTML = '❌ Connection failed. Please check your Apps Script deployment.';
            continueBtn.disabled = true;
        }
    };
    
    // Handle timeout
    setTimeout(() => {
        if (window[callbackName]) {
            document.head.removeChild(testScript);
            delete window[callbackName];
            resultDiv.className = 'connection-result error';
            resultDiv.innerHTML = '❌ Connection timeout. Please verify your Apps Script is deployed correctly.';
            continueBtn.disabled = true;
        }
    }, 10000);
    
    testScript.src = `${scriptURL}?callback=${callbackName}`;
    testScript.onerror = function() {
        document.head.removeChild(testScript);
        delete window[callbackName];
        resultDiv.className = 'connection-result error';
        resultDiv.innerHTML = '❌ Failed to connect. Please check your Apps Script URL.';
        continueBtn.disabled = true;
    };
    
    document.head.appendChild(testScript);
}

// Export for use in other modules
window.OnboardingManager = OnboardingManager;