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
    }

    setupEventListeners() {
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

        // Sort columns
        document.querySelectorAll('#studentsTable th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                this.toggleSort(column);
            });
        });

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
                window.dashboard.switchSection('add-student');
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
                tableSearch.focus();
            }
            
            if (e.key === 'Delete' && this.selectedStudents.size > 0) {
                this.confirmBulkDelete();
            }
        });
    }

    initializeTable() {
        this.loadTableData();
        this.renderTable();
        this.updateTableInfo();
        this.setupFilters();
    }

    loadTableData() {
        this.allStudents = window.studentStorage.getAllStudents();
        this.filteredStudents = window.studentStorage.searchStudents(this.searchQuery, this.filters);
        this.sortTableData();
        this.paginateData();
    }

    sortTableData() {
        this.filteredStudents.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sortColumn) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'department':
                    aValue = a.department.toLowerCase();
                    bValue = b.department.toLowerCase();
                    break;
                case 'gender':
                    aValue = a.gender.toLowerCase();
                    bValue = b.gender.toLowerCase();
                    break;
                case 'gpa':
                    aValue = a.gpa || 0;
                    bValue = b.gpa || 0;
                    break;
                case 'status':
                    aValue = a.status.toLowerCase();
                    bValue = b.status.toLowerCase();
                    break;
                case 'rollNo':
                default:
                    aValue = a.rollNumber.toLowerCase();
                    bValue = b.rollNumber.toLowerCase();
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
        
        if (this.isCardView) {
            this.renderCardView(tbody);
            tableContainer.classList.add('card-view');
        } else {
            this.renderTableView(tbody);
            tableContainer.classList.remove('card-view');
        }
        
        this.updateSortIndicators();
        this.updateBulkDeleteButton();
        this.updateSelectAllCheckbox();
        this.renderPagination();
    }

    renderTableView(tbody) {
        tbody.innerHTML = '';
        
        this.paginatedStudents.forEach(student => {
            const isSelected = this.selectedStudents.has(student.id);
            const row = document.createElement('tr');
            row.dataset.id = student.id;
            if (isSelected) row.classList.add('selected');
            
            row.innerHTML = `
                <td class="checkbox-col">
                    <input type="checkbox" class="row-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="roll-no">${student.rollNumber}</td>
                <td class="student-name">
                    ${student.profilePhoto ? 
                        `<img src="${student.profilePhoto}" alt="${student.name}" class="student-avatar">` : 
                        `<div class="avatar-placeholder">${student.name.charAt(0)}</div>`
                    }
                    <div>
                        <strong>${student.name}</strong>
                        <small class="student-email">${student.email}</small>
                    </div>
                </td>
                <td>
                    <span class="dept-badge" data-dept="${student.department}">${student.department}</span>
                </td>
                <td>
                    <span class="gender-badge ${student.gender.toLowerCase()}">${student.gender}</span>
                </td>
                <td>
                    <div class="gpa-indicator">
                        <span class="gpa-value">${student.gpa || 'N/A'}</span>
                        ${student.gpa ? `<div class="gpa-bar" style="width: ${(student.gpa / 4) * 100}%"></div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${student.status.toLowerCase()}">${student.status}</span>
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
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        
        this.paginatedStudents.forEach(student => {
            const isSelected = this.selectedStudents.has(student.id);
            const card = document.createElement('div');
            card.className = 'student-card';
            card.dataset.id = student.id;
            if (isSelected) card.classList.add('selected');
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-checkbox">
                        <input type="checkbox" class="row-checkbox" data-id="${student.id}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <div class="card-avatar">
                        ${student.profilePhoto ? 
                            `<img src="${student.profilePhoto}" alt="${student.name}">` : 
                            `<div class="avatar-placeholder">${student.name.charAt(0)}</div>`
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
                    <h4 class="card-name">${student.name}</h4>
                    <div class="card-details">
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/id-icon.svg#id"></use></svg>
                            <span>${student.rollNumber}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/dept-icon.svg#dept"></use></svg>
                            <span>${student.department}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/gpa-icon.svg#gpa"></use></svg>
                            <span>GPA: ${student.gpa || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <svg class="detail-icon"><use href="assets/icons/status-icon.svg#status"></use></svg>
                            <span class="status-badge ${student.status.toLowerCase()}">${student.status}</span>
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
                const studentId = e.target.closest('[data-id]').dataset.id;
                this.editStudent(studentId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.target.closest('[data-id]').dataset.id;
                this.deleteStudent(studentId);
            });
        });

        // View buttons
        document.querySelectorAll('.view-btn, .view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.target.closest('[data-id]').dataset.id;
                this.viewStudentDetails(studentId);
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
            if (th.dataset.sort === this.sortColumn) {
                icon.className = 'sort-icon';
                icon.classList.add(this.sortDirection);
                icon.innerHTML = this.sortDirection === 'asc' ? '↑' : '↓';
            } else {
                icon.className = 'sort-icon';
                icon.innerHTML = '';
            }
        });
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.paginatedStudents.forEach(student => {
                this.selectedStudents.add(student.id);
            });
        } else {
            this.paginatedStudents.forEach(student => {
                this.selectedStudents.delete(student.id);
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
            const pageStudents = this.paginatedStudents.map(s => s.id);
            const allSelected = pageStudents.length > 0 && 
                               pageStudents.every(id => this.selectedStudents.has(id));
            
            selectAll.checked = allSelected;
            selectAll.indeterminate = !allSelected && 
                                     pageStudents.some(id => this.selectedStudents.has(id));
        }
    }

    editStudent(studentId) {
        const student = window.studentStorage.getStudentById(studentId);
        if (student) {
            // Switch to edit mode (could be implemented as a separate form)
            window.showToast(`Editing ${student.name}`, 'info');
            
            // For now, we'll show a prompt to edit
            // In a full implementation, this would open an edit form
            const newName = prompt('Enter new name:', student.name);
            if (newName && newName !== student.name) {
                window.studentStorage.updateStudent(studentId, { name: newName });
                window.showToast('Student updated successfully', 'success');
            }
        }
    }

    deleteStudent(studentId) {
        const student = window.studentStorage.getStudentById(studentId);
        if (student && confirm(`Are you sure you want to delete ${student.name}?`)) {
            window.studentStorage.deleteStudent(studentId);
            this.selectedStudents.delete(studentId);
            window.showToast('Student deleted successfully', 'success');
            this.refreshTable();
        }
    }

    confirmBulkDelete() {
        const count = this.selectedStudents.size;
        if (count === 0) return;
        
        if (confirm(`Are you sure you want to delete ${count} selected student(s)?`)) {
            window.studentStorage.deleteMultipleStudents([...this.selectedStudents]);
            this.selectedStudents.clear();
            window.showToast(`${count} student(s) deleted successfully`, 'success');
            this.refreshTable();
        }
    }

    viewStudentDetails(studentId) {
        const student = window.studentStorage.getStudentById(studentId);
        if (student) {
            // Create modal with student details
            const modal = document.createElement('div');
            modal.className = 'student-modal';
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
                                    `<img src="${student.profilePhoto}" alt="${student.name}">` : 
                                    `<div class="avatar-large">${student.name.charAt(0)}</div>`
                                }
                            </div>
                            <div class="profile-info">
                                <h4>${student.name}</h4>
                                <p class="profile-roll">${student.rollNumber}</p>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${student.email}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${student.phone || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Gender:</span>
                                <span class="detail-value">${student.gender}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Department:</span>
                                <span class="detail-value">${student.department}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status-badge ${student.status.toLowerCase()}">${student.status}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">GPA:</span>
                                <span class="detail-value">${student.gpa || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Enrollment Date:</span>
                                <span class="detail-value">${new Date(student.enrollmentDate).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-item full-width">
                                <span class="detail-label">Address:</span>
                                <span class="detail-value">${student.address || 'N/A'}</span>
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
            
            modal.querySelector('.edit-student-btn').addEventListener('click', () => {
                modal.remove();
                this.editStudent(studentId);
            });
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
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
        
        if (this.searchQuery) {
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
            'Roll Number': student.rollNumber,
            'Name': student.name,
            'Email': student.email,
            'Department': student.department,
            'Gender': student.gender,
            'GPA': student.gpa || 'N/A',
            'Status': student.status,
            'Enrollment Date': student.enrollmentDate,
            'Address': student.address || ''
        }));
        
        switch(format) {
            case 'csv':
                this.exportToCSV(data);
                break;
            case 'json':
                this.exportToJSON(data);
                break;
            case 'pdf':
                // PDF export would require a library like jsPDF
                window.showToast('PDF export requires additional setup', 'info');
                break;
        }
    }

    exportToCSV(data) {
        if (data.length === 0) {
            window.showToast('No data to export', 'warning');
            return;
        }
        
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
        
        window.showToast('CSV exported successfully', 'success');
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
        
        window.showToast('JSON exported successfully', 'success');
    }
}

// Initialize table when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentTable = new StudentTable();
});