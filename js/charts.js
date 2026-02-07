// Charts Module

// Chart instances
let expensesCategoryChart = null;
let expensesVsIncomeChart = null;
let expensesCategoryBarChart = null;
let allTransactions = [];
let chartsInitialized = false;
let isLoadingCharts = false;

/**
 * Check if Chart.js is available and ready
 */
function isChartJsReady() {
    return typeof Chart !== 'undefined' && typeof Chart.register === 'function';
}

/**
 * Wait for Chart.js to be available
 */
function waitForChartJs(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        if (isChartJsReady()) {
            resolve(true);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (isChartJsReady()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(checkInterval);
                reject(new Error('Chart.js failed to load within timeout period'));
            }
        }, 100);
    });
}

/**
 * Load transactions and display charts with caching
 */
async function loadAndDisplayCharts(forceRefresh = false) {
    // Prevent multiple simultaneous loads
    if (isLoadingCharts) {
        return;
    }
    
    isLoadingCharts = true;
    
    try {
        // Wait for Chart.js to be available
        await waitForChartJs();
    } catch (error) {
        console.error('Chart.js is not available:', error);
        showMessage('Charts cannot be displayed. Chart.js library failed to load. Please check your internet connection and refresh the page.', true);
        isLoadingCharts = false;
        return;
    }
    
    // Check if required elements exist
    const requiredElements = ['applyFilterBtn', 'chartStartDate', 'chartEndDate', 'expensesCategoryChart', 'expensesVsIncomeChart', 'expensesCategoryBarChart'];
    const missingElements = [];
    
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            missingElements.push(elementId);
        }
    }
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        alert('Charts cannot be displayed. Some required elements are missing: ' + missingElements.join(', '));
        return;
    }
    
    try {
        let data = null;
        
        // Check cache first unless force refresh is requested
        if (!forceRefresh && window.DataCache) {
            const cachedData = DataCache.getCachedChartTransactions();
            if (cachedData) {
                data = cachedData;
            }
        }
        
        // If no cached data, fetch from API
        if (!data) {
            data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getAllTransactions');
            
            // Cache the received data
            if (window.DataCache && data) {
                DataCache.setCachedChartTransactions(data);
            }
        }
        
        if (data && data.transactions && Array.isArray(data.transactions)) {
            allTransactions = data.transactions;
            
            // Debug: Log first few transactions to see date format
            if (data.transactions.length > 0) {
                // Check for today's transactions specifically
                const todaysTransactions = data.transactions.filter(t => {
                    const txDateStr = typeof t.date === 'string' ? t.date : String(t.date);
                    return txDateStr.includes('2026-02-06') || txDateStr.includes('02/06/2026') || txDateStr.includes('6/2/2026');
                });
            }
            
            // Set default date range to current month
            setDefaultDateRange();
            
            // Setup filter button
            setupFilterButton();
            
            // Display charts with current filters
            updateChartsWithFilter();
            
            // Mark as initialized
            chartsInitialized = true;
        } else {
            // Show a message to the user
            showMessage('No transaction data available. Please ensure your Google Sheet is properly configured and contains data.');
        }
    } catch (error) {
        console.error('Could not fetch transactions for charts:', error);
        showMessage('Error loading transaction data: ' + error.message, true);
    } finally {
        isLoadingCharts = false;
    }
}

/**
 * Set default date range to current month
 */
function setDefaultDateRange() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // First day of the current month
    const firstDay = new Date(year, month, 1);
    // Last day of the current month (first day of next month - 1)
    const lastDay = new Date(year, month + 1, 0);
    
    const startDateInput = document.getElementById('chartStartDate');
    const endDateInput = document.getElementById('chartEndDate');
    
    if (startDateInput) {
        startDateInput.value = formatDate(firstDay);
    } else {
        console.error('chartStartDate input not found');
    }
    
    if (endDateInput) {
        endDateInput.value = formatDate(lastDay);
    } else {
        console.error('chartEndDate input not found');
    }
}

/**
 * Setup filter button and quick filter buttons
 */
function setupFilterButton() {
    const applyBtn = document.getElementById('applyFilterBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', updateChartsWithFilter);
    } else {
        console.error('Apply filter button not found');
    }
    
    // Setup quick filter buttons with null checks
    const todayBtn = document.getElementById('todayBtn');
    const lastMonthBtn = document.getElementById('lastMonthBtn');
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const thisYearBtn = document.getElementById('thisYearBtn');
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => setFilterAndApply('today'));
    } else {
        console.error('Today button not found');
    }
    
    if (lastMonthBtn) {
        lastMonthBtn.addEventListener('click', () => setFilterAndApply('lastMonth'));
    } else {
        console.error('Last month button not found');
    }
    
    if (thisMonthBtn) {
        thisMonthBtn.addEventListener('click', () => setFilterAndApply('thisMonth'));
    } else {
        console.error('This month button not found');
    }
    
    if (thisYearBtn) {
        thisYearBtn.addEventListener('click', () => setFilterAndApply('thisYear'));
    } else {
        console.error('This year button not found');
    }
}

