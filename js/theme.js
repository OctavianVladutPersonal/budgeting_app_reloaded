// Theme Management

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Update both toggle switches
    const themeToggle = document.getElementById('themeToggle');
    const onboardingThemeToggle = document.getElementById('onboardingThemeToggle');
    
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
    if (onboardingThemeToggle) {
        onboardingThemeToggle.checked = savedTheme === 'dark';
    }
    
    // Update icon
    updateThemeIcon(savedTheme);
}

/**
 * Apply theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme(event) {
    // Get the toggle that was clicked
    const clickedToggle = event ? event.target : null;
    const themeToggle = document.getElementById('themeToggle');
    const onboardingThemeToggle = document.getElementById('onboardingThemeToggle');
    
    // Determine new theme based on which toggle was clicked
    let newTheme = 'light';
    if (clickedToggle) {
        newTheme = clickedToggle.checked ? 'dark' : 'light';
    } else {
        // Fallback: check if any toggle is checked
        if ((themeToggle && themeToggle.checked) || (onboardingThemeToggle && onboardingThemeToggle.checked)) {
            newTheme = 'dark';
        }
    }
    
    // Sync both toggles
    if (themeToggle) {
        themeToggle.checked = newTheme === 'dark';
    }
    if (onboardingThemeToggle) {
        onboardingThemeToggle.checked = newTheme === 'dark';
    }
    
    // Apply theme
    applyTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    updateThemeIcon(newTheme);
}

/**
 * Update the theme icon based on current theme
 * @param {string} theme - 'light' or 'dark'
 */
function updateThemeIcon(theme) {
    // Update all theme icons (both in settings and onboarding)
    const iconElements = document.querySelectorAll('.theme-icon');
    iconElements.forEach(icon => {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
