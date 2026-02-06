// ===================================
// SMART STUDENT DASHBOARD - Complete App with Authentication
// ===================================

// ===================================
// STORAGE MANAGER
// ===================================
const StorageManager = {
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
};

// ===================================
// APP STATE
// ===================================
const AppState = {
    student: null,
    isLoggedIn: false,
    courses: [],
    schedules: [],
    tasks: [],
    grades: [],
    achievements: [],
    projects: [],
    currentFilter: 'all',
    currentModal: null,

    init() {
        this.student = StorageManager.get('studentProfile');
        this.isLoggedIn = StorageManager.get('isLoggedIn') || false;
        this.courses = StorageManager.get('courses') || [];
        this.schedules = StorageManager.get('schedules') || [];
        this.tasks = StorageManager.get('tasks') || [];
        this.grades = StorageManager.get('grades') || [];
        this.achievements = StorageManager.get('achievements') || [];
        this.projects = StorageManager.get('projects') || [];
    },

    save(key) {
        const dataMap = {
            student: 'studentProfile',
            isLoggedIn: 'isLoggedIn',
            courses: 'courses',
            schedules: 'schedules',
            tasks: 'tasks',
            grades: 'grades',
            achievements: 'achievements',
            projects: 'projects'
        };
        
        if (dataMap[key]) {
            StorageManager.set(dataMap[key], this[key]);
        }
    }
};

// ===================================
// UI MANAGER
// ===================================
const UIManager = {
    showModal(modalId, title, content) {
        const modal = document.getElementById(modalId);
        const modalTitle = modal.querySelector('.modal-header h2');
        const modalContent = modal.querySelector('.modal-content');
        
        modalTitle.textContent = title;
        modalContent.innerHTML = content;
        modal.classList.add('active');
        AppState.currentModal = modalId;
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        AppState.currentModal = null;
    },

    notify(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const iconMap = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        
        alert.innerHTML = `
            <i class="bi ${iconMap[type] || iconMap.success} alert-icon"></i>
            <div class="alert-content">
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
        
        container.appendChild(alert);
        
        alert.querySelector('.alert-close').addEventListener('click', () => {
            this.removeAlert(alert);
        });
        
        setTimeout(() => {
            this.removeAlert(alert);
        }, 3000);
    },
    
    removeAlert(alert) {
        if (!alert || !alert.parentElement) return;
        alert.classList.add('removing');
        setTimeout(() => {
            if (alert.parentElement) {
                alert.parentElement.removeChild(alert);
            }
        }, 300);
    },

    confirm(title, message, onConfirm, isDanger = false) {
        const overlay = document.getElementById('confirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const iconEl = document.getElementById('confirmIcon');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        if (isDanger) {
            iconEl.classList.add('danger');
            iconEl.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
            okBtn.className = 'btn btn-danger';
        } else {
            iconEl.classList.remove('danger');
            iconEl.innerHTML = '<i class="bi bi-question-circle"></i>';
            okBtn.className = 'btn btn-primary';
        }
        
        overlay.classList.add('active');
        
        const handleOk = () => {
            overlay.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            if (onConfirm) onConfirm();
        };
        
        const handleCancel = () => {
            overlay.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        });
    },

    renderEmptyState(container, icon, message) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-${icon}"></i>
                <p>${message}</p>
            </div>
        `;
    },

    updateAvatar(container, photo, name) {
        if (photo) {
            container.innerHTML = `<img src="${photo}" alt="Student Photo">`;
        } else {
            const firstLetter = name ? name.charAt(0).toUpperCase() : 'S';
            container.innerHTML = `<div class="avatar-letter">${firstLetter}</div>`;
        }
    }
};

// ===================================
// AUTHENTICATION MANAGER
// ===================================
const AuthManager = {
    currentPhotoData: null,

    init() {
        this.checkAuthState();
        this.setupSignup();
        this.setupLogin();
        this.setupLogout();
    },

    checkAuthState() {
        const student = AppState.student;
        const isLoggedIn = AppState.isLoggedIn;
        
        if (!student) {
            this.showSignupPage();
        } else if (!isLoggedIn) {
            this.showLoginPage();
        } else {
            this.showApp();
        }
    },

    showSignupPage() {
        document.getElementById('signup-page').classList.add('active');
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('app-container').style.display = 'none';
    },

    showLoginPage() {
        document.getElementById('signup-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('app-container').style.display = 'none';
        
        const goToSignup = document.getElementById('goToSignup');
        goToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupPage();
        });
    },

    showApp() {
        document.getElementById('signup-page').classList.remove('active');
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('app-container').style.display = 'block';
        
        // Load all student data
        ProfileManager.loadProfile();
        CourseManager.render();
        ScheduleManager.renderAdmin();
        ScheduleManager.renderDashboard();
        TaskManager.render();
        GradeManager.render();
        AchievementManager.render();
        ProjectManager.render();
    },

    setupSignup() {
        const form = document.getElementById('signupForm');
        const photoInput = document.getElementById('signupPhoto');
        const uploadBtn = document.getElementById('signupUploadBtn');
        const removeBtn = document.getElementById('signupRemoveBtn');
        const photoPreview = document.getElementById('signupPhotoPreview');
        
        uploadBtn.addEventListener('click', () => {
            photoInput.click();
        });
        
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.currentPhotoData = event.target.result;
                    photoPreview.innerHTML = `<img src="${this.currentPhotoData}" alt="Preview">`;
                    removeBtn.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        removeBtn.addEventListener('click', () => {
            this.currentPhotoData = null;
            photoPreview.innerHTML = '<i class="bi bi-person-circle"></i>';
            removeBtn.style.display = 'none';
            photoInput.value = '';
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
    },

    handleSignup() {
        const studentId = document.getElementById('signupStudentId').value.trim();
        const name = document.getElementById('signupName').value.trim();
        const program = document.getElementById('signupProgram').value.trim();
        const semester = document.getElementById('signupSemester').value;
        
        if (!studentId || !name || !program || !semester) {
            UIManager.notify('Please fill in all required fields', 'error');
            return;
        }
        
        const studentData = {
            studentId,
            name,
            program,
            semester,
            photo: this.currentPhotoData
        };
        
        AppState.student = studentData;
        AppState.isLoggedIn = true;
        AppState.save('student');
        AppState.save('isLoggedIn');
        
        UIManager.notify('Account created successfully! Welcome!', 'success');
        
        setTimeout(() => {
            this.showApp();
            // Initialize all managers after showing app
            NavigationManager.init();
            ThemeManager.init();
            ProfileManager.init();
            CourseManager.init();
            ScheduleManager.init();
            TaskManager.init();
            GradeManager.init();
            AchievementManager.init();
            TodayManager.init();
            FocusModeManager.init();
            ProjectManager.init();
        }, 500);
    },

    setupLogin() {
        const form = document.getElementById('loginForm');
        const errorMsg = document.getElementById('loginError');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentId = document.getElementById('loginStudentId').value.trim();
            
            if (studentId === AppState.student.studentId) {
                AppState.isLoggedIn = true;
                AppState.save('isLoggedIn');
                errorMsg.style.display = 'none';
                UIManager.notify('Welcome back!', 'success');
                setTimeout(() => {
                    this.showApp();
                    // Initialize all managers after login
                    NavigationManager.init();
                    ThemeManager.init();
                    ProfileManager.init();
                    CourseManager.init();
                    ScheduleManager.init();
                    TaskManager.init();
                    GradeManager.init();
                    AchievementManager.init();
                    TodayManager.init();
                    FocusModeManager.init();
                    ProjectManager.init();
                }, 500);
            } else {
                errorMsg.style.display = 'flex';
            }
        });
    },

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', () => {
            UIManager.confirm(
                'Logout',
                'Are you sure you want to logout?',
                () => {
                    AppState.isLoggedIn = false;
                    AppState.save('isLoggedIn');
                    document.getElementById('loginStudentId').value = '';
                    UIManager.notify('Logged out successfully', 'info');
                    this.showLoginPage();
                }
            );
        });
    }
};