/**
 * Set filter dates and apply
 */
function setFilterAndApply(filterType) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    let startDate, endDate;
    
    if (filterType === 'today') {
        startDate = today;
        endDate = today;
    } else if (filterType === 'lastMonth') {
        const lastMonthStart = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        startDate = lastMonthStart;
        endDate = lastMonthEnd;
    } else if (filterType === 'thisMonth') {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        startDate = monthStart;
        endDate = monthEnd;
    } else if (filterType === 'thisYear') {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        startDate = yearStart;
        endDate = yearEnd;
    }
    
    const startDateInput = document.getElementById('chartStartDate');
    const endDateInput = document.getElementById('chartEndDate');
    
    if (startDateInput) {
        startDateInput.value = formatDate(startDate);
    }
    
    if (endDateInput) {
        endDateInput.value = formatDate(endDate);
    }
    
    // Apply filter immediately
    updateChartsWithFilter();
}

/**
 * Update charts with current filter settings
 */
function updateChartsWithFilter() {
    const startDate = document.getElementById('chartStartDate').value;
    const endDate = document.getElementById('chartEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    // Debug: Show all transaction dates to understand format
    
    // Filter transactions by date range (inclusive)
    const filteredTransactions = allTransactions.filter(transaction => {
        let txDate = transaction.date;
        let originalTxDate = txDate;
        
        // Handle different date formats and strip whitespace
        if (typeof txDate === 'object' && txDate.getTime) {
            txDate = txDate.toISOString().split('T')[0];
        } else if (typeof txDate === 'number') {
            txDate = new Date(txDate).toISOString().split('T')[0];
        } else if (txDate && txDate.includes('T')) {
            txDate = txDate.split('T')[0];
        } else if (txDate) {
            // Ensure it's a string in YYYY-MM-DD format and trim whitespace
            txDate = String(txDate).trim();
        }
        
        // Debug log for dates that should match
        if (txDate === '2026-02-06') {
            // Transaction found for today
        }
        
        // Debug log for any February 2026 transaction
        if (txDate && txDate.startsWith('2026-02')) {
            // February 2026 transaction found
        }
        
        // Compare dates as strings (YYYY-MM-DD format allows proper string comparison)
        const isInRange = txDate >= startDate && txDate <= endDate;
        
        return isInRange;
    });

    // Debug: Check if any transactions have today's date in different formats
    const todayFormats = ['2026-02-06', '02/06/2026', '6/2/2026', '2/6/2026', 'Feb 6, 2026', 'February 6, 2026'];
    const possibleTodayTransactions = allTransactions.filter(t => {
        const dateStr = String(t.date).toLowerCase();
        return todayFormats.some(format => dateStr.includes(format.toLowerCase()));
    });
    
    if (filteredTransactions.length > 0) {
        // First and last transactions exist
    }
    displayCharts(filteredTransactions);
}

/**
 * Display all charts
 */
function displayCharts(transactions) {
    const expenses = transactions.filter(t => t.type === 'Expense');
    const income = transactions.filter(t => t.type === 'Income');
    
    // Calculate expenses by category
    const categoryData = {};
    expenses.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        const amount = parseFloat(transaction.amount) || 0;
        categoryData[category] = (categoryData[category] || 0) + amount;
    });
    
    // Calculate total expenses and income
    const totalExpenses = expenses.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalIncome = income.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    // Display pie chart for expenses by category
    displayExpensesCategoryChart(categoryData);
    
    // Display bar chart for expenses vs income
    displayExpensesVsIncomeChart(totalExpenses, totalIncome);
    
    // Display horizontal bar chart for expenses by category (ranked)
    displayExpensesCategoryBarChart(categoryData);
}

/**
 * Display expenses by category pie chart
 */
