// Utility Functions

/**
 * JSONP helper to bypass CORS
 */
function fetchJSONP(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonpCallback_' + Math.random().toString(36).substr(2, 9);
        
        // Define the callback on window FIRST
        window[callbackName] = function(data) {
            // Cleanup
            delete window[callbackName];
            const script = document.querySelector('script[data-callback="' + callbackName + '"]');
            if (script) {
                script.remove();
            }
            resolve(data);
        };
        
        // Create and configure script tag
        const script = document.createElement('script');
        script.setAttribute('data-callback', callbackName);
        script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
        
        script.onerror = function() {
            delete window[callbackName];
            script.remove();
            reject(new Error('JSONP request failed'));
        };
        
        // Timeout fallback
        const timeout = setTimeout(() => {
            delete window[callbackName];
            script.remove();
            reject(new Error('JSONP request timeout'));
        }, window.CONFIG.jsonpTimeout);
        
        // Override resolve to clear timeout
        const originalResolve = resolve;
        window[callbackName].__resolve = function(data) {
            clearTimeout(timeout);
            originalResolve(data);
        };
        
        // Update callback to use the timeout-aware resolve
        window[callbackName] = function(data) {
            clearTimeout(timeout);
            delete window[callbackName];
            const script = document.querySelector('script[data-callback="' + callbackName + '"]');
            if (script) {
                script.remove();
            }
            resolve(data);
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Update day of week based on date input
 */
function updateDay() {
    const dayKeys = [
        'common.days.sunday',
        'common.days.monday',
        'common.days.tuesday',
        'common.days.wednesday',
        'common.days.thursday',
        'common.days.friday',
        'common.days.saturday'
    ];
    const dateInput = document.getElementById('date');
    const dayInput = document.getElementById('dayOfWeek');
    const d = new Date(dateInput.value);
    dayInput.value = I18n.t(dayKeys[d.getDay()]);
}

/**
 * Generate colors for charts
 */
function generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
        '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
    ];
    
    // Cycle through colors if we need more than available
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

/**
 * Format a date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Function to open the spreadsheet
 */
function openSpreadsheet() {
    window.open(window.CONFIG.spreadsheetURL, '_blank');
}
