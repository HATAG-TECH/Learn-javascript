// charts.js - Complete Data Visualization with Chart.js
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCustomTooltip();
        this.initializeCharts();
        
        // Listen for updates
        window.addEventListener('charts:update', (e) => {
            this.updateCharts(e.detail.stats);
        });
        
        window.addEventListener('dashboard:analytics-loaded', () => {
            this.initializeAnalyticsCharts();
        });
        
        window.addEventListener('dashboard:home-loaded', () => {
            this.updateChartContainers();
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

destroyChart(chartId) {
        if (this.charts[chartId]) {
            try {
                this.charts[chartId].destroy();
                this.charts[chartId] = null;
                console.log(`DashboardCharts: Destroyed ${chartId}`);
            } catch (error) {
                console.warn(`DashboardCharts: Failed to destroy ${chartId}:`, error);
            }
        }
    }

    // FIXED: Check if chart exists before creating
    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) {
            console.log('DashboardCharts: departmentChart canvas not found');
            return;
        }
        
        // Destroy existing chart first
        this.destroyChart('departmentChart');
        
        this.showChartLoading('departmentChart');
        
        try {
            const stats = window.studentStorage?.getStatistics();
            if (!stats) {
                console.warn('DashboardCharts: No statistics available');
                this.hideChartLoading('departmentChart');
                return;
            }
            
            const departments = Object.keys(stats.byDepartment || {});
            const counts = Object.values(stats.byDepartment || {});
            
            if (departments.length === 0) {
                this.showChartError('departmentChart', 'No department data available');
                return;
            }
            
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
            
            this.createLegend('departmentChart');
            this.hideChartLoading('departmentChart');
            console.log('DashboardCharts: Department chart created ✓');
            
        } catch (error) {
            console.error('Department chart error:', error);
            this.showChartError('departmentChart', 'Failed to create department chart');
        }
    }

    createGenderChart() {
        const ctx = document.getElementById('genderChart');
        if (!ctx) {
            console.log('DashboardCharts: genderChart canvas not found');
            return;
        }
        
        // Destroy existing chart first
        this.destroyChart('genderChart');
        
        this.showChartLoading('genderChart');
        
        try {
            const stats = window.studentStorage?.getStatistics();
            if (!stats) {
                console.warn('DashboardCharts: No statistics available');
                this.hideChartLoading('genderChart');
                return;
            }
            
            const genders = Object.keys(stats.byGender || {});
            const counts = Object.values(stats.byGender || {});
            
            if (genders.length === 0) {
                this.showChartError('genderChart', 'No gender data available');
                return;
            }
            
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
            
            this.hideChartLoading('genderChart');
            console.log('DashboardCharts: Gender chart created ✓');
            
        } catch (error) {
            console.error('Gender chart error:', error);
            this.showChartError('genderChart', 'Failed to create gender chart');
        }
    }

    setupCustomTooltip() {
        Chart.register({
            id: 'customTooltip',
            beforeDraw: (chart) => {
                const tooltip = chart.tooltip;
                if (!tooltip || !tooltip.opacity) return;
                
                const ctx = chart.ctx;
                const tooltipModel = tooltip;
                
                // Tooltip background
                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
                ctx.lineWidth = 1;
                
                // Draw rounded rectangle
                const x = tooltipModel.caretX;
                const y = tooltipModel.caretY;
                const width = tooltipModel.width;
                const height = tooltipModel.height;
                const radius = 8;
                
                ctx.roundRect(x - width / 2, y - height - 10, width, height, radius);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    initializeCharts() {
        const deptChart = document.getElementById('departmentChart');
        const genderChart = document.getElementById('genderChart');
        
        if (deptChart) {
            this.createDepartmentChart();
        }
        
        if (genderChart) {
            this.createGenderChart();
        }
    }

    initializeAnalyticsCharts() {
        const charts = [
            'performanceChart',
            'deptPerformanceChart',
            'enrollmentChart',
            'statusChart'
        ];
        
        charts.forEach(chartId => {
            if (document.getElementById(chartId)) {
                this[`create${chartId.charAt(0).toUpperCase() + chartId.slice(1).replace('Chart', '')}Chart`]();
            }
        });
    }




    refreshAllCharts() {
        console.log('DashboardCharts: Refreshing all charts...');
        
        // Destroy all existing charts
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
        
        // Recreate charts
        this.initializeCharts();
        this.initializeAnalyticsCharts();
    }
}


    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;
        
        this.showChartLoading('departmentChart');
        
        try {
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
            
            this.createLegend('departmentChart');
            this.hideChartLoading('departmentChart');
        } catch (error) {
            this.showChartError('departmentChart', 'Failed to create department chart');
            console.error('Department chart error:', error);
        }
    }

    createGenderChart() {
        const ctx = document.getElementById('genderChart');
        if (!ctx) return;
        
        this.showChartLoading('genderChart');
        
        try {
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
            
            this.hideChartLoading('genderChart');
        } catch (error) {
            this.showChartError('genderChart', 'Failed to create gender chart');
            console.error('Gender chart error:', error);
        }
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        this.showChartLoading('performanceChart');
        
        try {
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
            
            this.hideChartLoading('performanceChart');
        } catch (error) {
            this.showChartError('performanceChart', 'Failed to create performance chart');
            console.error('Performance chart error:', error);
        }
    }

    createDeptPerformanceChart() {
        const ctx = document.getElementById('deptPerformanceChart');
        if (!ctx) return;
        
        this.showChartLoading('deptPerformanceChart');
        
        try {
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
            
            this.hideChartLoading('deptPerformanceChart');
        } catch (error) {
            this.showChartError('deptPerformanceChart', 'Failed to create department performance chart');
            console.error('Dept performance chart error:', error);
        }
    }

    createEnrollmentChart() {
        const ctx = document.getElementById('enrollmentChart');
        if (!ctx) return;
        
        this.showChartLoading('enrollmentChart');
        
        try {
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
            
            this.hideChartLoading('enrollmentChart');
        } catch (error) {
            this.showChartError('enrollmentChart', 'Failed to create enrollment chart');
            console.error('Enrollment chart error:', error);
        }
    }

    createStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        this.showChartLoading('statusChart');
        
        try {
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
            
            this.hideChartLoading('statusChart');
        } catch (error) {
            this.showChartError('statusChart', 'Failed to create status chart');
            console.error('Status chart error:', error);
        }
    }

    updateCharts(stats) {
        // Update department chart
        if (this.charts.department) {
            this.charts.department.data.labels = Object.keys(stats.byDepartment || {});
            this.charts.department.data.datasets[0].data = Object.values(stats.byDepartment || {});
            this.charts.department.update();
            this.createLegend('departmentChart');
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

    // === NEW ENHANCED METHODS ===

    createLegend(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return;
        
        const legendContainer = document.getElementById(`${chartId}-legend`);
        if (!legendContainer) return;
        
        const labels = chart.data.labels || [];
        const datasets = chart.data.datasets || [];
        
        legendContainer.innerHTML = '';
        
        datasets.forEach((dataset, datasetIndex) => {
            if (dataset.label) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                legendItem.dataset.datasetIndex = datasetIndex;
                legendItem.innerHTML = `
                    <span class="legend-color" style="background-color: ${dataset.backgroundColor}"></span>
                    <span>${dataset.label}</span>
                `;
                
                legendItem.addEventListener('click', (e) => {
                    const ci = chart;
                    const meta = ci.getDatasetMeta(datasetIndex);
                    meta.hidden = meta.hidden === null ? !ci.data.datasets[datasetIndex].hidden : null;
                    ci.update();
                    
                    // Update legend item state
                    e.currentTarget.classList.toggle('hidden', meta.hidden);
                });
                
                legendContainer.appendChild(legendItem);
            }
        });
    }

    exportChart(chartId, format = 'png') {
        const chart = this.charts[chartId];
        if (!chart) {
            window.showToast('Chart not found', 'error');
            return;
        }
        
        const canvas = chart.canvas;
        
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = `dbu_chart_${chartId}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `dbu_chart_${chartId}_${new Date().toISOString().split('T')[0]}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        } else if (format === 'svg') {
            window.showToast('SVG export requires additional setup', 'info');
        }
        
        window.showToast(`Chart exported as ${format.toUpperCase()}`, 'success');
    }

    showChartLoading(chartId) {
        const container = document.getElementById(chartId)?.parentElement;
        if (!container) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chart-loading';
        loadingDiv.id = `${chartId}-loading`;
        loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
        container.appendChild(loadingDiv);
    }

    hideChartLoading(chartId) {
        const loadingDiv = document.getElementById(`${chartId}-loading`);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showChartError(chartId, message) {
        const container = document.getElementById(chartId)?.parentElement;
        if (!container) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chart-error';
        errorDiv.id = `${chartId}-error`;
        errorDiv.innerHTML = `
            <svg class="error-icon"><use href="assets/icons/alert-icon.svg#alert"></use></svg>
            <p class="error-message">${message}</p>
            <button class="retry-btn" onclick="window.dashboardCharts.retryChart('${chartId}')">Retry</button>
        `;
        container.appendChild(errorDiv);
    }

    retryChart(chartId) {
        const errorDiv = document.getElementById(`${chartId}-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
        
        this.showChartLoading(chartId);
        
        setTimeout(() => {
            this.hideChartLoading(chartId);
            this.initializeChart(chartId);
        }, 1000);
    }

    initializeChart(chartId) {
        try {
            this.hideChartError(chartId);
            
            switch(chartId) {
                case 'departmentChart':
                    this.createDepartmentChart();
                    break;
                case 'genderChart':
                    this.createGenderChart();
                    break;
                case 'performanceChart':
                    this.createPerformanceChart();
                    break;
                case 'deptPerformanceChart':
                    this.createDeptPerformanceChart();
                    break;
                case 'enrollmentChart':
                    this.createEnrollmentChart();
                    break;
                case 'statusChart':
                    this.createStatusChart();
                    break;
            }
        } catch (error) {
            this.showChartError(chartId, 'Failed to load chart data');
            console.error(`Chart ${chartId} error:`, error);
        }
    }

    hideChartError(chartId) {
        const errorDiv = document.getElementById(`${chartId}-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    updateChartContainers() {
        // Update department chart container
        const deptChartContainer = document.getElementById('departmentChart')?.parentElement;
        if (deptChartContainer && !deptChartContainer.querySelector('.chart-wrapper')) {
            deptChartContainer.innerHTML = `
                <div class="chart-header">
                    <div>
                        <h3 class="chart-title">Students by Department</h3>
                        <p class="chart-subtitle">Distribution across academic departments</p>
                    </div>
                    <div class="chart-controls">
                        <select class="chart-filter" id="deptFilter">
                            <option value="all">All Departments</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Electronics">Electronics</option>
                        </select>
                        <div class="chart-export">
                            <button class="export-btn" onclick="window.dashboardCharts.exportChart('departmentChart', 'png')">
                                <svg><use href="assets/icons/download-icon.svg#download"></use></svg>
                                PNG
                            </button>
                        </div>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas id="departmentChart"></canvas>
                    <div class="chart-legend" id="departmentChart-legend"></div>
                </div>
            `;
            
            // Re-attach event listener
            const newDeptFilter = document.getElementById('deptFilter');
            if (newDeptFilter) {
                newDeptFilter.addEventListener('change', (e) => {
                    this.filterDepartmentChart(e.target.value);
                });
            }
        }
    }

    // === ORIGINAL HELPER METHODS ===

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
        this.createLegend('departmentChart');
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
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) {
            window.showToast('Please select both start and end dates', 'warning');
            return;
        }
        
        const filteredStudents = window.studentStorage.getAllStudents().filter(student => {
            const enrollDate = new Date(student.enrollmentDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return enrollDate >= start && enrollDate <= end;
        });
        
        const stats = this.calculateStatsForPeriod(filteredStudents);
        this.updateCharts(stats);
        
        window.showToast(`Showing data from ${startDate} to ${endDate}`, 'info');
    }

    generateDepartmentColors(count) {
        const baseColors = [
            'rgba(99, 102, 241, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(249, 115, 22, 0.8)'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    calculateGPATrend(students) {
        const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
        const values = [3.2, 3.4, 3.5, 3.6, 3.7, 3.8];
        return { labels, values };
    }

    calculateEnrollmentTrend(students) {
        const monthlyEnrollments = {};
        
        students.forEach(student => {
            const date = new Date(student.enrollmentDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyEnrollments[monthYear] = (monthlyEnrollments[monthYear] || 0) + 1;
        });
        
        const sortedEntries = Object.entries(monthlyEnrollments).sort((a, b) => a[0].localeCompare(b[0]));
        const last12Months = sortedEntries.slice(-12);
        
        const labels = last12Months.map(([date]) => {
            const [year, month] = date.split('-');
            return `${this.getMonthName(month)} ${year}`;
        });
        
        const values = last12Months.map(([, count]) => count);
        
        return { labels, values };
    }

    calculateAttendanceTrend(students) {
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
        const values = [85, 88, 87, 90, 92, 91];
        return { labels, values };
    }

    calculateStatsForPeriod(students) {
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
            activeToday: 0
        };
    }

    getMonthName(monthNumber) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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