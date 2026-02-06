// Obfuscation and Privacy Module

/**
 * Setup obfuscate button
 */
function setupObfuscateButton() {
    const obfuscateBtn = document.getElementById('obfuscateBtn');
    if (obfuscateBtn) {
        // Obfuscate by default on first access, unless explicitly deobfuscated
        const obfuscateMode = localStorage.getItem('obfuscateMode');
        const isObfuscated = obfuscateMode !== 'false'; // Default to obfuscated unless explicitly set to 'false'
        if (isObfuscated) {
            document.body.classList.add('obfuscate-mode');
            obfuscateBtn.textContent = '👁️‍🗨️';
            obfuscateBtn.title = 'Show sensitive information';
            disableAccountAndSubmit();
        }
        
        obfuscateBtn.addEventListener('click', toggleObfuscate);
    }
}

/**
 * Disable account field and submit button
 */
function disableAccountAndSubmit() {
    const accountField = document.getElementById('account');
    const submitBtn = document.getElementById('submitBtn');
    const viewSpreadsheetBtn = document.getElementById('viewSpreadsheetBtn');
    if (accountField) {
        accountField.disabled = true;
    }
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
    if (viewSpreadsheetBtn) {
        viewSpreadsheetBtn.disabled = true;
        viewSpreadsheetBtn.style.opacity = '0.5';
        viewSpreadsheetBtn.style.cursor = 'not-allowed';
    }
    
    // Disable all action buttons (edit and delete)
    disableActionButtons();
}

/**
 * Enable account field and submit button
 */
function enableAccountAndSubmit() {
    const accountField = document.getElementById('account');
    const submitBtn = document.getElementById('submitBtn');
    const viewSpreadsheetBtn = document.getElementById('viewSpreadsheetBtn');
    if (accountField) {
        accountField.disabled = false;
    }
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
    if (viewSpreadsheetBtn) {
        viewSpreadsheetBtn.disabled = false;
        viewSpreadsheetBtn.style.opacity = '1';
        viewSpreadsheetBtn.style.cursor = 'pointer';
    }
    
    // Enable all action buttons (edit and delete)
    enableActionButtons();
}

/**
 * Toggle obfuscation mode
 */
function toggleObfuscate() {
    const isCurrentlyObfuscated = document.body.classList.contains('obfuscate-mode');
    
    if (isCurrentlyObfuscated) {
        deactivateObfuscation();
    } else {
        activateObfuscation();
    }
}

/**
 * Activate obfuscation mode
 */
function activateObfuscation() {
    const obfuscateBtn = document.getElementById('obfuscateBtn');
    document.body.classList.add('obfuscate-mode');
    localStorage.setItem('obfuscateMode', 'true');
    obfuscateBtn.textContent = '👁️‍🗨️';
    obfuscateBtn.title = 'Show sensitive information';
    disableAccountAndSubmit();
    
    // Refresh settings page if it's currently active
    if (document.getElementById('settingsPage')?.classList.contains('active')) {
        loadSettingsPage();
    }
}

/**
 * Deactivate obfuscation mode
 */
function deactivateObfuscation() {
    const obfuscateBtn = document.getElementById('obfuscateBtn');
    document.body.classList.remove('obfuscate-mode');
    localStorage.setItem('obfuscateMode', 'false');
    obfuscateBtn.textContent = '👁️';
    obfuscateBtn.title = 'Hide sensitive information';
    enableAccountAndSubmit();
    
    // Refresh settings page if it's currently active
    if (document.getElementById('settingsPage')?.classList.contains('active')) {
        loadSettingsPage();
    }
}



/**
 * Disable edit and delete action buttons
 */
function disableActionButtons() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    editButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.3';
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';
    });
    
    deleteButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.3';
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';
    });
}

/**
 * Enable edit and delete action buttons
 */
function enableActionButtons() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    editButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
    });
    
    deleteButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
    });
}
