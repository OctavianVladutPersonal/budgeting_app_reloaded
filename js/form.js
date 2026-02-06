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
    btn.innerText = "Sending...";

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

    console.log('Sending add payload:', payload);

    fetch(window.CONFIG.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    })
    .then(() => {
        showSuccessCheckmark();
        setTimeout(() => {
            addPayeeToHistory(document.getElementById('payee').value, document.getElementById('category').value);
            document.getElementById('trackerForm').reset();
            dateInput.value = today;
            updateDay();
            btn.disabled = false;
            btn.innerText = "Add Transaction";
            
            // Automatically refresh the transactions table
            if (typeof loadRecentTransactions === 'function') {
                loadRecentTransactions();
            }
        }, 2500);
    })
    .catch(error => console.error('Error!', error.message));
}

/**
 * Show success checkmark modal
 */
function showSuccessCheckmark(message = 'Success! Transaction added!') {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    
    // Set custom message
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    modal.classList.add('show');
    
    // Hide modal after 1.5 seconds
    setTimeout(() => {
        modal.classList.remove('show');
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
}