function displayExpensesCategoryChart(categoryData) {
    const ctx = document.getElementById('expensesCategoryChart');
    if (!ctx) {
        console.error('Canvas element expensesCategoryChart not found');
        return;
    }
    
    const ctxContext = ctx.getContext('2d');
    if (!ctxContext) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    // Destroy existing chart if it exists
    if (expensesCategoryChart) {
        expensesCategoryChart.destroy();
    }
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    // Check if there's data to display
    if (labels.length === 0) {
        const chartWrapper = ctx.closest('.chart-wrapper');
        if (chartWrapper) {
            const existingMessage = chartWrapper.querySelector('.no-data-message');
            if (!existingMessage) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'no-data-message';
                messageDiv.style.cssText = 'text-align: center; padding: 40px 20px; color: #666; font-size: 14px;';
                messageDiv.textContent = 'No expense data available for the selected period';
                chartWrapper.appendChild(messageDiv);
            }
        }
        return;
    }
    
    // Remove any existing no-data message
    const chartWrapper = ctx.closest('.chart-wrapper');
    if (chartWrapper) {
        const existingMessage = chartWrapper.querySelector('.no-data-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    // Generate colors for pie chart
    const colors = generateColors(labels.length);
    
    expensesCategoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value.toFixed(2) + ' Ron (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Display expenses vs income bar chart
 */
function displayExpensesVsIncomeChart(totalExpenses, totalIncome) {
    const ctx = document.getElementById('expensesVsIncomeChart');
    if (!ctx) {
        console.error('Canvas element expensesVsIncomeChart not found');
        return;
    }
    
    const ctxContext = ctx.getContext('2d');
    if (!ctxContext) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    // Destroy existing chart if it exists
    if (expensesVsIncomeChart) {
        expensesVsIncomeChart.destroy();
    }
    
    expensesVsIncomeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total'],
            datasets: [
                {
                    label: 'Income',
                    data: [totalIncome],
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: [totalExpenses],
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.x || 0;
                            return label + ': ' + value.toFixed(2) + ' Ron';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Display expenses by category horizontal bar chart
 */
function displayExpensesCategoryBarChart(categoryData) {
    const ctx = document.getElementById('expensesCategoryBarChart');
    if (!ctx) {
        console.error('Canvas element expensesCategoryBarChart not found');
        return;
    }
    
    const ctxContext = ctx.getContext('2d');
    if (!ctxContext) {
        console.error('Could not get 2D context from canvas');
        return;
    }
    
    // Destroy existing chart if it exists
    if (expensesCategoryBarChart) {
        expensesCategoryBarChart.destroy();
    }
    
    // Convert to array and sort by amount (descending)
    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1]); // Sort by value, highest first
    
    const labels = sortedCategories.map(entry => entry[0]);
    const data = sortedCategories.map(entry => entry[1]);
    
    // Check if there's data to display
    if (labels.length === 0) {
        const chartWrapper = ctx.closest('.chart-wrapper');
        if (chartWrapper) {
            const existingMessage = chartWrapper.querySelector('.no-data-message');
            if (!existingMessage) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'no-data-message';
                messageDiv.style.cssText = 'text-align: center; padding: 40px 20px; color: #666; font-size: 14px;';
                messageDiv.textContent = 'No expense data available for the selected period';
                chartWrapper.appendChild(messageDiv);
            }
        }
        return;
    }
    
    // Remove any existing no-data message
    const chartWrapper = ctx.closest('.chart-wrapper');
    if (chartWrapper) {
        const existingMessage = chartWrapper.querySelector('.no-data-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    // Generate colors for each category
    const colors = generateColors(labels.length);
    
    expensesCategoryBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount (Ron)',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y', // Makes it horizontal
            plugins: {
                legend: {
                    display: false // Hide legend since we already have labels
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x || 0;
                            return 'Amount: ' + value.toFixed(2) + ' Ron';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Amount (Ron)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Category'
                    }
                }
            }
        }
    });
}

/**
 * Show a message to the user in the charts area
 */
function showMessage(message, showRetry = false) {
    // Find a suitable container to display the message
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
        let retryButton = '';
        if (showRetry) {
            retryButton = `
                <button onclick="retryLoadCharts()" style="
                    margin-top: 15px; 
                    padding: 10px 20px; 
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                    font-size: 14px;
                ">
                    Retry Loading Charts
                </button>
            `;
        }
        
        chartsContainer.innerHTML = `
            <div class="chart-message" style="
                text-align: center; 
                padding: 40px 20px; 
                color: #666; 
                font-size: 16px;
                background: #f8f9fa;
                border-radius: 8px;
                margin: 20px 0;
            ">
                ${message}
                ${retryButton}
            </div>
        `;
    } else {
        // Fallback to alert
        alert(message);
    }
}

/**
 * Retry loading charts - exposed globally for button click
 */
function retryLoadCharts() {
    // Reset flags
    chartsInitialized = false;
    isLoadingCharts = false;
    allTransactions = [];
    
    // Retry loading
    loadAndDisplayCharts(); // Initial load uses cache if available
}

/**
 * Update charts after data changes (called from transactions.js)
 */
function updateCharts() {
    if (typeof loadAndDisplayCharts === 'function' && chartsInitialized) {
        loadAndDisplayCharts(true); // Force refresh since data changed
    } else if (typeof loadAndDisplayCharts === 'function') {
        loadAndDisplayCharts(true); // Force refresh for initial load after data change
    }
}

// Make retryLoadCharts available globally
window.retryLoadCharts = retryLoadCharts;

/**
 * Debug helper - manually check what today's date should be
 */
function debugTodaysDate() {
    const today = new Date();
    // Date debugging removed
}

// Make debug function available globally
window.debugTodaysDate = debugTodaysDate;
