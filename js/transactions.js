// Transaction Management Module

/**
 * Load and display recent transactions
 */
async function loadRecentTransactions() {
    const tbody = document.getElementById('transactionsBody');
    
    // Show loading animation
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;"><div class="loading-spinner"></div><span style="margin-left: 10px;">Loading transactions...</span></td></tr>';
    
    try {
        console.log('Fetching from:', window.CONFIG.scriptURL + '?action=getTransactions');
        const data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getTransactions');
        console.log('Received data:', data);
        
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
            console.log('No transactions found in data:', data);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No transactions yet</td></tr>';
            return Promise.resolve();
        }
    } catch (error) {
        console.error('Could not fetch transactions from sheet:', error);
    }
    
    // Show fallback message if fetch fails
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Unable to load transactions</td></tr>';
    return Promise.resolve();
}

/**
 * Display recent transactions in the table
 */
function displayRecentTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');
    
    // Get last 5 transactions (assuming they come in order, reverse if needed)
    const recentTransactions = transactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No transactions yet</td></tr>';
        return;
    }
    
    // Store transactions globally for editing and add rowIndex
    // recentTransactions are the last 5 transactions in reverse order
    const startIndexInFullArray = Math.max(0, transactions.length - recentTransactions.length);
    
    window.currentTransactions = recentTransactions.map((transaction, index) => {
        // Calculate rowIndex based on position in full dataset
        // Since recentTransactions is reversed, we need to calculate the correct original position
        const originalIndex = startIndexInFullArray + (recentTransactions.length - 1 - index);
        
        return {
            ...transaction,
            // rowIndex is 1-based for spreadsheet operations (transaction 0 in array = row 1 for backend)
            rowIndex: originalIndex + 1
        };
    });
    
    tbody.innerHTML = window.currentTransactions.map((transaction, index) => {
        // Format date to YYYY-MM-DD
        let formattedDate = '-';
        if (transaction.Date || transaction.date) {
            const dateValue = transaction.Date || transaction.date;
            if (typeof dateValue === 'string' && dateValue.includes('T')) {
                // ISO format: extract just the date part
                formattedDate = dateValue.split('T')[0];
            } else if (typeof dateValue === 'number') {
                // Timestamp: convert to date
                formattedDate = new Date(dateValue).toISOString().split('T')[0];
            } else {
                formattedDate = dateValue;
            }
        }
        
        // Handle different property name cases (Date vs date, etc.)
        const payee = transaction.Payee || transaction.payee || '-';
        const category = transaction.Category || transaction.category || '-';
        const amount = transaction.Amount || transaction.amount || 0;
        const type = transaction.Type || transaction.type || 'Expense';
        const account = transaction.Account || transaction.account || '-';
        
        return `
        <tr>
            <td>${formattedDate}</td>
            <td class="sensitive-data">${payee}</td>
            <td>${category}</td>
            <td class="amount sensitive-data ${type === 'Income' ? 'income' : 'expense'}">
                ${type === 'Income' ? '+' : '-'}${parseFloat(amount).toFixed(2)}
            </td>
            <td>${type}</td>
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
}

/**
 * Refresh transactions list
 */
function refreshTransactions() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    loadRecentTransactions().finally(() => {
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
    console.log('Opening edit modal for transaction index:', transactionIndex);
    console.log('Available transactions:', window.currentTransactions);
    
    const transaction = window.currentTransactions[transactionIndex];
    if (!transaction) {
        console.error('Transaction not found at index:', transactionIndex);
        return;
    }
    
    console.log('Editing transaction:', transaction);
    
    // Store the row index for reference
    document.getElementById('editRowIndex').value = transaction.rowIndex || '';
    
    // Populate form fields - handle both uppercase and lowercase property names
    const amount = transaction.Amount || transaction.amount || '';
    const payee = transaction.Payee || transaction.payee || '';
    const category = transaction.Category || transaction.category || 'Groceries';
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
    if (!rowIndex) {
        console.error('No row index found - cannot update transaction');
        alert('Error: Unable to identify transaction to update. Please try again.');
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
    
    console.log('Sending update payload:', payload);
    
    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('Update response received');
        // Show success modal
        showSuccessCheckmark('Success! Transaction updated!');
        
        setTimeout(() => {
            closeEditModal();
            saveBtn.disabled = false;
            saveBtn.innerText = "Save Changes";
            
            // Refresh transactions table
            if (typeof loadRecentTransactions === 'function') {
                loadRecentTransactions();
            }
        }, 2500);
    })
    .catch(error => {
        console.error('Error updating transaction:', error);
        alert('Error updating transaction. Please try again.');
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
    console.log('Opening delete modal for transaction index:', transactionIndex);
    console.log('Available transactions:', window.currentTransactions);
    
    const transaction = window.currentTransactions[transactionIndex];
    if (!transaction) {
        console.error('Transaction not found at index:', transactionIndex);
        return;
    }
    
    console.log('Deleting transaction:', transaction);
    
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
    if (!window.deleteTransactionData.rowIndex) {
        console.error('No row index found - cannot delete transaction');
        alert('Error: Unable to identify transaction to delete. Please try again.');
        return;
    }
    
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.innerText = "Deleting...";
    
    const payload = {
        operation: 'delete',
        rowIndex: parseInt(window.deleteTransactionData.rowIndex)
    };
    
    console.log('Sending delete payload:', payload);
    
    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('Delete response received');
        // Show success modal
        showSuccessCheckmark('Transaction deleted successfully!');
        
        setTimeout(() => {
            closeDeleteModal();
            deleteBtn.disabled = false;
            deleteBtn.innerText = "Delete";
            
            // Refresh transactions table
            if (typeof loadRecentTransactions === 'function') {
                loadRecentTransactions();
            }
        }, 2500);
    })
    .catch(error => {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please try again.');
        deleteBtn.disabled = false;
        deleteBtn.innerText = "Delete";
    });
}
