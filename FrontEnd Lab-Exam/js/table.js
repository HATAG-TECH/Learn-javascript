// Student Table Management
class StudentTable {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortColumn = 'rollNo';
        this.sortDirection = 'asc';
        this.selectedStudents = new Set();
        this.searchQuery = '';
        this.filters = {};
        this.isCardView = false;
        this.init();
    }

    init() {
        console.log('StudentTable: Initializing...');
        
        // Wait for DOM and dependencies
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            setTimeout(() => this.setup(), 100);
        }
    }

    setup() {
        console.log('StudentTable: Setting up...');
        
        try {
            // Check if table exists
            const table = document.getElementById('studentsTable');
            if (!table) {
                console.warn('StudentTable: Table element not found');
                return;
            }
            
            this.setupEventListeners();
            this.initializeTable();
            
            // Listen for storage updates
            window.addEventListener('students:updated', () => {
                this.refreshTable();
            });
            
            // Listen for table section load
            window.addEventListener('dashboard:students-loaded', () => {
                this.initializeTable();
            });
            
            console.log('StudentTable: Ready ✓');
            
        } catch (error) {
            console.error('StudentTable: Setup failed:', error);
        }
    }

    setupEventListeners() {
        console.log('StudentTable: Setting up event listeners...');
        
        // Search functionality
        const tableSearch = document.getElementById('tableSearch');
        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.refreshTable();
            });
        }

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.refreshTable();
            });
        }

        // Entries per page
        const entriesSelect = document.getElementById('entriesPerPage');
        if (entriesSelect) {
            entriesSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.refreshTable();
            });
        }

        // Sort columns - add null checks
        const sortableHeaders = document.querySelectorAll('#studentsTable th[data-sort]');
        if (sortableHeaders.length > 0) {
            sortableHeaders.forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.sort;
                    this.toggleSort(column);
                });
            });
        }

        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk delete
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.confirmBulkDelete();
            });
        }

        // Add new button
        const addNewBtn = document.getElementById('addNewBtn');
        if (addNewBtn) {
            addNewBtn.addEventListener('click', () => {
                if (window.dashboard) {
                    window.dashboard.switchSection('add-student');
                }
            });
        }

        // Export table
        const exportTableBtn = document.getElementById('exportTableBtn');
        if (exportTableBtn) {
            exportTableBtn.addEventListener('click', () => {
                this.exportTable();
            });
        }

        // Toggle card view
        const toggleCardView = document.getElementById('toggleCardView');
        if (toggleCardView) {
            toggleCardView.addEventListener('click', () => {
                this.toggleViewMode();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (tableSearch) tableSearch.focus();
            }
            
            if (e.key === 'Delete' && this.selectedStudents.size > 0) {
                this.confirmBulkDelete();
            }
        });
    }

    initializeTable() {
        console.log('StudentTable: Initializing table...');
        this.loadTableData();
        this.renderTable();
        this.updateTableInfo();
        this.setupFilters();
    }

    loadTableData() {
        if (!window.studentStorage) {
            console.warn('StudentTable: Storage not available');
            this.allStudents = [];
            this.filteredStudents = [];
            this.paginatedStudents = [];
            return;
        }
        
        this.allStudents = window.studentStorage.getAllStudents();
        this.filteredStudents = window.studentStorage.searchStudents(this.searchQuery, this.filters);
        this.sortTableData();
        this.paginateData();
    }

    sortTableData() {
        // FIXED: Added null checks for .toLowerCase()
        this.filteredStudents.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sortColumn) {
                case 'name':
                    aValue = (a.name || '').toLowerCase();
                    bValue = (b.name || '').toLowerCase();
                    break;
                case 'department':
                    aValue = (a.department || '').toLowerCase();
                    bValue = (b.department || '').toLowerCase();
                    break;
                case 'gender':
                    aValue = (a.gender || '').toLowerCase();
                    bValue = (b.gender || '').toLowerCase();
                    break;
                case 'gpa':
                    aValue = a.gpa || 0;
                    bValue = b.gpa || 0;
                    break;
                case 'status':
                    aValue = (a.status || '').toLowerCase();
                    bValue = (b.status || '').toLowerCase();
                    break;
                case 'rollNo':
                default:
                    aValue = (a.rollNumber || '').toLowerCase();
                    bValue = (b.rollNumber || '').toLowerCase();
                    break;
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    paginateData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
    }

    renderTable() {
        const tbody = document.getElementById('studentsTableBody');
        const tableContainer = document.querySelector('.table-container');
        
        if (!tbody) {
            console.warn('StudentTable: Table body not found');
            return;
        }
        
        if (this.isCardView) {
            this.renderCardView(tbody);
            if (tableContainer) {
                tableContainer.classList.add('card-view');
            }
        } else {
            this.renderTableView(tbody);
            if (tableContainer) {
                tableContainer.classList.remove('card-view');
            }
        }
        
        this.updateSortIndicators();
        this.updateBulkDeleteButton();
        this.updateSelectAllCheckbox();
        this.renderPagination();
    }

    renderTableView(tbody) {
        tbody.innerHTML = '';
        
        if (this.paginatedStudents.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="8">
                        <div class="no-data-message">
                            <svg><use href="assets/icons/users-icon.svg#users"></use></svg>
                            <p>No students found</p>
                            ${this.searchQuery ? '<small>Try a different search term</small>' : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        this.paginatedStudents.forEach(student => {
            const isSelected = this.selectedStudents.has(student.id);
            const row = document.createElement('tr');
            row.dataset.id = student.id;
            if (isSelected) row.classList.add('selected');
            
            // Safe property access
            const studentName = student.name || 'Unknown';
            const rollNumber = student.rollNumber || 'N/A';
            const department = student.department || 'N/A';
            const gender = student.gender || 'N/A';
            const gpa = student.gpa || 'N/A';
            const status = student.status || 'N/A';
            const email = student.email || '';
            
            row.innerHTML = `
                <td class="checkbox-col">
                    <input type="checkbox" class="row-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="roll-no">${rollNumber}</td>
                <td class="student-name">
                    ${student.profilePhoto ? 
                        `<img src="${student.profilePhoto}" alt="${studentName}" class="student-avatar">` : 
                        `<div class="avatar-placeholder">${studentName.charAt(0)}</div>`
                    }
                    <div>
                        <strong>${studentName}</strong>
                        ${email ? `<small class="student-email">${email}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="dept-badge" data-dept="${department}">${department}</span>
                </td>
                <td>
                    <span class="gender-badge ${gender.toLowerCase()}">${gender}</span>
                </td>
                <td>
                    <div class="gpa-indicator">
                        <span class="gpa-value">${gpa}</span>
                        ${student.gpa ? `<div class="gpa-bar" style="width: ${(student.gpa / 4) * 100}%"></div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${status.toLowerCase()}">${status}</span>
                </td>
                <td class="actions-col">
                    <button class="btn-icon edit-btn" data-id="${student.id}" title="Edit">
                        <svg><use href="assets/icons/edit-icon.svg#edit"></use></svg>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${student.id}" title="Delete">
                        <svg><use href="assets/icons/trash-icon.svg#trash"></use></svg>
                    </button>
                    <button class="btn-icon view-btn" data-id="${student.id}" title="View Details">
                        <svg><use href="assets/icons/eye-icon.svg#eye"></use></svg>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to new rows
        this.setupRowEventListeners();
    }

    renderCardView(container) {
        container.innerHTML = '';
        
        if (this.paginatedStudents.length === 0) {
            container.innerHTML = `
                <div class="no-data-card">
                    <svg><use href="assets/icons/users-icon.svg#users"></use></svg>
                    <p>No students found</p>
                    ${this.searchQuery ? '<small>Try a different search term</small>' : ''}
                </div>
            `;
            return;
        }
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        
        this.paginatedStudents.forEach(student => {
            const isSelected = this.selectedStudents.has(student.id);
            const card = document.createElement('div');
            card.className = 'student-card';
            card.dataset.id = student.id;
            if (isSelected) card.classList.add('selected');
            
            // Safe property access
            const studentName = student.name || 'Unknown';
            const rollNumber = student.rollNumber || 'N/A';
            const department = student.department || 'N/A';
            const gpa = student.gpa || 'N/A';
            const status = student.status || 'N/A';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-checkbox">
                        <input type="checkbox" class="row-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="card-avatar">
                        ${student.profilePhoto ? 
                            `<img src="${student.profilePhoto}" alt="${studentName}">` : 
                            `<div class="avatar-placeholder">${studentName.charAt(0)}</div>`
                        }
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon edit-btn" data-id="${student.id}">
                            <svg><use href="assets/icons/edit-icon.svg#edit"></use></svg>
                        </button>
                        <button class="btn-icon delete-btn" data-id="${student.id}">
                            <svg><use href="assets/icons/trash-icon.svg#trash"></use></svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <h4 class="card-name">${studentName}</h4>
                    <div class="card-details">
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/id-icon.svg#id"></use></svg>
                            <span>${rollNumber}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/dept-icon.svg#dept"></use></svg>
                            <span>${department}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/gpa-icon.svg#gpa"></use></svg>
                            <span>GPA: ${gpa}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/status-icon.svg#status"></use></svg>
                            <span class="status-badge ${status.toLowerCase()}">${status}</span>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-text btn-sm view-details-btn" data-id="${student.id}">
                        View Details
                    </button>
                </div>
            `;
            
            cardsContainer.appendChild(card);
        });
        
        container.appendChild(cardsContainer);
        this.setupRowEventListeners();
    }

    setupRowEventListeners() {
        // Row selection
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const studentId = e.target.dataset.id;
                this.toggleStudentSelection(studentId, e.target.checked);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('[data-id]');
                if (target) {
                    const studentId = target.dataset.id;
                    this.editStudent(studentId);
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('[data-id]');
                if (target) {
                    const studentId = target.dataset.id;
                    this.deleteStudent(studentId);
                }
            });
        });

        // View buttons
        document.querySelectorAll('.view-btn, .view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('[data-id]');
                if (target) {
                    const studentId = target.dataset.id;
                    this.viewStudentDetails(studentId);
                }
            });
        });

        // Row click (for selection)
        document.querySelectorAll('#studentsTableBody tr, .student-card').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('input, button, a')) {
                    const studentId = row.dataset.id;
                    const checkbox = row.querySelector('.row-checkbox');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        this.toggleStudentSelection(studentId, checkbox.checked);
                    }
                }
            });
        });
    }

    setupFilters() {
        // Add filter controls dynamically
        // This can be extended with more filter types
    }

    toggleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.refreshTable();
    }

    updateSortIndicators() {
        document.querySelectorAll('#studentsTable th[data-sort]').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                if (th.dataset.sort === this.sortColumn) {
                    icon.className = 'sort-icon';
                    icon.classList.add(this.sortDirection);
                    icon.innerHTML = this.sortDirection === 'asc' ? '↑' : '↓';
                } else {
                    icon.className = 'sort-icon';
                    icon.innerHTML = '';
                }
            }
        });
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.paginatedStudents.forEach(student => {
                if (student.id) {
                    this.selectedStudents.add(student.id);
                }
            });
        } else {
            this.paginatedStudents.forEach(student => {
                if (student.id) {
                    this.selectedStudents.delete(student.id);
                }
            });
        }
        
        this.refreshTable();
    }

    toggleStudentSelection(studentId, selected) {
        if (selected) {
            this.selectedStudents.add(studentId);
        } else {
            this.selectedStudents.delete(studentId);
        }
        
        this.updateBulkDeleteButton();
        this.updateSelectAllCheckbox();
        
        // Update row/card selection styling
        const element = document.querySelector(`[data-id="${studentId}"]`);
        if (element) {
            element.classList.toggle('selected', selected);
        }
    }

    updateBulkDeleteButton() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            const count = this.selectedStudents.size;
            bulkDeleteBtn.disabled = count === 0;
            bulkDeleteBtn.innerHTML = `
                <svg class="btn-icon"><use href="assets/icons/trash-icon.svg#trash"></use></svg>
                Delete Selected (${count})
            `;
        }
    }

    updateSelectAllCheckbox() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            const pageStudents = this.paginatedStudents
                .map(s => s.id)
                .filter(id => id); // Filter out undefined/null
            
            const allSelected = pageStudents.length > 0 && 
                               pageStudents.every(id => this.selectedStudents.has(id));
            
            selectAll.checked = allSelected;
            selectAll.indeterminate = !allSelected && 
                                     pageStudents.some(id => this.selectedStudents.has(id));
        }
    }

    editStudent(studentId) {
        const student = window.studentStorage?.getStudentById(studentId);
        if (student) {
            // Switch to edit mode
            if (window.showToast) {
                window.showToast(`Editing ${student.name || 'student'}`, 'info');
            }
            
            // For now, we'll show a prompt to edit
            // In a full implementation, this would open an edit form
            const newName = prompt('Enter new name:', student.name || '');
            if (newName && newName !== student.name) {
                if (window.studentStorage) {
                    window.studentStorage.updateStudent(studentId, { name: newName });
                    if (window.showToast) {
                        window.showToast('Student updated successfully', 'success');
                    }
                }
            }
        }
    }

    deleteStudent(studentId) {
        const student = window.studentStorage?.getStudentById(studentId);
        if (student) {
            const studentName = student.name || 'this student';
            if (confirm(`Are you sure you want to delete ${studentName}?`)) {
                if (window.studentStorage) {
                    window.studentStorage.deleteStudent(studentId);
                    this.selectedStudents.delete(studentId);
                    if (window.showToast) {
                        window.showToast('Student deleted successfully', 'success');
                    }
                    this.refreshTable();
                }
            }
        }
    }

    confirmBulkDelete() {
        const count = this.selectedStudents.size;
        if (count === 0) return;
        
        if (confirm(`Are you sure you want to delete ${count} selected student(s)?`)) {
            if (window.studentStorage) {
                window.studentStorage.deleteMultipleStudents([...this.selectedStudents]);
                this.selectedStudents.clear();
                if (window.showToast) {
                    window.showToast(`${count} student(s) deleted successfully`, 'success');
                }
                this.refreshTable();
            }
        }
    }

    viewStudentDetails(studentId) {
        const student = window.studentStorage?.getStudentById(studentId);
        if (!student) return;
        
        // Create modal with student details
        const modal = document.createElement('div');
        modal.className = 'student-modal';
        
        // Safe property access
        const studentName = student.name || 'Unknown';
        const rollNumber = student.rollNumber || 'N/A';
        const email = student.email || 'N/A';
        const phone = student.phone || 'N/A';
        const gender = student.gender || 'N/A';
        const department = student.department || 'N/A';
        const status = student.status || 'N/A';
        const gpa = student.gpa || 'N/A';
        const enrollmentDate = student.enrollmentDate ? 
            new Date(student.enrollmentDate).toLocaleDateString() : 'N/A';
        const address = student.address || 'N/A';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Student Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="student-profile">
                        <div class="profile-photo">
                            ${student.profilePhoto ? 
                                `<img src="${student.profilePhoto}" alt="${studentName}">` : 
                                `<div class="avatar-large">${studentName.charAt(0)}</div>`
                            }
                        </div>
                        <div class="profile-info">
                            <h4>${studentName}</h4>
                            <p class="profile-roll">${rollNumber}</p>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${phone}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Gender:</span>
                            <span class="detail-value">${gender}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Department:</span>
                            <span class="detail-value">${department}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-badge ${status.toLowerCase()}">${status}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">GPA:</span>
                            <span class="detail-value">${gpa}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Enrollment Date:</span>
                            <span class="detail-value">${enrollmentDate}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${address}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Close</button>
                    <button class="btn btn-primary edit-student-btn" data-id="${studentId}">Edit</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        const editBtn = modal.querySelector('.edit-student-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                modal.remove();
                this.editStudent(studentId);
            });
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleViewMode() {
        this.isCardView = !this.isCardView;
        const toggleBtn = document.getElementById('toggleCardView');
        
        if (toggleBtn) {
            toggleBtn.innerHTML = `
                <svg class="btn-icon"><use href="${this.isCardView ? 'assets/icons/list-icon.svg#list' : 'assets/icons/grid-icon.svg#grid'}"></use></svg>
                ${this.isCardView ? 'Table View' : 'Card View'}
            `;
        }
        
        this.refreshTable();
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredStudents.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `<button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="${this.currentPage - 1}">Previous</button>`;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) html += '<span class="pagination-ellipsis">...</span>';
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        html += `<button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" data-page="${this.currentPage + 1}">Next</button>`;
        
        pagination.innerHTML = html;
        
        // Add event listeners
        pagination.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.refreshTable();
                }
            });
        });
    }

    updateTableInfo() {
        const tableInfo = document.getElementById('tableInfo');
        if (!tableInfo) return;
        
        const total = this.filteredStudents.length;
        const start = total === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, total);
        
        tableInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;
        
        if (this.searchQuery && this.allStudents.length > 0) {
            tableInfo.textContent += ` (filtered from ${this.allStudents.length} total entries)`;
        }
    }

    refreshTable() {
        this.loadTableData();
        this.renderTable();
        this.updateTableInfo();
    }

    exportTable(format = 'csv') {
        const data = this.filteredStudents.map(student => ({
            'Roll Number': student.rollNumber || 'N/A',
            'Name': student.name || 'Unknown',
            'Email': student.email || 'N/A',
            'Department': student.department || 'N/A',
            'Gender': student.gender || 'N/A',
            'GPA': student.gpa || 'N/A',
            'Status': student.status || 'N/A',
            'Enrollment Date': student.enrollmentDate || 'N/A',
            'Address': student.address || 'N/A'
        }));
        
        if (data.length === 0) {
            if (window.showToast) {
                window.showToast('No data to export', 'warning');
            }
            return;
        }
        
        switch(format) {
            case 'csv':
                this.exportToCSV(data);
                break;
            case 'json':
                this.exportToJSON(data);
                break;
            case 'pdf':
                if (window.showToast) {
                    window.showToast('PDF export requires additional setup', 'info');
                }
                break;
        }
    }

    exportToCSV(data) {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                let cell = row[header] || '';
                cell = cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `dbu_students_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.showToast) {
            window.showToast('CSV exported successfully', 'success');
        }
    }

    exportToJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `dbu_students_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (window.showToast) {
            window.showToast('JSON exported successfully', 'success');
        }
    }
}

// Initialize table with safety checks
function initializeStudentTable() {
    try {
        console.log('StudentTable: Attempting initialization...');
        
        // Check if table exists in DOM
        const tableExists = document.getElementById('studentsTable') !== null;
        
        if (!tableExists) {
            console.log('StudentTable: Table not found in DOM, will initialize when added');
            return null;
        }
        
        // Initialize table
        window.studentTable = new StudentTable();
        console.log('StudentTable: Initialized successfully ✓');
        
        return window.studentTable;
        
    } catch (error) {
        console.error('StudentTable: Failed to initialize:', error);
        return null;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStudentTable);
} else {
    setTimeout(initializeStudentTable, 0);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentTable;
}