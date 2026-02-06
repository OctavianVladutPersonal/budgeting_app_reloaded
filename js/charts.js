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
    console.log('Loading and displaying charts...');
    
    // Prevent multiple simultaneous loads
    if (isLoadingCharts) {
        console.log('Charts are already loading, skipping...');
        return;
    }
    
    isLoadingCharts = true;
    
    try {
        // Wait for Chart.js to be available
        await waitForChartJs();
        console.log('Chart.js is ready');
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
                console.log('💾 Using cached chart transaction data');
                data = cachedData;
            }
        }
        
        // If no cached data, fetch from API
        if (!data) {
            console.log('🔄 Fetching fresh chart data from:', window.CONFIG.scriptURL + '?action=getAllTransactions');
            data = await fetchJSONP(window.CONFIG.scriptURL + '?action=getAllTransactions');
            
            // Cache the received data
            if (window.DataCache && data) {
                DataCache.setCachedChartTransactions(data);
            }
        }
        
        if (data && data.transactions && Array.isArray(data.transactions)) {
            console.log('Total transactions received:', data.transactions.length);
            allTransactions = data.transactions;
            
            // Debug: Log first few transactions to see date format
            if (data.transactions.length > 0) {
                console.log('Sample transactions:', data.transactions.slice(0, 5));
                console.log('First transaction date:', data.transactions[0].date, 'Type:', typeof data.transactions[0].date);
                
                // Check for today's transactions specifically
                const todaysTransactions = data.transactions.filter(t => {
                    const txDateStr = typeof t.date === 'string' ? t.date : String(t.date);
                    return txDateStr.includes('2026-02-06') || txDateStr.includes('02/06/2026') || txDateStr.includes('6/2/2026');
                });
                console.log('🔍 Found transactions for TODAY (2026-02-06):', todaysTransactions.length);
                if (todaysTransactions.length > 0) {
                    console.log('✅ TODAY\'S TRANSACTIONS:', todaysTransactions);
                } else {
                    console.log('❌ NO transactions found for today. Check if transaction was saved with correct date.');
                    console.log('🔍 All dates in system:', data.transactions.map(t => ({date: t.date, amount: t.amount, category: t.category})));
                }
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
            console.log('No transactions available for charts');
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
    
    console.log('Setting default date range - Today:', today.toDateString(), 'Year:', year, 'Month:', month);
    
    // First day of the current month
    const firstDay = new Date(year, month, 1);
    // Last day of the current month (first day of next month - 1)
    const lastDay = new Date(year, month + 1, 0);
    
    console.log('Date range - First day:', firstDay.toDateString(), 'Last day:', lastDay.toDateString());
    console.log('Formatted - First day:', formatDate(firstDay), 'Last day:', formatDate(lastDay));
    
    const startDateInput = document.getElementById('chartStartDate');
    const endDateInput = document.getElementById('chartEndDate');
    
    if (startDateInput) {
        startDateInput.value = formatDate(firstDay);
        console.log('Set start date input to:', startDateInput.value);
    } else {
        console.error('chartStartDate input not found');
    }
    
    if (endDateInput) {
        endDateInput.value = formatDate(lastDay);
        console.log('Set end date input to:', endDateInput.value);
    } else {
        console.error('chartEndDate input not found');
    }
}

/**
 * Setup filter button and quick filter buttons
 */
function setupFilterButton() {
    console.log('Setting up chart filter buttons...');
    
    const applyBtn = document.getElementById('applyFilterBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', updateChartsWithFilter);
        console.log('Apply filter button event listener added');
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
        console.log('Today button event listener added');
    } else {
        console.error('Today button not found');
    }
    
    if (lastMonthBtn) {
        lastMonthBtn.addEventListener('click', () => setFilterAndApply('lastMonth'));
        console.log('Last month button event listener added');
    } else {
        console.error('Last month button not found');
    }
    
    if (thisMonthBtn) {
        thisMonthBtn.addEventListener('click', () => setFilterAndApply('thisMonth'));
        console.log('This month button event listener added');
    } else {
        console.error('This month button not found');
    }
    
    if (thisYearBtn) {
        thisYearBtn.addEventListener('click', () => setFilterAndApply('thisYear'));
        console.log('This year button event listener added');
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
    
    console.log('setFilterAndApply called with filterType:', filterType, 'Today:', today.toDateString());
    
    if (filterType === 'today') {
        startDate = today;
        endDate = today;
        console.log('Setting filter to TODAY:');
        console.log('  - Today object:', today);
        console.log('  - Today toDateString():', today.toDateString());
        console.log('  - Today toISOString():', today.toISOString());
        console.log('  - Start date formatted:', formatDate(startDate));
        console.log('  - End date formatted:', formatDate(endDate));
    } else if (filterType === 'lastMonth') {
        const lastMonthStart = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        startDate = lastMonthStart;
        endDate = lastMonthEnd;
        console.log('Setting filter to LAST MONTH - Start:', startDate.toDateString(), 'End:', endDate.toDateString());
    } else if (filterType === 'thisMonth') {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        startDate = monthStart;
        endDate = monthEnd;
        console.log('Setting filter to THIS MONTH - Start:', startDate.toDateString(), 'End:', endDate.toDateString());
    } else if (filterType === 'thisYear') {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        startDate = yearStart;
        endDate = yearEnd;
        console.log('Setting filter to THIS YEAR - Start:', startDate.toDateString(), 'End:', endDate.toDateString());
    }
    
    const startDateInput = document.getElementById('chartStartDate');
    const endDateInput = document.getElementById('chartEndDate');
    
    if (startDateInput) {
        startDateInput.value = formatDate(startDate);
        console.log('Set start date input to:', startDateInput.value);
    }
    
    if (endDateInput) {
        endDateInput.value = formatDate(endDate);
        console.log('Set end date input to:', endDateInput.value);
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
    
    console.log('Filter dates - Start:', startDate, 'End:', endDate);
    console.log('All transactions before filtering:', allTransactions.length);
    
    // Debug: Show all transaction dates to understand format
    console.log('All transaction dates:', allTransactions.map(t => ({
        date: t.date, 
        type: typeof t.date, 
        amount: t.amount,
        category: t.category
    })));
    
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
        
        console.log('Processing transaction:', {
            originalDate: originalTxDate,
            processedDate: txDate,
            startDate: startDate,
            endDate: endDate,
            greaterThanStart: txDate >= startDate,
            lessThanEnd: txDate <= endDate,
            inRange: txDate >= startDate && txDate <= endDate,
            amount: transaction.amount,
            category: transaction.category
        });
        
        // Debug log for dates that should match
        if (txDate === '2026-02-06') {
            console.log('Found TODAY (02/06/2026) transaction:', txDate, 'Start:', startDate, 'End:', endDate, 'In range:', txDate >= startDate && txDate <= endDate);
        }
        
        // Debug log for any February 2026 transaction
        if (txDate && txDate.startsWith('2026-02')) {
            console.log('Found Feb 2026 transaction:', {
                txDate: txDate,
                startDate: startDate,
                endDate: endDate,
                greaterThanStart: txDate >= startDate,
                lessThanEnd: txDate <= endDate,
                inRange: txDate >= startDate && txDate <= endDate
            });
        }
        
        // Compare dates as strings (YYYY-MM-DD format allows proper string comparison)
        const isInRange = txDate >= startDate && txDate <= endDate;
        
        if (isInRange) {
            console.log('✅ INCLUDED transaction:', txDate, transaction.amount, transaction.category);
        } else {
            console.log('❌ EXCLUDED transaction:', txDate, '(not between', startDate, 'and', endDate, ')');
        }
        
        return isInRange;
    });
    
    console.log('Total transactions:', allTransactions.length);
    console.log('Filtered transactions:', filteredTransactions.length);
    
    // Debug: Check if any transactions have today's date in different formats
    const todayFormats = ['2026-02-06', '02/06/2026', '6/2/2026', '2/6/2026', 'Feb 6, 2026', 'February 6, 2026'];
    const possibleTodayTransactions = allTransactions.filter(t => {
        const dateStr = String(t.date).toLowerCase();
        return todayFormats.some(format => dateStr.includes(format.toLowerCase()));
    });
    console.log('Transactions that might be for today (checking various formats):', possibleTodayTransactions);
    
    if (filteredTransactions.length > 0) {
        console.log('First filtered transaction:', filteredTransactions[0]);
        console.log('Last filtered transaction:', filteredTransactions[filteredTransactions.length - 1]);
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
    console.log('Displaying expenses category chart...');
    
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
        console.log('No category data to display');
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
    
    console.log('Creating pie chart with', labels.length, 'categories');
    
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
    console.log('Displaying expenses vs income chart...');
    
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
    
    console.log('Creating income/expense chart - Income:', totalIncome, 'Expenses:', totalExpenses);
    
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
    console.log('Displaying expenses category bar chart...');
    
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
        console.log('No category data to display for bar chart');
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
    
    console.log('Creating bar chart with', labels.length, 'categories');
    
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
    console.log('Chart message:', message);
    
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
    console.log('Retrying chart load...');
    
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
        console.log('🔄 Updating charts after data change');
        loadAndDisplayCharts(true); // Force refresh since data changed
    } else if (typeof loadAndDisplayCharts === 'function') {
        console.log('📊 Initializing charts with fresh data');
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
    console.log('=== TODAY DATE DEBUG ===');
    console.log('JavaScript Date object:', today);
    console.log('toDateString():', today.toDateString());
    console.log('toISOString():', today.toISOString());
    console.log('Formatted (YYYY-MM-DD):', formatDate(today));
    console.log('Expected transaction date should be:', formatDate(today));
    console.log('========================');
}

// Make debug function available globally
window.debugTodaysDate = debugTodaysDate;
