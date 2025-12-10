// Student Data Storage Management
class StudentStorage {
    constructor() {
        this.STORAGE_KEY = 'dbu_students';
        this.AUTOSAVE_KEY = 'dbu_autosave';
        this.ACTIVITY_KEY = 'dbu_activity';
        this.init();
    }

    init() {
        // Initialize with sample data if empty
        if (!this.getAllStudents().length) {
            this.seedSampleData();
        }
    }

    // Student CRUD Operations
    getAllStudents() {
        const students = localStorage.getItem(this.STORAGE_KEY);
        return students ? JSON.parse(students) : [];
    }

    getStudentById(id) {
        const students = this.getAllStudents();
        return students.find(student => student.id === id);
    }

    addStudent(studentData) {
        const students = this.getAllStudents();
        const newStudent = {
            id: this.generateStudentId(),
            ...studentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        students.push(newStudent);
        this.saveStudents(students);
        this.logActivity('added', newStudent);
        return newStudent;
    }

    updateStudent(id, updates) {
        const students = this.getAllStudents();
        const index = students.findIndex(s => s.id === id);
        
        if (index !== -1) {
            students[index] = {
                ...students[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveStudents(students);
            this.logActivity('updated', students[index]);
            return students[index];
        }
        return null;
    }

    deleteStudent(id) {
        const students = this.getAllStudents();
        const student = students.find(s => s.id === id);
        const filtered = students.filter(s => s.id !== id);
        this.saveStudents(filtered);
        
        if (student) {
            this.logActivity('deleted', student);
        }
        
        return filtered;
    }

    deleteMultipleStudents(ids) {
        const students = this.getAllStudents();
        const deletedStudents = students.filter(s => ids.includes(s.id));
        const filtered = students.filter(s => !ids.includes(s.id));
        this.saveStudents(filtered);
        
        deletedStudents.forEach(student => {
            this.logActivity('deleted', student);
        });
        
        return filtered;
    }

    // Search and Filter
    searchStudents(query, filters = {}) {
        const students = this.getAllStudents();
        const lowerQuery = query.toLowerCase();
        
        return students.filter(student => {
            // Text search
            const matchesSearch = !query || 
                student.name.toLowerCase().includes(lowerQuery) ||
                student.rollNumber.toLowerCase().includes(lowerQuery) ||
                student.email.toLowerCase().includes(lowerQuery);
            
            // Filter by department
            const matchesDept = !filters.department || 
                student.department === filters.department;
            
            // Filter by status
            const matchesStatus = !filters.status || 
                student.status === filters.status;
            
            // Filter by gender
            const matchesGender = !filters.gender || 
                student.gender === filters.gender;
            
            return matchesSearch && matchesDept && matchesStatus && matchesGender;
        });
    }

    // Autosave functionality
    getAutosaveData() {
        const data = localStorage.getItem(this.AUTOSAVE_KEY);
        return data ? JSON.parse(data) : null;
    }

    setAutosaveData(formData) {
        localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify({
            ...formData,
            savedAt: new Date().toISOString()
        }));
    }

    clearAutosaveData() {
        localStorage.removeItem(this.AUTOSAVE_KEY);
    }

    // Activity Logging
    logActivity(action, student) {
        const activities = this.getActivities();
        const activity = {
            id: Date.now(),
            action,
            studentName: student.name,
            studentId: student.id,
            timestamp: new Date().toISOString(),
            details: `${action.charAt(0).toUpperCase() + action.slice(1)} student: ${student.name} (${student.rollNumber})`
        };
        
        activities.unshift(activity);
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.pop();
        }
        
        localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activities));
        return activity;
    }

    getActivities(limit = 10) {
        const activities = localStorage.getItem(this.ACTIVITY_KEY);
        const allActivities = activities ? JSON.parse(activities) : [];
        return limit ? allActivities.slice(0, limit) : allActivities;
    }

    // Statistics
    getStatistics() {
        const students = this.getAllStudents();
        
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
            activeToday: this.getActiveTodayCount(students)
        };
    }

    getActiveTodayCount(students) {
        const today = new Date().toISOString().split('T')[0];
        return students.filter(s => {
            const lastActive = s.lastActive ? s.lastActive.split('T')[0] : s.updatedAt.split('T')[0];
            return lastActive === today;
        }).length;
    }

    // Helper Methods
    generateStudentId() {
        const students = this.getAllStudents();
        const lastId = students.length > 0 
            ? parseInt(students[students.length - 1].id.replace('DBU', ''))
            : 2024000;
        return `DBU${lastId + 1}`;
    }

    saveStudents(students) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(students));
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('students:updated'));
    }

    // Sample data for initialization
    seedSampleData() {
        const sampleStudents = [
            {
                id: 'DBU2024001',
                name: 'John Smith',
                rollNumber: 'DBU2024001',
                email: 'john.smith@dbu.edu',
                phone: '+12345678901',
                gender: 'Male',
                department: 'Computer Science',
                gpa: 3.8,
                status: 'Active',
                enrollmentDate: '2024-01-15',
                address: '123 Main St, Dallas, TX',
                profilePhoto: '',
                createdAt: '2024-01-15T09:00:00Z',
                updatedAt: '2024-01-15T09:00:00Z'
            },
            {
                id: 'DBU2024002',
                name: 'Emma Johnson',
                rollNumber: 'DBU2024002',
                email: 'emma.j@dbu.edu',
                phone: '+12345678902',
                gender: 'Female',
                department: 'Information Technology',
                gpa: 3.9,
                status: 'Active',
                enrollmentDate: '2024-01-16',
                address: '456 Oak Ave, Fort Worth, TX',
                profilePhoto: '',
                createdAt: '2024-01-16T10:30:00Z',
                updatedAt: '2024-01-16T10:30:00Z'
            },
            {
                id: 'DBU2024003',
                name: 'Michael Brown',
                rollNumber: 'DBU2024003',
                email: 'm.brown@dbu.edu',
                phone: '+12345678903',
                gender: 'Male',
                department: 'Electronics',
                gpa: 3.5,
                status: 'Active',
                enrollmentDate: '2024-01-17',
                address: '789 Pine Rd, Arlington, TX',
                profilePhoto: '',
                createdAt: '2024-01-17T14:15:00Z',
                updatedAt: '2024-01-17T14:15:00Z'
            },
            {
                id: 'DBU2024004',
                name: 'Sarah Williams',
                rollNumber: 'DBU2024004',
                email: 'sarah.w@dbu.edu',
                phone: '+12345678904',
                gender: 'Female',
                department: 'Business Administration',
                gpa: 3.7,
                status: 'Active',
                enrollmentDate: '2024-01-18',
                address: '321 Elm St, Plano, TX',
                profilePhoto: '',
                createdAt: '2024-01-18T11:45:00Z',
                updatedAt: '2024-01-18T11:45:00Z'
            },
            {
                id: 'DBU2024005',
                name: 'David Miller',
                rollNumber: 'DBU2024005',
                email: 'd.miller@dbu.edu',
                phone: '+12345678905',
                gender: 'Male',
                department: 'Mechanical Engineering',
                gpa: 3.6,
                status: 'Inactive',
                enrollmentDate: '2024-01-19',
                address: '654 Maple Dr, Irving, TX',
                profilePhoto: '',
                createdAt: '2024-01-19T13:20:00Z',
                updatedAt: '2024-01-19T13:20:00Z'
            }
        ];
        
        this.saveStudents(sampleStudents);
    }
}

// Initialize storage
window.studentStorage = new StudentStorage();