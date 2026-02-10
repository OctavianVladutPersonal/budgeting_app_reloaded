// Recurring Transactions Module

/**
 * Recurring Transaction Storage and Management (Google Sheets Based)
 */
class RecurringTransactions {
    /**
     * Get all recurring transactions from Google Sheets with caching
     */
    static async getAll(forceRefresh = false) {
        try {
            // Check cache first unless force refresh is requested
            if (!forceRefresh && window.DataCache) {
                const cachedData = DataCache.getCachedRecurringTransactions();
                if (cachedData) {
                    return Array.isArray(cachedData) ? cachedData : (cachedData.recurringTransactions || []);
                }
            }
            
            const data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getRecurringTransactions');
            
            // Cache the received data
            if (window.DataCache && data) {
                DataCache.setCachedRecurringTransactions(data);
            }
            
            if (data && data.recurringTransactions && Array.isArray(data.recurringTransactions)) {
                return data.recurringTransactions;
            }
        } catch (error) {
            console.error('Error loading recurring transactions:', error);
            return [];
        }
    }
    
    /**
     * Add a new recurring transaction
     */
    static async add(transaction) {
        try {
            const payload = {
                operation: 'addRecurring',
                amount: parseFloat(transaction.amount),
                payee: transaction.payee,
                category: transaction.category,
                notes: transaction.notes || '',
                account: transaction.account,
                type: transaction.type,
                frequency: transaction.frequency,
                startDate: transaction.startDate,
                endDate: transaction.endDate || '',
                // Use the nextDue exactly as provided by the form, don't recalculate
                nextDue: transaction.nextDue
            };
            
            const response = await fetch(window.CONFIG.scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            
            // Since it's no-cors, we can't check response status, so assume success
            return true;
        } catch (error) {
            console.error('Error adding recurring transaction:', error);
            return false;
        }
    }
    
    /**
     * Update an existing recurring transaction
     */
    static async update(id, updates) {
        try {
            const payload = {
                operation: 'updateRecurring',
                recurringId: id,
                amount: parseFloat(updates.amount),
                payee: updates.payee,
                category: updates.category,
                notes: updates.notes || '',
                account: updates.account,
                type: updates.type,
                frequency: updates.frequency,
                startDate: updates.startDate,
                endDate: updates.endDate || '',
                nextDue: updates.nextDue
            };
            
            const response = await fetch(window.CONFIG.scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            
            return true;
        } catch (error) {
            console.error('Error updating recurring transaction:', error);
            return false;
        }
    }
    
    /**
     * Delete a recurring transaction
     */
    static async delete(id) {
        try {
            const payload = {
                operation: 'deleteRecurring',
                recurringId: id
            };
            
            const response = await fetch(window.CONFIG.scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            
            return true;
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            return false;
        }
    }
    
    /**
     * Get a specific recurring transaction by ID
     */
    static async getById(id) {
        const transactions = await this.getAll();
        return transactions.find(t => t.id === id) || null;
    }
    
    /**
     * Get transactions that are due for processing
     */
    static async getDueTransactions() {
        const today = new Date().toISOString().split('T')[0];
        const transactions = await this.getAll();
        
        return transactions.filter(transaction => {
            // Must have a next due date (active)
            if (!transaction.nextDue) {
                return false;
            }
            
            // Must have started (not future-dated)
            if (transaction.startDate > today) {
                return false;
            }
            
            // Must not be past end date
            if (transaction.endDate && transaction.endDate < today) {
                return false;
            }
            
            // Next due must not exceed end date
            if (transaction.endDate && transaction.nextDue > transaction.endDate) {
                return false;
            }
            
            // Must be due today or overdue
            return transaction.nextDue <= today;
        });
    }
    

    
    /**
     * Mark a recurring transaction as processed and update next due date
     */
    static async markAsProcessed(id) {
        // Force refresh to get latest data and avoid cache issues
        const transaction = await this.getById(id);
        if (!transaction) {
            console.error(`Cannot mark transaction ${id} as processed - not found`);
            return false;
        }
        
        // Double-check the transaction is still due before marking as processed
        const today = new Date().toISOString().split('T')[0];
        if (!transaction.nextDue || transaction.nextDue > today) {
            return false;
        }
        
        let nextDue;
        
        // If transaction has an end date equal to today, make it inactive
        if (transaction.endDate && transaction.endDate === today) {
            // Set nextDue to null to mark transaction as inactive
            nextDue = null;
        } else {
            // Calculate next due date normally
            nextDue = this.calculateNextDueDate(transaction.nextDue, transaction.frequency);
            
            // But if the calculated next due would be after the end date, also make it inactive
            if (transaction.endDate && nextDue > transaction.endDate) {
                nextDue = null;
            }
        }
        
        const updateResult = await this.update(id, {
            lastProcessed: new Date().toISOString(),
            nextDue: nextDue
        });
        
        if (updateResult) {
            // Clear cache to ensure fresh data on next read
            if (window.DataCache) {
                DataCache.clearRecurringCache();
            }
        }
        
        return updateResult;
    }
    
    /**
     * Deactivate transactions that have reached their end date (regardless of processing status)
     */
    static async deactivateExpiredTransactions() {
        const today = new Date().toISOString().split('T')[0];
        const transactions = await this.getAll();
        
        // Find transactions that have end date = today and are still active
        const expiredTransactions = transactions.filter(transaction => {
            return transaction.endDate === today && transaction.nextDue !== null;
        });
        
        // Deactivate each expired transaction
        const promises = expiredTransactions.map(transaction => {
            return this.update(transaction.id, {
                nextDue: null
            });
        });
        
        return await Promise.all(promises);
    }
    
    /**
     * Calculate the next due date based on start date and frequency (client-side utility)
     */
    static calculateNextDueDate(fromDate, frequency) {
        const date = new Date(fromDate);
        
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
                console.warn('Unknown frequency:', frequency);
                date.setDate(date.getDate() + 1); // Default to daily
        }
        
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Get frequency display text
     */
    static getFrequencyText(frequency) {
        // Use I18n if available, otherwise fall back to English
        if (window.I18n) {
            return I18n.translateFrequency(frequency);
        }
        
        const frequencies = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'biweekly': 'Bi-weekly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'yearly': 'Yearly'
        };
        
        return frequencies[frequency] || frequency;
    }
    
    /**
     * Format recurring transaction for display
     */
    static formatForDisplay(transaction) {
        const today = new Date().toISOString().split('T')[0];
        let status = 'active';
        
        // INACTIVE CONDITIONS (checked first, highest priority)
        if (!transaction.nextDue) {
            status = 'inactive';  // No next due date set
        }
        else if (transaction.startDate > today) {
            status = 'inactive';  // Transaction hasn't started yet
        }
        else if (transaction.endDate && transaction.endDate < today) {
            status = 'inactive';  // End date has already passed
        }
        else if (transaction.endDate && transaction.nextDue > transaction.endDate) {
            status = 'inactive';  // Next due exceeds end date
        }
        // OVERDUE (should have been processed already)
        else if (transaction.nextDue < today) {
            status = 'overdue';   // Missed processing - important visibility
        }
        // DUE TODAY (ready for processing)
        else if (transaction.nextDue === today) {
            status = 'due';
        }
        // Otherwise ACTIVE (future scheduled date)
        
        return {
            ...transaction,
            status,
            formattedAmount: parseFloat(transaction.amount).toFixed(2),
            frequencyText: this.getFrequencyText(transaction.frequency),
            nextDueFormatted: transaction.nextDue ? new Date(transaction.nextDue).toLocaleDateString() : 'N/A',
            startDateFormatted: new Date(transaction.startDate).toLocaleDateString(),
            endDateFormatted: transaction.endDate ? new Date(transaction.endDate).toLocaleDateString() : null
        };
    }
}

/**
 * UI Management for Recurring Transactions
 */
class RecurringUI {
    /**
     * Initialize recurring transactions UI
     */
    static init() {
        this.setupEventListeners();
        this.loadRecurringList();
        
        // Automatically process due transactions on page load
        setTimeout(() => {
            this.autoProcessDueTransactions();
        }, 1000); // Delay to allow page to fully load
    }
    
    /**
     * Automatically process due transactions without user interaction
     */
    static async autoProcessDueTransactions() {
        try {
            const dueTransactions = await RecurringTransactions.getDueTransactions();
            
            if (dueTransactions.length > 0) {
                await RecurringProcessor.processAllDue(true); // true for silent mode
                
                // Refresh the UI data after processing
                await this.loadRecurringList(true); // force refresh
            }
        } catch (error) {
            console.error('Error in auto-processing due transactions:', error);
        }
    }
    
    /**
     * Setup event listeners for recurring transaction features
     */
    static setupEventListeners() {
        // Main form recurring checkbox
        const recurringCheckbox = document.getElementById('isRecurring');
        if (recurringCheckbox) {
            recurringCheckbox.addEventListener('change', this.handleRecurringToggle);
        }
        
        // Recurring options frequency change
        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', this.updateRecurringDescription);
            frequencySelect.addEventListener('change', () => this.updateNextDueDate());
        }
        
        // Recurring start date change
        const startDateInput = document.getElementById('recurringStartDate');
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.validateStartEndDates('recurringStartDate', 'recurringEndDate');
                this.updateNextDueDate();
            });
        }
        
        // Recurring end date change
        const endDateInput = document.getElementById('recurringEndDate');
        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.validateStartEndDates('recurringStartDate', 'recurringEndDate');
                this.updateNextDueDate();
            });
        }
        
        // Modal forms - only edit recurring form is needed
        const editRecurringForm = document.getElementById('editRecurringForm');
        if (editRecurringForm) {
            editRecurringForm.addEventListener('submit', this.handleEditRecurring);
        }
        
        // Auto-populate today's date in recurring start date
        const today = new Date().toISOString().split('T')[0];
        if (startDateInput) {
            startDateInput.value = today;
        }
        
        const modalStartDate = document.getElementById('recurringModalStartDate');
        if (modalStartDate) {
            modalStartDate.value = today;
        }
        
        // Update modal type change to handle category options
        const modalTypeSelect = document.getElementById('recurringModalType');
        if (modalTypeSelect) {
            modalTypeSelect.addEventListener('change', this.updateModalCategoryOptions);
        }
        
        const editTypeSelect = document.getElementById('editRecurringType');
        if (editTypeSelect) {
            editTypeSelect.addEventListener('change', this.updateEditCategoryOptions);
        }
        
        // Edit modal start date change validation
        const editStartDateInput = document.getElementById('editRecurringStartDate');
        if (editStartDateInput) {
            editStartDateInput.addEventListener('change', () => {
                this.validateStartEndDates('editRecurringStartDate', 'editRecurringEndDate');
            });
        }
        
        // Edit modal end date change validation
        const editEndDateInput = document.getElementById('editRecurringEndDate');
        if (editEndDateInput) {
            editEndDateInput.addEventListener('change', () => {
                this.validateStartEndDates('editRecurringStartDate', 'editRecurringEndDate');
            });
        }
    }
    
    /**
     * Validate that start date is not after end date
     */
    static validateStartEndDates(startDateId, endDateId) {
        const startDateInput = document.getElementById(startDateId);
        const endDateInput = document.getElementById(endDateId);
        
        if (!startDateInput || !endDateInput) return;
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // If both dates are set and start date is after end date
        if (startDate && endDate && startDate > endDate) {
            // Automatically set end date to match start date
            endDateInput.value = startDate;
        }
    }
    
    /**
     * Handle recurring checkbox toggle in main form
     */
    static handleRecurringToggle(event) {
        const recurringOptions = document.getElementById('recurringOptions');
        const frequencySelect = document.getElementById('frequency');
        
        if (event.target.checked) {
            recurringOptions.style.display = 'block';
            // Make frequency required when recurring is enabled
            if (frequencySelect) {
                frequencySelect.setAttribute('required', 'required');
            }
            RecurringUI.updateRecurringDescription();
            RecurringUI.updateNextDueDate(); // Initialize next due date
        } else {
            recurringOptions.style.display = 'none';
            // Remove required attribute when recurring is disabled
            if (frequencySelect) {
                frequencySelect.removeAttribute('required');
                frequencySelect.value = ''; // Clear the value
            }
        }
    }
    
    /**
     * Update recurring description text
     */
    static updateRecurringDescription() {
        const frequency = document.getElementById('frequency').value;
        const startDate = document.getElementById('recurringStartDate').value;
        const endDate = document.getElementById('recurringEndDate').value;
        const descElement = document.getElementById('recurringDescription');
        
        if (!frequency || !startDate) {
            descElement.textContent = I18n.t('recurring.selectFrequencyDate');
            return;
        }
        
        const frequencyText = RecurringTransactions.getFrequencyText(frequency).toLowerCase();
        const startDateFormatted = new Date(startDate).toLocaleDateString();
        const endDateText = endDate ? ` until ${new Date(endDate).toLocaleDateString()}` : '';
        
        descElement.textContent = `This transaction will repeat ${frequencyText} starting ${startDateFormatted}${endDateText}.`;
        
        // Update next due date
        RecurringUI.updateNextDueDate();
    }
    
    /**
     * Update next due date based on start date and frequency
     */
    static updateNextDueDate() {
        const frequency = document.getElementById('frequency').value;
        const startDate = document.getElementById('recurringStartDate').value;
        const endDate = document.getElementById('recurringEndDate').value;
        const nextDueDateInput = document.getElementById('nextDueDate');
        
        if (frequency && startDate) {
            let nextDue = RecurringTransactions.calculateNextDueDate(startDate, frequency);
            
            // If end date is set, ensure next due date doesn't exceed it
            if (endDate && nextDue > endDate) {
                // Calculate the last valid occurrence before or on the end date
                nextDue = this.calculateLastValidDueDateBeforeEndDate(startDate, frequency, endDate);
            }
            
            nextDueDateInput.value = nextDue;
        }
    }
    
    /**
     * Calculate the last valid due date that falls before or on the end date
     */
    static calculateLastValidDueDateBeforeEndDate(startDate, frequency, endDate) {
        let currentDate = new Date(startDate);
        let lastValidDate = startDate;
        
        // Keep calculating next dates until we exceed the end date
        while (currentDate.toISOString().split('T')[0] <= endDate) {
            lastValidDate = currentDate.toISOString().split('T')[0];
            
            // Calculate next occurrence
            switch (frequency) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'biweekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'quarterly':
                    currentDate.setMonth(currentDate.getMonth() + 3);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
                default:
                    // Default to daily if unknown frequency
                    currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        return lastValidDate;
    }
    
    /**
     * Refresh the recurring transactions list
     */
    static async refreshRecurringList() {
        try {
            // Force refresh data from server
            await this.loadRecurringList(true); // true forces cache refresh
            
        } catch (error) {
            console.error('Error refreshing recurring transactions:', error);
            const tbody = document.querySelector('#recurringTransactionsTable tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545;">❌ Error refreshing data. Please try again.</td></tr>';
            }
        }
    }

    /**
     * Handle editing a recurring transaction
     */
    static async handleEditRecurring(event) {
        event.preventDefault();
        
        const saveBtn = document.getElementById('saveEditRecurringBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        
        try {
            const id = document.getElementById('editRecurringId').value;
            const updates = {
                amount: parseFloat(document.getElementById('editRecurringAmount').value),
                payee: document.getElementById('editRecurringPayee').value,
                category: document.getElementById('editRecurringCategory').value,
                notes: document.getElementById('editRecurringNotes').value,
                account: document.getElementById('editRecurringAccount').value,
                type: document.getElementById('editRecurringType').value,
                frequency: document.getElementById('editRecurringFrequency').value,
                startDate: document.getElementById('editRecurringStartDate').value,
                endDate: document.getElementById('editRecurringEndDate').value || null,
                nextDue: document.getElementById('editRecurringNextDue').value
            };
            
            const result = await RecurringTransactions.update(id, updates);
            
            // Clear cache since recurring data has changed
            if (window.DataCache) {
                DataCache.clearRecurringCache();
                DataCache.clearChartCache();
            }
            
            // Close modal first to avoid any conflicts
            closeEditRecurringModal();
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
            
            // Then show success message
            showSuccessCheckmark(I18n.t('success.recurringUpdated'));
            
            // Refresh data after modal closes
            setTimeout(() => {
                RecurringUI.loadRecurringList();
            }, 1600); // Slightly after success modal disappears
            
        } catch (error) {
            console.error('Error updating recurring transaction:', error);
            showErrorMessage('Error updating recurring transaction. Please check your connection and try again.');
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
        }
    }
    

    
    /**
     * Load and display recurring transactions list
     */
    static async loadRecurringList(forceRefresh = false) {
        const tbody = document.getElementById('recurringTransactionsBody');
        
        if (!tbody) return;
        
        const loadingMsg = window.I18n ? I18n.t('transactions.loading', 'Loading recurring transactions...') : 'Loading recurring transactions...';
        const emptyMsg = window.I18n ? I18n.t('recurring.empty', 'No recurring transactions set up yet.') : 'No recurring transactions set up yet.';
        
        // Show loading state
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #999;">${loadingMsg}</td></tr>`;
        
        try {
            const transactions = await RecurringTransactions.getAll(forceRefresh);
            
            if (transactions.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #999;">${emptyMsg}<br><small>Create one by adding a transaction and checking "Make this a recurring transaction"</small></td></tr>`;
                return;
            }
            
            // Store transactions globally for editing
            window.currentRecurringTransactions = transactions;
            
            const html = transactions.map((transaction, index) => {
                const formatted = RecurringTransactions.formatForDisplay(transaction);
                const amountClass = transaction.type === 'Income' ? 'income' : 'expense';
                const sign = transaction.type === 'Income' ? '+' : '-';
                
                // Translate category, type, and status
                const translatedCategory = window.I18n ? I18n.translateCategory(transaction.category) : transaction.category;
                const translatedType = window.I18n ? I18n.translateType(transaction.type) : transaction.type;
                const translatedStatus = window.I18n ? I18n.translateStatus(formatted.status.charAt(0).toUpperCase() + formatted.status.slice(1)) : formatted.status;
                
                return `
                    <tr>
                        <td class="sensitive-data">${transaction.payee}</td>
                        <td>${translatedCategory}</td>
                        <td class="amount sensitive-data ${amountClass}">
                            ${sign}${formatted.formattedAmount}
                        </td>
                        <td>${translatedType}</td>
                        <td>${formatted.frequencyText}</td>
                        <td>${formatted.nextDueFormatted}</td>
                        <td>
                            <span class="status-badge status-${formatted.status}">${translatedStatus}</span>
                        </td>
                        <td class="action-buttons">
                            <button type="button" class="edit-btn" onclick="openEditRecurringModal('${transaction.id}')" title="Edit recurring transaction">✏️</button>
                            <button type="button" class="delete-btn" onclick="deleteRecurringTransaction('${transaction.id}')" title="Delete recurring transaction">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            tbody.innerHTML = html;
            
            // Apply obfuscation state to newly rendered buttons
            const isObfuscated = document.body.classList.contains('obfuscate-mode');
            if (isObfuscated && typeof disableActionButtons === 'function') {
                // Use setTimeout to ensure buttons are in DOM
                setTimeout(() => disableActionButtons(), 0);
            }
        } catch (error) {
            console.error('Error loading recurring list:', error);
            
            // Show error state
            tbody.innerHTML = '<tr><td colspan=\"8\" style=\"text-align: center; color: #dc3545;\">Error loading recurring transactions.<br><small>Please check your connection and try refreshing the page.</small></td></tr>';
        }
    }
    
    /**
     * Load all recurring data in a single call (optimized for navigation)
     */
    static async loadAllRecurringData() {
        const tbody = document.getElementById('recurringTransactionsBody');
        
        // Show loading state for table
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">Loading recurring transactions...</td></tr>';
        }
        
        try {
            // Make single API call to get all transactions
            const transactions = await RecurringTransactions.getAll();
            

            
            // Update the transaction list display
            this.displayTransactionList(transactions);
            
        } catch (error) {
            console.error('Error loading recurring data:', error);
            

            
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545;">Error loading recurring transactions.<br><small>Please check your connection and try refreshing the page.</small></td></tr>';
            }
        }
    }
    

    
    /**
     * Display transaction list from loaded data
     */
    static displayTransactionList(transactions) {
        const tbody = document.getElementById('recurringTransactionsBody');
        if (!tbody) return;
        
        const emptyMsg = window.I18n ? I18n.t('recurring.empty', 'No recurring transactions set up yet.') : 'No recurring transactions set up yet.';
        
        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #999;">${emptyMsg}<br><small>Create one by adding a transaction and checking "Make this a recurring transaction"</small></td></tr>`;
            return;
        }
        
        // Store transactions globally for editing
        window.currentRecurringTransactions = transactions;
        
        const html = transactions.map((transaction, index) => {
            const formatted = RecurringTransactions.formatForDisplay(transaction);
            const amountClass = transaction.type === 'Income' ? 'income' : 'expense';
            const sign = transaction.type === 'Income' ? '+' : '-';
            
            // Translate category, type, and status
            const translatedCategory = window.I18n ? I18n.translateCategory(transaction.category) : transaction.category;
            const translatedType = window.I18n ? I18n.translateType(transaction.type) : transaction.type;
            const translatedStatus = window.I18n ? I18n.translateStatus(formatted.status.charAt(0).toUpperCase() + formatted.status.slice(1)) : formatted.status;
            
            return `
                <tr>
                    <td class="sensitive-data">${transaction.payee}</td>
                    <td>${translatedCategory}</td>
                    <td class="amount sensitive-data ${amountClass}">
                        ${sign}${formatted.formattedAmount}
                    </td>
                    <td>${translatedType}</td>
                    <td>${formatted.frequencyText}</td>
                    <td>${formatted.nextDueFormatted}</td>
                    <td>
                        <span class="status-badge status-${formatted.status}">${translatedStatus}</span>
                    </td>
                    <td class="action-buttons">
                        <button type="button" class="edit-btn" onclick="openEditRecurringModal('${transaction.id}')" title="Edit recurring transaction">✏️</button>
                        <button type="button" class="delete-btn" onclick="deleteRecurringTransaction('${transaction.id}')" title="Delete recurring transaction">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = html;
        
        // Apply obfuscation state to newly rendered buttons
        const isObfuscated = document.body.classList.contains('obfuscate-mode');
        if (isObfuscated && typeof disableActionButtons === 'function') {
            // Use setTimeout to ensure buttons are in DOM
            setTimeout(() => disableActionButtons(), 0);
        }
    }
    

    
    /**
     * Update a transaction in local data
     */
    static updateLocalTransaction(id, updates) {
        if (!window.currentRecurringTransactions) return;
        
        const index = window.currentRecurringTransactions.findIndex(t => t.id === id);
        if (index !== -1) {
            window.currentRecurringTransactions[index] = {
                ...window.currentRecurringTransactions[index],
                ...updates
            };
        }
    }
    
    /**
     * Remove a transaction from local data
     */
    static removeLocalTransaction(id) {
        if (!window.currentRecurringTransactions) return;
        
        window.currentRecurringTransactions = window.currentRecurringTransactions.filter(t => t.id !== id);
    }
    
    /**
     * Render the recurring table from current local data
     */
    static renderRecurringTable() {
        const tbody = document.getElementById('recurringTransactionsBody');
        if (!tbody || !window.currentRecurringTransactions) return;
        
        const transactions = window.currentRecurringTransactions;
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No recurring transactions set up yet.<br><small>Create one by adding a transaction and checking "Make this a recurring transaction"</small></td></tr>';
            return;
        }
        
        const html = transactions.map((transaction, index) => {
            const formatted = RecurringTransactions.formatForDisplay(transaction);
            const amountClass = transaction.type === 'Income' ? 'income' : 'expense';
            const sign = transaction.type === 'Income' ? '+' : '-';
            
            return `
                <tr>
                    <td class="sensitive-data">${transaction.payee}</td>
                    <td>${transaction.category}</td>
                    <td class="amount sensitive-data ${amountClass}">
                        ${sign}${formatted.formattedAmount}
                    </td>
                    <td>${transaction.type}</td>
                    <td>${formatted.frequencyText}</td>
                    <td>${formatted.nextDueFormatted}</td>
                    <td>
                        <span class="status-badge status-${formatted.status}">${formatted.status}</span>
                    </td>
                    <td class="action-buttons">
                        <button type="button" class="edit-btn" onclick="openEditRecurringModal('${transaction.id}')" title="Edit recurring transaction">✏️</button>
                        <button type="button" class="delete-btn" onclick="deleteRecurringTransaction('${transaction.id}')" title="Delete recurring transaction">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = html;
    }
    
    /**
     * Update category options for modal based on transaction type (Add mode)
     */
    static updateModalCategoryOptions() {
        const typeSelect = document.getElementById('recurringModalType');
        const categorySelect = document.getElementById('recurringModalCategory');
        const selectedType = typeSelect.value;
        
        // Find the account option
        const accountOption = categorySelect.querySelector('option[value="Account"]');
        
        if (selectedType === 'Income') {
            // Auto-set category to Account for Income and disable the field
            categorySelect.value = 'Account';
            categorySelect.disabled = true;
            if (accountOption) {
                accountOption.disabled = false;
                accountOption.style.display = 'block';
            }
        } else {
            // Enable category field for Expense and disable Account option
            categorySelect.disabled = false;
            if (accountOption) {
                accountOption.disabled = true;
                accountOption.style.display = 'none';
            }
            
            // If Account was selected, switch to first category
            if (categorySelect.value === 'Account') {
                const firstOption = Array.from(categorySelect.options).find(opt => !opt.hasAttribute('data-income-only'));
                if (firstOption) categorySelect.value = firstOption.value;
            }
        }
    }
    
    /**
     * Update category options for edit modal based on transaction type (Edit mode)
     */
    static updateEditCategoryOptions() {
        const typeSelect = document.getElementById('editRecurringType');
        const categorySelect = document.getElementById('editRecurringCategory');
        const selectedType = typeSelect.value;
        
        // Find the account option
        const accountOption = categorySelect.querySelector('option[value="Account"]');
        
        if (selectedType === 'Income') {
            // Auto-set category to Account for Income and disable the field
            categorySelect.value = 'Account';
            categorySelect.disabled = true;
            if (accountOption) {
                accountOption.disabled = false;
                accountOption.style.display = 'block';
            }
        } else {
            // Enable category field for Expense and disable Account option
            categorySelect.disabled = false;
            if (accountOption) {
                accountOption.disabled = true;
                accountOption.style.display = 'none';
            }
            
            // If Account was selected, switch to first category
            if (categorySelect.value === 'Account') {
                const firstOption = Array.from(categorySelect.options).find(opt => !opt.hasAttribute('data-income-only'));
                if (firstOption) categorySelect.value = firstOption.value;
            }
        }
    }
}

/**
 * Processing recurring transactions
 */
class RecurringProcessor {
    // Track currently processing transactions to prevent duplicates
    static processingTransactions = new Set();
    
    /**
     * Process all due recurring transactions
     */
    static async processAllDue(silentMode = false) {
        const dueTransactions = await RecurringTransactions.getDueTransactions();
        
        if (dueTransactions.length === 0) {
            if (!silentMode) {
                showSuccessCheckmark(I18n.t('success.noDueTransactions'));
            }
            return;
        }
        
        // Filter out transactions that are already being processed
        const transactionsToProcess = dueTransactions.filter(t => !this.processingTransactions.has(t.id));
        
        if (transactionsToProcess.length === 0) {
            return;
        }
        
        let successCount = 0;
        let errors = [];
        
        for (const recurringTransaction of transactionsToProcess) {
            // Mark as currently processing
            this.processingTransactions.add(recurringTransaction.id);
            
            // Double-check transaction is still active before processing
            if (!recurringTransaction.nextDue) {
                this.processingTransactions.delete(recurringTransaction.id);
                continue;
            }
            
            try {
                // Double-check the transaction is still due (prevent race conditions)
                const currentTransaction = await RecurringTransactions.getById(recurringTransaction.id);
                if (!currentTransaction || !currentTransaction.nextDue) {
                    continue;
                }
                
                const today = new Date().toISOString().split('T')[0];
                
                // Check if already processed today (extra safety layer)
                if (currentTransaction.lastProcessed) {
                    const lastProcessedDate = currentTransaction.lastProcessed.split('T')[0];
                    if (lastProcessedDate === today) {
                        continue;
                    }
                }
                
                // Verify still due
                if (currentTransaction.nextDue > today) {
                    continue;
                }
                
                // Verify start date hasn't been changed to future
                if (currentTransaction.startDate > today) {
                    continue;
                }
                
                const success = await this.processRecurringTransaction(recurringTransaction);
                if (success) {
                    // Immediately mark as processed to prevent duplicate processing
                    const markResult = await RecurringTransactions.markAsProcessed(recurringTransaction.id);
                    if (markResult) {
                        successCount++;
                    } else {
                        errors.push(`Failed to mark ${recurringTransaction.payee} as processed`);
                    }
                } else {
                    errors.push(`Failed to process: ${recurringTransaction.payee}`);
                }
            } catch (error) {
                console.error('Error processing recurring transaction:', error);
                errors.push(`Error with ${recurringTransaction.payee}: ${error.message}`);
            } finally {
                // Always remove from processing set
                this.processingTransactions.delete(recurringTransaction.id);
            }
        }
        
        // Show results only if not in silent mode
        if (!silentMode) {
            let message = `Processed ${successCount} of ${transactionsToProcess.length} recurring transactions.`;
            if (errors.length > 0) {
                message += '\n\nErrors:\n' + errors.join('\n');
            }
            showSuccessCheckmark(message);
        } else {
            // Just log the results for automatic processing
            if (errors.length > 0) {
                console.warn('Auto-processing errors:', errors);
            }
        }
        
        // Refresh UI
        await RecurringUI.loadRecurringList();
        
        // Clear caches since both regular and recurring data have changed
        if (window.DataCache) {
            DataCache.clearTransactionCache();
            DataCache.clearRecurringCache();
            DataCache.clearChartCache();
        }
        
        // Refresh main transactions if on home page  
        if (typeof loadRecentTransactions === 'function') {
            // Add a small delay to ensure spreadsheet has processed all changes
            // and then force a full refresh to get accurate rowIndex values
            setTimeout(() => {
                // Clear cache to ensure we get completely fresh data
                if (window.DataCache) {
                    DataCache.clearAllCache();
                }
                loadRecentTransactions(true); // Force refresh after processing
            }, 1500); // Wait 1.5 seconds for data to be properly synced
        }
    }
    
    /**
     * Process a single recurring transaction
     */
    static async processRecurringTransaction(recurringTransaction) {
        // Final check that transaction is still active
        if (!recurringTransaction.nextDue) {
            return false;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        const payload = {
            operation: 'add',
            date: today,
            dayOfWeek: dayOfWeek,
            type: recurringTransaction.type,
            amount: parseFloat(recurringTransaction.amount),
            category: recurringTransaction.category,
            account: recurringTransaction.account,
            payee: recurringTransaction.payee,
            notes: `${recurringTransaction.notes ? recurringTransaction.notes + ' - ' : ''}Recurring ${RecurringTransactions.getFrequencyText(recurringTransaction.frequency).toLowerCase()}`
        };
        
        try {
            const response = await fetch(window.CONFIG.scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload)
            });
            
            // Since it's no-cors, we can't check response status, so assume success
            return true;
        } catch (error) {
            console.error('Error sending recurring transaction:', error);
            return false;
        }
    }
}

/**
 * Global functions for UI interactions
 */
// Note: openAddRecurringModal function removed - add functionality disabled

function refreshRecurringList() {
    const refreshBtn = document.getElementById('refreshRecurringBtn');
    
    // Clear cache to force fresh data
    if (window.DataCache) {
        DataCache.clearRecurringCache();
    }
    
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    RecurringUI.refreshRecurringList().finally(() => {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    });
}

function closeAddRecurringModal() {
    const modal = document.getElementById('addRecurringModal');
    modal.classList.remove('show');
    document.getElementById('addRecurringForm').reset();
}

function openEditRecurringModal(id) {
    // Use already loaded data instead of fetching
    const transaction = window.currentRecurringTransactions?.find(t => t.id === id);
    if (!transaction) {
        console.error('Recurring transaction not found in loaded data:', id);
        return;
    }
    
    // Ensure account dropdown is populated before setting values
    const accountSelect = document.getElementById('editRecurringAccount');
    if (accountSelect && window.userConfig && window.userConfig.accounts) {
        // Only repopulate if the dropdown appears empty or has hardcoded values
        if (accountSelect.children.length <= 2 || accountSelect.querySelector('option[value="Ale"]')) {
            accountSelect.innerHTML = '';
            window.userConfig.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account;
                option.textContent = account;
                accountSelect.appendChild(option);
            });
        }
    }
    
    // Populate form fields
    document.getElementById('editRecurringId').value = transaction.id;
    document.getElementById('editRecurringAmount').value = transaction.amount;
    document.getElementById('editRecurringPayee').value = transaction.payee;
    document.getElementById('editRecurringCategory').value = transaction.category;
    document.getElementById('editRecurringNotes').value = transaction.notes || '';
    document.getElementById('editRecurringAccount').value = transaction.account;
    document.getElementById('editRecurringType').value = transaction.type;
    document.getElementById('editRecurringFrequency').value = transaction.frequency;
    document.getElementById('editRecurringStartDate').value = transaction.startDate;
    document.getElementById('editRecurringEndDate').value = transaction.endDate || '';
    document.getElementById('editRecurringNextDue').value = transaction.nextDue;
    
    // Trigger category options update based on type
    RecurringUI.updateEditCategoryOptions();
    
    // Show modal
    const modal = document.getElementById('editRecurringModal');
    modal.classList.add('show');
}

function closeEditRecurringModal() {
    const modal = document.getElementById('editRecurringModal');
    modal.classList.remove('show');
    document.getElementById('editRecurringForm').reset();
}

function closeDeleteRecurringModal() {
    const modal = document.getElementById('deleteRecurringModal');
    modal.classList.remove('show');
}

function deleteRecurringTransaction(id) {
    // Use already loaded data instead of fetching
    const transaction = window.currentRecurringTransactions?.find(t => t.id === id);
    if (!transaction) {
        console.error('Recurring transaction not found in loaded data:', id);
        return;
    }
    
    // Store transaction for deletion
    window.currentDeleteRecurringTransaction = transaction;
    
    // Show transaction details in modal
    const detailsContainer = document.getElementById('deleteRecurringTransactionDetails');
    const formattedAmount = parseFloat(transaction.amount).toFixed(2);
    const sign = transaction.type === 'Income' ? '+' : '-';
    
    detailsContainer.innerHTML = `
        <div class="delete-details-item"><strong>Payee:</strong> ${transaction.payee}</div>
        <div class="delete-details-item"><strong>Category:</strong> ${transaction.category}</div>
        <div class="delete-details-item"><strong>Amount:</strong> ${sign}$${formattedAmount}</div>
        <div class="delete-details-item"><strong>Frequency:</strong> ${RecurringTransactions.getFrequencyText(transaction.frequency)}</div>
        <div class="delete-details-item"><strong>Next Due:</strong> ${new Date(transaction.nextDue).toLocaleDateString()}</div>
    `;
    
    // Show modal
    const modal = document.getElementById('deleteRecurringModal');
    modal.classList.add('show');
}

async function handleDeleteRecurring() {
    const transaction = window.currentDeleteRecurringTransaction;
    if (!transaction) return;
    
    const deleteBtn = document.getElementById('confirmDeleteRecurringBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    try {
        const success = await RecurringTransactions.delete(transaction.id);
        
        if (success) {
            // Clear cache since recurring data has changed
            if (window.DataCache) {
                DataCache.clearRecurringCache();
                DataCache.clearChartCache();
            }
            
            showSuccessCheckmark(I18n.t('success.recurringDeleted'));
            closeDeleteRecurringModal();
            
            // Refresh data from server to ensure UI is updated
            await RecurringUI.loadRecurringList();
        } else {
            alert(I18n.t('error.recurringDeleteFailed'));
        }
    } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        alert(I18n.t('error.recurringDeleteFailed'));
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
    }
}

// Note: processRecurringTransactions function removed - automatic processing now enabled

/**
 * Show error message using the success modal but with error styling
 */
function showErrorMessage(message = 'An error occurred. Please try again.') {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    const svg = modal.querySelector('svg');
    
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = '#dc3545';
    }
    
    // Change checkmark to error icon
    if (svg) {
        svg.innerHTML = `
            <circle cx="50" cy="50" r="45" fill="none" stroke="#dc3545" stroke-width="4"/>
            <line x1="35" y1="35" x2="65" y2="65" stroke="#dc3545" stroke-width="4" stroke-linecap="round"/>
            <line x1="65" y1="35" x2="35" y2="65" stroke="#dc3545" stroke-width="4" stroke-linecap="round"/>
        `;
    }
    
    modal.classList.add('show');
    
    // Hide modal after 2.5 seconds (longer for error messages)
    setTimeout(() => {
        modal.classList.remove('show');
        
        // Reset styles back to success
        if (messageElement) {
            messageElement.style.color = '';
        }
        if (svg) {
            svg.innerHTML = `
                <circle cx="50" cy="50" r="45" fill="none" stroke="#28a745" stroke-width="4"/>
                <path d="M 30 50 L 45 65 L 70 35" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        }
    }, 2500);
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if recurring UI elements exist
    if (document.getElementById('recurringList')) {
        RecurringUI.init();
    }
});