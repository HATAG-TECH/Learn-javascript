// Charts Management with Chart.js
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        
        // Listen for updates
        window.addEventListener('charts:update', (e) => {
            this.updateCharts(e.detail.stats);
        });
        
        window.addEventListener('dashboard:analytics-loaded', () => {
            this.initializeAnalyticsCharts();
        });
    }

    setupEventListeners() {
        // Department filter
        const deptFilter = document.getElementById('deptFilter');
        if (deptFilter) {
            deptFilter.addEventListener('change', (e) => {
                this.filterDepartmentChart(e.target.value);
            });
        }

        // Trend filter
        const trendFilter = document.getElementById('trendFilter');
        if (trendFilter) {
            trendFilter.addEventListener('change', (e) => {
                this.updatePerformanceChart(e.target.value);
            });
        }

        // Date range
        const applyDateRange = document.getElementById('applyDateRange');
        if (applyDateRange) {
            applyDateRange.addEventListener('click', () => {
                this.applyDateRange();
            });
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.debouncedResize();
        });
    }

    initializeCharts() {
        this.createDepartmentChart();
        this.createGenderChart();
    }

    initializeAnalyticsCharts() {
        this.createPerformanceChart();
        this.createDeptPerformanceChart();
        this.createEnrollmentChart();
        this.createStatusChart();
    }

    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;
        
        const stats = window.studentStorage.getStatistics();
        const departments = Object.keys(stats.byDepartment || {});
        const counts = Object.values(stats.byDepartment || {});
        
        // Color palette for departments
        const colors = this.generateDepartmentColors(departments.length);
        
        this.charts.department = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: departments,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }

    createGenderChart() {
        const ctx = document.getElementById('genderChart');
        if (!ctx) return;
        
        const stats = window.studentStorage.getStatistics();
        const genders = Object.keys(stats.byGender || {});
        const counts = Object.values(stats.byGender || {});
        
        this.charts.gender = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: genders,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',    // Male - blue
                        'rgba(236, 72, 153, 0.8)',    // Female - pink
                        'rgba(156, 163, 175, 0.8)'    // Other - gray
                    ],
                    borderColor: 'white',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        const students = window.studentStorage.getAllStudents();
        const gpaData = this.calculateGPATrend(students);
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: gpaData.labels,
                datasets: [{
                    label: 'Average GPA',
                    data: gpaData.values,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 2.5,
                        max: 4.0,
                        title: {
                            display: true,
                            text: 'GPA'
                        },
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Semester'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                }
            }
        });
    }

    createDeptPerformanceChart() {
        const ctx = document.getElementById('deptPerformanceChart');
        if (!ctx) return;
        
        const stats = window.studentStorage.getStatistics();
        const departments = Object.keys(stats.byDepartment || {});
        const avgGPAs = departments.map(dept => {
            const students = window.studentStorage.getAllStudents()
                .filter(s => s.department === dept && s.gpa);
            const avg = students.length > 0 
                ? students.reduce((sum, s) => sum + s.gpa, 0) / students.length
                : 0;
            return parseFloat(avg.toFixed(2));
        });
        
        this.charts.deptPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: [{
                    label: 'Average GPA',
                    data: avgGPAs,
                    backgroundColor: this.generateDepartmentColors(departments.length),
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 4.0,
                        title: {
                            display: true,
                            text: 'GPA'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    createEnrollmentChart() {
        const ctx = document.getElementById('enrollmentChart');
        if (!ctx) return;
        
        const students = window.studentStorage.getAllStudents();
        const enrollmentData = this.calculateEnrollmentTrend(students);
        
        this.charts.enrollment = new Chart(ctx, {
            type: 'line',
            data: {
                labels: enrollmentData.labels,
                datasets: [{
                    label: 'New Enrollments',
                    data: enrollmentData.values,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Students'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    }

    createStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        const stats = window.studentStorage.getStatistics();
        const statuses = Object.keys(stats.byStatus || {});
        const counts = Object.values(stats.byStatus || {});
        
        this.charts.status = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: statuses,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',    // Active - green
                        'rgba(245, 158, 11, 0.8)',    // Inactive - yellow
                        'rgba(139, 92, 246, 0.8)',    // Graduated - purple
                        'rgba(239, 68, 68, 0.8)'      // Suspended - red
                    ],
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateCharts(stats) {
        // Update department chart
        if (this.charts.department) {
            this.charts.department.data.labels = Object.keys(stats.byDepartment || {});
            this.charts.department.data.datasets[0].data = Object.values(stats.byDepartment || {});
            this.charts.department.update();
        }

        // Update gender chart
        if (this.charts.gender) {
            this.charts.gender.data.labels = Object.keys(stats.byGender || {});
            this.charts.gender.data.datasets[0].data = Object.values(stats.byGender || {});
            this.charts.gender.update();
        }

        // Update all analytics charts
        this.updateAnalyticsCharts();
    }

    updateAnalyticsCharts() {
        const students = window.studentStorage.getAllStudents();
        
        // Update performance chart
        if (this.charts.performance) {
            const gpaData = this.calculateGPATrend(students);
            this.charts.performance.data.labels = gpaData.labels;
            this.charts.performance.data.datasets[0].data = gpaData.values;
            this.charts.performance.update();
        }
        
        // Update department performance chart
        if (this.charts.deptPerformance) {
            const stats = window.studentStorage.getStatistics();
            const departments = Object.keys(stats.byDepartment || {});
            const avgGPAs = departments.map(dept => {
                const deptStudents = students.filter(s => s.department === dept && s.gpa);
                const avg = deptStudents.length > 0 
                    ? deptStudents.reduce((sum, s) => sum + s.gpa, 0) / deptStudents.length
                    : 0;
                return parseFloat(avg.toFixed(2));
            });
            
            this.charts.deptPerformance.data.labels = departments;
            this.charts.deptPerformance.data.datasets[0].data = avgGPAs;
            this.charts.deptPerformance.update();
        }
        
        // Update enrollment chart
        if (this.charts.enrollment) {
            const enrollmentData = this.calculateEnrollmentTrend(students);
            this.charts.enrollment.data.labels = enrollmentData.labels;
            this.charts.enrollment.data.datasets[0].data = enrollmentData.values;
            this.charts.enrollment.update();
        }
        
        // Update status chart
        if (this.charts.status) {
            const stats = window.studentStorage.getStatistics();
            this.charts.status.data.labels = Object.keys(stats.byStatus || {});
            this.charts.status.data.datasets[0].data = Object.values(stats.byStatus || {});
            this.charts.status.update();
        }
    }

    filterDepartmentChart(filter) {
        if (!this.charts.department) return;
        
        const stats = window.studentStorage.getStatistics();
        let departments = Object.keys(stats.byDepartment || {});
        let counts = Object.values(stats.byDepartment || {});
        
        if (filter !== 'all') {
            // Highlight selected department
            const index = departments.indexOf(filter);
            if (index !== -1) {
                const colors = departments.map((_, i) => 
                    i === index ? this.generateDepartmentColors(1)[0] : 'rgba(200, 200, 200, 0.3)'
                );
                this.charts.department.data.datasets[0].backgroundColor = colors;
            }
        } else {
            // Reset to normal colors
            this.charts.department.data.datasets[0].backgroundColor = 
                this.generateDepartmentColors(departments.length);
        }
        
        this.charts.department.update();
    }

    updatePerformanceChart(type) {
        const students = window.studentStorage.getAllStudents();
        
        if (type === 'gpa') {
            const gpaData = this.calculateGPATrend(students);
            this.charts.performance.data.labels = gpaData.labels;
            this.charts.performance.data.datasets[0].data = gpaData.values;
            this.charts.performance.data.datasets[0].label = 'Average GPA';
            this.charts.performance.options.scales.y.title.text = 'GPA';
        } else if (type === 'attendance') {
            // Mock attendance data - in real app, this would come from database
            const attendanceData = this.calculateAttendanceTrend(students);
            this.charts.performance.data.labels = attendanceData.labels;
            this.charts.performance.data.datasets[0].data = attendanceData.values;
            this.charts.performance.data.datasets[0].label = 'Attendance Rate';
            this.charts.performance.options.scales.y.title.text = 'Percentage';
            this.charts.performance.options.scales.y.max = 100;
        }
        
        this.charts.performance.update();
    }

    applyDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            window.showToast('Please select both start and end dates', 'warning');
            return;
        }
        
        // Filter students by enrollment date
        const filteredStudents = window.studentStorage.getAllStudents().filter(student => {
            const enrollDate = new Date(student.enrollmentDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return enrollDate >= start && enrollDate <= end;
        });
        
        // Update charts with filtered data
        const stats = this.calculateStatsForPeriod(filteredStudents);
        this.updateCharts(stats);
        
        window.showToast(`Showing data from ${startDate} to ${endDate}`, 'info');
    }

    // Helper Methods
    generateDepartmentColors(count) {
        const baseColors = [
            'rgba(99, 102, 241, 0.8)',   // Primary
            'rgba(59, 130, 246, 0.8)',   // Info
            'rgba(16, 185, 129, 0.8)',   // Success
            'rgba(245, 158, 11, 0.8)',   // Warning
            'rgba(236, 72, 153, 0.8)',   // Pink
            'rgba(139, 92, 246, 0.8)',   // Purple
            'rgba(20, 184, 166, 0.8)',   // Teal
            'rgba(249, 115, 22, 0.8)'    // Orange
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    calculateGPATrend(students) {
        // Mock GPA trend data - in real app, this would come from historical data
        const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
        const values = [3.2, 3.4, 3.5, 3.6, 3.7, 3.8];
        
        // Calculate actual average GPA per semester if we had the data
        // For now, we'll use mock data with some variation
        return { labels, values };
    }

    calculateEnrollmentTrend(students) {
        // Group students by enrollment month
        const monthlyEnrollments = {};
        
        students.forEach(student => {
            const date = new Date(student.enrollmentDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyEnrollments[monthYear] = (monthlyEnrollments[monthYear] || 0) + 1;
        });
        
        // Sort by date
        const sortedEntries = Object.entries(monthlyEnrollments).sort((a, b) => a[0].localeCompare(b[0]));
        
        // Get last 12 months
        const last12Months = sortedEntries.slice(-12);
        
        const labels = last12Months.map(([date]) => {
            const [year, month] = date.split('-');
            return `${this.getMonthName(month)} ${year}`;
        });
        
        const values = last12Months.map(([, count]) => count);
        
        return { labels, values };
    }

    calculateAttendanceTrend(students) {
        // Mock attendance data
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
        const values = [85, 88, 87, 90, 92, 91];
        return { labels, values };
    }

    calculateStatsForPeriod(students) {
        // Calculate statistics for a filtered set of students
        const byDept = students.reduce((acc, student) => {
            acc[student.department] = (acc[student.department] || 0) + 1;
            return acc;
        }, {});
        
        const byGender = students.reduce((acc, student) => {
            acc[student.gender] = (acc[student.gender] || 0) + 1;
            return acc;
        }, {});
        
        const byStatus = students.reduce((acc, student) => {
            acc[student.status] = (acc[student.status] || 0) + 1;
            return acc;
        }, {});
        
        const totalGPA = students.reduce((sum, student) => sum + (student.gpa || 0), 0);
        const avgGPA = students.length > 0 ? totalGPA / students.length : 0;
        
        return {
            total: students.length,
            byDepartment: byDept,
            byGender: byGender,
            byStatus: byStatus,
            averageGPA: avgGPA.toFixed(2),
            activeToday: 0 // Would need last activity data
        };
    }

    getMonthName(monthNumber) {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return months[parseInt(monthNumber) - 1] || '';
    }

    debouncedResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.resize();
            });
        }, 250);
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCharts = new DashboardCharts();
});