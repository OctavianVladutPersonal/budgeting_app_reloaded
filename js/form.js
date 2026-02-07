// Form Handling Module

/**
 * Update category options based on transaction type
 */
function updateCategoryOptions() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const selectedType = typeSelect.value;
    const accountOption = categorySelect.querySelector('option[data-income-only="true"]');
    
    if (selectedType === 'Income') {
        // Auto-set category to Account for Income and disable the field
        categorySelect.value = 'Account';
        categorySelect.disabled = true;
        accountOption.disabled = false;
        accountOption.style.display = 'block';
    } else {
        // Enable category field for Expense and disable Account option
        categorySelect.disabled = false;
        accountOption.disabled = true;
        accountOption.style.display = 'none';
        
        // If Account was selected, switch to Groceries
        if (categorySelect.value === 'Account') {
            categorySelect.value = 'Groceries';
        }
    }
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    
    const isRecurring = document.getElementById('isRecurring').checked;
    
    if (isRecurring) {
        btn.innerText = "Creating Recurring...";
        handleRecurringTransactionSubmit();
    } else {
        btn.innerText = "Sending...";
        handleRegularTransactionSubmit();
    }
}

/**
 * Handle regular (one-time) transaction submission
 */
function handleRegularTransactionSubmit() {
    const dateInput = document.getElementById('date');
    const dayInput = document.getElementById('dayOfWeek');
    const today = new Date().toISOString().split('T')[0];

    const payload = {
        operation: 'add',
        date: dateInput.value,
        dayOfWeek: dayInput.value,
        type: document.getElementById('type').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        account: document.getElementById('account').value,
        payee: document.getElementById('payee').value,
        notes: document.getElementById('notes').value
    };

    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(() => {
        // Clear cache since data has changed
        if (window.DataCache) {
            DataCache.clearTransactionCache();
            DataCache.clearChartCache();
        }
        
        showSuccessCheckmark();
        setTimeout(() => {
            addPayeeToHistory(document.getElementById('payee').value, document.getElementById('category').value);
            resetForm();
        }, 2500);
    })
    .catch(error => {
        console.error('Error!', error.message);
        resetFormButton();
    });
}

/**
 * Handle recurring transaction submission
 */
async function handleRecurringTransactionSubmit() {
    // Validate recurring fields
    const frequency = document.getElementById('frequency').value;
    const startDate = document.getElementById('recurringStartDate').value;
    
    if (!frequency || !startDate) {
        alert('Please fill in all required recurring transaction fields.');
        resetFormButton();
        return;
    }
    
    const transaction = {
        amount: parseFloat(document.getElementById('amount').value),
        payee: document.getElementById('payee').value,
        category: document.getElementById('category').value,
        notes: document.getElementById('notes').value,
        account: document.getElementById('account').value,
        type: document.getElementById('type').value,
        frequency: frequency,
        startDate: startDate,
        endDate: document.getElementById('recurringEndDate').value || null
    };
    
    try {
        const result = await RecurringTransactions.add(transaction);
        
        if (result) {
            // Clear cache since recurring data has changed
            if (window.DataCache) {
                DataCache.clearRecurringCache();
                DataCache.clearChartCache(); // Charts might show recurring transaction data
            }
            
            let message = 'Recurring transaction created successfully!';
            
            // If start date is today, also process it immediately
            const today = new Date().toISOString().split('T')[0];
            if (startDate === today) {
                // Clear transaction cache too since we're adding a regular transaction
                if (window.DataCache) {
                    DataCache.clearTransactionCache();
                    DataCache.clearChartCache();
                }
                
                try {
                    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    
                    const immediatePayload = {
                        operation: 'add',
                        date: today,
                        dayOfWeek: dayOfWeek,
                        type: transaction.type,
                        amount: transaction.amount,
                        category: transaction.category,
                        account: transaction.account,
                        payee: transaction.payee,
                        notes: `${transaction.notes ? transaction.notes + ' - ' : ''}Recurring ${RecurringTransactions.getFrequencyText(frequency).toLowerCase()}`
                    };
                    
                    await fetch(window.CONFIG.scriptURL, {
                        method: 'POST',
                        mode: 'no-cors',
                        body: JSON.stringify(immediatePayload)
                    });
                    
                    message = 'Recurring transaction created and first payment processed!';
                } catch (error) {
                    console.error('Error processing immediate transaction:', error);
                    message = 'Recurring transaction created, but failed to process first payment.';
                }
            }
            
            showSuccessCheckmark(message);
            setTimeout(() => {
                addPayeeToHistory(document.getElementById('payee').value, document.getElementById('category').value);
                resetForm();
                
                // Refresh transactions if immediate processing occurred
                if (startDate === today && typeof loadRecentTransactions === 'function') {
                    loadRecentTransactions(true); // Force refresh since we added a transaction
                }
            }, 2500);
        } else {
            alert('Error creating recurring transaction. Please try again.');
            resetFormButton();
        }
    } catch (error) {
        console.error('Error creating recurring transaction:', error);
        alert('Error creating recurring transaction. Please try again.');
        resetFormButton();
    }
}

