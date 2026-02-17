// Translations for all supported languages

const translations = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.recurring': 'Recurring',
        'nav.charts': 'Charts',
        'nav.settings': 'Settings',
        'nav.title': 'Spending Tracker',
        'nav.coffee': 'Buy me a coffee',
        
        // Home Page - Transaction Form
        'home.title': 'New Transaction',
        'form.amount': 'Amount',
        'form.payee': 'Payee',
        'form.category': 'Category',
        'form.notes': 'Notes',
        'form.date': 'Date',
        'form.dayOfWeek': 'Day of the Week',
        'form.account': 'Account Used',
        'form.type': 'Type',
        'form.type.expense': 'Expense',
        'form.type.income': 'Income',
        'form.required': '*',
        'form.submit': 'Add Transaction',
        
        // Recurring Section
        'recurring.checkbox': '🔄 Make this a recurring transaction',
        'recurring.frequency': 'Frequency',
        'recurring.frequency.select': 'Select frequency',
        'recurring.frequency.daily': 'Daily',
        'recurring.frequency.weekly': 'Weekly',
        'recurring.frequency.biweekly': 'Bi-weekly',
        'recurring.frequency.monthly': 'Monthly',
        'recurring.frequency.quarterly': 'Quarterly',
        'recurring.frequency.yearly': 'Yearly',
        'recurring.startDate': 'Start Date',
        'recurring.endDate': 'End Date (Optional)',
        'recurring.nextDue': 'Next Due Date',
        
        // Categories
        'category.childcare': 'Childcare & School',
        'category.debt': 'Debt',
        'category.education': 'Education',
        'category.entertainment': 'Entertainment',
        'category.goingout': 'Going out',
        'category.groceries': 'Groceries',
        'category.healthcare': 'Healthcare',
        'category.housing': 'Housing',
        'category.insurance': 'Insurance',
        'category.others': 'Others',
        'category.personalcare': 'Personal Care',
        'category.savings': 'Savings & Investments',
        'category.sport': 'Sport',
        'category.transportation': 'Transportation',
        'category.utilities': 'Utilities',
        'category.vacation': 'Vacation',
        'category.account': 'Account',
        
        // Transactions Table
        'transactions.title': 'Recent Transactions',
        'transactions.refresh': 'Refresh transactions',
        'transactions.loading': 'Loading transactions...',
        'transactions.empty': 'No transactions found.',
        'transactions.header.date': 'Date',
        'transactions.header.payee': 'Payee',
        'transactions.header.category': 'Category',
        'transactions.header.amount': 'Amount',
        'transactions.header.type': 'Type',
        'transactions.header.account': 'Account',
        'transactions.header.actions': 'Actions',
        'transactions.action.edit': 'Edit',
        'transactions.action.delete': 'Delete',
        
        // Success Modal
        'success.message': 'Success! Transaction added!',
        
        // Delete Modal
        'delete.title': 'Delete Transaction',
        'delete.message': 'Are you sure you want to delete this transaction? This action cannot be undone.',
        'delete.cancel': 'Cancel',
        'delete.confirm': 'Delete',
        
        // Edit Modal
        'edit.title': '✏️ Edit Transaction',
        'edit.cancel': 'Cancel',
        'edit.save': 'Save Changes',
        
        // Recurring Page
        'recurring.title': 'Recurring Transactions',
        'recurring.add': '➕ Add Recurring Transaction',
        'recurring.table.payee': 'Payee',
        'recurring.table.amount': 'Amount',
        'recurring.table.frequency': 'Frequency',
        'recurring.table.nextDue': 'Next Due',
        'recurring.table.status': 'Status',
        'recurring.table.actions': 'Actions',
        'recurring.status.active': 'Active',
        'recurring.status.inactive': 'Inactive',
        'recurring.status.due': 'Due',
        'recurring.status.overdue': 'Overdue',
        'recurring.empty': 'No recurring transactions set up yet.',
        
        // Add Recurring Modal
        'recurring.add.title': '➕ Add Recurring Transaction',
        'recurring.add.submit': 'Create Recurring Transaction',
        
        // Edit Recurring Modal
        'recurring.edit.title': '✏️ Edit Recurring Transaction',
        'recurring.edit.save': 'Save Changes',
        
        // Delete Recurring Modal
        'recurring.delete.title': 'Delete Recurring Transaction',
        'recurring.delete.message': 'Are you sure you want to delete this recurring transaction? This will stop all future automatic transactions but won\'t affect already created transactions.',
        
        // Charts Page
        'charts.title': 'Financial Charts',
        'charts.period': 'Period',
        'charts.period.day': 'Today',
        'charts.period.week': 'Week',
        'charts.period.month': 'Month',
        'charts.period.custom': 'Custom',
        'charts.startDate': 'From',
        'charts.endDate': 'To',
        'charts.loading': 'Loading charts...',
        'charts.noData': 'No data available for the selected period.',
        'charts.expensesByCategory': 'Expenses by Category',
        'charts.expensesVsIncome': 'Expenses vs Income',
        'charts.expensesByRank': 'Expenses by Category (Ranked)',
        'charts.lastMonth': 'Last Month',
        'charts.thisMonth': 'This Month',
        'charts.thisYear': 'This Year',
        'charts.applyFilter': 'Apply Filter',
        'charts.refreshData': '🔄 Refresh Data',
        
        // Settings Page
        'settings.title': 'Settings',
        'settings.appearance': 'Appearance',
        'settings.language': 'Language',
        'settings.language.select': 'Select Language',
        'settings.darkmode': 'Dark Mode',
        'settings.configuration': 'Current Configuration',
        'settings.actions': 'Actions',
        'settings.viewSpreadsheet': '📊 View Spreadsheet',
        'settings.reconfigure': '🔄 Reconfigure Settings',
        'settings.reset': '🗑️ Reset All Data',
        
        // Reconfigure Modal
        'reconfigure.title': 'Reconfigure Settings',
        'reconfigure.message': 'This will restart the setup process with your current settings prefilled. You can modify any settings you want to change.',
        'reconfigure.cancel': 'Cancel',
        'reconfigure.confirm': 'Reconfigure',
        
        // Reset Modal
        'reset.title': 'Reset All Data',
        'reset.message': '<strong>Warning:</strong> This will permanently delete ALL your configuration, accounts, categories, and settings. This action cannot be undone.',
        'reset.confirm.message': 'Are you absolutely sure you want to continue?',
        'reset.cancel': 'Cancel',
        'reset.confirm': 'Reset Everything',
        
        // Onboarding
        'onboarding.welcome.title': 'Welcome to your Spending Tracker! 🎯',
        'onboarding.welcome.subtitle': 'Let\'s set up your personalized budgeting experience in just a few steps.',
        'onboarding.features.button': '📖 Learn About App Features',
        'onboarding.step1.title': 'First, let\'s connect to your Google Spreadsheet',
        'onboarding.step1.instructions': 'Go to <a href="https://sheets.google.com" target="_blank">Google Sheets</a>, create a new spreadsheet, and copy its ID from the URL.',
        'onboarding.step1.example': 'Example URL:',
        'onboarding.step1.exampleNote': 'The highlighted part is your Spreadsheet ID',
        'onboarding.step1.language': 'Language',
        'onboarding.step1.label': 'Your Spreadsheet ID *',
        'onboarding.step1.placeholder': 'Paste your Spreadsheet ID here',
        'onboarding.step1.help': 'This will be used to connect your app to your spreadsheet',
        'onboarding.step1.continue': 'Continue to Apps Script Setup →',
        
        'onboarding.step2.title': 'Setup Apps Script 📊',
        'onboarding.step2.subtitle': 'Now we\'ll set up the Google Apps Script to connect your spreadsheet to the app.',
        'onboarding.step2.tab1': '1. Copy & Deploy Script',
        'onboarding.step2.tab2': '2. Test Connection',
        'onboarding.step2.scriptTitle': '⚙️ Step 1: Copy & Deploy Apps Script',
        'onboarding.step2.copyCode': '📋 Copy Code',
        'onboarding.step2.codeHeader': 'Apps Script Code (Personalized for Your Spreadsheet)',
        'onboarding.step2.instruction1': 'Go to <a href="https://script.google.com" target="_blank">Google Apps Script</a>',
        'onboarding.step2.instruction2': 'Click "New project"',
        'onboarding.step2.instruction3': 'Replace the default code with the code below (it\'s already customized with your Spreadsheet ID!)',
        'onboarding.step2.instruction4': 'Paste the code into your Apps Script editor',
        'onboarding.step2.instruction5': 'Click "Save" (💾)',
        'onboarding.step2.instruction6': 'Click "Deploy" → "New deployment"',
        'onboarding.step2.instruction7': 'Choose "Web app" as the type',
        'onboarding.step2.instruction8': 'Set "Execute as" to "Me"',
        'onboarding.step2.instruction9': 'Set "Who has access" to "Anyone"',
        'onboarding.step2.instruction10': 'Click "Deploy" and copy the Web App URL',
        'onboarding.step2.scriptURL': 'Apps Script Web App URL:',
        'onboarding.step2.scriptURLPlaceholder': 'Paste your Web App URL here',
        'onboarding.step2.scriptURLHelp': 'Should look like: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
        'onboarding.step2.nextConnect': 'Next: Test Connection →',
        'onboarding.step2.testTitle': '🔗 Step 2: Test Connection',
        'onboarding.step2.testSubtitle': 'Let\'s make sure everything is working correctly.',
        'onboarding.step2.testButton': '🔍 Test Connection',
        'onboarding.step2.testMessage': 'Click "Test Connection" to verify your setup',
        'onboarding.step2.testing': 'Testing connection... Please wait',
        'onboarding.step2.testSuccess': 'Connection successful! Your setup is working correctly.',
        'onboarding.step2.testFailed': 'Connection failed. Please check your Apps Script deployment.',
        'onboarding.step2.testTimeout': 'Connection timeout. Please verify your Apps Script is deployed correctly.',
        'onboarding.step2.testError': 'Failed to connect. Please check your Apps Script URL.',
        'onboarding.step2.testMissing': 'Please provide both Spreadsheet ID and Script URL',
        'onboarding.step2.back': '← Back',
        'onboarding.step2.continue': 'Continue to Accounts →',
        
        'onboarding.step3.title': 'Set Up Your Accounts 🏦',
        'onboarding.step3.subtitle': 'Add the accounts you\'ll be tracking (checking, savings, credit cards, etc.)',
        'onboarding.step3.placeholder': 'Account name (e.g., Checking)',
        'onboarding.step3.add': 'Add',
        'onboarding.step3.back': 'Back',
        'onboarding.step3.continue': 'Continue',
        
        'onboarding.step4.title': 'Customize Categories 📝',
        'onboarding.step4.subtitle': 'Modify or add expense categories that fit your spending habits.',
        'onboarding.step4.placeholder': 'Category name (e.g., Entertainment)',
        'onboarding.step4.add': 'Add',
        'onboarding.step4.back': 'Back',
        'onboarding.step4.continue': 'Continue',
        
        'onboarding.step5.title': 'Almost Done! ✨',
        'onboarding.step5.subtitle': 'Just a few final details to personalize your experience.',
        'onboarding.step5.name': 'Your Name (optional)',
        'onboarding.step5.namePlaceholder': 'How should we address you?',
        'onboarding.step5.currency': 'Currency',
        'onboarding.step5.back': 'Back',
        'onboarding.step5.complete': 'Complete Setup',
        
        'onboarding.complete.title': 'Setup Complete!',
        'onboarding.complete.message': 'Your Spending Tracker is now personalized and ready to use.',
        
        'onboarding.progress': 'of',
        
        // Days of the week
        'common.days.sunday': 'Sunday',
        'common.days.monday': 'Monday',
        'common.days.tuesday': 'Tuesday',
        'common.days.wednesday': 'Wednesday',
        'common.days.thursday': 'Thursday',
        'common.days.friday': 'Friday',
        'common.days.saturday': 'Saturday',
        
        // Success messages
        'success.message': 'Success! Transaction added!',
        'success.transactionUpdated': 'Success! Transaction updated!',
        'success.transactionDeleted': 'Transaction deleted successfully!',
        'success.recurringUpdated': 'Recurring transaction updated successfully!',
        'success.recurringDeleted': 'Recurring transaction deleted successfully!',
        'success.noDueTransactions': 'No recurring transactions are currently due.',
        
        // Error messages
        'error.recurringDeleteFailed': 'Error deleting recurring transaction. Please try again.',
        'error.recurringFieldsRequired': 'Please fill in all required recurring transaction fields.',
        'error.recurringCreateFailed': 'Error creating recurring transaction. Please try again.',
        'error.transactionNotFound': 'Transaction not found. Please refresh the page and try again.',
        'error.transactionNoId': 'Error: This transaction cannot be edited because it lacks proper identification. This may indicate a backend issue. Please refresh the page and contact support if the problem persists.',
        'error.transactionIdentifyFailed': 'Error: Cannot identify transaction to update. This may indicate a backend issue. Please refresh the page and try again.',
        'error.transactionUpdateFailed': 'Error updating transaction. Please try again.',
        'error.transactionDeleteNoId': 'Error: This transaction cannot be deleted because it lacks proper identification. This may indicate a backend issue. Please refresh the page and contact support if the problem persists.',
        'error.transactionDeleteIdentifyFailed': 'Error: Cannot identify transaction to delete. This may indicate a backend issue. Please refresh the page and try again.',
        'error.transactionDeleteFailed': 'Error deleting transaction. Please try again.',
        'error.accountExists': 'This account already exists.',
        'error.categoryExists': 'This category already exists.',
        'error.noSpreadsheetURL': 'No spreadsheet URL configured.',
        'error.chartsMissingElements': 'Charts cannot be displayed. Some required elements are missing: ',
        'error.selectDates': 'Please select both start and end dates',
        
        // Recurring transaction messages
        'recurring.selectFrequencyDate': 'Please select frequency and start date.',
        
        // Settings page configuration labels
        'settings.config.spreadsheetId': 'Spreadsheet ID:',
        'settings.config.accounts': 'Accounts:',
        'settings.config.categories': 'Categories:',
        'settings.config.userName': 'User Name:',
        'settings.config.currency': 'Currency:',
        'settings.config.notSet': 'Not set',
        'settings.config.none': 'None',
        'settings.config.expenseCategories': 'expense categories',
        
        // Reconfigure modal
        'reconfigure.title': 'Reconfigure Settings',
        'reconfigure.message': 'This will restart the setup process with your current settings prefilled. You can modify any settings you want to change.',
        'reconfigure.cancel': 'Cancel',
        'reconfigure.confirm': 'Reconfigure',
        
        // Edit Recurring Transaction modal
        'editRecurring.title': '✏️ Edit Recurring Transaction',
        'editRecurring.frequency': 'Frequency *',
        'editRecurring.startDate': 'Start Date *',
        'editRecurring.endDate': 'End Date (Optional)',
        'editRecurring.nextDue': 'Next Due Date',
        'editRecurring.cancel': 'Cancel',
        'editRecurring.save': 'Save Changes',
        
        // Delete Recurring Transaction modal
        'deleteRecurring.title': 'Delete Recurring Transaction',
        'deleteRecurring.message': 'Are you sure you want to delete this recurring transaction? This will stop all future automatic transactions but won\'t affect already created transactions.',
        'deleteRecurring.cancel': 'Cancel',
        'deleteRecurring.delete': 'Delete',
        
        // App Features Modal
        'features.title': 'App Features Overview',
        'features.transactions.title': '💰 Transaction Management',
        'features.transactions.add': '<strong>Add Transactions:</strong> Record income and expenses with details like payee, category, amount, and notes',
        'features.transactions.edit': '<strong>Edit & Delete:</strong> Modify or remove transactions as needed',
        'features.transactions.accounts': '<strong>Multiple Accounts:</strong> Track transactions across different accounts (bank, cash, credit cards)',
        'features.transactions.categories': '<strong>Categories:</strong> Organize spending with customizable categories',
        
        'features.recurring.title': '🔄 Recurring Transactions',
        'features.recurring.automated': '<strong>Automated Processing:</strong> Set up recurring income or expenses (daily, weekly, monthly, etc.)',
        'features.recurring.scheduling': '<strong>Smart Scheduling:</strong> Transactions are automatically processed when due',
        'features.recurring.tracking': '<strong>Status Tracking:</strong> Monitor active, inactive, overdue, and due transactions',
        'features.recurring.management': '<strong>Flexible Management:</strong> Edit or delete recurring transactions anytime',
        
        'features.analytics.title': '📊 Analytics & Charts',
        'features.analytics.overview': '<strong>Spending Overview:</strong> Visual breakdown of expenses by category',
        'features.analytics.comparison': '<strong>Income vs Expenses:</strong> Compare your income and spending patterns',
        'features.analytics.trends': '<strong>Trend Analysis:</strong> Track financial trends over time',
        'features.analytics.periods': '<strong>Period Selection:</strong> Analyze data by day, week, month, or custom date ranges',
        
        'features.customization.title': '⚙️ Customization',
        'features.customization.accounts': '<strong>Custom Accounts:</strong> Add your own bank accounts, cards, or cash sources',
        'features.customization.categories': '<strong>Custom Categories:</strong> Create categories that match your spending habits',
        'features.customization.currency': '<strong>Currency Selection:</strong> Choose your preferred currency',
        'features.customization.privacy': '<strong>Privacy Mode:</strong> Hide sensitive information with one click',
        
        'features.cloud.title': '☁️ Cloud Sync',
        'features.cloud.integration': '<strong>Google Sheets Integration:</strong> All data stored securely in your own Google Spreadsheet',
        'features.cloud.sync': '<strong>Real-time Sync:</strong> Changes are automatically saved to the cloud',
        'features.cloud.access': '<strong>Access Anywhere:</strong> Your data is accessible from any device',
        'features.cloud.ownership': '<strong>Data Ownership:</strong> You own and control all your financial data',
        
        'features.tip': '<strong>💡 Tip:</strong> This app is designed to help you understand your spending patterns and make informed financial decisions!',
        'features.close': 'Got it!',
        
        // Common
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        'common.obfuscate': 'Hide sensitive information',
        
        // Footer
        'footer.madeWith': 'Made with ❤️ for better financial management',
        'footer.contact': 'Contact me on Telegram'
    },
    
    ro: {
        // Navigation
        'nav.home': 'Acasă',
        'nav.recurring': 'Recurente',
        'nav.charts': 'Grafice',
        'nav.settings': 'Setări',
        'nav.title': 'Monitor de Cheltuieli',
        'nav.coffee': 'Oferă-mi o cafea',
        
        // Home Page - Transaction Form
        'home.title': 'Tranzacție Nouă',
        'form.amount': 'Sumă',
        'form.payee': 'Beneficiar',
        'form.category': 'Categorie',
        'form.notes': 'Notițe',
        'form.date': 'Data',
        'form.dayOfWeek': 'Ziua săptămânii',
        'form.account': 'Cont utilizat',
        'form.type': 'Tip',
        'form.type.expense': 'Cheltuială',
        'form.type.income': 'Venit',
        'form.required': '*',
        'form.submit': 'Adaugă Tranzacție',
        
        // Recurring Section
        'recurring.checkbox': '🔄 Setează ca tranzacție recurentă',
        'recurring.frequency': 'Frecvență',
        'recurring.frequency.select': 'Selectează frecvența',
        'recurring.frequency.daily': 'Zilnic',
        'recurring.frequency.weekly': 'Săptămânal',
        'recurring.frequency.biweekly': 'La două săptămâni',
        'recurring.frequency.monthly': 'Lunar',
        'recurring.frequency.quarterly': 'Trimestrial',
        'recurring.frequency.yearly': 'Anual',
        'recurring.startDate': 'Data de început',
        'recurring.endDate': 'Data de sfârșit (Opțional)',
        'recurring.nextDue': 'Următoarea scadență',
        
        // Categories
        'category.childcare': 'Îngrijire copii & Școală',
        'category.debt': 'Datorii',
        'category.education': 'Educație',
        'category.entertainment': 'Divertisment',
        'category.goingout': 'Ieșiri',
        'category.groceries': 'Cumpărături alimentare',
        'category.healthcare': 'Sănătate',
        'category.housing': 'Locuință',
        'category.insurance': 'Asigurări',
        'category.others': 'Altele',
        'category.personalcare': 'Îngrijire personală',
        'category.savings': 'Economii & Investiții',
        'category.sport': 'Sport',
        'category.transportation': 'Transport',
        'category.utilities': 'Utilități',
        'category.vacation': 'Vacanță',
        'category.account': 'Cont',
        
        // Transactions Table
        'transactions.title': 'Tranzacții Recente',
        'transactions.refresh': 'Reîmprospătează tranzacțiile',
        'transactions.loading': 'Se încarcă tranzacțiile...',
        'transactions.empty': 'Nu s-au găsit tranzacții.',
        'transactions.header.date': 'Data',
        'transactions.header.payee': 'Beneficiar',
        'transactions.header.category': 'Categorie',
        'transactions.header.amount': 'Sumă',
        'transactions.header.type': 'Tip',
        'transactions.header.account': 'Cont',
        'transactions.header.actions': 'Acțiuni',
        'transactions.action.edit': 'Editează',
        'transactions.action.delete': 'Șterge',
        
        // Success Modal
        'success.message': 'Succes! Tranzacție adăugată!',
        
        // Delete Modal
        'delete.title': 'Șterge Tranzacția',
        'delete.message': 'Sigur doriți să ștergeți această tranzacție? Această acțiune nu poate fi anulată.',
        'delete.cancel': 'Anulează',
        'delete.confirm': 'Șterge',
        
        // Edit Modal
        'edit.title': '✏️ Editează Tranzacția',
        'edit.cancel': 'Anulează',
        'edit.save': 'Salvează Modificările',
        
        // Recurring Page
        'recurring.title': 'Tranzacții Recurente',
        'recurring.add': '➕ Adaugă Tranzacție Recurentă',
        'recurring.table.payee': 'Beneficiar',
        'recurring.table.amount': 'Sumă',
        'recurring.table.frequency': 'Frecvență',
        'recurring.table.nextDue': 'Următoarea scadență',
        'recurring.table.status': 'Status',
        'recurring.table.actions': 'Acțiuni',
        'recurring.status.active': 'Activă',
        'recurring.status.inactive': 'Inactivă',
        'recurring.status.due': 'Scadentă',
        'recurring.status.overdue': 'Întârziată',
        'recurring.empty': 'Nu există încă tranzacții recurente.',
        
        // Add Recurring Modal
        'recurring.add.title': '➕ Adaugă Tranzacție Recurentă',
        'recurring.add.submit': 'Creează Tranzacție Recurentă',
        
        // Edit Recurring Modal
        'recurring.edit.title': '✏️ Editează Tranzacția Recurentă',
        'recurring.edit.save': 'Salvează Modificările',
        
        // Delete Recurring Modal
        'recurring.delete.title': 'Șterge Tranzacția Recurentă',
        'recurring.delete.message': 'Sigur doriți să ștergeți această tranzacție recurentă? Aceasta va opri toate tranzacțiile viitoare automate, dar nu va afecta tranzacțiile deja create.',
        
        // Charts Page
        'charts.title': 'Grafice Financiare',
        'charts.period': 'Perioadă',
        'charts.period.day': 'Astăzi',
        'charts.period.week': 'Săptămână',
        'charts.period.month': 'Lună',
        'charts.period.custom': 'Personalizat',
        'charts.startDate': 'De la',
        'charts.endDate': 'Până la',
        'charts.loading': 'Se încarcă graficele...',
        'charts.noData': 'Nu există date disponibile pentru perioada selectată.',
        'charts.expensesByCategory': 'Cheltuieli pe Categorii',
        'charts.expensesVsIncome': 'Cheltuieli vs Venituri',
        'charts.expensesByRank': 'Cheltuieli pe Categorii (Clasate)',
        'charts.lastMonth': 'Luna Trecută',
        'charts.thisMonth': 'Luna Aceasta',
        'charts.thisYear': 'Anul Acesta',
        'charts.applyFilter': 'Aplică Filtrul',
        'charts.refreshData': '🔄 Reîmprospătează Datele',
        
        // Settings Page
        'settings.title': 'Setări',
        'settings.appearance': 'Aspect',
        'settings.language': 'Limbă',
        'settings.language.select': 'Selectează limba',
        'settings.darkmode': 'Mod întunecat',
        'settings.configuration': 'Configurație Curentă',
        'settings.actions': 'Acțiuni',
        'settings.viewSpreadsheet': '📊 Vezi Spreadsheet',
        'settings.reconfigure': '🔄 Reconfigurează Setările',
        'settings.reset': '🗑️ Resetează Toate Datele',
        
        // Reconfigure Modal
        'reconfigure.title': 'Reconfigurează Setările',
        'reconfigure.message': 'Aceasta va reporni procesul de configurare cu setările curente precompletate. Puteți modifica orice setări doriți să schimbați.',
        'reconfigure.cancel': 'Anulează',
        'reconfigure.confirm': 'Reconfigurează',
        
        // Reset Modal
        'reset.title': 'Resetează Toate Datele',
        'reset.message': '<strong>Atenție:</strong> Aceasta va șterge permanent TOATE configurațiile, conturile, categoriile și setările dumneavoastră. Această acțiune nu poate fi anulată.',
        'reset.confirm.message': 'Sunteți absolut sigur că doriți să continuați?',
        'reset.cancel': 'Anulează',
        'reset.confirm': 'Resetează Tot',
        
        // Onboarding
        'onboarding.welcome.title': 'Bine ați venit la Monitorul de Cheltuieli! 🎯',
        'onboarding.welcome.subtitle': 'Să vă configurăm experiența personalizată de bugetare în doar câțiva pași.',
        'onboarding.features.button': '📖 Aflați despre funcționalitățile aplicației',
        'onboarding.step1.title': 'Mai întâi, să ne conectăm la Google Spreadsheet',
        'onboarding.step1.instructions': 'Accesați <a href="https://sheets.google.com" target="_blank">Google Sheets</a>, creați un spreadsheet nou și copiați ID-ul acestuia din URL.',
        'onboarding.step1.example': 'URL exemplu:',
        'onboarding.step1.exampleNote': 'Partea evidențiată este ID-ul Spreadsheet-ului dvs.',
        'onboarding.step1.language': 'Limbă',
        'onboarding.step1.label': 'ID-ul Spreadsheet-ului *',
        'onboarding.step1.placeholder': 'Lipiți ID-ul Spreadsheet-ului aici',
        'onboarding.step1.help': 'Acesta va fi folosit pentru a conecta aplicația la spreadsheet-ul dvs.',
        'onboarding.step1.continue': 'Continuă la Configurarea Apps Script →',
        
        'onboarding.step2.title': 'Configurează Apps Script 📊',
        'onboarding.step2.subtitle': 'Acum vom configura Google Apps Script pentru a conecta spreadsheet-ul la aplicație.',
        'onboarding.step2.tab1': '1. Copiază & Implementează Script',
        'onboarding.step2.tab2': '2. Testează Conexiunea',
        'onboarding.step2.scriptTitle': '⚙️ Pasul 1: Copiază & Implementează Apps Script',
        'onboarding.step2.copyCode': '📋 Copiază Codul',
        'onboarding.step2.codeHeader': 'Cod Apps Script (Personalizat pentru Spreadsheet-ul dvs.)',
        'onboarding.step2.instruction1': 'Accesați <a href="https://script.google.com" target="_blank">Google Apps Script</a>',
        'onboarding.step2.instruction2': 'Faceți clic pe "New project"',
        'onboarding.step2.instruction3': 'Înlocuiți codul implicit cu codul de mai jos (este deja personalizat cu ID-ul Spreadsheet-ului dvs.!)',
        'onboarding.step2.instruction4': 'Lipiți codul în editorul Apps Script',
        'onboarding.step2.instruction5': 'Faceți clic pe "Save" (💾)',
        'onboarding.step2.instruction6': 'Faceți clic pe "Deploy" → "New deployment"',
        'onboarding.step2.instruction7': 'Alegeți "Web app" ca tip',
        'onboarding.step2.instruction8': 'Setați "Execute as" la "Me"',
        'onboarding.step2.instruction9': 'Setați "Who has access" la "Anyone"',
        'onboarding.step2.instruction10': 'Faceți clic pe "Deploy" și copiați URL-ul Web App',
        'onboarding.step2.scriptURL': 'URL Web App Apps Script:',
        'onboarding.step2.scriptURLPlaceholder': 'Lipiți URL-ul Web App aici',
        'onboarding.step2.scriptURLHelp': 'Ar trebui să arate ca: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
        'onboarding.step2.nextConnect': 'Următorul: Testează Conexiunea →',
        'onboarding.step2.testTitle': '🔗 Pasul 2: Testează Conexiunea',
        'onboarding.step2.testSubtitle': 'Să ne asigurăm că totul funcționează corect.',
        'onboarding.step2.testButton': '🔍 Testează Conexiunea',
        'onboarding.step2.testMessage': 'Apăsați "Testează Conexiunea" pentru a verifica configurarea',
        'onboarding.step2.testing': 'Se testează conexiunea... Vă rugăm așteptați',
        'onboarding.step2.testSuccess': 'Conexiune reușită! Configurarea dvs. funcționează corect.',
        'onboarding.step2.testFailed': 'Conexiunea a eșuat. Vă rugăm verificați implementarea Apps Script.',
        'onboarding.step2.testTimeout': 'Timeout conexiune. Vă rugăm verificați că Apps Script este implementat corect.',
        'onboarding.step2.testError': 'Conectarea a eșuat. Vă rugăm verificați URL-ul Apps Script.',
        'onboarding.step2.testMissing': 'Vă rugăm furnizați atât ID-ul Spreadsheet-ului, cât și URL-ul Script',
        'onboarding.step2.back': '← Înapoi',
        'onboarding.step2.continue': 'Continuă la Conturi →',
        
        'onboarding.step3.title': 'Configurează Conturile 🏦',
        'onboarding.step3.subtitle': 'Adăugați conturile pe care le veți urmări (cont curent, economii, carduri de credit, etc.)',
        'onboarding.step3.placeholder': 'Numele contului (ex. Cont curent)',
        'onboarding.step3.add': 'Adaugă',
        'onboarding.step3.back': 'Înapoi',
        'onboarding.step3.continue': 'Continuă',
        
        'onboarding.step4.title': 'Personalizează Categoriile 📝',
        'onboarding.step4.subtitle': 'Modificați sau adăugați categorii de cheltuieli care se potrivesc obiceiurilor dvs. de cheltuire.',
        'onboarding.step4.placeholder': 'Numele categoriei (ex. Divertisment)',
        'onboarding.step4.add': 'Adaugă',
        'onboarding.step4.back': 'Înapoi',
        'onboarding.step4.continue': 'Continuă',
        
        'onboarding.step5.title': 'Aproape Gata! ✨',
        'onboarding.step5.subtitle': 'Doar câteva detalii finale pentru a vă personaliza experiența.',
        'onboarding.step5.name': 'Numele dvs. (opțional)',
        'onboarding.step5.namePlaceholder': 'Cum ar trebui să vă adresăm?',
        'onboarding.step5.currency': 'Monedă',
        'onboarding.step5.back': 'Înapoi',
        'onboarding.step5.complete': 'Finalizează Configurarea',
        
        'onboarding.complete.title': 'Configurare Completă!',
        'onboarding.complete.message': 'Monitorul tău de cheltuieli este acum personalizat și gata de utilizare.',
        
        'onboarding.progress': 'din',
        
        // Recurring transaction messages
        'recurring.selectFrequencyDate': 'Vă rugăm selectați frecvența și data de început.',
        
        // Settings page configuration labels
        'settings.config.spreadsheetId': 'ID Spreadsheet:',
        'settings.config.accounts': 'Conturi:',
        'settings.config.categories': 'Categorii:',
        'settings.config.userName': 'Nume Utilizator:',
        'settings.config.currency': 'Monedă:',
        'settings.config.notSet': 'Nesetat',
        'settings.config.none': 'Niciuna',
        'settings.config.expenseCategories': 'categorii de cheltuieli',
        
        // Reconfigure modal
        'reconfigure.title': 'Reconfigurează Setările',
        'reconfigure.message': 'Aceasta va reporni procesul de configurare cu setările curente precompletate. Puteți modifica orice setări doriți să schimbați.',
        'reconfigure.cancel': 'Anulează',
        'reconfigure.confirm': 'Reconfigurează',
        
        // Edit Recurring Transaction modal
        'editRecurring.title': '✏️ Editează Tranzacția Recurentă',
        'editRecurring.frequency': 'Frecvență *',
        'editRecurring.startDate': 'Data de Început *',
        'editRecurring.endDate': 'Data de Sfârșit (Opțional)',
        'editRecurring.nextDue': 'Următoarea Scadență',
        'editRecurring.cancel': 'Anulează',
        'editRecurring.save': 'Salvează Modificările',
        
        // Delete Recurring Transaction modal
        'deleteRecurring.title': 'Șterge Tranzacția Recurentă',
        'deleteRecurring.message': 'Sigur doriți să ștergeți această tranzacție recurentă? Aceasta va opri toate tranzacțiile automate viitoare, dar nu va afecta tranzacțiile deja create.',
        'deleteRecurring.cancel': 'Anulează',
        'deleteRecurring.delete': 'Șterge',
        
        // Days of the week
        'common.days.sunday': 'Duminică',
        'common.days.monday': 'Luni',
        'common.days.tuesday': 'Marți',
        'common.days.wednesday': 'Miercuri',
        'common.days.thursday': 'Joi',
        'common.days.friday': 'Vineri',
        'common.days.saturday': 'Sâmbătă',
        
        // Success messages
        'success.message': 'Succes! Tranzacție adăugată!',
        'success.transactionUpdated': 'Succes! Tranzacție actualizată!',
        'success.transactionDeleted': 'Tranzacție ștearsă cu succes!',
        'success.recurringUpdated': 'Tranzacție recurentă actualizată cu succes!',
        'success.recurringDeleted': 'Tranzacție recurentă ștearsă cu succes!',
        'success.noDueTransactions': 'Nu există tranzacții recurente scadente în prezent.',
        
        // Error messages
        'error.recurringDeleteFailed': 'Eroare la ștergerea tranzacției recurente. Vă rugăm încercați din nou.',
        'error.recurringFieldsRequired': 'Vă rugăm completați toate câmpurile necesare pentru tranzacția recurentă.',
        'error.recurringCreateFailed': 'Eroare la crearea tranzacției recurente. Vă rugăm încercați din nou.',
        'error.transactionNotFound': 'Tranzacție negăsită. Vă rugăm reîmprospătați pagina și încercați din nou.',
        'error.transactionNoId': 'Eroare: Această tranzacție nu poate fi editată deoarece îi lipsește identificarea corectă. Aceasta poate indica o problemă backend. Vă rugăm reîmprospătați pagina și contactați suportul dacă problema persistă.',
        'error.transactionIdentifyFailed': 'Eroare: Nu se poate identifica tranzacția pentru actualizare. Aceasta poate indica o problemă backend. Vă rugăm reîmprospătați pagina și încercați din nou.',
        'error.transactionUpdateFailed': 'Eroare la actualizarea tranzacției. Vă rugăm încercați din nou.',
        'error.transactionDeleteNoId': 'Eroare: Această tranzacție nu poate fi ștearsă deoarece îi lipsește identificarea corectă. Aceasta poate indica o problemă backend. Vă rugăm reîmprospătați pagina și contactați suportul dacă problema persistă.',
        'error.transactionDeleteIdentifyFailed': 'Eroare: Nu se poate identifica tranzacția pentru ștergere. Aceasta poate indica o problemă backend. Vă rugăm reîmprospătați pagina și încercați din nou.',
        'error.transactionDeleteFailed': 'Eroare la ștergerea tranzacției. Vă rugăm încercați din nou.',
        'error.accountExists': 'Acest cont există deja.',
        'error.categoryExists': 'Această categorie există deja.',
        'error.noSpreadsheetURL': 'Niciun URL de spreadsheet configurat.',
        'error.chartsMissingElements': 'Graficele nu pot fi afișate. Unele elemente necesare lipsesc: ',
        'error.selectDates': 'Vă rugăm selectați atât data de început, cât și data de sfârșit',
        
        // App Features Modal
        'features.title': 'Prezentare Funcționalități Aplicație',
        'features.transactions.title': '💰 Gestionarea Tranzacțiilor',
        'features.transactions.add': '<strong>Adaugă Tranzacții:</strong> Înregistrează venituri și cheltuieli cu detalii precum beneficiar, categorie, sumă și notițe',
        'features.transactions.edit': '<strong>Editează & Șterge:</strong> Modifică sau elimină tranzacții după necesitate',
        'features.transactions.accounts': '<strong>Conturi Multiple:</strong> Urmărește tranzacțiile pe diferite conturi (bancă, numerar, carduri de credit)',
        'features.transactions.categories': '<strong>Categorii:</strong> Organizează cheltuielile cu categorii personalizabile',
        
        'features.recurring.title': '🔄 Tranzacții Recurente',
        'features.recurring.automated': '<strong>Procesare Automată:</strong> Configurează venituri sau cheltuieli recurente (zilnic, săptămânal, lunar, etc.)',
        'features.recurring.scheduling': '<strong>Programare Inteligentă:</strong> Tranzacțiile sunt procesate automat la scadență',
        'features.recurring.tracking': '<strong>Urmărire Status:</strong> Monitorizează tranzacțiile active, inactive, întârziate și scadente',
        'features.recurring.management': '<strong>Gestionare Flexibilă:</strong> Editează sau șterge tranzacții recurente oricând',
        
        'features.analytics.title': '📊 Analize & Grafice',
        'features.analytics.overview': '<strong>Prezentare Cheltuieli:</strong> Defalcare vizuală a cheltuielilor pe categorii',
        'features.analytics.comparison': '<strong>Venituri vs Cheltuieli:</strong> Compară modelele de venituri și cheltuieli',
        'features.analytics.trends': '<strong>Analiză Tendințe:</strong> Urmărește tendințele financiare în timp',
        'features.analytics.periods': '<strong>Selecție Perioadă:</strong> Analizează datele pe zi, săptămână, lună sau intervale personalizate',
        
        'features.customization.title': '⚙️ Personalizare',
        'features.customization.accounts': '<strong>Conturi Personalizate:</strong> Adaugă propriile conturi bancare, carduri sau surse de numerar',
        'features.customization.categories': '<strong>Categorii Personalizate:</strong> Creează categorii care se potrivesc obiceiurilor tale de cheltuire',
        'features.customization.currency': '<strong>Selectare Monedă:</strong> Alege moneda preferată',
        'features.customization.privacy': '<strong>Mod Confidențialitate:</strong> Ascunde informațiile sensibile cu un click',
        
        'features.cloud.title': '☁️ Sincronizare Cloud',
        'features.cloud.integration': '<strong>Integrare Google Sheets:</strong> Toate datele sunt stocate în siguranță în propriul tău Google Spreadsheet',
        'features.cloud.sync': '<strong>Sincronizare în Timp Real:</strong> Modificările sunt salvate automat în cloud',
        'features.cloud.access': '<strong>Acces Oriunde:</strong> Datele tale sunt accesibile de pe orice dispozitiv',
        'features.cloud.ownership': '<strong>Proprietate Date:</strong> Tu deții și controlezi toate datele tale financiare',
        
        'features.tip': '<strong>💡 Sfat:</strong> Această aplicație este concepută pentru a vă ajuta să înțelegeți modelele de cheltuire și să luați decizii financiare informate!',
        'features.close': 'Am înțeles!',
        
        // Common
        'common.loading': 'Se încarcă...',
        'common.save': 'Salvează',
        'common.cancel': 'Anulează',
        'common.delete': 'Șterge',
        'common.edit': 'Editează',
        'common.close': 'Închide',
        'common.obfuscate': 'Ascunde informațiile sensibile',
        
        // Footer
        'footer.madeWith': 'Creat cu ❤️ pentru o mai bună gestionare financiară',
        'footer.contact': 'Contactează-mă pe Telegram'
    }
};

// Export translations
window.translations = translations;
