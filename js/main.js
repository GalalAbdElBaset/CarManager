    /**
     * Main Module - Core application functionality
     * Handles loader, toast, theme, and utility functions
     */
    if ('caches' in window) {
        caches.keys().then(names => {
            for (let name of names) caches.delete(name);
        });
    }
    const App = (function() {
        // ========== INITIALIZATION ==========
        function init() {
            console.log('🚀 App initialized');
            
            // Hide loader after 1.5 seconds
            setTimeout(hideLoader, 1500);
            
            // Initialize theme
            initTheme();
            
            // Set active nav link based on current page
            setActiveNavLink();
        }
        
        function hideLoader() {
            const loader = document.getElementById('crmLoader');
            if (!loader) return;
            
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
        
        function initTheme() {
            const isDark = localStorage.getItem('darkMode') === 'true';

            if (isDark) {
                document.body.classList.add('dark');
            }

            updateThemeIcon(isDark);
        }    
        
        function updateThemeIcon(isDark) {
            const icons = document.querySelectorAll('[data-action="theme"] i');

            icons.forEach(icon => {
                icon.classList.toggle('fa-sun', !isDark);
                icon.classList.toggle('fa-moon', isDark);
            });
        }
        
        function setActiveNavLink() {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
        
        // ========== TOAST NOTIFICATIONS ==========
        function showToast(message, type = 'info', duration = 3000) {
            const toast = document.getElementById('toast');
            if (!toast) return;
            
            if (window.toastTimeout) {
                clearTimeout(window.toastTimeout);
            }
            
            toast.className = `show ${type}`;
            toast.innerHTML = `
                <div class="toast-body">
                    <i class="toast-icon fa-solid ${getToastIcon(type)}"></i>
                    <span>${escapeHtml(message)}</span>
                </div>
                <div class="toast-progress">
                    <div class="toast-progress-bar" style="animation: progress ${duration}ms linear;"></div>
                </div>
            `;
            
            window.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
        
        function getToastIcon(type) {
            const icons = {
                success: 'fa-circle-check',
                error: 'fa-circle-exclamation',
                warning: 'fa-triangle-exclamation',
                info: 'fa-circle-info'
            };
            return icons[type] || icons.info;
        }
        
        // ========== SCREEN NAVIGATION (Internal) ==========
        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.style.display = 'none';
                screen.classList.remove('active');
            });
            
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.style.display = 'block';
                targetScreen.classList.add('active');
            }
        }
        
        // ========== THEME TOGGLE ==========
        document.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('[data-action="theme"]');
            if (themeBtn) {
                toggleTheme();
            }
        });

        function toggleTheme() {
            document.body.classList.toggle('dark');

            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('darkMode', isDark);

            updateThemeIcon(isDark);
        }
            
                
        // ========== UTILITY FUNCTIONS ==========
        function escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                .toString()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        
        function formatPrice(price) {
            if (!price) return 'Price on request';
            const numPrice = parseFloat(price);
            if (isNaN(numPrice)) return price;
            
            return numPrice.toLocaleString('en-US') + ' EGP';
        }
        
        function formatCondition(condition) {
            if (!condition) return 'Not specified';
            
            const conditions = {
                'excellent': 'Excellent',
                'very_good': 'Very Good',
                'good': 'Good',
                'fair': 'Fair',
                'needs_maintenance': 'Needs Maintenance'
            };
            
            return conditions[condition] || condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        function truncateText(text, maxLength = 100) {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        }
        
        function getInitials(name) {
            if (!name) return '?';
            return name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }
        
        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }
        
        // ========== PUBLIC API ==========
        return {
            init,
            showScreen,
            showToast,
            toggleTheme,
            escapeHtml,
            formatPrice,
            formatCondition,
            truncateText,
            getInitials,
            debounce
        };
    })();

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Make App globally available
    window.App = App;
    window.showToast = App.showToast;
    window.showScreen = App.showScreen;
    window.escapeHtml = App.escapeHtml;
    window.formatPrice = App.formatPrice;
    window.formatCondition = App.formatCondition;
    window.truncateText = App.truncateText;
    window.getInitials = App.getInitials;