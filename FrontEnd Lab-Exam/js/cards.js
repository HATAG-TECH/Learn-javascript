// Dashboard Cards Management
class DashboardCards {
    constructor() {
        this.kpiCards = [];
        this.activityItems = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        
        // Listen for updates
        window.addEventListener('students:updated', () => {
            this.refreshDashboard();
        });
        
        window.addEventListener('dashboard:home-loaded', () => {
            this.refreshDashboard();
        });
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
                window.showToast('Dashboard refreshed', 'info');
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDashboardData();
            });
        }

        // View all activity
        const viewAllActivity = document.getElementById('viewAllActivity');
        if (viewAllActivity) {
            viewAllActivity.addEventListener('click', () => {
                this.showAllActivities();
            });
        }

        // Quick actions from FAB
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="quick-report"]')) {
                this.generateQuickReport();
            }
        });
    }

    loadDashboardData() {
        const stats = window.studentStorage.getStatistics();
        const activities = window.studentStorage.getActivities(5);
        
        this.createKPICards(stats);
        this.createActivityList(activities);
        this.updateCharts(stats);
    }

    createKPICards(stats) {
        this.kpiCards = [
            {
                id: 'total-students',
                title: 'Total Students',
                value: stats.total,
                icon: 'users-icon.svg#users',
                color: 'primary',
                change: '+12%',
                trend: 'up',
                description: 'All registered students'
            },
            {
                id: 'active-today',
                title: 'Active Today',
                value: stats.activeToday,
                icon: 'activity-icon.svg#activity',
                color: 'success',
                change: '+5',
                trend: 'up',
                description: 'Students active today'
            },
            {
                id: 'avg-gpa',
                title: 'Average GPA',
                value: stats.averageGPA,
                icon: 'award-icon.svg#award',
                color: 'warning',
                change: '+0.2',
                trend: 'up',
                description: 'Overall academic performance'
            },
            {
                id: 'departments',
                title: 'Departments',
                value: Object.keys(stats.byDepartment || {}).length,
                icon: 'building-icon.svg#building',
                color: 'info',
                change: '+1',
                trend: 'up',
                description: 'Active departments'
            }
        ];
        
        this.renderKPICards();
    }

    renderKPICards() {
        const kpiGrid = document.getElementById('kpiGrid');
        if (!kpiGrid) return;
        
        kpiGrid.innerHTML = '';
        
        this.kpiCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `kpi-card ${card.color}`;
            cardElement.innerHTML = `
                <div class="card-icon">
                    <svg><use href="assets/icons/${card.icon}"></use></svg>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${card.title}</h3>
                    <div class="card-value">
                        <span class="value">${card.value}</span>
                        <span class="trend ${card.trend}">
                            <svg><use href="assets/icons/${card.trend === 'up' ? 'trend-up-icon.svg#trend-up' : 'trend-down-icon.svg#trend-down'}"></use></svg>
                            ${card.change}
                        </span>
                    </div>
                    <p class="card-description">${card.description}</p>
                </div>
                <div class="card-sparkline" id="sparkline-${card.id}"></div>
            `;
            
            kpiGrid.appendChild(cardElement);
            
            // Add click event to navigate to relevant section
            if (card.id === 'total-students') {
                cardElement.style.cursor = 'pointer';
                cardElement.addEventListener('click', () => {
                    window.dashboard.switchSection('students');
                });
            }
        });
        
        // Animate counters
        this.animateCounters();
    }

    animateCounters() {
        const counters = document.querySelectorAll('.card-value .value');
        
        counters.forEach(counter => {
            const target = parseFloat(counter.textContent);
            if (!isNaN(target)) {
                this.animateValue(counter, 0, target, 1500);
            }
        });
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            const value = start + (end - start) * ease;
            element.textContent = Math.round(value).toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    createActivityList(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item empty">
                    <div class="activity-icon">
                        <svg><use href="assets/icons/info-icon.svg#info"></use></svg>
                    </div>
                    <div class="activity-content">
                        <p>No recent activity</p>
                    </div>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.action}">
                    <svg><use href="assets/icons/${this.getActivityIcon(activity.action)}"></use></svg>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.details}</p>
                    <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
                </div>
                <button class="activity-action" data-id="${activity.studentId}">
                    <svg><use href="assets/icons/eye-icon.svg#eye"></use></svg>
                </button>
            </div>
        `).join('');
        
        // Add event listeners to view buttons
        activityList.querySelectorAll('.activity-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.currentTarget.dataset.id;
                window.studentTable.viewStudentDetails(studentId);
            });
        });
    }

    getActivityIcon(action) {
        const icons = {
            'added': 'user-plus-icon.svg#user-plus',
            'updated': 'edit-icon.svg#edit',
            'deleted': 'trash-icon.svg#trash'
        };
        return icons[action] || 'activity-icon.svg#activity';
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    updateCharts(stats) {
        // This will be called by charts.js
        window.dispatchEvent(new CustomEvent('charts:update', { 
            detail: { stats } 
        }));
    }

    refreshDashboard() {
        const stats = window.studentStorage.getStatistics();
        const activities = window.studentStorage.getActivities(5);
        
        this.createKPICards(stats);
        this.createActivityList(activities);
        this.updateCharts(stats);
    }

    showAllActivities() {
        const allActivities = window.studentStorage.getActivities(50);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>All Activities</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="activities-container">
                        ${allActivities.map(activity => `
                            <div class="activity-item detailed">
                                <div class="activity-icon ${activity.action}">
                                    <svg><use href="assets/icons/${this.getActivityIcon(activity.action)}"></use></svg>
                                </div>
                                <div class="activity-content">
                                    <p class="activity-text">${activity.details}</p>
                                    <div class="activity-meta">
                                        <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
                                        <span class="activity-id">ID: ${activity.studentId}</span>
                                    </div>
                                </div>
                                <button class="activity-action" data-id="${activity.studentId}">
                                    <svg><use href="assets/icons/eye-icon.svg#eye"></use></svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.querySelectorAll('.activity-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.currentTarget.dataset.id;
                modal.remove();
                window.studentTable.viewStudentDetails(studentId);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    exportDashboardData() {
        const stats = window.studentStorage.getStatistics();
        const data = {
            timestamp: new Date().toISOString(),
            summary: {
                totalStudents: stats.total,
                averageGPA: stats.averageGPA,
                activeToday: stats.activeToday,
                departments: Object.keys(stats.byDepartment || {}).length
            },
            byDepartment: stats.byDepartment,
            byGender: stats.byGender,
            byStatus: stats.byStatus
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `dbu_dashboard_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.showToast('Dashboard data exported', 'success');
    }

    generateQuickReport() {
        const stats = window.studentStorage.getStatistics();
        const report = `
DBU Student Management Report
Generated: ${new Date().toLocaleString()}

SUMMARY:
--------
Total Students: ${stats.total}
Average GPA: ${stats.averageGPA}
Active Today: ${stats.activeToday}
Departments: ${Object.keys(stats.byDepartment || {}).length}

DEPARTMENT DISTRIBUTION:
------------------------
${Object.entries(stats.byDepartment || {}).map(([dept, count]) => 
    `${dept}: ${count} students (${((count/stats.total)*100).toFixed(1)}%)`
).join('\n')}

GENDER DISTRIBUTION:
--------------------
${Object.entries(stats.byGender || {}).map(([gender, count]) => 
    `${gender}: ${count} students (${((count/stats.total)*100).toFixed(1)}%)`
).join('\n')}

STATUS DISTRIBUTION:
--------------------
${Object.entries(stats.byStatus || {}).map(([status, count]) => 
    `${status}: ${count} students (${((count/stats.total)*100).toFixed(1)}%)`
).join('\n')}
        `.trim();
        
        // Create report modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Quick Report</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <pre class="report-content">${report}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="copyReport">Copy to Clipboard</button>
                    <button class="btn btn-primary" id="downloadReport">Download Report</button>
                    <button class="btn btn-secondary close-modal">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        
        modal.querySelector('#copyReport').addEventListener('click', () => {
            navigator.clipboard.writeText(report).then(() => {
                window.showToast('Report copied to clipboard', 'success');
            });
        });
        
        modal.querySelector('#downloadReport').addEventListener('click', () => {
            const blob = new Blob([report], { type: 'text/plain' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `dbu_report_${new Date().toISOString().split('T')[0]}.txt`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.showToast('Report downloaded', 'success');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// Initialize cards when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCards = new DashboardCards();
});