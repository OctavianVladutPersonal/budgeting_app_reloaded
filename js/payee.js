// Payee Management Module

/**
 * Load payee history from sheet and local storage
 */
async function loadPayeeHistory() {
    try {
        // Use JSONP to bypass CORS
        const data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getPayees');
        
        if (data && data.payees) {
            const payeeMap = data.payees;
            localStorage.setItem('payeeMap', JSON.stringify(payeeMap));
            updatePayeeDatalist(Object.keys(payeeMap));
            return;
        }
    } catch (error) {
        // Could not fetch from sheet, using local data
    }
    
    // Fallback to local storage if sheet fetch fails
    const payeeMap = JSON.parse(localStorage.getItem('payeeMap')) || {};
    updatePayeeDatalist(Object.keys(payeeMap));
}

/**
 * Update payee datalist with available payees
 */
function updatePayeeDatalist(payees) {
    const datalist = document.getElementById('payeeList');
    datalist.innerHTML = '';
    const uniquePayees = [...new Set(payees)].sort();
    uniquePayees.forEach(payee => {
        if (payee.trim()) {
            const option = document.createElement('option');
            option.value = payee;
            datalist.appendChild(option);
        }
    });
}

/**
 * Add payee to history with associated category
 */
function addPayeeToHistory(payee, category) {
    if (!payee.trim()) return;
    const payeeMap = JSON.parse(localStorage.getItem('payeeMap')) || {};
    payeeMap[payee] = category;
    localStorage.setItem('payeeMap', JSON.stringify(payeeMap));
    updatePayeeDatalist(Object.keys(payeeMap));
}

/**
 * Set category based on selected payee
 */
function setPayeeCategory() {
    const payeeInput = document.getElementById('payee').value;
    const payeeMap = JSON.parse(localStorage.getItem('payeeMap')) || {};
    if (payeeMap[payeeInput]) {
        document.getElementById('category').value = payeeMap[payeeInput];
    }
}

/**
 * Show payee suggestions dropdown
 */
function showPayeeSuggestions() {
    const input = document.getElementById('payee').value.toLowerCase().trim();
    const suggestionsDiv = document.getElementById('payeeSuggestions');
    const payeeMap = JSON.parse(localStorage.getItem('payeeMap')) || {};
    
    if (!input) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    const matches = Object.keys(payeeMap).filter(payee => 
        payee.toLowerCase().includes(input)
    ).sort();
    
    if (matches.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    suggestionsDiv.innerHTML = '';
    matches.forEach(payee => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.textContent = payee;
        suggestion.addEventListener('click', () => {
            document.getElementById('payee').value = payee;
            setPayeeCategory();
            suggestionsDiv.style.display = 'none';
        });
        suggestion.addEventListener('mouseover', () => {
            suggestion.style.background = '#f0f0f0';
        });
        suggestion.addEventListener('mouseout', () => {
            suggestion.style.background = 'white';
        });
        suggestionsDiv.appendChild(suggestion);
    });
    
    suggestionsDiv.style.display = 'block';
}

/**
 * Setup payee-related event listeners
 */
function setupPayeeListeners() {
    const payeeInput = document.getElementById('payee');
    payeeInput.addEventListener('change', setPayeeCategory);
    payeeInput.addEventListener('input', () => {
        showPayeeSuggestions();
        setTimeout(setPayeeCategory, 100);
    });
    payeeInput.addEventListener('focus', showPayeeSuggestions);
    
    // Click outside suggestions to hide them
    document.addEventListener('click', (e) => {
        const suggestionsDiv = document.getElementById('payeeSuggestions');
        if (!e.target.closest('#payee') && !e.target.closest('#payeeSuggestions')) {
            suggestionsDiv.style.display = 'none';
        }
    });
}
