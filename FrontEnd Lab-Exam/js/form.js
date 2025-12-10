// Student Form Management
class StudentForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {};
        this.photoPreview = null;
        this.init();
    }

    init() {
        this.loadAutosave();
        this.setupEventListeners();
        this.setupPhotoUpload();
        this.setupValidation();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Step navigation
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nextStep = parseInt(e.target.dataset.next);
                if (this.validateStep(this.currentStep)) {
                    this.goToStep(nextStep);
                }
            });
        });

        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prevStep = parseInt(e.target.dataset.prev);
                this.goToStep(prevStep);
            });
        });

        // Form submission
        document.getElementById('studentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        // Reset form
        document.getElementById('resetFormBtn').addEventListener('click', () => {
            this.resetForm();
        });

        // Form input changes for auto-save
        document.querySelectorAll('#studentForm input, #studentForm select, #studentForm textarea').forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormState();
            });
            
            input.addEventListener('change', () => {
                this.saveFormState();
            });
        });

        // Form section loaded event
        window.addEventListener('dashboard:add-student-loaded', () => {
            this.initializeForm();
        });
    }

    setupPhotoUpload() {
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const photoInput = document.getElementById('profilePhoto');
        const preview = document.getElementById('photoPreview');

        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handlePhotoUpload(file);
            }
        });

        // Drag and drop
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('drag-over');
        });

        preview.addEventListener('dragleave', () => {
            preview.classList.remove('drag-over');
        });

        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handlePhotoUpload(file);
            }
        });

        preview.addEventListener('click', () => {
            photoInput.click();
        });
    }

    handlePhotoUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('photo', 'Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showError('photo', 'Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.photoPreview = e.target.result;
            this.updatePhotoPreview();
            this.saveFormState();
        };
        reader.readAsDataURL(file);
    }

    updatePhotoPreview() {
        const preview = document.getElementById('photoPreview');
        if (this.photoPreview) {
            preview.innerHTML = `<img src="${this.photoPreview}" alt="Profile Preview">`;
            preview.classList.add('has-photo');
        } else {
            preview.innerHTML = `
                <svg class="upload-icon"><use href="assets/icons/upload-icon.svg#upload"></use></svg>
                <span>Click to upload photo</span>
            `;
            preview.classList.remove('has-photo');
        }
    }

    setupValidation() {
        // Real-time validation
        document.querySelectorAll('.input-group input, .input-group select, .input-group textarea').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearError(input.id);
            });
        });
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldId = input.id;
        let isValid = true;
        let errorMessage = '';

        switch(fieldId) {
            case 'fullName':
                if (!value) {
                    errorMessage = 'Full name is required';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Name must be at least 2 characters';
                    isValid = false;
                }
                break;

            case 'rollNumber':
                if (!value) {
                    errorMessage = 'Roll number is required';
                    isValid = false;
                } else if (!/^DBU\d{7}$/.test(value)) {
                    errorMessage = 'Format: DBU followed by 7 digits';
                    isValid = false;
                } else if (this.checkRollNumberExists(value)) {
                    errorMessage = 'Roll number already exists';
                    isValid = false;
                }
                break;

            case 'email':
                if (!value) {
                    errorMessage = 'Email is required';
                    isValid = false;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorMessage = 'Please enter a valid email';
                    isValid = false;
                }
                break;

            case 'phone':
                if (value && !/^[\+\d\s\-\(\)]{10,}$/.test(value)) {
                    errorMessage = 'Please enter a valid phone number';
                    isValid = false;
                }
                break;

            case 'gpa':
                if (value) {
                    const gpa = parseFloat(value);
                    if (gpa < 0 || gpa > 4) {
                        errorMessage = 'GPA must be between 0 and 4';
                        isValid = false;
                    }
                }
                break;

            case 'enrollmentDate':
                if (!value) {
                    errorMessage = 'Enrollment date is required';
                    isValid = false;
                } else if (new Date(value) > new Date()) {
                    errorMessage = 'Enrollment date cannot be in the future';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            this.showError(fieldId, errorMessage);
        } else {
            this.clearError(fieldId);
        }

        return isValid;
    }

    checkRollNumberExists(rollNumber) {
        const students = window.studentStorage.getAllStudents();
        return students.some(student => 
            student.rollNumber.toLowerCase() === rollNumber.toLowerCase()
        );
    }

    validateStep(step) {
        let isValid = true;
        const stepFields = this.getStepFields(step);
        
        stepFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input && input.hasAttribute('required')) {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    getStepFields(step) {
        const stepFields = {
            1: ['fullName', 'rollNumber', 'email', 'phone', 'gender'],
            2: ['department', 'gpa', 'enrollmentDate', 'status', 'address'],
            3: [] // Review step has no validation
        };
        return stepFields[step] || [];
    }

    goToStep(step) {
        // Hide current step
        document.querySelector(`.form-step[data-step="${this.currentStep}"]`).classList.remove('active');
        
        // Update step indicator
        document.querySelector(`.step[data-step="${this.currentStep}"]`).classList.remove('active');
        
        // Show new step
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
        document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
        
        // Update current step
        this.currentStep = step;
        
        // If moving to review step, update review content
        if (step === 3) {
            this.updateReviewContent();
        }
    }

    updateReviewContent() {
        this.collectFormData();
        const reviewGrid = document.getElementById('reviewGrid');
        
        reviewGrid.innerHTML = `
            <div class="review-item">
                <span class="review-label">Name:</span>
                <span class="review-value">${this.formData.fullName || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Roll Number:</span>
                <span class="review-value">${this.formData.rollNumber || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Email:</span>
                <span class="review-value">${this.formData.email || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Gender:</span>
                <span class="review-value">${this.formData.gender || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Department:</span>
                <span class="review-value">${this.formData.department || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Status:</span>
                <span class="review-value">${this.formData.status || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">Enrollment Date:</span>
                <span class="review-value">${this.formData.enrollmentDate || 'Not provided'}</span>
            </div>
            <div class="review-item">
                <span class="review-label">GPA:</span>
                <span class="review-value">${this.formData.gpa || 'Not provided'}</span>
            </div>
            <div class="review-item full-width">
                <span class="review-label">Address:</span>
                <span class="review-value">${this.formData.address || 'Not provided'}</span>
            </div>
        `;
    }

    collectFormData() {
        const form = document.getElementById('studentForm');
        const formData = new FormData(form);
        
        this.formData = {
            fullName: formData.get('fullName'),
            rollNumber: formData.get('rollNumber'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            gender: formData.get('gender'),
            department: formData.get('department'),
            gpa: parseFloat(formData.get('gpa')) || null,
            enrollmentDate: formData.get('enrollmentDate'),
            status: formData.get('status'),
            address: formData.get('address'),
            profilePhoto: this.photoPreview
        };
    }

    async submitForm() {
        // Validate all steps
        for (let i = 1; i <= 2; i++) {
            if (!this.validateStep(i)) {
                this.goToStep(i);
                window.showToast('Please fix the errors in the form', 'error');
                return;
            }
        }

        this.collectFormData();
        
        try {
            // Add student to storage
            const newStudent = window.studentStorage.addStudent(this.formData);
            
            // Show success message
            window.showToast(`Student ${newStudent.name} added successfully!`, 'success');
            
            // Reset form
            this.resetForm();
            
            // Switch to students table
            window.dashboard.switchSection('students');
            
            // Clear autosave
            window.studentStorage.clearAutosaveData();
            
        } catch (error) {
            window.showToast(`Error adding student: ${error.message}`, 'error');
        }
    }

    resetForm() {
        document.getElementById('studentForm').reset();
        this.photoPreview = null;
        this.updatePhotoPreview();
        this.currentStep = 1;
        
        // Reset steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector('.form-step[data-step="1"]').classList.add('active');
        
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector('.step[data-step="1"]').classList.add('active');
        
        // Clear all errors
        document.querySelectorAll('.input-error').forEach(error => {
            error.textContent = '';
        });
        
        // Clear autosave
        window.studentStorage.clearAutosaveData();
        
        // Update autosave indicator
        this.updateAutosaveIndicator();
        
        window.showToast('Form has been reset', 'info');
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            if (this.hasFormData()) {
                this.saveFormState();
            }
        }, 30000);

        // Update indicator
        this.updateAutosaveIndicator();
    }

    hasFormData() {
        const form = document.getElementById('studentForm');
        const inputs = form.querySelectorAll('input, select, textarea');
        return Array.from(inputs).some(input => input.value.trim() !== '');
    }

    saveFormState() {
        this.collectFormData();
        window.studentStorage.setAutosaveData(this.formData);
        this.updateAutosaveIndicator();
    }

    loadAutosave() {
        const autosave = window.studentStorage.getAutosaveData();
        if (autosave) {
            this.populateForm(autosave);
            window.showToast('Form data restored from auto-save', 'info');
        }
    }

    populateForm(data) {
        // Populate form fields
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'file') {
                    // Handle photo separately
                    if (data.profilePhoto) {
                        this.photoPreview = data.profilePhoto;
                        this.updatePhotoPreview();
                    }
                } else {
                    element.value = data[key] || '';
                    
                    // Trigger floating label update
                    if (element.value) {
                        element.classList.add('filled');
                    }
                }
            }
        });
    }

    updateAutosaveIndicator() {
        const indicator = document.getElementById('autosaveIndicator');
        const hasAutosave = window.studentStorage.getAutosaveData() !== null;
        
        if (hasAutosave) {
            indicator.classList.add('active');
            indicator.innerHTML = `
                <svg class="indicator-icon"><use href="assets/icons/save-icon.svg#save"></use></svg>
                <span>Auto-saved ${this.getTimeSinceAutosave()}</span>
            `;
        } else {
            indicator.classList.remove('active');
        }
    }

    getTimeSinceAutosave() {
        const autosave = window.studentStorage.getAutosaveData();
        if (!autosave || !autosave.savedAt) return '';
        
        const savedTime = new Date(autosave.savedAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - savedTime) / (1000 * 60));
        
        if (diffMinutes < 1) return 'just now';
        if (diffMinutes === 1) return '1 minute ago';
        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours === 1) return '1 hour ago';
        return `${diffHours} hours ago`;
    }

    initializeForm() {
        // Set minimum date for enrollment date
        const enrollmentDate = document.getElementById('enrollmentDate');
        if (enrollmentDate) {
            const today = new Date().toISOString().split('T')[0];
            enrollmentDate.max = today;
        }
        
        // Update autosave indicator
        this.updateAutosaveIndicator();
    }

    // Error handling
    showError(fieldId, message) {
        const inputGroup = document.getElementById(fieldId).closest('.input-group');
        const errorElement = inputGroup.querySelector('.input-error');
        
        if (errorElement) {
            errorElement.textContent = message;
            inputGroup.classList.add('error');
        }
    }

    clearError(fieldId) {
        const inputGroup = document.getElementById(fieldId).closest('.input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorElement = inputGroup.querySelector('.input-error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studentForm = new StudentForm();
});