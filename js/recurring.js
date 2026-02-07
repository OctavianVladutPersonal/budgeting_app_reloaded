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
                endDate: transaction.endDate || ''
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
            if (transaction.endDate && transaction.endDate < today) return false;
            return transaction.nextDue <= today;
        });
    }
    
    /**
     * Get active recurring transactions count
     */
    static async getActiveCount() {
        const transactions = await this.getAll();
        const today = new Date().toISOString().split('T')[0];
        return transactions.filter(t => (!t.endDate || t.endDate >= today)).length;
    }
    
    /**
     * Mark a recurring transaction as processed and update next due date
     */
    static async markAsProcessed(id) {
        const transaction = await this.getById(id);
        if (!transaction) return false;
        
        const nextDue = this.calculateNextDueDate(transaction.nextDue, transaction.frequency);
        
        return await this.update(id, {
            lastProcessed: new Date().toISOString(),
            nextDue: nextDue
        });
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
        
        if (transaction.nextDue < today) {
            status = 'overdue';
        } else if (transaction.nextDue === today) {
            status = 'due';
        }
        
        return {
            ...transaction,
            status,
            formattedAmount: parseFloat(transaction.amount).toFixed(2),
            frequencyText: this.getFrequencyText(transaction.frequency),
            nextDueFormatted: new Date(transaction.nextDue).toLocaleDateString(),
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
        this.loadRecurringStats();
        this.loadRecurringList();
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
        }
        
        // Recurring start date change
        const startDateInput = document.getElementById('recurringStartDate');
        if (startDateInput) {
            startDateInput.addEventListener('change', this.updateNextDueDate);
        }
        
        // Modal forms
        const addRecurringForm = document.getElementById('addRecurringForm');
        if (addRecurringForm) {
            addRecurringForm.addEventListener('submit', this.handleAddRecurring);
        }
        
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
            descElement.textContent = 'Please select frequency and start date.';
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
        const nextDueDateInput = document.getElementById('nextDueDate');
        
        if (frequency && startDate) {
            const nextDue = RecurringTransactions.calculateNextDueDate(startDate, frequency);
            nextDueDateInput.value = nextDue;
        }
    }
    
    /**
     * Handle adding a recurring transaction
     */
    static async handleAddRecurring(event) {
        event.preventDefault();
        
        const transaction = {
            amount: parseFloat(document.getElementById('recurringModalAmount').value),
            payee: document.getElementById('recurringModalPayee').value,
            category: document.getElementById('recurringModalCategory').value,
            notes: document.getElementById('recurringModalNotes').value,
            account: document.getElementById('recurringModalAccount').value,
            type: document.getElementById('recurringModalType').value,
            frequency: document.getElementById('recurringModalFrequency').value,
            startDate: document.getElementById('recurringModalStartDate').value,
            endDate: document.getElementById('recurringModalEndDate').value || null
        };
        
        const result = await RecurringTransactions.add(transaction);
        
        if (result) {
            showSuccessCheckmark('Recurring transaction created successfully!');
            document.getElementById('addRecurringForm').reset();
            closeAddRecurringModal();
            await RecurringUI.loadRecurringStats();
            await RecurringUI.loadRecurringList();
        } else {
            alert('Error creating recurring transaction. Please try again.');
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
            showSuccessCheckmark('Recurring transaction updated successfully!');
            
            // Refresh data after modal closes
            setTimeout(() => {
                RecurringUI.loadRecurringStats();
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
     * Load and display recurring transaction statistics
     */
    static async loadRecurringStats() {
        try {
            const activeCount = await RecurringTransactions.getActiveCount();
            const dueTransactions = await RecurringTransactions.getDueTransactions();
            
            const activeElement = document.getElementById('activeRecurringCount');
            const dueElement = document.getElementById('dueRecurringCount');
            
            if (activeElement) activeElement.textContent = activeCount;
            if (dueElement) dueElement.textContent = dueTransactions.length;
        } catch (error) {
            console.error('Error loading recurring stats:', error);
            
            const activeElement = document.getElementById('activeRecurringCount');
            const dueElement = document.getElementById('dueRecurringCount');
            
            if (activeElement) activeElement.textContent = '?';
            if (dueElement) dueElement.textContent = '?';
        }
    }
    
    /**
     * Load and display recurring transactions list
     */
    static async loadRecurringList() {
        const tbody = document.getElementById('recurringTransactionsBody');
        
        if (!tbody) return;
        
        // Show loading state
        tbody.innerHTML = '<tr><td colspan=\"8\" style=\"text-align: center; color: #999;\">Loading recurring transactions...</td></tr>';
        
        try {
            const transactions = await RecurringTransactions.getAll();
            
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan=\"8\" style=\"text-align: center; color: #999;\">No recurring transactions set up yet.<br><small>Create one by adding a transaction and checking \"Make this a recurring transaction\"</small></td></tr>';
                return;
            }
            
            // Store transactions globally for editing
            window.currentRecurringTransactions = transactions;
            
            const html = transactions.map((transaction, index) => {
                const formatted = RecurringTransactions.formatForDisplay(transaction);
                const amountClass = transaction.type === 'Income' ? 'income' : 'expense';
                const sign = transaction.type === 'Income' ? '+' : '-';
                
                return `
                    <tr>
                        <td class=\"sensitive-data\">${transaction.payee}</td>
                        <td>${transaction.category}</td>
                        <td class=\"amount sensitive-data ${amountClass}\">
                            ${sign}${formatted.formattedAmount}
                        </td>
                        <td>${transaction.type}</td>
                        <td>${formatted.frequencyText}</td>
                        <td>${formatted.nextDueFormatted}</td>
                        <td>
                            <span class=\"status-badge status-${formatted.status}\">${formatted.status}</span>
                        </td>
                        <td class=\"action-buttons\">
                            <button type=\"button\" class=\"edit-btn\" onclick=\"openEditRecurringModal('${transaction.id}')\" title=\"Edit recurring transaction\">✏️</button>
                            <button type=\"button\" class=\"delete-btn\" onclick=\"deleteRecurringTransaction('${transaction.id}')\" title=\"Delete recurring transaction\">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            tbody.innerHTML = html;
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
            
            // Update stats from the loaded data
            this.updateStatsFromTransactionData(transactions);
            
            // Update the transaction list display
            this.displayTransactionList(transactions);
            
        } catch (error) {
            console.error('Error loading recurring data:', error);
            
            // Show error states
            const activeElement = document.getElementById('activeRecurringCount');
            const dueElement = document.getElementById('dueRecurringCount');
            if (activeElement) activeElement.textContent = '?';
            if (dueElement) dueElement.textContent = '?';
            
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #dc3545;">Error loading recurring transactions.<br><small>Please check your connection and try refreshing the page.</small></td></tr>';
            }
        }
    }
    
    /**
     * Update stats from transaction data
     */
    static updateStatsFromTransactionData(transactions) {
        const activeCount = transactions.filter(t => t.isActive !== false).length;
        const dueTransactions = transactions.filter(t => {
            if (!t.nextDue) return false;
            const nextDueDate = new Date(t.nextDue);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return nextDueDate <= today;
        });
        
        const activeElement = document.getElementById('activeRecurringCount');
        const dueElement = document.getElementById('dueRecurringCount');
        
        if (activeElement) activeElement.textContent = activeCount;
        if (dueElement) dueElement.textContent = dueTransactions.length;
    }
    
    /**
     * Display transaction list from loaded data
     */
    static displayTransactionList(transactions) {
        const tbody = document.getElementById('recurringTransactionsBody');
        if (!tbody) return;
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No recurring transactions set up yet.<br><small>Create one by adding a transaction and checking "Make this a recurring transaction"</small></td></tr>';
            return;
        }
        
        // Store transactions globally for editing
        window.currentRecurringTransactions = transactions;
        
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
     * Update stats display from local data (for backward compatibility and local updates)
     */
    static updateStatsFromLocalData() {
        if (!window.currentRecurringTransactions) return;
        
        this.updateStatsFromTransactionData(window.currentRecurringTransactions);
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
            
            // If Account was selected, switch to Groceries
            if (categorySelect.value === 'Account') {
                categorySelect.value = 'Groceries';
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
            
            // If Account was selected, switch to Groceries
            if (categorySelect.value === 'Account') {
                categorySelect.value = 'Groceries';
            }
        }
    }
}

/**
 * Processing recurring transactions
 */
class RecurringProcessor {
    /**
     * Process all due recurring transactions
     */
    static async processAllDue() {
        const dueTransactions = await RecurringTransactions.getDueTransactions();
        
        if (dueTransactions.length === 0) {
            showSuccessCheckmark('No recurring transactions are currently due.');
            return;
        }
        
        const processBtn = document.getElementById('processRecurringBtn');
        if (processBtn) {
            processBtn.disabled = true;
            processBtn.textContent = '⏳ Processing...';
        }
        
        let successCount = 0;
        let errors = [];
        
        for (const recurringTransaction of dueTransactions) {
            try {
                const success = await this.processRecurringTransaction(recurringTransaction);
                if (success) {
                    successCount++;
                    // Small delay to ensure transaction is properly added to spreadsheet
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await RecurringTransactions.markAsProcessed(recurringTransaction.id);
                } else {
                    errors.push(`Failed to process: ${recurringTransaction.payee}`);
                }
            } catch (error) {
                console.error('Error processing recurring transaction:', error);
                errors.push(`Error with ${recurringTransaction.payee}: ${error.message}`);
            }
        }
        
        // Re-enable button
        if (processBtn) {
            processBtn.disabled = false;
            processBtn.textContent = '🔄 Process Due';
        }
        
        // Show results
        let message = `Processed ${successCount} of ${dueTransactions.length} recurring transactions.`;
        if (errors.length > 0) {
            message += '\n\nErrors:\n' + errors.join('\n');
        }
        
        showSuccessCheckmark(message);
        
        // Refresh UI
        await RecurringUI.loadRecurringStats();
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
function openAddRecurringModal() {
    // Ensure account dropdown is populated before opening modal
    const accountSelect = document.getElementById('recurringModalAccount');
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
    
    const modal = document.getElementById('addRecurringModal');
    modal.classList.add('show');
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
            
            showSuccessCheckmark('Recurring transaction deleted successfully!');
            closeDeleteRecurringModal();
            
            // Refresh data from server to ensure UI is updated
            await RecurringUI.loadRecurringStats();
            await RecurringUI.loadRecurringList();
        } else {
            alert('Error deleting recurring transaction. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        alert('Error deleting recurring transaction. Please try again.');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
    }
}

function processRecurringTransactions() {
    RecurringProcessor.processAllDue();
}

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