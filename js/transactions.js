// Transaction Management Module

/**
 * Load and display recent transactions with caching
 */
async function loadRecentTransactions(forceRefresh = false) {
    const tbody = document.getElementById('transactionsBody');
    
    // Get translated messages
    const loadingMsg = window.I18n ? I18n.t('transactions.loading', 'Loading transactions...') : 'Loading transactions...';
    const emptyMsg = window.I18n ? I18n.t('transactions.empty', 'No transactions found.') : 'No transactions found.';
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh && window.DataCache) {
        const cachedData = DataCache.getCachedTransactions();
        if (cachedData) {
            // Parse cached data the same way as fresh data
            let transactions = null;
            
            if (Array.isArray(cachedData)) {
                transactions = cachedData;
            } else if (cachedData && cachedData.transactions && Array.isArray(cachedData.transactions)) {
                transactions = cachedData.transactions;
            } else if (cachedData && typeof cachedData === 'object') {
                const keys = Object.keys(cachedData);
                if (keys.length > 0 && Array.isArray(cachedData[keys[0]])) {
                    transactions = cachedData[keys[0]];
                }
            }
            
            if (transactions && transactions.length > 0) {
                displayRecentTransactions(transactions);
                return Promise.resolve();
            } else {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999;">${emptyMsg}</td></tr>`;
                return Promise.resolve();
            }
        }
    }
    
    // Show loading state
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #666;">${loadingMsg}</td></tr>`;
    
    try {
        const data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getTransactions');
        
        // Cache the received data
        if (window.DataCache && data) {
            DataCache.setCachedTransactions(data);
        }
        
        // Handle different data formats
        let transactions = null;
        
        if (Array.isArray(data)) {
            // Data is directly an array
            transactions = data;
        } else if (data && data.transactions && Array.isArray(data.transactions)) {
            // Data has transactions property
            transactions = data.transactions;
        } else if (data && typeof data === 'object') {
            // Data might be an object with array values
            const keys = Object.keys(data);
            if (keys.length > 0 && Array.isArray(data[keys[0]])) {
                transactions = data[keys[0]];
            }
        }
        
        if (transactions && transactions.length > 0) {
            displayRecentTransactions(transactions);
            return Promise.resolve();
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999;">${emptyMsg}</td></tr>`;
            return Promise.resolve();
        }
    } catch (error) {
        console.error('Could not fetch transactions from sheet:', error);
    }
    
    // Show fallback message if fetch fails
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #999;">${emptyMsg}</td></tr>`;
    return Promise.resolve();
}

/**
 * Display recent transactions in the table
 */
function displayRecentTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');
    const emptyMsg = window.I18n ? I18n.t('transactions.empty', 'No transactions found.') : 'No transactions found.';
    
    // Get last 5 transactions (assuming they come in order, reverse if needed)
    const recentTransactions = transactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #999;">${emptyMsg}</td></tr>`;
        return;
    }
    
    // Store transactions globally for editing - rely on backend-provided rowIndex
    window.currentTransactions = recentTransactions.map((transaction, index) => {        
        return {
            ...transaction,
            // Use backend-provided identifier if available, otherwise mark as invalid
            rowIndex: transaction.rowIndex || transaction.row || null
        };
    });
    
    tbody.innerHTML = window.currentTransactions.map((transaction, index) => {
        // Format date to YYYY-MM-DD - try multiple property name variations
        // Handle malformed property names (e.g., space character " ")
        let formattedDate = '-';
        const dateValue = transaction.Date || transaction.date || transaction.d || transaction.D || transaction[' '];
        
        if (dateValue && dateValue !== '') {
            if (typeof dateValue === 'string') {
                if (dateValue.includes('T')) {
                    // ISO format: convert to local date to account for timezone
                    // Create date object and get the local date
                    const dateObj = new Date(dateValue);
                    if (!isNaN(dateObj.getTime())) {
                        // Use toLocaleDateString to convert to YYYY-MM-DD in local timezone
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        formattedDate = `${year}-${month}-${day}`;
                    } else {
                        formattedDate = dateValue;
                    }
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    // Already in correct format
                    formattedDate = dateValue;
                } else if (dateValue.length > 0) {
                    // Try to parse and reformat
                    try {
                        const parsedDate = new Date(dateValue + 'T00:00:00');
                        if (!isNaN(parsedDate.getTime())) {
                            const year = parsedDate.getFullYear();
                            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                            const day = String(parsedDate.getDate()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day}`;
                        } else {
                            formattedDate = dateValue;
                        }
                    } catch(e) {
                        formattedDate = dateValue;
                    }
                }
            } else if (typeof dateValue === 'number') {
                // Timestamp: convert to local date
                const dateObj = new Date(dateValue);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
        }
        
        // Handle different property name cases (Date vs date, etc.)
        const payee = transaction.Payee || transaction.payee || '-';
        const category = transaction.Category || transaction.category || '-';
        const amount = transaction.Amount || transaction.amount || 0;
        const type = transaction.Type || transaction.type || 'Expense';
        const account = transaction.Account || transaction.account || '-';
        
        // Translate category and type if I18n is available
        const translatedCategory = window.I18n ? I18n.translateCategory(category) : category;
        const translatedType = window.I18n ? I18n.translateType(type) : type;
        
        return `
        <tr>
            <td>${formattedDate}</td>
            <td class="sensitive-data">${payee}</td>
            <td>${translatedCategory}</td>
            <td class="amount sensitive-data ${type === 'Income' ? 'income' : 'expense'}">
                ${type === 'Income' ? '+' : '-'}${parseFloat(amount).toFixed(2)}
            </td>
            <td>${translatedType}</td>
            <td class="sensitive-data">${account}</td>
            <td class="action-buttons">
                <button type="button" class="edit-btn" onclick="openEditModal(${index})" title="Edit transaction">✏️</button>
                <button type="button" class="delete-btn" onclick="openDeleteModal(${index})" title="Delete transaction">🗑️</button>
            </td>
        </tr>
    `;
    }).join('');
    
    // Apply obfuscation state to newly rendered buttons
    const isObfuscated = document.body.classList.contains('obfuscate-mode');
    if (isObfuscated && typeof disableActionButtons === 'function') {
        // Use setTimeout to ensure buttons are in DOM
        setTimeout(() => disableActionButtons(), 0);
    }
    
    // Update charts with new data if charts module is available
    if (typeof updateCharts === 'function') {
        updateCharts();
    }
}

/**
 * Refresh transactions list
 */
function refreshTransactions() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Clear cache to force fresh data
    if (window.DataCache) {
        DataCache.clearAllCache();
    }
    
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    loadRecentTransactions(true).finally(() => { // Force refresh
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    });
}

/**
 * Setup refresh button
 */
function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshTransactions);
    }
}

/**
 * Open edit modal with transaction data
 */
function openEditModal(transactionIndex) {
    const transaction = window.currentTransactions[transactionIndex];
    if (!transaction) {
        console.error('Transaction not found at index:', transactionIndex);
        
        // Try refreshing data first in case it's stale
        loadRecentTransactions(true).then(() => {
            const refreshedTransaction = window.currentTransactions[transactionIndex];
            if (refreshedTransaction) {
                setTimeout(() => openEditModal(transactionIndex), 100);
            } else {
                alert(I18n.t('error.transactionNotFound'));
            }
        });
        return;
    }
    
    // Additional validation for rowIndex
    if (!transaction.rowIndex || isNaN(transaction.rowIndex) || transaction.rowIndex <= 0) {
        console.error('Invalid or missing rowIndex for transaction:', transaction);
        alert(I18n.t('error.transactionNoId'));
        return;
    }
    
    // Store the row index for reference
    document.getElementById('editRowIndex').value = transaction.rowIndex || '';
    
    // Populate form fields - handle both uppercase and lowercase property names
    const amount = transaction.Amount || transaction.amount || '';
    const payee = transaction.Payee || transaction.payee || '';
    const categorySelect = document.getElementById('editCategory');
    const firstCategory = categorySelect ? (Array.from(categorySelect.options).find(opt => !opt.hasAttribute('data-income-only'))?.value || '') : '';
    const category = transaction.Category || transaction.category || firstCategory;
    const notes = transaction.Notes || transaction.notes || '';
    const account = transaction.Account || transaction.account || 'Ale';
    const type = transaction.Type || transaction.type || 'Expense';
    
    document.getElementById('editAmount').value = amount;
    document.getElementById('editPayee').value = payee;
    document.getElementById('editCategory').value = category;
    document.getElementById('editNotes').value = notes;
    
    // Format and set date - handle both property name cases
    let dateValue = '';
    const dateSource = transaction.Date || transaction.date;
    if (dateSource) {
        if (typeof dateSource === 'string' && dateSource.includes('T')) {
            dateValue = dateSource.split('T')[0];
        } else if (typeof dateSource === 'number') {
            dateValue = new Date(dateSource).toISOString().split('T')[0];
        } else {
            dateValue = dateSource;
        }
    }
    document.getElementById('editDate').value = dateValue;
    
    // Update day of week
    updateEditDay();
    
    document.getElementById('editAccount').value = account;
    document.getElementById('editType').value = type;
    
    // Show modal
    document.getElementById('editModal').classList.add('show');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    document.getElementById('editTransactionForm').reset();
}

/**
 * Update day of week in edit form
 */
function updateEditDay() {
    const dateInput = document.getElementById('editDate');
    const dayInput = document.getElementById('editDayOfWeek');
    const dateValue = dateInput.value;
    
    if (dateValue) {
        const date = new Date(dateValue + 'T00:00:00');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayInput.value = days[date.getDay()];
    } else {
        dayInput.value = '';
    }
}

/**
 * Handle edit form submission
 */
function handleEditFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";
    
    const rowIndex = document.getElementById('editRowIndex').value;
    
    // Validate that we have a row index
    if (!rowIndex || isNaN(rowIndex) || parseInt(rowIndex) <= 0) {
        console.error('Invalid row index found - cannot update transaction. RowIndex:', rowIndex);
        alert(I18n.t('error.transactionIdentifyFailed'));
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
        return;
    }
    
    const payload = {
        operation: 'update',
        rowIndex: parseInt(rowIndex),
        date: document.getElementById('editDate').value,
        dayOfWeek: document.getElementById('editDayOfWeek').value,
        type: document.getElementById('editType').value,
        amount: parseFloat(document.getElementById('editAmount').value),
        category: document.getElementById('editCategory').value,
        account: document.getElementById('editAccount').value,
        payee: document.getElementById('editPayee').value,
        notes: document.getElementById('editNotes').value
    };
    
    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(response => {
        
        // Clear cache since data has changed
        if (window.DataCache) {
            DataCache.clearTransactionCache();
            DataCache.clearChartCache();
        }
        
        // Show success modal
        showSuccessCheckmark(I18n.t('success.transactionUpdated'));
        
        setTimeout(() => {
            closeEditModal();
            saveBtn.disabled = false;
            saveBtn.innerText = "Save Changes";
            
            // Refresh transactions table
            if (typeof loadRecentTransactions === 'function') {
                loadRecentTransactions(true); // Force refresh after edit
            }
        }, 2500);
    })
    .catch(error => {
        console.error('Error updating transaction:', error);
        alert(I18n.t('error.transactionUpdateFailed'));
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Changes";
    });
}

/**
 * Setup edit modal event listeners
 */
function setupEditModalListeners() {
    // Date change listener
    const editDateInput = document.getElementById('editDate');
    if (editDateInput) {
        editDateInput.addEventListener('change', updateEditDay);
    }
    
    // Form submit listener
    const editForm = document.getElementById('editTransactionForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(transactionIndex) {
    const transaction = window.currentTransactions[transactionIndex];
    if (!transaction) {
        console.error('Transaction not found at index:', transactionIndex);
        return;
    }
    
    // Validate rowIndex before allowing delete
    if (!transaction.rowIndex || isNaN(transaction.rowIndex) || transaction.rowIndex <= 0) {
        console.error('Invalid rowIndex for deletion:', transaction);
        alert(I18n.t('error.transactionDeleteNoId'));
        return;
    }
    
    // Store transaction data for deletion
    window.deleteTransactionData = {
        index: transactionIndex,
        rowIndex: transaction.rowIndex
    };
    
    // Format date - handle both property name cases
    let formattedDate = '-';
    const dateSource = transaction.Date || transaction.date;
    if (dateSource) {
        if (typeof dateSource === 'string' && dateSource.includes('T')) {
            formattedDate = dateSource.split('T')[0];
        } else if (typeof dateSource === 'number') {
            formattedDate = new Date(dateSource).toISOString().split('T')[0];
        } else {
            formattedDate = dateSource;
        }
    }
    
    // Handle both uppercase and lowercase property names
    const payee = transaction.Payee || transaction.payee || '-';
    const amount = transaction.Amount || transaction.amount || 0;
    const category = transaction.Category || transaction.category || '-';
    const type = transaction.Type || transaction.type || 'Expense';
    
    // Display transaction details in modal
    const detailsElement = document.getElementById('deleteTransactionDetails');
    detailsElement.innerHTML = `
        <div class="delete-detail-row"><strong>Date:</strong> ${formattedDate}</div>
        <div class="delete-detail-row"><strong>Payee:</strong> ${payee}</div>
        <div class="delete-detail-row"><strong>Amount:</strong> ${type === 'Income' ? '+' : '-'}${parseFloat(amount).toFixed(2)}</div>
        <div class="delete-detail-row"><strong>Category:</strong> ${category}</div>
    `;
    
    // Show modal
    document.getElementById('deleteModal').classList.add('show');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    window.deleteTransactionData = null;
}

/**
 * Handle transaction deletion
 */
function handleDelete() {
    if (!window.deleteTransactionData) {
        console.error('No delete transaction data found');
        return;
    }
    
    // Validate that we have a row index
    if (!window.deleteTransactionData.rowIndex || isNaN(window.deleteTransactionData.rowIndex) || parseInt(window.deleteTransactionData.rowIndex) <= 0) {
        console.error('Invalid row index found - cannot delete transaction. RowIndex:', window.deleteTransactionData.rowIndex);
        alert(I18n.t('error.transactionDeleteIdentifyFailed'));
        return;
    }
    
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.innerText = "Deleting...";
    
    const payload = {
        operation: 'delete',
        rowIndex: parseInt(window.deleteTransactionData.rowIndex)
    };
    
    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(response => {
        
        // Clear cache since data has changed
        if (window.DataCache) {
            DataCache.clearTransactionCache();
            DataCache.clearChartCache();
        }
        
        // Show success modal
        showSuccessCheckmark(I18n.t('success.transactionDeleted'));
        
        setTimeout(() => {
            closeDeleteModal();
            deleteBtn.disabled = false;
            deleteBtn.innerText = "Delete";
            
            // Refresh transactions table
            if (typeof loadRecentTransactions === 'function') {
                loadRecentTransactions(true); // Force refresh after delete
            }
        }, 2500);
    })
    .catch(error => {
        console.error('Error deleting transaction:', error);
        alert(I18n.t('error.transactionDeleteFailed'));
        deleteBtn.disabled = false;
        deleteBtn.innerText = "Delete";
    });
}