// Continue in next part...
// ===================================
// NAVIGATION MANAGER
// ===================================
const NavigationManager = {
    init() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });

        const mobileToggle = document.getElementById('mobileMenuToggle');
        const navLinksContainer = document.querySelector('.nav-links');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navLinksContainer.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const isClickInside = navLinksContainer.contains(e.target) || 
                                     mobileToggle.contains(e.target);
                
                if (!isClickInside && navLinksContainer.classList.contains('active')) {
                    navLinksContainer.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            }
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinksContainer.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            });
        });
    },

    navigateTo(page) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            if (p.id === `${page}-page`) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }
};

// ===================================
// THEME MANAGER
// ===================================
const ThemeManager = {
    init() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
            themeToggle.title = 'Toggle Light Mode';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            
            if (isDark) {
                themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
                themeToggle.title = 'Toggle Light Mode';
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggle.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
                themeToggle.title = 'Toggle Dark Mode';
                localStorage.setItem('theme', 'light');
            }
        });
    }
};

// ===================================
// PROFILE MANAGER
// ===================================
const ProfileManager = {
    currentEditPhoto: null,

    init() {
        document.getElementById('editProfileBtn').addEventListener('click', () => this.showEditModal());
        
        const dashboardModalClose = document.getElementById('dashboardModalClose');
        const adminModalClose = document.getElementById('adminModalClose');
        const projectsModalClose = document.getElementById('projectsModalClose');
        
        dashboardModalClose.addEventListener('click', () => UIManager.closeModal('dashboardModal'));
        adminModalClose.addEventListener('click', () => UIManager.closeModal('adminModal'));
        projectsModalClose.addEventListener('click', () => UIManager.closeModal('projectsModal'));
        
        document.getElementById('dashboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'dashboardModal') UIManager.closeModal('dashboardModal');
        });
        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') UIManager.closeModal('adminModal');
        });
        document.getElementById('projectsModal').addEventListener('click', (e) => {
            if (e.target.id === 'projectsModal') UIManager.closeModal('projectsModal');
        });
    },

    loadProfile() {
        const student = AppState.student;
        
        // Dashboard display
        document.getElementById('displayName').textContent = student.name;
        document.getElementById('displayStudentId').textContent = `ID: ${student.studentId}`;
        document.getElementById('displayProgram').textContent = student.program;
        document.getElementById('displaySemester').textContent = student.semester;
        UIManager.updateAvatar(document.getElementById('dashboardAvatar'), student.photo, student.name);
        
        // Admin panel display
        document.getElementById('adminDisplayName').textContent = student.name;
        document.getElementById('adminDisplayId').textContent = student.studentId;
        document.getElementById('adminDisplayProgram').textContent = student.program;
        document.getElementById('adminDisplaySemester').textContent = student.semester;
        UIManager.updateAvatar(document.getElementById('adminAvatar'), student.photo, student.name);
    },

    showEditModal() {
        const student = AppState.student;
        this.currentEditPhoto = student.photo;
        
        const form = `
            <form id="editProfileForm" class="form">
                <div class="form-group">
                    <label>Profile Photo (Optional)</label>
                    <div class="photo-upload-container">
                        <div class="photo-preview" id="editPhotoPreview">
                            ${student.photo ? `<img src="${student.photo}" alt="Photo">` : `<div class="avatar-letter">${student.name.charAt(0).toUpperCase()}</div>`}
                        </div>
                        <div class="photo-upload-actions">
                            <input type="file" id="editPhoto" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary btn-sm" id="editUploadBtn">
                                <i class="bi bi-upload"></i> Upload Photo
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" id="editRemoveBtn" style="display: ${student.photo ? 'block' : 'none'};">
                                <i class="bi bi-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editStudentId">Student ID *</label>
                    <input type="text" id="editStudentId" value="${student.studentId}" readonly>
                </div>
                <div class="form-group">
                    <label for="editName">Full Name *</label>
                    <input type="text" id="editName" value="${student.name}" required>
                </div>
                <div class="form-group">
                    <label for="editProgram">Program *</label>
                    <input type="text" id="editProgram" value="${student.program}" required>
                </div>
                <div class="form-group">
                    <label for="editSemester">Semester *</label>
                    <select id="editSemester" required>
                        <option value="1st Semester" ${student.semester === '1st Semester' ? 'selected' : ''}>1st Semester</option>
                        <option value="2nd Semester" ${student.semester === '2nd Semester' ? 'selected' : ''}>2nd Semester</option>
                        <option value="Summer" ${student.semester === 'Summer' ? 'selected' : ''}>Summer</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Save Changes
                </button>
            </form>
        `;
        
        UIManager.showModal('adminModal', 'Edit Profile', form);
        
        const photoInput = document.getElementById('editPhoto');
        const uploadBtn = document.getElementById('editUploadBtn');
        const removeBtn = document.getElementById('editRemoveBtn');
        const photoPreview = document.getElementById('editPhotoPreview');
        
        uploadBtn.addEventListener('click', () => photoInput.click());
        
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.currentEditPhoto = event.target.result;
                    photoPreview.innerHTML = `<img src="${this.currentEditPhoto}" alt="Preview">`;
                    removeBtn.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        removeBtn.addEventListener('click', () => {
            this.currentEditPhoto = null;
            photoPreview.innerHTML = `<div class="avatar-letter">${student.name.charAt(0).toUpperCase()}</div>`;
            removeBtn.style.display = 'none';
            photoInput.value = '';
        });
        
        document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
    },

    saveProfile() {
        AppState.student = {
            studentId: AppState.student.studentId,
            name: document.getElementById('editName').value.trim(),
            program: document.getElementById('editProgram').value.trim(),
            semester: document.getElementById('editSemester').value,
            photo: this.currentEditPhoto
        };
        
        AppState.save('student');
        this.loadProfile();
        UIManager.closeModal('adminModal');
        UIManager.notify('Profile updated successfully!', 'success');
    }
};

