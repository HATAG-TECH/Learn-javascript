// main.js - Main Dashboard Controller
class Dashboard {
    constructor() {
        this.currentSection = 'home';
        this.isInitialized = false;
        this.pendingActions = [];
        this.init();
    }

    init() {
        console.log('Dashboard: Initializing...');
        
        // Wait for DOM and dependencies
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            setTimeout(() => this.initialize(), 100);
        }
    }

    async initialize() {
        try {
            console.log('Dashboard: Starting setup...');
            
            // Wait for critical dependencies
            await this.waitForDependencies();
            
            // Setup core functionality
            this.setupEventListeners();
            this.setupDarkMode();
            this.setupNavigation();
            this.loadCurrentSection();
            
            // Initialize sections
            this.initializeSections();
            
            // Mark as initialized
            this.isInitialized = true;
            console.log('Dashboard: Initialized successfully');
            
            // Execute any pending actions
            this.executePendingActions();
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('dashboard:ready'));
            
        } catch (error) {
            console.error('Dashboard: Initialization failed:', error);
            this.showInitializationError(error);
        }
    }

    async waitForDependencies() {
        const dependencies = {
            'storage': () => typeof window.studentStorage !== 'undefined',
            'notifications': () => typeof window.notificationSystem !== 'undefined'
        };
        
        const maxWaitTime = 5000; // 5 seconds max
        const startTime = Date.now();
        
        for (const [name, check] of Object.entries(dependencies)) {
            console.log(`Dashboard: Waiting for ${name}...`);
            
            while (!check() && Date.now() - startTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!check()) {
                throw new Error(`Dependency ${name} not loaded after ${maxWaitTime}ms`);
            }
            
            console.log(`Dashboard: ${name} ✓`);
        }
    }

    setupEventListeners() {
        console.log('Dashboard: Setting up event listeners...');
        
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // Navigation links
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth < 768 && 
                sidebar && 
                !sidebar.contains(e.target) && 
                !menuToggle?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + / for search
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                const searchInput = document.getElementById('globalSearch') || 
                                  document.getElementById('tableSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Alt + 1-6 for quick navigation
            if (e.altKey && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const sections = ['home', 'students', 'add-student', 'analytics', 'reports', 'settings'];
                const index = parseInt(e.key) - 1;
                if (sections[index]) {
                    this.switchSection(sections[index]);
                }
            }
        });

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.debounce((e) => {
                this.handleGlobalSearch(e.target.value);
            }, 300));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDashboard();
            });
        }

        // FAB (Floating Action Button)
        const fab = document.getElementById('fab');
        if (fab) {
            fab.addEventListener('click', (e) => {
                e.stopPropagation();
                fab.classList.toggle('active');
            });
            
            // Close FAB when clicking elsewhere
            document.addEventListener('click', () => {
                fab.classList.remove('active');
            });
            
            // FAB menu items
            document.querySelectorAll('.fab-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    this.handleFabAction(action);
                });
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    setupDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.updateDarkModeIcon(true);
        }
        
        // Listen for system preference changes
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('darkMode')) {
                // Only apply if user hasn't manually set preference
                const isSystemDark = e.matches;
                document.body.classList.toggle('dark-mode', isSystemDark);
                this.updateDarkModeIcon(isSystemDark);
            }
        });
    }

    toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.updateDarkModeIcon(isDark);
        window.showToast(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'info');
    }

    updateDarkModeIcon(isDark) {
        const icon = document.getElementById('darkModeIcon');
        if (!icon) return;
        
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
        
        // Check URL hash on load
        if (window.location.hash) {
            const section = window.location.hash.substring(1);
            this.switchSection(section, false);
        }
    }

    initializeSections() {
        // Initialize all sections that might need setup
        const sections = {
            'home': () => this.initializeHomeSection(),
            'students': () => this.initializeStudentsSection(),
            'add-student': () => this.initializeAddStudentSection(),
            'analytics': () => this.initializeAnalyticsSection()
        };
        
        // Initialize current section immediately
        if (sections[this.currentSection]) {
            sections[this.currentSection]();
        }
        
        // Listen for section changes
        window.addEventListener('dashboard:section-changed', (e) => {
            const section = e.detail.section;
            if (sections[section]) {
                sections[section]();
            }
        });
    }

    initializeHomeSection() {
        console.log('Dashboard: Initializing home section...');
        window.dispatchEvent(new CustomEvent('dashboard:home-loaded'));
    }

    initializeStudentsSection() {
        console.log('Dashboard: Initializing students section...');
        window.dispatchEvent(new CustomEvent('dashboard:students-loaded'));
    }

    initializeAddStudentSection() {
        console.log('Dashboard: Initializing add student section...');
        window.dispatchEvent(new CustomEvent('dashboard:add-student-loaded'));
    }

    initializeAnalyticsSection() {
        console.log('Dashboard: Initializing analytics section...');
        window.dispatchEvent(new CustomEvent('dashboard:analytics-loaded'));
    }

    switchSection(section, updateHistory = true) {
        // Validate section exists
        const targetSection = document.getElementById(section);
        if (!targetSection) {
            console.warn(`Section ${section} not found`);
            return;
        }

        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show target section
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

        // Dispatch section change event
        window.dispatchEvent(new CustomEvent('dashboard:section-changed', {
            detail: { section }
        }));
        
        // Initialize section-specific components
        this.initializeSection(section);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`Dashboard: Switched to ${section} section`);
    }

    initializeSection(section) {
    switch(section) {
        case 'home':
            this.initializeHomeSection();
            break;
        case 'students':
            this.initializeStudentsSection();
            break;
        case 'add-student':
            this.initializeAddStudentSection();
            break;
        case 'analytics':
            this.initializeAnalyticsSection();
            break;
        default:
            console.log(`Dashboard: No special initialization for ${section}`);
    }
}

    updateBreadcrumbs() {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (!breadcrumbs) return;
        
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

    loadCurrentSection() {
        // Load data for current section
        switch(this.currentSection) {
            case 'home':
                this.loadDashboardData();
                break;
            case 'students':
                this.loadStudentsData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
        }
    }

    loadDashboardData() {
        // Trigger data loading for dashboard
        if (window.dashboardCards) {
            window.dashboardCards.refreshDashboard();
        }
    }

    loadStudentsData() {
        // Trigger data loading for students table
        if (window.studentTable) {
            window.studentTable.refreshTable();
        }
    }

    loadAnalyticsData() {
        // Trigger data loading for analytics
        if (window.dashboardCharts) {
            window.dashboardCharts.updateAnalyticsCharts();
        }
    }

    handleGlobalSearch(query) {
        if (!query.trim()) return;
        
        // Search across all sections
        const searchResults = window.studentStorage?.searchStudents(query) || [];
        
        if (searchResults.length > 0) {
            // Switch to students section with search
            this.switchSection('students');
            
            // Set search in table
            const tableSearch = document.getElementById('tableSearch');
            if (tableSearch) {
                tableSearch.value = query;
            }
            
            // Trigger table search
            if (window.studentTable) {
                window.studentTable.searchQuery = query;
                window.studentTable.refreshTable();
            }
            
            window.showToast(`Found ${searchResults.length} students`, 'info');
        } else {
            window.showToast('No students found', 'warning');
        }
    }

    refreshDashboard() {
        // Refresh all dashboard components
        if (window.dashboardCards) {
            window.dashboardCards.refreshDashboard();
        }
        
        if (window.dashboardCharts) {
            window.dashboardCharts.updateAnalyticsCharts();
        }
        
        if (window.studentTable) {
            window.studentTable.refreshTable();
        }
        
        window.showToast('Dashboard refreshed', 'success');
    }

    exportDashboard() {
        // Export dashboard data
        if (window.dashboardCards) {
            window.dashboardCards.exportDashboardData();
        }
    }

    handleFabAction(action) {
        switch(action) {
            case 'add-student':
                this.switchSection('add-student');
                break;
            case 'quick-report':
                if (window.dashboardCards) {
                    window.dashboardCards.generateQuickReport();
                }
                break;
            case 'settings':
                this.switchSection('settings');
                break;
        }
        
        // Close FAB
        const fab = document.getElementById('fab');
        if (fab) {
            fab.classList.remove('active');
        }
    }

    showNotifications() {
        // Show notifications panel
        window.showToast('Notifications feature coming soon', 'info');
        // TODO: Implement notifications panel
    }

    closeAllModals() {
        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
        
        // Close FAB
        const fab = document.getElementById('fab');
        if (fab) {
            fab.classList.remove('active');
        }
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

    // Queue actions if not initialized yet
    queueAction(action) {
        if (!this.isInitialized) {
            this.pendingActions.push(action);
            return false;
        }
        return true;
    }

    executePendingActions() {
        while (this.pendingActions.length > 0) {
            const action = this.pendingActions.shift();
            try {
                action();
            } catch (error) {
                console.error('Pending action failed:', error);
            }
        }
    }

    showInitializationError(error) {
        const errorHtml = `
            <div class="init-error">
                <h2>Dashboard Initialization Error</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Reload Dashboard</button>
                <p class="error-hint">Check console (F12) for details</p>
            </div>
        `;
        
        // Add error styles
        const style = document.createElement('style');
        style.textContent = `
            .init-error {
                padding: 40px;
                text-align: center;
                background: white;
                border-radius: 10px;
                margin: 100px auto;
                max-width: 500px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .init-error h2 {
                color: #ef4444;
                margin-bottom: 20px;
            }
            .init-error button {
                padding: 10px 20px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            }
            .error-hint {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
        `;
        
        document.head.appendChild(style);
        document.body.innerHTML = errorHtml;
    }
}

// Initialize dashboard with safety checks
function initializeDashboard() {
    try {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded. Charts will be disabled.');
        }
        
        // Initialize dashboard
        window.dashboard = new Dashboard();
        
        // Export helper methods
        window.formatNumber = window.dashboard.formatNumber.bind(window.dashboard);
        window.formatDate = window.dashboard.formatDate.bind(window.dashboard);
        
        console.log('Dashboard: Loaded successfully');
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        
        // Show fallback message
        if (document.body) {
            document.body.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h1>DBU Dashboard</h1>
                    <p>Failed to load dashboard. Please refresh the page.</p>
                    <button onclick="location.reload()">Refresh</button>
                    <p style="margin-top: 20px; color: #666;">
                        Error: ${error.message}
                    </p>
                </div>
            `;
        }
    }
}

// Start initialization when dependencies are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    // DOM already loaded
    setTimeout(initializeDashboard, 0);
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}