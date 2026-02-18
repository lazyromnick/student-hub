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
            // Handle QuotaExceededError (common on mobile with large base64 photos)
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('Storage quota exceeded for key:', key);
                // If saving profile, try saving without photo
                if (key === 'studentProfile' && value && value.photo) {
                    try {
                        // Save photo separately
                        localStorage.setItem('studentPhoto', value.photo);
                        const profileWithoutPhoto = { ...value, photo: '__STORED_SEPARATELY__' };
                        localStorage.setItem(key, JSON.stringify(profileWithoutPhoto));
                        console.log('Photo saved separately due to quota');
                        return true;
                    } catch (e2) {
                        console.error('Failed to save even without photo:', e2);
                    }
                }
            }
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
        // Restore photo if it was stored separately due to quota
        if (this.student && this.student.photo === '__STORED_SEPARATELY__') {
            const savedPhoto = localStorage.getItem('studentPhoto');
            if (savedPhoto) this.student.photo = savedPhoto;
            else this.student.photo = null;
        }
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
                    MusicManager.init();
                    ProjectManager.init();
                    BottomNavManager.init();

                    // Wire up FAB buttons
                    const fabTask = document.getElementById('fabAddTask');
                    const fabGrade = document.getElementById('fabAddGrade');
                    const fabAchieve = document.getElementById('fabAddAchievement');
                    if (fabTask) fabTask.addEventListener('click', () => TaskManager.showAddForm());
                    if (fabGrade) fabGrade.addEventListener('click', () => GradeManager.showAddForm());
                    if (fabAchieve) fabAchieve.addEventListener('click', () => AchievementManager.showAddForm());

                    // Navigate to dashboard on login
                    NavigationManager.navigateTo('dashboard');
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
            if (link.dataset.page === page) link.classList.add('active');
            else link.classList.remove('active');
        });

        const pages = document.querySelectorAll('.page');
        pages.forEach(p => {
            if (p.id === `${page}-page`) p.classList.add('active');
            else p.classList.remove('active');
        });

        this.currentPage = page;

        // Show/hide FABs based on page
        const fabProject = document.getElementById('fabAddProject');
        const fabTask    = document.getElementById('fabAddTask');
        const fabGrade   = document.getElementById('fabAddGrade');
        const fabAchieve = document.getElementById('fabAddAchievement');

        if (fabProject) fabProject.style.display = page === 'projects' ? 'flex' : 'none';
        if (fabTask)    fabTask.style.display    = page === 'tasks'    ? 'flex' : 'none';
        if (fabGrade)   fabGrade.style.display   = page === 'grades'   ? 'flex' : 'none';
        if (fabAchieve) fabAchieve.style.display = page === 'achievements' ? 'flex' : 'none';

        // Update bottom nav visibility and active state
        if (window.BottomNavManager) {
            BottomNavManager.updateVisibility(page);
            BottomNavManager.syncWithPage(page);
        }
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
        this.loadProfile(); // Load profile data on init
        
        document.getElementById('editProfileBtn').addEventListener('click', () => this.showEditModal());
        
        const dashboardModalClose = document.getElementById('dashboardModalClose');
        const adminModalClose = document.getElementById('adminModalClose');
        const projectsModalClose = document.getElementById('projectsModalClose');
        const tasksModalClose = document.getElementById('tasksModalClose');
        const gradesModalClose = document.getElementById('gradesModalClose');
        const achievementsModalClose = document.getElementById('achievementsModalClose');
        
        dashboardModalClose.addEventListener('click', () => UIManager.closeModal('dashboardModal'));
        adminModalClose.addEventListener('click', () => UIManager.closeModal('adminModal'));
        projectsModalClose.addEventListener('click', () => UIManager.closeModal('projectsModal'));
        tasksModalClose.addEventListener('click', () => UIManager.closeModal('tasksModal'));
        gradesModalClose.addEventListener('click', () => UIManager.closeModal('gradesModal'));
        achievementsModalClose.addEventListener('click', () => UIManager.closeModal('achievementsModal'));
        
        document.getElementById('dashboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'dashboardModal') UIManager.closeModal('dashboardModal');
        });
        document.getElementById('adminModal').addEventListener('click', (e) => {
            if (e.target.id === 'adminModal') UIManager.closeModal('adminModal');
        });
        document.getElementById('projectsModal').addEventListener('click', (e) => {
            if (e.target.id === 'projectsModal') UIManager.closeModal('projectsModal');
        });
        document.getElementById('tasksModal').addEventListener('click', (e) => {
            if (e.target.id === 'tasksModal') UIManager.closeModal('tasksModal');
        });
        document.getElementById('gradesModal').addEventListener('click', (e) => {
            if (e.target.id === 'gradesModal') UIManager.closeModal('gradesModal');
        });
        document.getElementById('achievementsModal').addEventListener('click', (e) => {
            if (e.target.id === 'achievementsModal') UIManager.closeModal('achievementsModal');
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
        const existingPhoto = AppState.student.photo;
        
        AppState.student = {
            studentId: AppState.student.studentId,
            name: document.getElementById('editName').value.trim(),
            program: document.getElementById('editProgram').value.trim(),
            semester: document.getElementById('editSemester').value,
            photo: this.currentEditPhoto !== undefined ? this.currentEditPhoto : existingPhoto
        };
        
        // Save to localStorage
        StorageManager.set('studentProfile', AppState.student);
        
        // Reset currentEditPhoto
        this.currentEditPhoto = undefined;
        
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
        // Note: Add Task button is now a FAB, wired in app init
        
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

        UIManager.showModal('tasksModal', 'Add Task', form);
        
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
        UIManager.closeModal('tasksModal');
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
        // Note: Add Grade button is now a FAB, wired in app init
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

        UIManager.showModal('gradesModal', 'Add Grade', form);
        
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
        UIManager.closeModal('gradesModal');
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
        // Note: Add Achievement button is now a FAB, wired in app init
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

        UIManager.showModal('achievementsModal', 'Add Achievement', form);
        
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
        UIManager.closeModal('achievementsModal');
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
// ===================================
// NOTIFICATION MANAGER
// ===================================
const NotificationManager = {
    STORAGE_KEY: 'hubNotifications',
    notifications: [],

    init() {
        this.load();
        this.pruneOld();
        this.renderPanel();
        this.updateBadge();

        document.getElementById('notifBellBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });
        document.getElementById('notifPanelOverlay').addEventListener('click', () => this.closePanel());
        document.getElementById('notifClearAll').addEventListener('click', () => this.clearAll());
    },

    load() {
        this.notifications = StorageManager.get(this.STORAGE_KEY) || [];
    },

    save() {
        StorageManager.set(this.STORAGE_KEY, this.notifications);
    },

    pruneOld() {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
        this.notifications = this.notifications.filter(n => n.timestamp > cutoff);
        this.save();
    },

    add(type, title, body, key = null) {
        // Prevent duplicates by key
        if (key && this.notifications.find(n => n.key === key)) return;

        const notif = {
            id: Date.now() + Math.random(),
            key: key || `${type}-${Date.now()}`,
            type,   // 'upcoming' | 'overdue' | 'missed' | 'due-today' | 'done'
            title,
            body,
            timestamp: Date.now(),
            unread: true
        };

        this.notifications.unshift(notif);
        this.save();
        this.renderPanel();
        this.updateBadge();
        return notif;
    },

    markRead(id) {
        const n = this.notifications.find(n => n.id === id);
        if (n) { n.unread = false; this.save(); this.updateBadge(); }
    },

    clearAll() {
        this.notifications = [];
        this.save();
        this.renderPanel();
        this.updateBadge();
    },

    updateBadge() {
        const badge = document.getElementById('notifBadge');
        const btn   = document.getElementById('notifBellBtn');
        const unread = this.notifications.filter(n => n.unread).length;

        if (unread > 0) {
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.style.display = 'flex';
            btn.classList.add('has-notifs');
        } else {
            badge.style.display = 'none';
            btn.classList.remove('has-notifs');
        }
    },

    togglePanel() {
        const panel   = document.getElementById('notifPanel');
        const overlay = document.getElementById('notifPanelOverlay');
        const isOpen  = panel.classList.contains('active');
        if (isOpen) {
            this.closePanel();
        } else {
            panel.classList.add('active');
            overlay.classList.add('active');
            // Mark all as read when opened
            this.notifications.forEach(n => n.unread = false);
            this.save();
            this.updateBadge();
        }
    },

    closePanel() {
        document.getElementById('notifPanel').classList.remove('active');
        document.getElementById('notifPanelOverlay').classList.remove('active');
    },

    renderPanel() {
        const body = document.getElementById('notifPanelBody');
        if (this.notifications.length === 0) {
            body.innerHTML = `
                <div class="notif-empty">
                    <i class="bi bi-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>`;
            return;
        }

        const iconMap = {
            upcoming:  'bi-clock-fill',
            'due-today': 'bi-alarm-fill',
            overdue:   'bi-exclamation-triangle-fill',
            missed:    'bi-x-circle-fill',
            done:      'bi-check-circle-fill'
        };

        body.innerHTML = this.notifications.map(n => `
            <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                <div class="notif-icon ${n.type}">
                    <i class="bi ${iconMap[n.type] || 'bi-bell'}"></i>
                </div>
                <div class="notif-text">
                    <h5>${n.title}</h5>
                    <p>${n.body}</p>
                </div>
                <span class="notif-time">${this.timeAgo(n.timestamp)}</span>
            </div>
        `).join('');

        body.querySelectorAll('.notif-item').forEach(el => {
            el.addEventListener('click', () => this.markRead(parseFloat(el.dataset.id)));
        });
    },

    timeAgo(ts) {
        const diff = Math.floor((Date.now() - ts) / 60000);
        if (diff < 1)  return 'just now';
        if (diff < 60) return `${diff}m ago`;
        const h = Math.floor(diff / 60);
        return h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
    }
};

// ===================================
// TODAY MANAGER (with attendance)
// ===================================
const TodayManager = {
    notificationInterval: null,
    attendanceState: {},    // { courseKey: 'attended'|'missed'|'pending'|'cancelled' }
    toastSnoozed: {},       // { courseKey: timestamp } — "Not yet" snooze tracking
    toastAnswered: {},      // { courseKey: true } — fully answered, never show again
    activeToast: null,
    cancelState: {},        // { courseKey: true } — cancelled for today

    init() {
        this.loadAttendance();
        this.render();
        this.startNotificationCheck();
        // Re-render every minute
        setInterval(() => this.render(), 60000);
    },

    loadAttendance() {
        const today = new Date().toDateString();
        const saved = StorageManager.get('attendanceState');
        if (saved && saved.date === today) {
            this.attendanceState = saved.state       || {};
            this.toastAnswered   = saved.answered    || {};
            this.cancelState     = saved.cancelState || {};
        } else {
            // New day — reset everything
            this.attendanceState = {};
            this.toastAnswered   = {};
            this.cancelState     = {};
            this.saveAttendance();
        }
    },

    saveAttendance() {
        StorageManager.set('attendanceState', {
            date:        new Date().toDateString(),
            state:       this.attendanceState,
            answered:    this.toastAnswered,
            cancelState: this.cancelState
        });
    },

    render() {
        this.renderDate();
        this.renderTodaySchedule();
        this.renderDueTasks();
    },

    renderDate() {
        const today   = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('todayDate').textContent = today.toLocaleDateString('en-US', options);
    },

    renderTodaySchedule() {
        const container   = document.getElementById('todaySchedule');
        const todayName   = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = new Date().getHours() * 60 + new Date().getMinutes();

        const todaySchedules = [];

        AppState.schedules.forEach(schedule => {
            const days  = schedule.day.split(',').map(d => d.trim());
            const times = schedule.time.split('/').map(t => t.trim());

            days.forEach((day, idx) => {
                if (day !== todayName) return;
                const rawTime   = times[idx] || times[0];
                const courseKey = `${schedule.course}-${rawTime}`;
                todaySchedules.push({
                    course:    schedule.course,
                    time:      ScheduleManager.formatTimeWithAMPM(rawTime),
                    room:      schedule.room,
                    startTime: this.parseTime(rawTime),
                    endTime:   this.parseEndTime(rawTime),
                    rawTime,
                    courseKey
                });
            });
        });

        if (todaySchedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="bi bi-calendar-x"></i>
                    <p>No classes today</p>
                </div>`;
            return;
        }

        todaySchedules.sort((a, b) => a.startTime - b.startTime);

        // ── Categorise into 4 buckets ─────────────────────────────────────
        const ongoing   = [];
        const done      = [];
        const missed    = [];
        const cancelled = [];

        todaySchedules.forEach(s => {
            const attendance  = this.attendanceState[s.courseKey];
            const isCancelled = this.cancelState[s.courseKey];
            const { isNow, isUpcoming, isDone } = this.checkClassStatus(s.rawTime, currentTime);

            if (isCancelled) {
                cancelled.push({ ...s, attendance, isCancelled });
                return;
            }

            if (isDone) {
                if (!this.toastAnswered[s.courseKey]) {
                    this.attendanceState[s.courseKey] = 'missed';
                    this.toastAnswered[s.courseKey]   = true;
                    this.saveAttendance();
                    NotificationManager.add('missed', 'Missed Class',
                        `Looks like you missed ${s.course}.`, `missed-${s.courseKey}`);
                }
                const final = this.attendanceState[s.courseKey];
                if (final === 'attended') {
                    done.push({ ...s, attendance: final });
                } else {
                    missed.push({ ...s, attendance: final });
                }
                return;
            }

            // Still active (ongoing / upcoming)
            ongoing.push({ ...s, attendance, isNow, isUpcoming });
        });

        // ── Build card HTML ──────────────────────────────────────────────
        const buildCard = (s, type) => {
            let itemClass   = '';
            let statusBadge = '';

            if (type === 'ongoing') {
                if (s.isNow && s.attendance === 'attended') {
                    itemClass   = 'class-attending';
                    statusBadge = `<span class="class-status-badge attending"><i class="bi bi-check-circle-fill"></i> Attending ✔️</span>`;
                } else if (s.isNow) {
                    itemClass   = 'happening-now';
                    statusBadge = `<span class="class-status-badge upcoming-soon"><i class="bi bi-circle-fill"></i> In progress</span>`;
                } else {
                    itemClass   = 'upcoming';
                    statusBadge = `<span class="class-status-badge upcoming-soon"><i class="bi bi-clock"></i> Starting soon</span>`;
                }
            } else if (type === 'done') {
                itemClass   = 'class-done-attended';
                statusBadge = `<span class="class-status-badge attended"><i class="bi bi-check2-circle"></i> Class done!</span>`;
            } else if (type === 'missed') {
                itemClass   = 'class-done-missed';
                statusBadge = `<span class="class-status-badge missed"><i class="bi bi-x-lg"></i> Missed class</span>`;
            } else if (type === 'cancelled') {
                itemClass   = 'class-done-cancelled';
                statusBadge = `<span class="class-status-badge cancelled"><i class="bi bi-slash-circle"></i> Cancelled</span>`;
            }

            return `
                <div class="today-schedule-item ${itemClass}"
                     data-course-key="${s.courseKey}"
                     data-course="${s.course}"
                     data-attendance="${s.attendance || ''}"
                     data-cancelled="${s.isCancelled || ''}">
                    <h4>${s.course}</h4>
                    <div class="today-schedule-time">
                        <i class="bi bi-clock"></i> <span>${s.time}</span>
                    </div>
                    <div class="today-schedule-room">
                        <i class="bi bi-geo-alt"></i> ${s.room}
                    </div>
                    ${statusBadge}
                </div>`;
        };

        const sectionHeader = (type, icon, label, count) => `
            <div class="schedule-section-header ${type}-header">
                <i class="bi ${icon}"></i>
                <span>${label}</span>
                <span class="section-count">${count}</span>
            </div>`;

        // ── Assemble HTML ────────────────────────────────────────────────
        let html = '';

        if (ongoing.length > 0) {
            html += `<div class="schedule-section">${ongoing.map(s => buildCard(s, 'ongoing')).join('')}</div>`;
        }

        if (done.length > 0) {
            html += sectionHeader('done', 'bi-check2-circle', 'Done', done.length);
            html += `<div class="schedule-section">${done.map(s => buildCard(s, 'done')).join('')}</div>`;
        }

        if (missed.length > 0) {
            html += sectionHeader('missed', 'bi-x-circle', 'Missed Classes', missed.length);
            html += `<div class="schedule-section">${missed.map(s => buildCard(s, 'missed')).join('')}</div>`;
        }

        if (cancelled.length > 0) {
            html += sectionHeader('cancelled', 'bi-slash-circle', 'Cancelled', cancelled.length);
            html += `<div class="schedule-section">${cancelled.map(s => buildCard(s, 'cancelled')).join('')}</div>`;
        }

        if (!html) {
            html = `<div class="empty-state-small"><i class="bi bi-calendar-check"></i><p>No classes today</p></div>`;
        }

        container.innerHTML = html;
        container.querySelectorAll('.today-schedule-item').forEach(el => this.attachLongPress(el));
    },

    // ─── LONG PRESS CONTEXT MENU ────────────────────────────────────────────
    attachLongPress(el) {
        let pressTimer = null;

        const start = () => {
            pressTimer = setTimeout(() => this.showContextMenu(el), 600);
        };
        const cancel = () => { if (pressTimer) clearTimeout(pressTimer); };

        el.addEventListener('touchstart',  start,  { passive: true });
        el.addEventListener('touchend',    cancel);
        el.addEventListener('touchmove',   cancel);
        el.addEventListener('mousedown',   start);
        el.addEventListener('mouseup',     cancel);
        el.addEventListener('mouseleave',  cancel);
        // Prevent default context menu on desktop
        el.addEventListener('contextmenu', e => { e.preventDefault(); this.showContextMenu(el); });
    },

    showContextMenu(el) {
        const courseKey  = el.dataset.courseKey;
        const courseName = el.dataset.course;
        const attendance = el.dataset.attendance;
        const cancelled  = el.dataset.cancelled === 'true';

        // Remove existing menu
        document.querySelector('.schedule-context-menu')?.remove();

        const menu = document.createElement('div');
        menu.className = 'schedule-context-menu';
        menu.innerHTML = `
            <div class="context-menu-header">${courseName}</div>
            ${!cancelled && attendance !== 'attended' ? `
                <button class="context-menu-item" data-action="attended">
                    <i class="bi bi-check2-circle"></i> Mark as Attended
                </button>` : ''}
            ${!cancelled && attendance !== 'missed' ? `
                <button class="context-menu-item danger" data-action="missed">
                    <i class="bi bi-x-circle"></i> Mark as Missed
                </button>` : ''}
            ${!cancelled ? `
                <button class="context-menu-item warning" data-action="cancel">
                    <i class="bi bi-slash-circle"></i> Cancel Class (Today)
                </button>` : `
                <button class="context-menu-item" data-action="uncancel">
                    <i class="bi bi-arrow-counterclockwise"></i> Undo Cancel
                </button>`}
            <button class="context-menu-item close-item" data-action="close">
                <i class="bi bi-x-lg"></i> Close
            </button>
        `;

        document.body.appendChild(menu);

        // Position near the element
        const rect = el.getBoundingClientRect();
        const menuH = 200;
        const top = rect.bottom + menuH > window.innerHeight
            ? rect.top - menuH
            : rect.bottom + 8;
        menu.style.top  = `${Math.max(8, top)}px`;
        menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`;

        // Handle actions
        menu.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'attended') {
                    this.attendanceState[courseKey] = 'attended';
                    this.toastAnswered[courseKey]   = true;
                    this.saveAttendance();
                    NotificationManager.add('done', 'Marked as Attended', `${courseName} — nice!`, `att-done-${courseKey}-manual`);
                    this.dismissActiveToast();
                } else if (action === 'missed') {
                    this.attendanceState[courseKey] = 'missed';
                    this.toastAnswered[courseKey]   = true;
                    this.saveAttendance();
                    NotificationManager.add('missed', 'Marked as Missed', courseName, `att-miss-${courseKey}-manual`);
                } else if (action === 'cancel') {
                    this.cancelState[courseKey] = true;
                    this.toastAnswered[courseKey] = true;
                    this.saveAttendance();
                    NotificationManager.add('upcoming', 'Class Cancelled', `${courseName} marked as cancelled today.`, `cancel-${courseKey}`);
                } else if (action === 'uncancel') {
                    delete this.cancelState[courseKey];
                    delete this.toastAnswered[courseKey];
                    this.saveAttendance();
                }
                menu.remove();
                this.renderTodaySchedule();
            });
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 100);
    },

    // ─── DUE TASKS ──────────────────────────────────────────────────────────
    renderDueTasks() {
        const container = document.getElementById('todayTasks');
        const today     = new Date(); today.setHours(0,0,0,0);
        const in3Days   = new Date(today); in3Days.setDate(today.getDate() + 3);

        const dueSoon = AppState.tasks.filter(t => {
            if (t.completed) return false;
            return new Date(t.dueDate + 'T00:00:00') <= in3Days;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (dueSoon.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="bi bi-check-circle"></i>
                    <p>No tasks due soon</p>
                </div>`;
            return;
        }

        container.innerHTML = dueSoon.slice(0,5).map(task => {
            const due       = new Date(task.dueDate + 'T00:00:00');
            const isOverdue = due < today;
            const isToday   = due.getTime() === today.getTime();
            let sc = '', icon = 'bi-clock', dueText = 'Due ' + task.dueDate;

            if (isOverdue)    { sc = 'overdue';   icon = 'bi-exclamation-triangle-fill'; dueText = 'Overdue!'; }
            else if (isToday) { sc = 'due-today'; icon = 'bi-alarm';                     dueText = 'Due Today'; }

            return `
                <div class="today-task-item ${sc}">
                    <i class="bi ${icon} today-task-icon ${sc}"></i>
                    <div class="today-task-info">
                        <h5>${task.title}</h5>
                        <p>${task.course}</p>
                    </div>
                    <span class="today-task-due ${sc}">${dueText}</span>
                </div>`;
        }).join('');
    },

    // ─── TIME PARSING ────────────────────────────────────────────────────────
    parseTime(timeString) {
        // ✅ Fix Bug 3: properly handle AM/PM from full time range string
        const fullUpper = timeString.toUpperCase();
        const part      = timeString.split('-')[0].trim();
        const m         = part.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!m) return 0;

        let h   = parseInt(m[1]);
        let min = parseInt(m[2]);
        let period = m[3] ? m[3].toUpperCase() : null;

        // If start has no AM/PM, infer from the full string
        if (!period) {
            if (fullUpper.includes('PM')) period = 'PM';
            else if (fullUpper.includes('AM')) period = 'AM';
        }

        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    },

    parseEndTime(timeString) {
        const parts     = timeString.split('-');
        const fullUpper = timeString.toUpperCase();
        if (parts.length < 2) return this.parseTime(timeString) + 60;

        const endPart = parts[1].trim();
        const m       = endPart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!m) return this.parseTime(timeString) + 60;

        let h = parseInt(m[1]), min = parseInt(m[2]);
        let period = m[3] ? m[3].toUpperCase() : null;
        if (!period && fullUpper.includes('PM')) period = 'PM';
        if (!period && fullUpper.includes('AM')) period = 'AM';

        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + min;
    },

    checkClassStatus(timeString, currentTime) {
        const times = timeString.split('-').map(t => t.trim());
        if (times.length !== 2) return { isNow: false, isUpcoming: false, isDone: false };
        const start = this.parseTime(timeString);
        const end   = this.parseEndTime(timeString);
        return {
            isNow:     currentTime >= start && currentTime < end,
            isUpcoming: currentTime < start && (start - currentTime) <= 30,
            isDone:    currentTime >= end   // ✅ only after class actually ends
        };
    },

    // ─── NOTIFICATION CHECK ──────────────────────────────────────────────────
    startNotificationCheck() {
        this.checkAll();
        this.notificationInterval = setInterval(() => this.checkAll(), 60000);
    },

    checkAll() {
        this.checkUpcomingClasses();
        this.checkOverdueTasks();
    },

    checkUpcomingClasses() {
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const current   = new Date().getHours() * 60 + new Date().getMinutes();

        AppState.schedules.forEach(schedule => {
            const days  = schedule.day.split(',').map(d => d.trim());
            const times = schedule.time.split('/').map(t => t.trim());

            days.forEach((day, i) => {
                if (day !== todayName) return;

                const rawTime   = times[i] || times[0];
                const startTime = this.parseTime(rawTime);
                const endTime   = this.parseEndTime(rawTime);
                const minsLeft  = startTime - current;
                const courseKey = `${schedule.course}-${rawTime}`;

                // ✅ Fix Bug 1: Only fire notifications when class hasn't started yet
                if (current >= endTime) return;         // class already over
                if (current >= startTime) return;       // class in progress, no toast
                if (this.toastAnswered[courseKey]) return; // already answered
                if (this.cancelState[courseKey]) return;   // cancelled

                // Within 10 minutes → show/re-show toast
                if (minsLeft <= 10 && minsLeft >= 0) {
                    const snoozed     = this.toastSnoozed[courseKey] || 0;
                    const snoozeReady = Date.now() - snoozed >= 2 * 60 * 1000; // 2 min

                    if (snoozeReady) {
                        const formatted = ScheduleManager.formatTimeWithAMPM(rawTime);

                        // Add to bell panel only once
                        NotificationManager.add(
                            'upcoming', 'Class in 10 minutes!',
                            `${schedule.course} starts at ${formatted} — Room ${schedule.room}`,
                            `upcoming-${courseKey}`
                        );

                        // ✅ Always re-show toast every 2 min until answered
                        this.showAttendanceToast(
                            `🎓 ${schedule.course} starts in ${minsLeft} min!`,
                            `Room: ${schedule.room} · ${formatted}\nAre you heading to class?`,
                            courseKey,
                            schedule.course
                        );
                    }
                }
            });
        });
    },

    checkOverdueTasks() {
        const today = new Date(); today.setHours(0,0,0,0);

        AppState.tasks.forEach((task, index) => {
            if (task.completed) return;
            const due     = new Date(task.dueDate + 'T00:00:00');
            const isToday = due.getTime() === today.getTime();
            const isOver  = due < today;
            const taskKey = `task-${task.title}-${task.dueDate}`;

            if ((isToday || isOver) && !this.toastAnswered[taskKey]) {
                const type  = isOver ? 'overdue' : 'due-today';
                const label = isOver ? 'Task Overdue!' : 'Task Due Today!';
                NotificationManager.add(type, label, `"${task.title}" for ${task.course}`, taskKey);
                this.showTaskToast(task, index, isOver, taskKey);
            }
        });
    },

    // ─── TOAST: ATTENDANCE ───────────────────────────────────────────────────
    showAttendanceToast(title, body, courseKey, courseName) {
        this.dismissActiveToast();
        const toast = document.getElementById('attendanceToast');
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastBody').textContent  = body;

        const yesBtn = document.getElementById('toastYesBtn');
        const noBtn  = document.getElementById('toastNoBtn');

        // ✅ Updated button labels
        yesBtn.textContent = "✅ I'm in class!";
        noBtn.textContent  = "🕐 Not yet";

        const newYes = yesBtn.cloneNode(true);
        const newNo  = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        noBtn.parentNode.replaceChild(newNo,  noBtn);

        newYes.addEventListener('click', () => {
            this.attendanceState[courseKey] = 'attended';
            this.toastAnswered[courseKey]   = true;
            this.saveAttendance();
            NotificationManager.add('done', 'Marked as Attended',
                `${courseName} — nice!`, `att-done-${courseKey}`);
            this.dismissActiveToast();
            this.renderTodaySchedule();
        });

        newNo.addEventListener('click', () => {
            // ✅ "Not yet" → snooze 2 min, keep showing
            this.toastSnoozed[courseKey] = Date.now();
            this.dismissActiveToast();
            // Will re-show next checkAll cycle (in ≤2 min)
        });

        toast.classList.add('active');
        this.activeToast = toast;
        // No auto-dismiss — stays until answered
    },

    // ─── TOAST: TASK ─────────────────────────────────────────────────────────
    showTaskToast(task, index, isOverdue, taskKey) {
        this.dismissActiveToast();
        const toast = document.getElementById('attendanceToast');
        const label = isOverdue ? '⚠️ Task Overdue!' : '⏰ Task Due Today!';

        document.getElementById('toastTitle').textContent = label;
        document.getElementById('toastBody').textContent  =
            `"${task.title}" for ${task.course}. Did you finish it?`;

        const yesBtn = document.getElementById('toastYesBtn');
        const noBtn  = document.getElementById('toastNoBtn');

        yesBtn.textContent = '✅ Yes, I\'m done!';
        noBtn.textContent  = 'Not yet';

        const newYes = yesBtn.cloneNode(true);
        const newNo  = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        noBtn.parentNode.replaceChild(newNo,  noBtn);

        newYes.addEventListener('click', () => {
            AppState.tasks[index].completed = true;
            AppState.save('tasks');
            TaskManager.render();
            this.renderDueTasks();
            NotificationManager.add('done', 'Task Completed!',
                `"${task.title}" marked as done.`, `task-done-${task.title}`);
            this.toastAnswered[taskKey] = true;
            this.saveAttendance();
            this.dismissActiveToast();
        });

        newNo.addEventListener('click', () => {
            this.toastAnswered[taskKey] = true;
            this.saveAttendance();
            this.dismissActiveToast();
        });

        toast.classList.add('active');
        this.activeToast = toast;
        setTimeout(() => { if (toast.classList.contains('active')) this.dismissActiveToast(); }, 30000);
    },

    dismissActiveToast() {
        if (this.activeToast) {
            this.activeToast.classList.remove('active');
            this.activeToast = null;
        }
    },
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
        MusicManager.autoPause(); // 🎵 Stop music on close
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

        // 🎵 Auto-play music when Pomodoro starts
        MusicManager.autoPlay();

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

        // 🎵 Pause music when timer pauses
        MusicManager.autoPause();

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
// MUSIC MANAGER
// ===================================
const MusicManager = {
    DB_NAME:    'StudentHubMusic',
    DB_VERSION: 1,
    STORE_NAME: 'tracks',
    db:         null,

    tracks:       [],   // { id, name, type, src? (youtube url) }
    currentIndex: -1,
    isPlaying:    false,
    isShuffle:    false,
    audio:        new Audio(),
    playOrder:    [],   // shuffled indices

    // ── Init ──────────────────────────────────────────────────────────────
    async init() {
        await this.openDB();
        await this.loadTracks();
        this.setupAudio();
        this.setupControls();
        this.renderLibrary();
        this.updatePlayerUI();
        // Restore volume
        const vol = parseFloat(localStorage.getItem('musicVolume') ?? '0.7');
        this.audio.volume = vol;
        document.getElementById('musicVolume').value = vol * 100;
    },

    openDB() {
        return new Promise((res, rej) => {
            const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            req.onupgradeneeded = e => {
                e.target.result.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
            };
            req.onsuccess = e => { this.db = e.target.result; res(); };
            req.onerror   = () => rej(req.error);
        });
    },

    loadTracks() {
        return new Promise((res) => {
            if (!this.db) { res(); return; }
            const tx  = this.db.transaction(this.STORE_NAME, 'readonly');
            const req = tx.objectStore(this.STORE_NAME).getAll();
            req.onsuccess = () => {
                this.tracks = req.result || [];
                this.buildPlayOrder();
                res();
            };
            req.onerror = () => res();
        });
    },

    saveTrack(track) {
        // track = { name, type: 'local'|'youtube', src (youtube) | blob (local) }
        return new Promise((res, rej) => {
            const tx  = this.db.transaction(this.STORE_NAME, 'readwrite');
            const req = tx.objectStore(this.STORE_NAME).add(track);
            req.onsuccess = () => { res(req.result); };
            req.onerror   = () => rej(req.error);
        });
    },

    deleteTrack(id) {
        return new Promise((res) => {
            const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).delete(id);
            tx.oncomplete = res;
        });
    },

    // ── Audio setup ───────────────────────────────────────────────────────
    setupAudio() {
        this.audio.addEventListener('ended',  () => this.playNext());
        this.audio.addEventListener('error',  () => this.playNext());
        this.audio.addEventListener('play',   () => this.onPlayState(true));
        this.audio.addEventListener('pause',  () => this.onPlayState(false));
    },

    onPlayState(playing) {
        this.isPlaying = playing;
        const icon = document.getElementById('musicPlay')?.querySelector('i');
        const bars = document.getElementById('musicArtBars');
        if (icon) icon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
        if (bars) bars.classList.toggle('playing', playing);
    },

    // ── Controls setup ────────────────────────────────────────────────────
    setupControls() {
        document.getElementById('musicPlay')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('musicNext')?.addEventListener('click', () => this.playNext());
        document.getElementById('musicPrev')?.addEventListener('click', () => this.playPrev());

        // Shuffle toggle
        document.getElementById('musicShuffle')?.addEventListener('click', () => {
            this.isShuffle = !this.isShuffle;
            document.getElementById('musicShuffle').classList.toggle('active', this.isShuffle);
            this.buildPlayOrder();
        });

        // Volume
        document.getElementById('musicVolume')?.addEventListener('input', (e) => {
            const vol = e.target.value / 100;
            this.audio.volume = vol;
            localStorage.setItem('musicVolume', vol);
        });

        // Library toggle
        document.getElementById('musicLibraryBtn')?.addEventListener('click', () => this.toggleLibrary());
        document.getElementById('musicLibraryClose')?.addEventListener('click', () => this.toggleLibrary());

        // Upload MP3
        document.getElementById('musicUploadBtn')?.addEventListener('click', () => {
            document.getElementById('musicFileInput').click();
        });
        document.getElementById('musicFileInput')?.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
            e.target.value = '';
        });

        // YouTube toggle row
        document.getElementById('musicYoutubeBtn')?.addEventListener('click', () => {
            const row = document.getElementById('musicYoutubeRow');
            row.style.display = row.style.display === 'none' ? 'flex' : 'none';
        });
        document.getElementById('musicYoutubeAdd')?.addEventListener('click', () => this.addYouTube());
    },

    // ── File upload ───────────────────────────────────────────────────────
    async handleFileUpload(files) {
        const allowed = ['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/aac','audio/flac'];
        let added = 0;
        for (const file of files) {
            if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) continue;
            const buf  = await file.arrayBuffer();
            const blob = new Blob([buf], { type: file.type || 'audio/mpeg' });
            const name = file.name.replace(/\.[^.]+$/, '');
            try {
                const id = await this.saveTrack({ name, type: 'local', blob });
                this.tracks.push({ id, name, type: 'local', blob });
                added++;
            } catch(e) {
                UIManager.notify('Storage full — try removing some songs first.', 'error');
            }
        }
        if (added) {
            this.buildPlayOrder();
            this.renderLibrary();
            UIManager.notify(`🎵 ${added} song${added > 1 ? 's' : ''} added!`, 'success');
            if (this.currentIndex === -1) this.setCurrent(0);
        }
    },

    // ── YouTube add ───────────────────────────────────────────────────────
    async addYouTube() {
        const input = document.getElementById('musicYoutubeUrl');
        const raw   = input.value.trim();
        if (!raw) return;

        // Extract YouTube video ID
        const match = raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
        if (!match) { UIManager.notify('Invalid YouTube URL — please paste a full video link.', 'error'); return; }

        const videoId = match[1];
        const src     = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        const name    = `YouTube: ${videoId}`;

        try {
            const id = await this.saveTrack({ name, type: 'youtube', src, videoId });
            this.tracks.push({ id, name, type: 'youtube', src, videoId });
            this.buildPlayOrder();
            this.renderLibrary();
            UIManager.notify('🎵 YouTube track added! Requires internet to play.', 'success');
            input.value = '';
            if (this.currentIndex === -1) this.setCurrent(this.tracks.length - 1);
        } catch(e) {
            UIManager.notify('Failed to save YouTube track.', 'error');
        }
    },

    // ── Playback ──────────────────────────────────────────────────────────
    buildPlayOrder() {
        const indices = this.tracks.map((_, i) => i);
        if (this.isShuffle) {
            // Fisher-Yates shuffle
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
        }
        this.playOrder = indices;
    },

    setCurrent(index) {
        if (index < 0 || index >= this.tracks.length) return;
        this.currentIndex = index;
        const track = this.tracks[index];
        this.audio.pause();

        if (track.type === 'local' && track.blob) {
            const url = URL.createObjectURL(track.blob);
            this.audio.src = url;
        } else if (track.type === 'youtube') {
            // YouTube can't play via Audio tag — show iframe note
            this.audio.src = '';
        }

        this.updatePlayerUI();
        this.renderLibrary();
    },

    togglePlay() {
        if (this.tracks.length === 0) {
            UIManager.notify('Add some songs to the library first! 🎵', 'info');
            this.toggleLibrary(true);
            return;
        }
        if (this.currentIndex === -1) this.setCurrent(0);
        const track = this.tracks[this.currentIndex];

        if (track.type === 'youtube') {
            UIManager.notify('YouTube tracks need internet. Open the link in your browser to play.', 'info');
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(() => UIManager.notify('Could not play audio.', 'error'));
        }
    },

    autoPlay() {
        if (this.tracks.length === 0) return;
        if (this.currentIndex === -1) this.setCurrent(0);
        const track = this.tracks[this.currentIndex];
        if (track?.type === 'youtube') return; // can't autoplay youtube
        if (!this.isPlaying) {
            this.audio.play().catch(() => {});
        }
    },

    autoPause() {
        if (this.isPlaying) this.audio.pause();
    },

    playNext() {
        if (this.tracks.length === 0) return;
        const orderIdx = this.playOrder.indexOf(this.currentIndex);
        const nextOrderIdx = (orderIdx + 1) % this.playOrder.length;
        this.setCurrent(this.playOrder[nextOrderIdx]);
        if (this.isPlaying) this.audio.play().catch(() => {});
    },

    playPrev() {
        if (this.tracks.length === 0) return;
        const orderIdx = this.playOrder.indexOf(this.currentIndex);
        const prevOrderIdx = (orderIdx - 1 + this.playOrder.length) % this.playOrder.length;
        this.setCurrent(this.playOrder[prevOrderIdx]);
        if (this.isPlaying) this.audio.play().catch(() => {});
    },

    // ── UI updates ────────────────────────────────────────────────────────
    updatePlayerUI() {
        const track = this.tracks[this.currentIndex];
        const titleEl = document.getElementById('musicTitle');
        const metaEl  = document.getElementById('musicMeta');
        if (!titleEl) return;

        if (!track) {
            titleEl.textContent = 'No song loaded';
            metaEl.textContent  = 'Add songs to get started';
            return;
        }

        titleEl.textContent = track.name;
        metaEl.textContent  = track.type === 'youtube' ? '🔴 YouTube (needs internet)' : '🎵 Local file';

        // Ticker scroll for long titles
        const parent = titleEl.parentElement;
        if (titleEl.scrollWidth > parent.clientWidth) {
            parent.classList.add('scrolling');
        } else {
            parent.classList.remove('scrolling');
        }
    },

    renderLibrary() {
        const list = document.getElementById('musicTrackList');
        if (!list) return;

        if (this.tracks.length === 0) {
            list.innerHTML = `
                <div class="music-empty">
                    <i class="bi bi-music-note-beamed"></i>
                    <p>No songs yet — upload MP3s or add a YouTube link!</p>
                </div>`;
            return;
        }

        list.innerHTML = this.tracks.map((t, i) => `
            <div class="music-track-item ${i === this.currentIndex ? 'playing' : ''}"
                 data-index="${i}">
                <span class="music-track-num">${i === this.currentIndex ? '▶' : i + 1}</span>
                <div class="music-track-info">
                    <div class="music-track-name">${t.name}</div>
                    <div class="music-track-type">${t.type}</div>
                </div>
                ${t.type === 'youtube' ? '<span class="music-track-yt">YT</span>' : ''}
                <button class="music-track-delete" data-id="${t.id}" title="Remove">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>`
        ).join('');

        // Click to play
        list.querySelectorAll('.music-track-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.music-track-delete')) return;
                const idx = parseInt(el.dataset.index);
                this.setCurrent(idx);
                if (this.tracks[idx]?.type !== 'youtube') {
                    this.audio.play().catch(() => {});
                }
            });
        });

        // Delete buttons
        list.querySelectorAll('.music-track-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id  = parseInt(btn.dataset.id);
                const idx = this.tracks.findIndex(t => t.id === id);
                await this.deleteTrack(id);
                this.tracks.splice(idx, 1);
                if (this.currentIndex >= this.tracks.length) this.currentIndex = this.tracks.length - 1;
                this.buildPlayOrder();
                this.renderLibrary();
                this.updatePlayerUI();
                if (this.currentIndex >= 0) this.setCurrent(this.currentIndex);
            });
        });
    },

    toggleLibrary(forceOpen = false) {
        const panel = document.getElementById('musicLibraryPanel');
        if (!panel) return;
        const isHidden = panel.style.display === 'none';
        panel.style.display = (isHidden || forceOpen) ? 'block' : 'none';
        document.getElementById('musicLibraryBtn')?.classList.toggle('active', panel.style.display !== 'none');
    }
};

// ===================================
// PROJECT MANAGER
// ===================================
// ===================================
// BOTTOM NAV MANAGER
// ===================================
const BottomNavManager = {
    init() {
        // Wire up all bottom nav buttons to navigate between pages
        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                NavigationManager.navigateTo(page);
                this.setActive(btn);
            });
        });
    },

    setActive(btn) {
        document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    },

    // Called by NavigationManager when page changes
    syncWithPage(page) {
        const btn = document.querySelector(`.bottom-nav-item[data-page="${page}"]`);
        this.setActive(btn);
    },

    updateVisibility(page) {
        const nav = document.getElementById('bottomNav');
        if (!nav) return;
        // Show bottom nav on dashboard + 4 section pages
        const showOn = ['dashboard','schedule','tasks','grades','achievements'];
        if (showOn.includes(page)) {
            nav.classList.remove('hidden');
        } else {
            nav.classList.add('hidden');
        }
    }
};

// ===================================
// PROJECT MANAGER
// ===================================
const ProjectManager = {
    init() {
        this.render();
        // FAB button
        document.getElementById('fabAddProject').addEventListener('click', () => this.showAddForm());
    },

    render() {
        const container = document.getElementById('projectsGrid');
        const page = document.getElementById('projects-page');

        if (AppState.projects.length === 0) {
            page.classList.add('projects-empty');
            container.innerHTML = `
                <div class="empty-state-large">
                    <i class="bi bi-folder-x"></i>
                    <h3>No projects yet</h3>
                    <p>Start building and showcase your programming portfolio!</p>
                    <p style="font-size:0.8125rem; color:var(--text-tertiary); margin-top:0.5rem;">
                        Tap the <strong>+</strong> button below to add your first project!
                    </p>
                </div>
            `;
            return;
        }

        page.classList.remove('projects-empty');
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
            NotificationManager.init();
            CourseManager.init();
            ScheduleManager.init();
            TaskManager.init();
            GradeManager.init();
            AchievementManager.init();
            TodayManager.init();
            FocusModeManager.init();
            MusicManager.init();
            ProjectManager.init();
            BottomNavManager.init();

            // Wire up FAB buttons
            const fabTask = document.getElementById('fabAddTask');
            const fabGrade = document.getElementById('fabAddGrade');
            const fabAchieve = document.getElementById('fabAddAchievement');
            if (fabTask) fabTask.addEventListener('click', () => TaskManager.showAddForm());
            if (fabGrade) fabGrade.addEventListener('click', () => GradeManager.showAddForm());
            if (fabAchieve) fabAchieve.addEventListener('click', () => AchievementManager.showAddForm());

            // Navigate to dashboard on initial load to show bottom nav
            NavigationManager.navigateTo('dashboard');

            console.log('✅ All managers initialized');
        } else {
            console.log('🔓 User not logged in, showing auth page');
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        alert('Error loading app. Please check console for details.');
    }
    
    // Portrait Lock
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {
            // Silently fail — some browsers don't support it
        });
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/student-hubv2/service-worker.js')
            .then(reg => console.log('✅ Service Worker registered:', reg.scope))
            .catch(err => console.error('❌ Service Worker failed:', err));
    }
});

// ===================================
// SERVICE WORKER REGISTRATION
// ===================================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/student-hub/service-worker.js')
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