// Continue...
// ===================================
// COURSE MANAGER
// ===================================
const CourseManager = {
    init() {
        this.render();
        document.getElementById('addCourseBtn').addEventListener('click', () => this.showAddForm());
    },

    render() {
        const container = document.getElementById('coursesList');
        
        if (AppState.courses.length === 0) {
            UIManager.renderEmptyState(container, 'journal-x', 'No courses added yet.');
            return;
        }

        container.innerHTML = AppState.courses.map((course, index) => `
            <div class="course-item">
                <div class="item-info">
                    <h4>${course.name}</h4>
                    <p class="item-details">
                        ${course.units} ${course.units === 1 ? 'unit' : 'units'}
                        ${course.instructor ? `• ${course.instructor}` : ''}
                    </p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-sm" onclick="CourseManager.edit(${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="CourseManager.delete(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateStats();
    },

    showAddForm() {
        const form = `
            <form id="courseForm" class="form">
                <div class="form-group">
                    <label for="courseName">Course Name *</label>
                    <input type="text" id="courseName" required>
                </div>
                <div class="form-group">
                    <label for="courseUnits">Number of Units *</label>
                    <input type="number" id="courseUnits" min="1" max="10" required>
                </div>
                <div class="form-group">
                    <label for="courseInstructor">Instructor (Optional)</label>
                    <input type="text" id="courseInstructor">
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Save Course
                </button>
            </form>
        `;

        UIManager.showModal('adminModal', 'Add Course', form);
        
        document.getElementById('courseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    showEditForm(index) {
        const course = AppState.courses[index];
        const form = `
            <form id="courseForm" class="form">
                <div class="form-group">
                    <label for="courseName">Course Name *</label>
                    <input type="text" id="courseName" value="${course.name}" required>
                </div>
                <div class="form-group">
                    <label for="courseUnits">Number of Units *</label>
                    <input type="number" id="courseUnits" value="${course.units}" min="1" max="10" required>
                </div>
                <div class="form-group">
                    <label for="courseInstructor">Instructor (Optional)</label>
                    <input type="text" id="courseInstructor" value="${course.instructor || ''}">
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Update Course
                </button>
            </form>
        `;

        UIManager.showModal('adminModal', 'Edit Course', form);
        
        document.getElementById('courseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.update(index);
        });
    },

    add() {
        const course = {
            id: Date.now(),
            name: document.getElementById('courseName').value.trim(),
            units: parseInt(document.getElementById('courseUnits').value),
            instructor: document.getElementById('courseInstructor').value.trim()
        };

        AppState.courses.push(course);
        AppState.save('courses');
        this.render();
        UIManager.closeModal('adminModal');
        UIManager.notify('Course added successfully!', 'success');
    },

    edit(index) {
        this.showEditForm(index);
    },

    update(index) {
        AppState.courses[index] = {
            id: AppState.courses[index].id,
            name: document.getElementById('courseName').value.trim(),
            units: parseInt(document.getElementById('courseUnits').value),
            instructor: document.getElementById('courseInstructor').value.trim()
        };

        AppState.save('courses');
        this.render();
        UIManager.closeModal('adminModal');
        UIManager.notify('Course updated successfully!', 'success');
    },

    delete(index) {
        UIManager.confirm(
            'Delete Course',
            'Are you sure you want to delete this course? This cannot be undone.',
            () => {
                AppState.courses.splice(index, 1);
                AppState.save('courses');
                this.render();
                UIManager.notify('Course deleted successfully!', 'info');
            },
            true
        );
    },

    updateStats() {
        document.getElementById('totalCourses').textContent = AppState.courses.length;
    }
};

// ===================================
// SCHEDULE MANAGER
// ===================================
const ScheduleManager = {
    init() {
        this.renderAdmin();
        this.renderDashboard();
        document.getElementById('addScheduleBtn').addEventListener('click', () => this.showAddForm());
    },

    renderAdmin() {
        const container = document.getElementById('scheduleList');
        
        if (AppState.schedules.length === 0) {
            UIManager.renderEmptyState(container, 'clock', 'No schedules added yet.');
            return;
        }

        container.innerHTML = AppState.schedules.map((schedule, index) => `
            <div class="schedule-item-admin">
                <div class="item-info">
                    <h4>${schedule.course}</h4>
                    <p class="item-details">
                        ${schedule.day} • ${schedule.time} • ${schedule.room}
                    </p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-sm" onclick="ScheduleManager.edit(${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="ScheduleManager.delete(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderDashboard() {
        const container = document.getElementById('scheduleDisplay');
        
        if (AppState.schedules.length === 0) {
            UIManager.renderEmptyState(container, 'calendar-x', 'No schedule yet. Add courses in Admin Panel!');
            return;
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const grouped = {};
        
        AppState.schedules.forEach(schedule => {
            const schedDays = schedule.day.split(',').map(d => d.trim());
            const schedTimes = schedule.time.split('/').map(t => t.trim());
            
            schedDays.forEach((day, index) => {
                if (!grouped[day]) grouped[day] = [];
                const timeForDay = schedTimes[index] || schedTimes[0];
                const formattedTime = this.formatTimeWithAMPM(timeForDay);
                grouped[day].push({
                    course: schedule.course,
                    time: formattedTime,
                    room: schedule.room,
                    rawTime: timeForDay
                });
            });
        });

        // Sort schedules by time within each day
        Object.keys(grouped).forEach(day => {
            grouped[day].sort((a, b) => {
                const timeA = this.parseTimeForSort(a.rawTime);
                const timeB = this.parseTimeForSort(b.rawTime);
                return timeA - timeB;
            });
        });

        container.innerHTML = days.map(day => {
            if (!grouped[day]) return '';
            
            return `
                <div class="schedule-day">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary);">${day}</h4>
                    ${grouped[day].map(schedule => `
                        <div class="schedule-item">
                            <h4>${schedule.course}</h4>
                            <div class="schedule-time">
                                <i class="bi bi-clock"></i>
                                <span>${schedule.time}</span>
                            </div>
                            <div class="schedule-room">
                                <i class="bi bi-geo-alt"></i> ${schedule.room}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    },
    
    parseTimeForSort(timeString) {
        const startTimeStr = timeString.split('-')[0].trim();
        const match = startTimeStr.match(/(\d+):(\d+)/);
        
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        
        // Apply AM/PM logic same as addAMPM function
        if (hours >= 7 && hours <= 11) {
            // Morning classes
        } else if (hours === 12 || (hours >= 1 && hours <= 9)) {
            if (hours !== 12) hours += 12;
        }
        
        return hours * 60 + minutes;
    },

    formatTimeWithAMPM(timeString) {
        // If already has AM/PM, return as is
        if (/AM|PM|am|pm/i.test(timeString)) {
            return timeString;
        }
        
        // Split time range (e.g., "9:00 - 10:30" or "9:00-10:30")
        const parts = timeString.split('-').map(t => t.trim());
        
        if (parts.length === 2) {
            const startTime = this.addAMPM(parts[0]);
            const endTime = this.addAMPM(parts[1]);
            return `${startTime} - ${endTime}`;
        }
        
        // Single time
        return this.addAMPM(timeString);
    },
    
    addAMPM(time) {
        // Extract hour and minute
        const match = time.match(/(\d+):(\d+)/);
        if (!match) return time;
        
        const hour = parseInt(match[1]);
        const minute = match[2];
        
        // Rules:
        // 7, 8, 9, 10, 11 + :30 or higher = AM (7:30 - 11:30 AM)
        // 12:00 - 12:59 = PM
        // 1:00 - 5:59 = PM (afternoon classes)
        // 6:00 - 9:00 = PM (evening classes)
        
        let period = 'AM';
        
        if (hour >= 7 && hour <= 11) {
            // 7:00 - 11:59 = AM
            period = 'AM';
        } else if (hour === 12) {
            // 12:00 - 12:59 = PM
            period = 'PM';
        } else if (hour >= 1 && hour <= 9) {
            // 1:00 - 9:00 = PM (afternoon/evening)
            period = 'PM';
        } else if (hour > 12) {
            // Handle 24-hour format (13-23)
            period = 'PM';
        }
        
        return `${hour}:${minute} ${period}`;
    },

    showAddForm() {
        const courseOptions = AppState.courses.map(course => 
            `<option value="${course.name}">${course.name}</option>`
        ).join('');

        const form = `
            <form id="scheduleForm" class="form">
                <div class="form-group">
                    <label for="scheduleCourse">Course *</label>
                    <select id="scheduleCourse" required>
                        <option value="">Select Course</option>
                        ${courseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="scheduleDay">Day(s) *</label>
                    <input type="text" id="scheduleDay" placeholder="e.g., Monday, Wednesday, Friday" required>
                    <small style="color: var(--text-tertiary); font-size: 0.75rem;">Separate multiple days with commas</small>
                </div>
                <div class="form-group">
                    <label for="scheduleTime">Time *</label>
                    <input type="text" id="scheduleTime" placeholder="e.g., 9:00 AM - 10:30 AM" required>
                    <small style="color: var(--text-tertiary); font-size: 0.75rem;">
                        For different times per day, separate with "/" (e.g., 9:00 AM - 10:30 AM / 1:00 PM - 2:30 PM)
                    </small>
                </div>
                <div class="form-group">
                    <label for="scheduleRoom">Room / Link *</label>
                    <input type="text" id="scheduleRoom" placeholder="e.g., Room 301 or Zoom Link" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Save Schedule
                </button>
            </form>
        `;

        UIManager.showModal('adminModal', 'Add Schedule', form);
        
        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    showEditForm(index) {
        const schedule = AppState.schedules[index];
        const courseOptions = AppState.courses.map(course => 
            `<option value="${course.name}" ${course.name === schedule.course ? 'selected' : ''}>${course.name}</option>`
        ).join('');

        const form = `
            <form id="scheduleForm" class="form">
                <div class="form-group">
                    <label for="scheduleCourse">Course *</label>
                    <select id="scheduleCourse" required>
                        <option value="">Select Course</option>
                        ${courseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="scheduleDay">Day(s) *</label>
                    <input type="text" id="scheduleDay" value="${schedule.day}" required>
                    <small style="color: var(--text-tertiary); font-size: 0.75rem;">Separate multiple days with commas</small>
                </div>
                <div class="form-group">
                    <label for="scheduleTime">Time *</label>
                    <input type="text" id="scheduleTime" value="${schedule.time}" required>
                    <small style="color: var(--text-tertiary); font-size: 0.75rem;">
                        For different times per day, separate with "/" (e.g., 9:00 AM - 10:30 AM / 1:00 PM - 2:30 PM)
                    </small>
                </div>
                <div class="form-group">
                    <label for="scheduleRoom">Room / Link *</label>
                    <input type="text" id="scheduleRoom" value="${schedule.room}" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Update Schedule
                </button>
            </form>
        `;

        UIManager.showModal('adminModal', 'Edit Schedule', form);
        
        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.update(index);
        });
    },

    add() {
        const schedule = {
            id: Date.now(),
            course: document.getElementById('scheduleCourse').value,
            day: document.getElementById('scheduleDay').value.trim(),
            time: document.getElementById('scheduleTime').value.trim(),
            room: document.getElementById('scheduleRoom').value.trim()
        };

        AppState.schedules.push(schedule);
        AppState.save('schedules');
        this.renderAdmin();
        this.renderDashboard();
        UIManager.closeModal('adminModal');
        UIManager.notify('Schedule added successfully!', 'success');
        
        // Refresh today view
        if (window.TodayManager) {
            setTimeout(() => TodayManager.renderTodaySchedule(), 100);
        }
    },

    edit(index) {
        this.showEditForm(index);
    },

    update(index) {
        AppState.schedules[index] = {
            id: AppState.schedules[index].id,
            course: document.getElementById('scheduleCourse').value,
            day: document.getElementById('scheduleDay').value.trim(),
            time: document.getElementById('scheduleTime').value.trim(),
            room: document.getElementById('scheduleRoom').value.trim()
        };

        AppState.save('schedules');
        this.renderAdmin();
        this.renderDashboard();
        UIManager.closeModal('adminModal');
        UIManager.notify('Schedule updated successfully!', 'success');
    },

    delete(index) {
        UIManager.confirm(
            'Delete Schedule',
            'Are you sure you want to delete this schedule?',
            () => {
                AppState.schedules.splice(index, 1);
                AppState.save('schedules');
                this.renderAdmin();
                this.renderDashboard();
                UIManager.notify('Schedule deleted successfully!', 'info');
            },
            true
        );
    }
};

// Continue with remaining managers...
// ===================================
// TASK MANAGER
// ===================================
const TaskManager = {
    init() {
        this.render();
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showAddForm());
        
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentFilter = btn.dataset.filter;
                this.render();
            });
        });
    },

    render() {
        const container = document.getElementById('tasksList');
        let tasks = AppState.tasks;

        if (AppState.currentFilter === 'completed') {
            tasks = tasks.filter(t => t.completed);
        } else if (AppState.currentFilter === 'pending') {
            tasks = tasks.filter(t => !t.completed);
        }

        if (tasks.length === 0) {
            UIManager.renderEmptyState(container, 'clipboard-x', 'No tasks yet. Add one to get started!');
            return;
        }

        container.innerHTML = tasks.map((task, index) => {
            const actualIndex = AppState.tasks.findIndex(t => t.id === task.id);
            return `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    <input type="checkbox" class="task-checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        onchange="TaskManager.toggle(${actualIndex})">
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="task-badge badge-${task.type}">${task.type}</span>
                            <span class="task-badge badge-${task.priority}">${task.priority}</span>
                            <span><i class="bi bi-book"></i> ${task.course}</span>
                            <span><i class="bi bi-calendar"></i> ${task.dueDate}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-icon btn-sm btn-focus-task" onclick="FocusModeManager.open(${actualIndex})" title="Start Focus Session">
                            <i class="bi bi-bullseye"></i>
                        </button>
                        <button class="btn btn-icon btn-sm" onclick="TaskManager.delete(${actualIndex})" title="Delete Task">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.updateStats();
    },

    showAddForm() {
        const courseOptions = AppState.courses.map(course => 
            `<option value="${course.name}">${course.name}</option>`
        ).join('');

        const form = `
            <form id="taskForm" class="form">
                <div class="form-group">
                    <label for="taskTitle">Task Title *</label>
                    <input type="text" id="taskTitle" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskType">Type *</label>
                        <select id="taskType" required>
                            <option value="assignment">Assignment</option>
                            <option value="project">Project</option>
                            <option value="exam">Exam</option>
                            <option value="practice">Practice</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taskPriority">Priority *</label>
                        <select id="taskPriority" required>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="taskCourse">Course *</label>
                    <select id="taskCourse" required>
                        <option value="">Select Course</option>
                        ${courseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="taskDueDate">Due Date *</label>
                    <input type="date" id="taskDueDate" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Add Task
                </button>
            </form>
        `;

        UIManager.showModal('dashboardModal', 'Add Task', form);
        
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    add() {
        const task = {
            id: Date.now(),
            title: document.getElementById('taskTitle').value.trim(),
            type: document.getElementById('taskType').value,
            priority: document.getElementById('taskPriority').value,
            course: document.getElementById('taskCourse').value,
            dueDate: document.getElementById('taskDueDate').value,
            completed: false
        };

        AppState.tasks.push(task);
        AppState.save('tasks');
        this.render();
        UIManager.closeModal('dashboardModal');
        UIManager.notify('Task added successfully!', 'success');
        
        // Refresh today view
        if (window.TodayManager) {
            setTimeout(() => TodayManager.renderDueTasks(), 100);
        }
    },

    toggle(index) {
        AppState.tasks[index].completed = !AppState.tasks[index].completed;
        AppState.save('tasks');
        this.render();
        
        // Refresh today view
        if (window.TodayManager) {
            setTimeout(() => TodayManager.renderDueTasks(), 100);
        }
    },

    delete(index) {
        UIManager.confirm(
            'Delete Task',
            'Are you sure you want to delete this task?',
            () => {
                AppState.tasks.splice(index, 1);
                AppState.save('tasks');
                this.render();
                UIManager.notify('Task deleted successfully!', 'info');
            },
            true
        );
    },

    updateStats() {
        document.getElementById('totalTasks').textContent = AppState.tasks.filter(t => !t.completed).length;
    }
};

// ===================================
// GRADE MANAGER
// ===================================
const GradeManager = {
    init() {
        this.render();
        document.getElementById('addGradeBtn').addEventListener('click', () => this.showAddForm());
    },

    render() {
        const container = document.getElementById('gradesList');
        
        if (AppState.grades.length === 0) {
            UIManager.renderEmptyState(container, 'file-earmark-bar-graph', 'No grades recorded yet.');
            this.updateGPA();
            return;
        }

        container.innerHTML = AppState.grades.map((grade, index) => `
            <div class="grade-item">
                <div class="grade-info">
                    <h4>${grade.course}</h4>
                    <p class="grade-units">${grade.units} ${grade.units === 1 ? 'unit' : 'units'}</p>
                </div>
                <div class="grade-value">${grade.grade.toFixed(2)}</div>
                <div class="item-actions">
                    <button class="btn btn-icon btn-sm" onclick="GradeManager.delete(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateGPA();
    },

    showAddForm() {
        const courseOptions = AppState.courses.map(course => 
            `<option value="${course.name}" data-units="${course.units}">${course.name}</option>`
        ).join('');

        const form = `
            <form id="gradeForm" class="form">
                <div class="form-group">
                    <label for="gradeCourse">Course *</label>
                    <select id="gradeCourse" required>
                        <option value="">Select Course</option>
                        ${courseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="gradeUnits">Units *</label>
                    <input type="number" id="gradeUnits" min="1" max="10" required readonly>
                </div>
                <div class="form-group">
                    <label for="gradeValue">Grade *</label>
                    <input type="number" id="gradeValue" min="0" max="5" step="0.01" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Add Grade
                </button>
            </form>
        `;

        UIManager.showModal('dashboardModal', 'Add Grade', form);
        
        const courseSelect = document.getElementById('gradeCourse');
        courseSelect.addEventListener('change', () => {
            const selectedOption = courseSelect.options[courseSelect.selectedIndex];
            const units = selectedOption.dataset.units;
            document.getElementById('gradeUnits').value = units || '';
        });
        
        document.getElementById('gradeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    add() {
        const grade = {
            id: Date.now(),
            course: document.getElementById('gradeCourse').value,
            units: parseInt(document.getElementById('gradeUnits').value),
            grade: parseFloat(document.getElementById('gradeValue').value)
        };

        AppState.grades.push(grade);
        AppState.save('grades');
        this.render();
        UIManager.closeModal('dashboardModal');
        UIManager.notify('Grade added successfully!', 'success');
    },

    delete(index) {
        UIManager.confirm(
            'Delete Grade',
            'Are you sure you want to delete this grade?',
            () => {
                AppState.grades.splice(index, 1);
                AppState.save('grades');
                this.render();
                UIManager.notify('Grade deleted successfully!', 'info');
            },
            true
        );
    },

    updateGPA() {
        let totalWeightedGrade = 0;
        let totalUnits = 0;

        AppState.grades.forEach(grade => {
            totalWeightedGrade += grade.grade * grade.units;
            totalUnits += grade.units;
        });

        const gpa = totalUnits > 0 ? totalWeightedGrade / totalUnits : 0;
        
        document.getElementById('gpaValue').textContent = gpa.toFixed(2);
        document.getElementById('gpaDisplay').textContent = gpa.toFixed(2);
    }
};

// ===================================
// ACHIEVEMENT MANAGER
// ===================================
const AchievementManager = {
    init() {
        this.render();
        document.getElementById('addAchievementBtn').addEventListener('click', () => this.showAddForm());
    },

    render() {
        const container = document.getElementById('achievementsList');
        
        if (AppState.achievements.length === 0) {
            UIManager.renderEmptyState(container, 'star', 'No achievements yet. Start celebrating your wins!');
            return;
        }

        container.innerHTML = AppState.achievements.map((achievement, index) => `
            <div class="achievement-item">
                <h4>
                    <i class="bi bi-trophy-fill"></i>
                    ${achievement.title}
                </h4>
                <p class="achievement-desc">${achievement.description}</p>
                <p class="achievement-date">
                    <i class="bi bi-calendar-check"></i> ${achievement.date}
                </p>
                <div class="item-actions" style="margin-top: 0.5rem;">
                    <button class="btn btn-icon btn-sm" onclick="AchievementManager.delete(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    showAddForm() {
        const form = `
            <form id="achievementForm" class="form">
                <div class="form-group">
                    <label for="achievementTitle">Title *</label>
                    <input type="text" id="achievementTitle" required>
                </div>
                <div class="form-group">
                    <label for="achievementDesc">Description *</label>
                    <textarea id="achievementDesc" required></textarea>
                </div>
                <div class="form-group">
                    <label for="achievementDate">Date Achieved *</label>
                    <input type="date" id="achievementDate" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Add Achievement
                </button>
            </form>
        `;

        UIManager.showModal('dashboardModal', 'Add Achievement', form);
        
        document.getElementById('achievementForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    add() {
        const achievement = {
            id: Date.now(),
            title: document.getElementById('achievementTitle').value.trim(),
            description: document.getElementById('achievementDesc').value.trim(),
            date: document.getElementById('achievementDate').value
        };

        AppState.achievements.push(achievement);
        AppState.save('achievements');
        this.render();
        UIManager.closeModal('dashboardModal');
        UIManager.notify('Achievement added successfully!', 'success');
    },

    delete(index) {
        UIManager.confirm(
            'Delete Achievement',
            'Are you sure you want to delete this achievement?',
            () => {
                AppState.achievements.splice(index, 1);
                AppState.save('achievements');
                this.render();
                UIManager.notify('Achievement deleted successfully!', 'info');
            },
            true
        );
    }
};

// ===================================
// TODAY'S OVERVIEW MANAGER
// ===================================
const TodayManager = {
    notificationInterval: null,
    lastNotifiedClass: null,

    init() {
        this.render();
        this.startNotificationCheck();
        
        // Update every minute
        setInterval(() => {
            this.render();
        }, 60000);
    },

    render() {
        this.renderDate();
        this.renderTodaySchedule();
        this.renderDueTasks();
    },

    renderDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
    },

    renderTodaySchedule() {
        const container = document.getElementById('todaySchedule');
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Filter schedules for today
        const todaySchedules = [];
        
        AppState.schedules.forEach(schedule => {
            const schedDays = schedule.day.split(',').map(d => d.trim());
            const schedTimes = schedule.time.split('/').map(t => t.trim());
            
            schedDays.forEach((day, index) => {
                if (day === today) {
                    const timeForDay = schedTimes[index] || schedTimes[0];
                    const formattedTime = ScheduleManager.formatTimeWithAMPM(timeForDay);
                    
                    // Parse start time for sorting
                    const startTime = this.parseTime(timeForDay);
                    
                    todaySchedules.push({
                        course: schedule.course,
                        time: formattedTime,
                        room: schedule.room,
                        startTime: startTime,
                        rawTime: timeForDay
                    });
                }
            });
        });
        
        if (todaySchedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="bi bi-calendar-x"></i>
                    <p>No classes today</p>
                </div>
            `;
            return;
        }
        
        // Sort by start time
        todaySchedules.sort((a, b) => a.startTime - b.startTime);
        
        container.innerHTML = todaySchedules.map(schedule => {
            const {isNow, isUpcoming} = this.checkClassStatus(schedule.rawTime, currentTime);
            
            let statusClass = '';
            if (isNow) statusClass = 'happening-now';
            else if (isUpcoming) statusClass = 'upcoming';
            
            return `
                <div class="today-schedule-item ${statusClass}">
                    <h4>${schedule.course}</h4>
                    <div class="today-schedule-time">
                        <i class="bi bi-clock"></i>
                        <span>${schedule.time}</span>
                    </div>
                    <div class="today-schedule-room">
                        <i class="bi bi-geo-alt"></i> ${schedule.room}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDueTasks() {
        const container = document.getElementById('todayTasks');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        // Filter tasks due within 3 days and not completed
        const dueSoonTasks = AppState.tasks.filter(task => {
            if (task.completed) return false;
            
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            return dueDate <= threeDaysFromNow;
        }).sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        if (dueSoonTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="bi bi-check-circle"></i>
                    <p>No tasks due soon</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = dueSoonTasks.slice(0, 5).map(task => {
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            const isOverdue = dueDate < today;
            const isDueToday = dueDate.getTime() === today.getTime();
            
            let statusClass = '';
            let iconClass = 'bi-clock';
            let dueText = 'Due ' + task.dueDate;
            
            if (isOverdue) {
                statusClass = 'overdue';
                iconClass = 'bi-exclamation-triangle-fill';
                dueText = 'Overdue!';
            } else if (isDueToday) {
                statusClass = 'due-today';
                iconClass = 'bi-alarm';
                dueText = 'Due Today';
            }
            
            return `
                <div class="today-task-item ${statusClass}">
                    <i class="bi ${iconClass} today-task-icon ${statusClass}"></i>
                    <div class="today-task-info">
                        <h5>${task.title}</h5>
                        <p>${task.course}</p>
                    </div>
                    <span class="today-task-due ${statusClass}">${dueText}</span>
                </div>
            `;
        }).join('');
    },

    parseTime(timeString) {
        // Parse time string like "9:00 - 10:30" or "9:00" to minutes from midnight
        const startTimeStr = timeString.split('-')[0].trim();
        const match = startTimeStr.match(/(\d+):(\d+)/);
        
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        
        // Handle AM/PM if present
        if (timeString.toUpperCase().includes('PM') && hours !== 12) {
            hours += 12;
        } else if (timeString.toUpperCase().includes('AM') && hours === 12) {
            hours = 0;
        }
        
        return hours * 60 + minutes;
    },

    checkClassStatus(timeString, currentTime) {
        const times = timeString.split('-').map(t => t.trim());
        if (times.length !== 2) return { isNow: false, isUpcoming: false };
        
        const startTime = this.parseTime(times[0]);
        const endTime = this.parseTime(times[1]);
        
        const isNow = currentTime >= startTime && currentTime <= endTime;
        const isUpcoming = currentTime < startTime && (startTime - currentTime) <= 30; // Within 30 min
        
        return { isNow, isUpcoming };
    },

    startNotificationCheck() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Check every minute for upcoming classes
        this.notificationInterval = setInterval(() => {
            this.checkUpcomingClasses();
        }, 60000); // Every minute
        
        // Check immediately
        this.checkUpcomingClasses();
    },

    checkUpcomingClasses() {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        AppState.schedules.forEach(schedule => {
            const schedDays = schedule.day.split(',').map(d => d.trim());
            const schedTimes = schedule.time.split('/').map(t => t.trim());
            
            schedDays.forEach((day, index) => {
                if (day === today) {
                    const timeForDay = schedTimes[index] || schedTimes[0];
                    const startTime = this.parseTime(timeForDay);
                    const minutesUntil = startTime - currentTime;
                    
                    // Notify 10 minutes before class
                    if (minutesUntil === 10) {
                        const notificationKey = `${schedule.course}-${timeForDay}`;
                        
                        // Prevent duplicate notifications
                        if (this.lastNotifiedClass !== notificationKey) {
                            this.lastNotifiedClass = notificationKey;
                            
                            const formattedTime = ScheduleManager.formatTimeWithAMPM(timeForDay);
                            
                            new Notification('Class Starting Soon! 🎓', {
                                body: `${schedule.course} starts in 10 minutes at ${formattedTime}
Room: ${schedule.room}`,
                                icon: '/student-hub/icons/icon-192x192.png',
                                badge: '/student-hub/icons/icon-72x72.png',
                                tag: notificationKey,
                                requireInteraction: false
                            });
                            
                            // Also show in-app notification
                            UIManager.notify(`Class starting soon: ${schedule.course} at ${formattedTime}`, 'info');
                        }
                    }
                    
                    // Notify when class is starting (within 2 minutes)
                    if (minutesUntil >= 0 && minutesUntil <= 2) {
                        const notificationKey = `${schedule.course}-starting-${timeForDay}`;
                        
                        if (this.lastNotifiedClass !== notificationKey) {
                            this.lastNotifiedClass = notificationKey;
                            
                            UIManager.notify(`${schedule.course} is starting now! 🎓`, 'warning');
                        }
                    }
                }
            });
        });
    },

    destroy() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
    }
};

// ===================================
// FOCUS MODE MANAGER (Task-Based Pomodoro)
// ===================================
const FocusModeManager = {
    currentTask: null,
    timer: null,
    timeLeft: 0,
    totalTime: 0,
    isRunning: false,
    stats: {
        sessionsToday: 0,
        minutesToday: 0,
        lastDate: null
    },

    init() {
        this.loadStats();
        this.setupControls();
    },

    loadStats() {
        const saved = StorageManager.get('focusStats');
        if (saved) {
            const today = new Date().toDateString();
            if (saved.lastDate === today) {
                this.stats = saved;
            } else {
                // Reset for new day
                this.stats = {
                    sessionsToday: 0,
                    minutesToday: 0,
                    lastDate: today
                };
            }
        } else {
            this.stats.lastDate = new Date().toDateString();
        }
        this.updateStats();
    },

    saveStats() {
        StorageManager.set('focusStats', this.stats);
    },

    setupControls() {
        document.getElementById('focusClose').addEventListener('click', () => this.close());
        document.getElementById('focusStart').addEventListener('click', () => this.start());
        document.getElementById('focusPause').addEventListener('click', () => this.pause());
        document.getElementById('focusReset').addEventListener('click', () => this.reset());
        
        // Update timer display when input changes
        document.getElementById('focusTimeInput').addEventListener('input', (e) => {
            if (!this.isRunning) {
                const minutes = parseInt(e.target.value) || 25;
                this.timeLeft = minutes * 60;
                this.totalTime = minutes * 60;
                this.render();
            }
        });
    },

    open(taskIndex) {
        const task = AppState.tasks[taskIndex];
        if (!task) return;

        this.currentTask = { ...task, index: taskIndex };
        
        // Set default time to 25 minutes
        const minutes = parseInt(document.getElementById('focusTimeInput').value) || 25;
        this.timeLeft = minutes * 60;
        this.totalTime = minutes * 60;
        
        // Populate task info
        document.getElementById('focusTaskTitle').textContent = task.title;
        document.getElementById('focusTaskType').textContent = task.type;
        document.getElementById('focusTaskType').className = `task-badge badge-${task.type}`;
        document.getElementById('focusTaskPriority').textContent = task.priority;
        document.getElementById('focusTaskPriority').className = `task-badge badge-${task.priority}`;
        document.getElementById('focusTaskCourse').textContent = task.course;
        document.getElementById('focusTaskDue').textContent = task.dueDate;
        
        // Show overlay
        document.getElementById('focusOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.render();
        this.updateStats();
    },

    close() {
        if (this.isRunning) {
            UIManager.confirm(
                'Exit Focus Mode?',
                'Your timer is still running. Are you sure you want to exit?',
                () => {
                    this.forceClose();
                }
            );
        } else {
            this.forceClose();
        }
    },

    forceClose() {
        this.pause();
        this.reset();
        document.getElementById('focusOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        this.currentTask = null;
    },

    start() {
        if (this.isRunning) return;
        
        // Get time from input if not started yet
        if (this.timeLeft === 0) {
            const minutes = parseInt(document.getElementById('focusTimeInput').value) || 25;
            this.timeLeft = minutes * 60;
            this.totalTime = minutes * 60;
        }
        
        this.isRunning = true;
        
        document.getElementById('focusStart').style.display = 'none';
        document.getElementById('focusPause').style.display = 'inline-flex';
        document.getElementById('focusTimeInput').disabled = true;
        
        const circle = document.getElementById('focusTimerCircle');
        circle.classList.add('running');
        
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.render();
            } else {
                this.complete();
            }
        }, 1000);
    },

    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        document.getElementById('focusStart').style.display = 'inline-flex';
        document.getElementById('focusPause').style.display = 'none';
        
        const circle = document.getElementById('focusTimerCircle');
        circle.classList.remove('running');
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    reset() {
        this.pause();
        
        const minutes = parseInt(document.getElementById('focusTimeInput').value) || 25;
        this.timeLeft = minutes * 60;
        this.totalTime = minutes * 60;
        
        document.getElementById('focusTimeInput').disabled = false;
        document.getElementById('focusTimerCircle').classList.remove('completed');
        document.getElementById('focusProgressFill').style.width = '0%';
        
        this.render();
    },

    complete() {
        this.pause();
        
        const circle = document.getElementById('focusTimerCircle');
        circle.classList.add('completed');
        
        // Update stats
        const minutesCompleted = Math.floor(this.totalTime / 60);
        this.stats.sessionsToday++;
        this.stats.minutesToday += minutesCompleted;
        this.stats.lastDate = new Date().toDateString();
        this.saveStats();
        this.updateStats();
        
        // Show completion notification
        UIManager.notify(`🎉 Focus session complete! You focused for ${minutesCompleted} minutes!`, 'success');
        
        // Play notification sound
        this.playNotification();
        
        // Ask if they want to mark task as complete
        setTimeout(() => {
            UIManager.confirm(
                'Task Complete?',
                'Great work! Do you want to mark this task as completed?',
                () => {
                    if (this.currentTask && this.currentTask.index !== undefined) {
                        TaskManager.toggle(this.currentTask.index);
                        UIManager.notify('Task marked as complete! 🎊', 'success');
                    }
                    this.forceClose();
                }
            );
        }, 1000);
    },

    render() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('focusTimerTime').textContent = timeString;
        
        // Update label
        if (this.isRunning) {
            document.getElementById('focusTimerLabel').textContent = 'Stay Focused...';
        } else if (this.timeLeft === 0) {
            document.getElementById('focusTimerLabel').textContent = 'Completed!';
        } else if (this.timeLeft === this.totalTime) {
            document.getElementById('focusTimerLabel').textContent = 'Ready to Focus';
        } else {
            document.getElementById('focusTimerLabel').textContent = 'Paused';
        }
        
        // Update progress bar
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        document.getElementById('focusProgressFill').style.width = `${progress}%`;
    },

    updateStats() {
        document.getElementById('focusSessionCount').textContent = this.stats.sessionsToday;
        document.getElementById('focusTotalTime').textContent = this.stats.minutesToday;
    },

    playNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Session Complete! 🎉', {
                body: `Great job! You completed a ${Math.floor(this.totalTime / 60)}-minute focus session.`,
                icon: '/student-hub/icons/icon-192x192.png',
                badge: '/student-hub/icons/icon-72x72.png'
            });
        }
        
        // Optional: Play a simple beep sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS86eeXSwwRR57g8LljGgU3k9nxy3goBS1+zPLaizsLEWO56+mjUBELTKXh77BeCw==');
            audio.play().catch(() => {});
        } catch (e) {}
    }
};

// ===================================
// PROJECT MANAGER
// ===================================
const ProjectManager = {
    init() {
        this.render();
        document.getElementById('addProjectBtn').addEventListener('click', () => this.showAddForm());
    },

    render() {
        const container = document.getElementById('projectsGrid');
        
        if (AppState.projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state-large">
                    <i class="bi bi-folder-x"></i>
                    <h3>No projects yet</h3>
                    <p>Start building and showcase your programming portfolio!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = AppState.projects.map((project, index) => `
            <div class="project-card">
                <div class="project-actions">
                    <button class="btn btn-icon btn-sm" onclick="ProjectManager.edit(${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="ProjectManager.delete(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="project-header">
                    <h3>${project.title}</h3>
                    <span class="project-status status-${project.status.toLowerCase().replace(' ', '-')}">
                        ${project.status}
                    </span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-tech">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
                <div class="project-links">
                    ${project.link ? `
                        <a href="${project.link}" target="_blank" class="project-link">
                            <i class="bi bi-link-45deg"></i> View Project
                        </a>
                    ` : ''}
                    ${project.github ? `
                        <a href="${project.github}" target="_blank" class="project-link">
                            <i class="bi bi-github"></i> GitHub
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    showAddForm() {
        const form = `
            <form id="projectForm" class="form">
                <div class="form-group">
                    <label for="projectTitle">Project Title *</label>
                    <input type="text" id="projectTitle" required>
                </div>
                <div class="form-group">
                    <label for="projectDesc">Description *</label>
                    <textarea id="projectDesc" required></textarea>
                </div>
                <div class="form-group">
                    <label for="projectTech">Technologies Used (comma-separated) *</label>
                    <input type="text" id="projectTech" placeholder="e.g., HTML, CSS, JavaScript" required>
                </div>
                <div class="form-group">
                    <label for="projectLink">Project Link (Optional)</label>
                    <input type="url" id="projectLink" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="projectGithub">GitHub Link (Optional)</label>
                    <input type="url" id="projectGithub" placeholder="https://github.com/...">
                </div>
                <div class="form-group">
                    <label for="projectStatus">Status *</label>
                    <select id="projectStatus" required>
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Add Project
                </button>
            </form>
        `;

        UIManager.showModal('projectsModal', 'Add Project', form);
        
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.add();
        });
    },

    showEditForm(index) {
        const project = AppState.projects[index];
        const form = `
            <form id="projectForm" class="form">
                <div class="form-group">
                    <label for="projectTitle">Project Title *</label>
                    <input type="text" id="projectTitle" value="${project.title}" required>
                </div>
                <div class="form-group">
                    <label for="projectDesc">Description *</label>
                    <textarea id="projectDesc" required>${project.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="projectTech">Technologies Used (comma-separated) *</label>
                    <input type="text" id="projectTech" value="${project.technologies.join(', ')}" required>
                </div>
                <div class="form-group">
                    <label for="projectLink">Project Link (Optional)</label>
                    <input type="url" id="projectLink" value="${project.link || ''}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="projectGithub">GitHub Link (Optional)</label>
                    <input type="url" id="projectGithub" value="${project.github || ''}" placeholder="https://github.com/...">
                </div>
                <div class="form-group">
                    <label for="projectStatus">Status *</label>
                    <select id="projectStatus" required>
                        <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Update Project
                </button>
            </form>
        `;

        UIManager.showModal('projectsModal', 'Edit Project', form);
        
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.update(index);
        });
    },

    add() {
        const project = {
            id: Date.now(),
            title: document.getElementById('projectTitle').value.trim(),
            description: document.getElementById('projectDesc').value.trim(),
            technologies: document.getElementById('projectTech').value.split(',').map(t => t.trim()),
            link: document.getElementById('projectLink').value.trim(),
            github: document.getElementById('projectGithub').value.trim(),
            status: document.getElementById('projectStatus').value
        };

        AppState.projects.push(project);
        AppState.save('projects');
        this.render();
        UIManager.closeModal('projectsModal');
        UIManager.notify('Project added successfully!', 'success');
    },

    edit(index) {
        this.showEditForm(index);
    },

    update(index) {
        AppState.projects[index] = {
            id: AppState.projects[index].id,
            title: document.getElementById('projectTitle').value.trim(),
            description: document.getElementById('projectDesc').value.trim(),
            technologies: document.getElementById('projectTech').value.split(',').map(t => t.trim()),
            link: document.getElementById('projectLink').value.trim(),
            github: document.getElementById('projectGithub').value.trim(),
            status: document.getElementById('projectStatus').value
        };

        AppState.save('projects');
        this.render();
        UIManager.closeModal('projectsModal');
        UIManager.notify('Project updated successfully!', 'success');
    },

    delete(index) {
        UIManager.confirm(
            'Delete Project',
            'Are you sure you want to delete this project?',
            () => {
                AppState.projects.splice(index, 1);
                AppState.save('projects');
                this.render();
                UIManager.notify('Project deleted successfully!', 'info');
            },
            true
        );
    }
};

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    try {
        console.log('🔄 Initializing AppState...');
        AppState.init();
        console.log('✅ AppState initialized');
        
        console.log('🔄 Initializing AuthManager...');
        AuthManager.init();
        console.log('✅ AuthManager initialized');
        
        // Only initialize these if user is logged in
        if (AppState.isLoggedIn && AppState.student) {
            console.log('👤 User is logged in, initializing managers...');
            NavigationManager.init();
            ThemeManager.init();
            ProfileManager.init();
            CourseManager.init();
            ScheduleManager.init();
            TaskManager.init();
            GradeManager.init();
            AchievementManager.init();
            TodayManager.init();
            FocusModeManager.init();
            ProjectManager.init();
            console.log('✅ All managers initialized');
        } else {
            console.log('🔓 User not logged in, showing auth page');
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        alert('Error loading app. Please check console for details.');
    }
    
    // Register Service Worker for PWA
    // Temporarily disabled for debugging
    // registerServiceWorker();
});

// ===================================
// SERVICE WORKER REGISTRATION
// ===================================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered successfully:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 New Service Worker installing...');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available, show update notification
                                console.log('✨ New version available! Please refresh.');
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
        
        // Listen for controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker controller changed');
        });
    } else {
        console.log('⚠️ Service Worker not supported in this browser');
    }
}

// Show update notification when new version is available
function showUpdateNotification() {
    if (AppState.isLoggedIn) {
        UIManager.notify('New version available! Refresh to update.', 'info');
    }
}

// Request notification permission (for future features)
function requestNotificationPermission() {
    if ('Notification' in window && navigator.serviceWorker) {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
            } else {
                console.log('⚠️ Notification permission denied');
            }
        });
    }
}

// Install prompt for PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA install prompt available');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button/notification if user is logged in
    if (AppState.isLoggedIn) {
        showInstallPromotion();
    }
});

// Show install promotion
function showInstallPromotion() {
    // You can create a custom install button here
    console.log('📱 Ready to install PWA');
    
    // Optional: Show a notification encouraging installation
    setTimeout(() => {
        if (deferredPrompt) {
            UIManager.notify('Install Student Hub for quick access!', 'info');
        }
    }, 3000);
}

// Trigger PWA install (can be called from a button click)
async function installPWA() {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            UIManager.notify('App installed successfully!', 'success');
        } else {
            console.log('❌ User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt for next time
        deferredPrompt = null;
    }
}

// Detect if app is running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Log PWA status on load
if (isPWA()) {
    console.log('🚀 Running as PWA (installed app)');
} else {
    console.log('🌐 Running in browser');
}