/**
 * Reset form to initial state
 */
function resetForm() {
    const btn = document.getElementById('submitBtn');
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('trackerForm').reset();
    dateInput.value = today;
    updateDay();
    
    // Reset category options based on default type (Expense)
    updateCategoryOptions();
    
    // Hide recurring options
    document.getElementById('recurringOptions').style.display = 'none';
    document.getElementById('isRecurring').checked = false;
    
    resetFormButton();
    
    // Automatically refresh the transactions table
    if (typeof loadRecentTransactions === 'function') {
        loadRecentTransactions();
    }
}

/**
 * Reset form button to original state
 */
function resetFormButton() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = false;
    btn.innerText = "Add Transaction";
}

/**
 * Show success checkmark modal
 */
function showSuccessCheckmark(message = 'Success! Transaction added!') {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    
    if (!modal) {
        console.error('❌ Success modal not found!');
        return;
    }
    
    // Set custom message
    if (messageElement) {
        messageElement.textContent = message;
    } else {
        console.error('❌ Success message element not found!');
    }
    
    // Remove any existing classes and styles to start fresh
    modal.className = 'success-modal show';
    
    // Force maximum visibility with aggressive inline styles
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 1 !important;
        visibility: visible !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        transform: none !important;
    `;
    
    // Hide modal after 1.5 seconds
    setTimeout(() => {
        modal.style.cssText = '';
        modal.className = 'success-modal';
    }, 1500);
}

/**
 * Setup sticky submit button
 */
function setupStickyButton() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    const buttonOffsetTop = submitBtn.offsetTop;

    const handleScroll = () => {
        const viewportBottom = window.scrollY + window.innerHeight;
        
        if (viewportBottom < buttonOffsetTop) {
            // Bottom of screen hasn't reached the button's initial position yet
            submitBtn.classList.add('sticky-submit-btn');
        } else {
            // Bottom of screen has reached or passed the button's initial position
            submitBtn.classList.remove('sticky-submit-btn');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check in case page loads already scrolled
    handleScroll();
}

/**
 * Setup form-related event listeners
 */
function setupFormListeners() {
    // Date change listener
    const dateInput = document.getElementById('date');
    dateInput.addEventListener('change', updateDay);
    
    // Type change listener to manage category options
    document.getElementById('type').addEventListener('change', updateCategoryOptions);
    
    // Form submission
    document.getElementById('trackerForm').addEventListener('submit', handleFormSubmit);
    
    // Initialize recurring UI if elements exist
    if (typeof RecurringUI !== 'undefined' && document.getElementById('isRecurring')) {
        RecurringUI.setupEventListeners();
    }
}
