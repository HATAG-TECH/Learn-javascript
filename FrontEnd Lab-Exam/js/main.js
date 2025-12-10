// Main Dashboard Controller
class Dashboard {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCurrentSection();
        this.setupDarkMode();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Navigation links
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth < 768 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + / for search
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                document.getElementById('globalSearch').focus();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.updateDarkModeIcon(true);
        }
    }

    toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.updateDarkModeIcon(isDark);
    }

    updateDarkModeIcon(isDark) {
        const icon = document.getElementById('darkModeIcon');
        if (isDark) {
            icon.innerHTML = '<use href="assets/icons/moon-icon.svg#moon"></use>';
            icon.parentElement.title = 'Switch to Light Mode';
        } else {
            icon.innerHTML = '<use href="assets/icons/sun-icon.svg#sun"></use>';
            icon.parentElement.title = 'Switch to Dark Mode';
        }
    }

    setupNavigation() {
        // Update breadcrumbs
        this.updateBreadcrumbs();
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.switchSection(e.state.section, false);
            }
        });
    }

    switchSection(section, updateHistory = true) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === section) {
                    item.classList.add('active');
                }
            });

            // Update breadcrumbs
            this.updateBreadcrumbs();
            
            // Update URL without reload
            if (updateHistory) {
                history.pushState({ section }, '', `#${section}`);
            }

            // Initialize section-specific components
            this.initializeSection(section);
        }
    }

    updateBreadcrumbs() {
        const breadcrumbs = document.getElementById('breadcrumbs');
        const sectionName = this.getSectionName(this.currentSection);
        
        breadcrumbs.innerHTML = `
            <a href="#home">Home</a>
            <span class="separator">/</span>
            <span class="current">${sectionName}</span>
        `;
    }

    getSectionName(section) {
        const names = {
            'home': 'Dashboard',
            'students': 'Students',
            'add-student': 'Add Student',
            'analytics': 'Analytics',
            'reports': 'Reports',
            'settings': 'Settings'
        };
        return names[section] || 'Dashboard';
    }

    initializeSection(section) {
        switch(section) {
            case 'home':
                window.dispatchEvent(new CustomEvent('dashboard:home-loaded'));
                break;
            case 'students':
                window.dispatchEvent(new CustomEvent('dashboard:students-loaded'));
                break;
            case 'add-student':
                window.dispatchEvent(new CustomEvent('dashboard:add-student-loaded'));
                break;
            case 'analytics':
                window.dispatchEvent(new CustomEvent('dashboard:analytics-loaded'));
                break;
        }
    }

    closeAllModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Check for hash in URL
    if (window.location.hash) {
        const section = window.location.hash.substring(1);
        window.dashboard.switchSection(section, false);
    }
});