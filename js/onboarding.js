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
        // Initialize i18n if available
        if (window.I18n) {
            I18n.init();
            I18n.applyTranslations();
        }
        
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
        } else {
            // Initialize language selector with current language for new onboarding
            this.initializeLanguageSelector();
        }
        
        // Initialize validation states
        this.validateStep1();
        this.validateStep3();
    }

    /**
     * Prefill form fields with existing configuration data
     */
    prefillFormFields() {
        // Step 1: Spreadsheet ID and Language
        const spreadsheetIdInput = document.getElementById('onboardingSpreadsheetId');
        if (spreadsheetIdInput && this.config.spreadsheetId) {
            spreadsheetIdInput.value = this.config.spreadsheetId;
        }
        
        const languageSelect = document.getElementById('onboardingLanguage');
        if (languageSelect && this.config.userInfo.language) {
            languageSelect.value = this.config.userInfo.language;
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
     * Initialize language selector with current language
     */
    initializeLanguageSelector() {
        const languageSelect = document.getElementById('onboardingLanguage');
        if (languageSelect) {
            // Get current language from I18n or use config default
            const currentLanguage = window.I18n ? I18n.currentLanguage : this.config.userInfo.language;
            languageSelect.value = currentLanguage;
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
        this.resetStep2();
        
        // Reset step 5 to original content (in case it was showing completion message)
        const step5 = document.getElementById('onboardingStep5');
        if (step5) {
            const content = step5.querySelector('.onboarding-content');
            if (content) {
                content.innerHTML = `
                    <h2 data-i18n="onboarding.step5.title">Almost Done! ✨</h2>
                    <p data-i18n="onboarding.step5.subtitle">Just a few final details to personalize your experience.</p>
                    
                    <form id="personalInfoForm" class="onboarding-form">
                        <label data-i18n="onboarding.step5.name">Your Name (optional)</label>
                        <input type="text" id="onboardingUserName" data-i18n-placeholder="onboarding.step5.namePlaceholder" placeholder="How should we address you?">
                        
                        <label data-i18n="onboarding.step5.currency">Currency</label>
                        <select id="onboardingCurrency">
                            <option value="RON" selected>RON (lei)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD ($)</option>
                            <option value="AUD">AUD ($)</option>
                        </select>
                        
                        <div class="onboarding-buttons">
                            <button type="button" class="btn-secondary" onclick="prevOnboardingStep()" data-i18n="onboarding.step5.back">Back</button>
                            <button type="button" class="btn-primary" onclick="completeOnboarding()" data-i18n="onboarding.step5.complete">Complete Setup</button>
                        </div>
                    </form>
                `;
                
                // Re-apply translations after injecting new HTML
                if (window.I18n) {
                    I18n.applyTranslations();
                }
            }
        }
    }

    /**
     * Reset step 2 tabs to initial state
     */
    resetStep2() {
        // Reset connection test state
        const connectionTest = document.getElementById('connectionTest');
        if (connectionTest) {
            connectionTest.className = 'connection-result';
            connectionTest.style.display = 'none';
            connectionTest.innerHTML = '';
        }

        // Disable continue button until connection succeeds
        const continueBtn = document.getElementById('step2ContinueBtn');
        if (continueBtn) {
            continueBtn.disabled = true;
        }

        // Hide retry button
        const retryBtn = document.getElementById('retryConnectionBtn');
        if (retryBtn) {
            retryBtn.style.display = 'none';
        }
    }

    /**
     * Get the Apps Script code that users need to deploy
     * @deprecated Template approach: script is pre-embedded in the Google Sheets template.
     */
    getAppsScriptCode() {
        return `// No hardcoded ID needed — this script is bound to the spreadsheet it lives in.

function doPost(e) {
  try {
    // Always operate on the spreadsheet this script is bound to
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    
    // Parse the incoming data
    var data = JSON.parse(e.postData.contents);
    
    // Handle different operations
    if (data.operation === 'update') {
      return handleUpdateTransaction(sheet, data);
    } else if (data.operation === 'delete') {
      return handleDeleteTransaction(sheet, data);
    } else if (data.operation === 'addRecurring') {
      return handleAddRecurring(sheet, data);
    } else if (data.operation === 'updateRecurring') {
      return handleUpdateRecurring(sheet, data);
    } else if (data.operation === 'deleteRecurring') {
      return handleDeleteRecurring(sheet, data);
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
    
    // Add a new row with the transaction data (regular transaction)
    sheet.appendRow([
      data.date,
      data.dayOfWeek,
      data.type,
      parseFloat(data.amount),
      data.category,
      data.account,
      data.payee,
      data.notes || '',
      false, // isRecurring
      '', // frequency
      '', // startDate
      '', // endDate
      '', // nextDue
      '', // recurringId
      new Date().toISOString() // createdAt
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Transaction added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    throw error;
  }
}

function handleAddRecurring(sheet, data) {
  try {
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Generate unique ID for recurring transaction
    var recurringId = 'recurring_' + Utilities.getUuid().replace(/-/g, '').substr(0, 12);
    
    // Calculate next due date - use provided nextDue if available, otherwise calculate it
    var nextDue = data.nextDue || calculateNextDueDate(data.startDate, data.frequency);
    
    // Add recurring transaction record
    sheet.appendRow([
      data.startDate,
      getDayOfWeek(data.startDate),
      data.type,
      parseFloat(data.amount),
      data.category,
      data.account,
      data.payee,
      data.notes || '',
      true, // isRecurring
      data.frequency,
      data.startDate,
      data.endDate || '',
      nextDue,
      recurringId,
      new Date().toISOString() // createdAt
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Recurring transaction added successfully',
      recurringId: recurringId,
      nextDue: nextDue
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    throw error;
  }
}

function handleUpdateRecurring(sheet, data) {
  try {
    setupHeaders(sheet);
    
    // Find the recurring transaction by ID
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var recurringIdCol = headers.indexOf('RecurringId') + 1;
    
    if (recurringIdCol === 0) {
      throw new Error('RecurringId column not found');
    }
    
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][recurringIdCol - 1] === data.recurringId) {
        var rowIndex = i + 1;
        
        // Calculate new next due date if needed
        var nextDue = data.nextDue || calculateNextDueDate(data.startDate, data.frequency);
        
        // Update the row
        var range = sheet.getRange(rowIndex, 1, 1, 15);
        range.setValues([[
          data.startDate,
          getDayOfWeek(data.startDate),
          data.type,
          parseFloat(data.amount),
          data.category,
          data.account,
          data.payee,
          data.notes || '',
          true, // isRecurring
          data.frequency,
          data.startDate,
          data.endDate || '',
          nextDue,
          data.recurringId,
          allData[i][14] // Keep original createdAt
        ]]);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Recurring transaction updated successfully',
          nextDue: nextDue
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Recurring transaction not found'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    throw error;
  }
}

function handleDeleteRecurring(sheet, data) {
  try {
    setupHeaders(sheet);
    
    // Find the recurring transaction by ID
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var recurringIdCol = headers.indexOf('RecurringId') + 1;
    
    if (recurringIdCol === 0) {
      throw new Error('RecurringId column not found');
    }
    
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][recurringIdCol - 1] === data.recurringId) {
        var rowIndex = i + 1;
        sheet.deleteRow(rowIndex);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Recurring transaction deleted successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Recurring transaction not found'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    throw error;
  }
}
function handleUpdateTransaction(sheet, data) {
  try {
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Use the rowIndex directly (it's already the correct spreadsheet row number)
    var rowIndex = parseInt(data.rowIndex);
    
    // Validate rowIndex
    if (!rowIndex || rowIndex < 2) { // Must be >= 2 (after header)
      throw new Error('Invalid rowIndex: ' + rowIndex);
    }
    
    // Check if row exists
    var lastRow = sheet.getLastRow();
    if (rowIndex <= lastRow && rowIndex > 1) {
      // Get existing data to preserve recurring fields
      var existingData = sheet.getRange(rowIndex, 1, 1, 15).getValues()[0];
      
      // Update the existing row with new data, preserving recurring fields
      var range = sheet.getRange(rowIndex, 1, 1, 15);
      range.setValues([[
        data.date,
        data.dayOfWeek,
        data.type,
        parseFloat(data.amount),
        data.category,
        data.account,
        data.payee,
        data.notes || '',
        existingData[8] || false, // preserve isRecurring
        existingData[9] || '', // preserve frequency
        existingData[10] || '', // preserve startDate
        existingData[11] || '', // preserve endDate
        existingData[12] || '', // preserve nextDue
        existingData[13] || '', // preserve recurringId
        existingData[14] || new Date().toISOString() // preserve createdAt
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
    
    // Use the rowIndex directly (it's already the correct spreadsheet row number)
    var rowIndex = parseInt(data.rowIndex);
    
    // Validate rowIndex
    if (!rowIndex || rowIndex < 2) { // Must be >= 2 (after header)
      throw new Error('Invalid rowIndex: ' + rowIndex);
    }
    
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
    // Always operate on the spreadsheet this script is bound to
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getActiveSheet();
    
    // Ensure headers exist
    setupHeaders(sheet);
    
    // Handle different actions
    var action = e.parameter.action;
    var callback = e.parameter.callback;
    var response;
    
    if (action === 'getAllTransactions' || action === 'getTransactions' || !action) {
      response = getAllTransactions(sheet, callback);
    } else if (action === 'getRecurringTransactions') {
      response = getRecurringTransactions(sheet, callback);
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
      var headers = data[0] || ['Date', 'Day', 'Type', 'Amount', 'Category', 'Account', 'Payee', 'Notes', 'IsRecurring', 'Frequency', 'StartDate', 'EndDate', 'NextDue', 'RecurringId', 'CreatedAt'];
      
      for (var i = 1; i < data.length; i++) {
        var transaction = {};
        
        // Skip recurring transaction records (only return actual transactions)
        if (data[i][8] === true) continue;
        
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
          // Add rowIndex for edit/delete operations (i+1 because spreadsheet rows are 1-based)
          transaction.rowIndex = i + 1;
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

function getRecurringTransactions(sheet, callback) {
  try {
    // Get all data from the sheet  
    var data = sheet.getDataRange().getValues();
    
    // Convert to JSON format
    var recurringTransactions = [];
    
    if (data.length > 1) {
      var headers = data[0];
      
      for (var i = 1; i < data.length; i++) {
        // Only include recurring transaction records
        if (data[i][8] !== true) continue;
        
        var transaction = {};
        
        for (var j = 0; j < headers.length && j < data[i].length; j++) {
          var headerKey = headers[j];
          var value = data[i][j];
          
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
            case 'IsRecurring':
              transaction.isRecurring = value;
              break;
            case 'Frequency':
              transaction.frequency = value;
              break;
            case 'StartDate':
              transaction.startDate = formatDateForFrontend(value);
              break;
            case 'EndDate':
              transaction.endDate = value ? formatDateForFrontend(value) : null;
              break;
            case 'NextDue':
              transaction.nextDue = formatDateForFrontend(value);
              break;
            case 'RecurringId':
              transaction.id = value;
              break;
            case 'CreatedAt':
              transaction.createdAt = value;
              break;
          }
        }
        
        if (transaction.id) {
          recurringTransactions.push(transaction);
        }
      }
    }
    
    var responseData = {
      status: 'success',
      recurringTransactions: recurringTransactions,
      count: recurringTransactions.length
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
      recurringTransactions: []
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
    sheet.appendRow(['Date', 'Day', 'Type', 'Amount', 'Category', 'Account', 'Payee', 'Notes', 'IsRecurring', 'Frequency', 'StartDate', 'EndDate', 'NextDue', 'RecurringId', 'CreatedAt']);
    
    // Format the header row
    var headerRange = sheet.getRange(1, 1, 1, 15);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
  }
  
  // Check if we need to add new columns for existing spreadsheets
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var expectedHeaders = ['Date', 'Day', 'Type', 'Amount', 'Category', 'Account', 'Payee', 'Notes', 'IsRecurring', 'Frequency', 'StartDate', 'EndDate', 'NextDue', 'RecurringId', 'CreatedAt'];
  
  if (headers.length < expectedHeaders.length) {
    // Add missing columns
    for (var i = headers.length; i < expectedHeaders.length; i++) {
      sheet.getRange(1, i + 1).setValue(expectedHeaders[i]);
      sheet.getRange(1, i + 1).setFontWeight('bold');
      sheet.getRange(1, i + 1).setBackground('#4285f4');
      sheet.getRange(1, i + 1).setFontColor('white');
    }
  }
}

function calculateNextDueDate(fromDate, frequency) {
  try {
    var date = new Date(fromDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setDate(date.getDate() + 1); // Default to daily
    }
    
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } catch (error) {
    return fromDate; // Return original date if calculation fails
  }
}

function getDayOfWeek(dateValue) {
  try {
    var date = new Date(dateValue);
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch (error) {
    return '';
  }
}

function testConnection(callback) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
    /**
     * Extract the spreadsheet ID from a full Google Sheets URL or a bare ID.
     * Supports:
     *   - Full URL: https://docs.google.com/spreadsheets/d/ID/edit
     *   - Bare ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
     */
    extractSpreadsheetId(input) {
        if (!input) return '';
        const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : input;
    }

    validateStep1() {
        const raw = document.getElementById('onboardingSpreadsheetId')?.value.trim() || '';
        const spreadsheetId = this.extractSpreadsheetId(raw);
        const continueBtn = document.getElementById('step1ContinueBtn');
        
        const isValid = spreadsheetId.length >= 40;
        
        if (continueBtn) {
            continueBtn.disabled = !isValid;
        }
        
        if (!isValid && raw) {
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
        const hasScriptURL = scriptURL.includes('script.google.com') && scriptURL.includes('/macros/');

        // Enable continue button as soon as a valid URL is entered
        const continueBtn = document.getElementById('step2ContinueBtn');
        if (continueBtn) continueBtn.disabled = !hasScriptURL;

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
                // Save spreadsheet ID and language from step 1
                const spreadsheetId = this.extractSpreadsheetId(document.getElementById('onboardingSpreadsheetId').value.trim());
                this.config.spreadsheetId = spreadsheetId;
                this.config.spreadsheetURL = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
                
                // Save language preference
                const languageSelect = document.getElementById('onboardingLanguage');
                if (languageSelect) {
                    this.config.userInfo.language = languageSelect.value;
                }
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
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();
            
            // Save final configuration
            if (UserConfig.saveConfig(this.config)) {
                // Mark onboarding as complete
                UserConfig.setOnboardingComplete();
                
                // Verify it was saved
                const isComplete = UserConfig.isOnboardingComplete();
                
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
        }
    }

    /**
     * Finish onboarding and show main app
     */
    finishOnboarding() {
        // Apply the selected language
        if (this.config.userInfo.language && window.I18n) {
            I18n.setLanguage(this.config.userInfo.language);
        }
        
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
            
            this.config.categories.expense.forEach((category, index) => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (index === 0) option.selected = true;
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
        // Translate the category name for display
        const translatedName = I18n.translateCategory ? I18n.translateCategory(categoryName) : categoryName;
        item.innerHTML = `
            <span>${translatedName}</span>
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
            <h3>${I18n.t('onboarding.complete.title')}</h3>
            <p>${I18n.t('onboarding.complete.message')}</p>
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
        alert(I18n.t('error.accountExists'));
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
        alert(I18n.t('error.categoryExists'));
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
 * Test connection to the spreadsheet and Apps Script
 */
function testConnection() {
    const scriptURL = document.getElementById('onboardingScriptURL').value.trim();
    const spreadsheetId = document.getElementById('onboardingSpreadsheetId').value.trim();
    const resultDiv = document.getElementById('connectionTest');
    const continueBtn = document.getElementById('step2ContinueBtn');
    const retryBtn = document.getElementById('retryConnectionBtn');

    if (retryBtn) retryBtn.style.display = 'none';

    if (!spreadsheetId || !scriptURL) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'connection-result error';
        resultDiv.textContent = I18n.t('onboarding.step2.testMissing');
        if (retryBtn) retryBtn.style.display = 'inline-block';
        return;
    }

    // Show spinner
    resultDiv.style.display = 'flex';
    resultDiv.className = 'connection-result testing';
    resultDiv.innerHTML = '<span class="connection-spinner"></span> ' + I18n.t('onboarding.step2.testing');

    // Test the connection by making a simple GET request
    const testScript = document.createElement('script');
    const callbackName = 'connectionTest_' + Date.now();

    window[callbackName] = function(response) {
        document.head.removeChild(testScript);
        delete window[callbackName];

        if (response && (Array.isArray(response) || response.status !== 'error')) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'connection-result success';
            resultDiv.innerHTML = '✅ ' + I18n.t('onboarding.step2.testSuccess');
            continueBtn.disabled = false;
            // Auto-advance after showing success briefly
            setTimeout(() => {
                if (window.onboardingManager) {
                    window.onboardingManager.nextStep();
                }
            }, 1500);
        } else {
            resultDiv.style.display = 'block';
            resultDiv.className = 'connection-result error';
            resultDiv.innerHTML = '❌ ' + I18n.t('onboarding.step2.testFailed');
            continueBtn.disabled = true;
            if (retryBtn) retryBtn.style.display = 'inline-block';
        }
    };

    // Handle timeout
    setTimeout(() => {
        if (window[callbackName]) {
            document.head.removeChild(testScript);
            delete window[callbackName];
            resultDiv.style.display = 'block';
            resultDiv.className = 'connection-result error';
            resultDiv.innerHTML = '❌ ' + I18n.t('onboarding.step2.testTimeout');
            continueBtn.disabled = true;
            if (retryBtn) retryBtn.style.display = 'inline-block';
        }
    }, 10000);

    testScript.src = `${scriptURL}?callback=${callbackName}`;
    testScript.onerror = function() {
        document.head.removeChild(testScript);
        delete window[callbackName];
        resultDiv.style.display = 'block';
        resultDiv.className = 'connection-result error';
        resultDiv.innerHTML = '❌ ' + I18n.t('onboarding.step2.testError');
        continueBtn.disabled = true;
        if (retryBtn) retryBtn.style.display = 'inline-block';
    };

    document.head.appendChild(testScript);
}

// Export for use in other modules
window.OnboardingManager = OnboardingManager;