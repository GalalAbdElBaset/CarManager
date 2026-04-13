// ==================== THEME MANAGER (UNIFIED) ====================
// This file handles theme switching across ALL pages and modules
// Include this file AFTER main.js in all HTML files

const ThemeManager = (function() {
    // ==================== CONSTANTS ====================
    const STORAGE_KEY = 'darkMode';
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };
    
    // ==================== PRIVATE STATE ====================
    let currentTheme = THEMES.LIGHT;
    let isInitialized = false;
    
    // ==================== CORE FUNCTIONS ====================
    
    /**
     * Initialize theme manager
     * Loads saved preference or system preference
     */
    function init() {
        if (isInitialized) return;
        
        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'true') {
            setTheme(THEMES.DARK);
        } else if (savedTheme === 'false') {
            setTheme(THEMES.LIGHT);
        } else if (systemPrefersDark) {
            setTheme(THEMES.DARK);
        } else {
            setTheme(THEMES.LIGHT);
        }
        
        // Listen for system theme changes (only if user hasn't set preference)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(STORAGE_KEY) === null) {
                setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        });
        
        // Bind all theme toggle buttons
        bindThemeButtons();
        
        isInitialized = true;
        console.log('🎨 Theme Manager initialized - Current theme:', currentTheme);
    }
    
    /**
     * Set theme and update all UI elements
     */
    function setTheme(theme) {
        currentTheme = theme;
        
        // Update body class
        if (theme === THEMES.DARK) {
            document.body.classList.add('dark');
            document.body.classList.remove('light');
        } else {
            document.body.classList.add('light');
            document.body.classList.remove('dark');
        }
        
        // Update all theme toggle buttons
        updateAllThemeButtons();
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, theme === THEMES.DARK ? 'true' : 'false');
        
        // Dispatch custom event for other modules to listen
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: currentTheme, isDark: theme === THEMES.DARK }
        }));
    }
    
    /**
     * Toggle between light and dark themes
     */
    function toggleTheme() {
        const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        setTheme(newTheme);
    }
    
    /**
     * Update ALL theme toggle buttons on the page
     * This includes:
     * - #theme-toggle (desktop floating button)
     * - #theme-toggle-desktop (sidebar button)
     * - Any element with class .Mood or .Mood-sidebar
     * - Any element with data-action="theme"
     */
    function updateAllThemeButtons() {
        const isDark = currentTheme === THEMES.DARK;
        const iconName = isDark ? 'fa-moon' : 'fa-sun';
        const buttonText = isDark ? ' Dark' : ' Light';
        
        // Update #theme-toggle (desktop floating button)
        const desktopToggle = document.getElementById('theme-toggle');
        if (desktopToggle) {
            const icon = desktopToggle.querySelector('i');
            if (icon) {
                icon.className = `fa-solid ${iconName}`;
            }
        }
        
        // Update #theme-toggle-desktop (sidebar button)
        const sidebarToggle = document.getElementById('theme-toggle-desktop');
        if (sidebarToggle) {
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.className = `fa-solid ${iconName}`;
            }
            
            // Update text content (keep the icon and text)
            const textNode = Array.from(sidebarToggle.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim()
            );
            if (textNode) {
                textNode.textContent = buttonText;
            } else {
                const span = sidebarToggle.querySelector('span');
                if (span) span.textContent = buttonText;
            }
        }
        
        // Update any element with class .Mood (without ID)
        document.querySelectorAll('.Mood:not(#theme-toggle)').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = `fa-solid ${iconName}`;
            }
        });
        
        // Update any element with class .Mood-sidebar
        document.querySelectorAll('.Mood-sidebar:not(#theme-toggle-desktop)').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = `fa-solid ${iconName}`;
            }
        });
        
        // Update any element with data-action="theme"
        document.querySelectorAll('[data-action="theme"]').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon && btn.id !== 'theme-toggle-desktop') {
                icon.className = `fa-solid ${iconName}`;
            }
        });
    }
    
    /**
     * Bind click events to all theme toggle buttons
     */
    function bindThemeButtons() {
        // Remove existing listeners to avoid duplicates
        const allThemeButtons = [
            document.getElementById('theme-toggle'),
            document.getElementById('theme-toggle-desktop'),
            ...document.querySelectorAll('.Mood'),
            ...document.querySelectorAll('.Mood-sidebar'),
            ...document.querySelectorAll('[data-action="theme"]')
        ].filter(Boolean);
        
        // Use a Set to remove duplicates
        const uniqueButtons = [...new Set(allThemeButtons)];
        
        uniqueButtons.forEach(btn => {
            // Remove old listener
            btn.removeEventListener('click', toggleTheme);
            // Add new listener
            btn.addEventListener('click', toggleTheme);
        });
    }
    
    /**
     * Get current theme
     */
    function getCurrentTheme() {
        return currentTheme;
    }
    
    /**
     * Check if dark mode is active
     */
    function isDarkMode() {
        return currentTheme === THEMES.DARK;
    }
    
    // ==================== PUBLIC API ====================
    return {
        init,
        setTheme,
        toggleTheme,
        getCurrentTheme,
        isDarkMode,
        THEMES
    };
})();

// ==================== AUTO-INITIALIZATION ====================
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

// ==================== GLOBAL EXPORTS ====================
// Make available globally
window.ThemeManager = ThemeManager;
window.toggleTheme = ThemeManager.toggleTheme;
window.getCurrentTheme = ThemeManager.getCurrentTheme;
window.isDarkMode = ThemeManager.isDarkMode;