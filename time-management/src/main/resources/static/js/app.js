/**
 * Main Application Logic for TimeMaster
 * Pure JavaScript (Vanilla JS) Single Page Application Controller
 */
import { TaskAPI, CategoryAPI, ScheduleAPI, ReminderAPI, ProgressAPI } from './api.js';

// ==================== APPLICATION STATE ====================
const state = {
    tasks: [],
    categories: [],
    schedules: [],
    reminders: [],
    progressList: [],
    currentSection: 'dashboard',
    calendarDate: new Date(),
    selectedDate: getFormattedDate(new Date()),
    taskFilters: {
        search: '',
        category: 'ALL',
        status: 'ALL',
        date: 'ALL'
    },
    reminderFilter: 'ALL',
    isLoading: false
};

// ==================== DATE & STRING UTILITIES ====================
function getFormattedDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Chưa định';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function formatTime(timeStr) {
    if (!timeStr) return '--:--';
    return timeStr.slice(0, 5);
}

function formatDateTime(dtStr) {
    if (!dtStr) return 'Chưa định';
    const dateObj = new Date(dtStr);
    if (isNaN(dateObj.getTime())) {
        return dtStr;
    }
    const h = String(dateObj.getHours()).padStart(2, '0');
    const m = String(dateObj.getMinutes()).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${h}:${m} ${d}/${mo}/${y}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== UI HELPERS (TOAST, MODAL, CONFIRM) ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }
}

let confirmActionCallback = null;
function showConfirm(title, message, onConfirm) {
    const modalTitle = document.getElementById('confirmModalTitle');
    const modalMsg = document.getElementById('confirmModalMessage');

    if (modalTitle) modalTitle.textContent = title;
    if (modalMsg) modalMsg.textContent = message;

    confirmActionCallback = onConfirm;
    openModal('confirmModal');
}

// ==================== STATE HELPERS ====================
function getTaskProgress(taskId) {
    const prog = state.progressList.find(p => p.task && p.task.id === taskId);
    if (prog) return prog;
    return {
        id: null,
        status: 'TODO',
        completed: false,
        percentage: 0,
        task: { id: taskId }
    };
}

function getTaskSchedule(taskId) {
    return state.schedules.find(s => s.task && s.task.id === taskId);
}

function getTaskReminders(taskId) {
    return state.reminders.filter(r => r.task && r.task.id === taskId);
}

// ==================== DATA FETCHING & SYNCHRONIZATION ====================
async function loadAllData() {
    state.isLoading = true;
    const refreshBtn = document.getElementById('refreshDataBtn');
    const icon = refreshBtn ? refreshBtn.querySelector('.spin-icon') : null;
    if (icon) icon.classList.add('spinning');

    try {
        const [tasks, categories, schedules, reminders, progressList] = await Promise.all([
            TaskAPI.getAll().catch(err => { console.error('Task error', err); return []; }),
            CategoryAPI.getAll().catch(err => { console.error('Category error', err); return []; }),
            ScheduleAPI.getAll().catch(err => { console.error('Schedule error', err); return []; }),
            ReminderAPI.getAll().catch(err => { console.error('Reminder error', err); return []; }),
            ProgressAPI.getAll().catch(err => { console.error('Progress error', err); return []; })
        ]);

        state.tasks = Array.isArray(tasks) ? tasks : [];
        state.categories = Array.isArray(categories) ? categories : [];
        state.schedules = Array.isArray(schedules) ? schedules : [];
        state.reminders = Array.isArray(reminders) ? reminders : [];
        state.progressList = Array.isArray(progressList) ? progressList : [];

        updateSidebarBadges();
        populateCategorySelects();
        populateTaskSelects();
        renderCurrentSection();

    } catch (err) {
        showToast('Không thể kết nối đến máy chủ Spring Boot. Vui lòng kiểm tra lại!', 'error');
        console.error('Error loading data:', err);
    } finally {
        state.isLoading = false;
        if (icon) icon.classList.remove('spinning');
    }
}

function updateSidebarBadges() {
    const navTaskCount = document.getElementById('navTaskCount');
    const navCategoryCount = document.getElementById('navCategoryCount');
    const navReminderCount = document.getElementById('navReminderCount');
    const sidebarPercent = document.getElementById('sidebarProgressPercent');
    const sidebarBar = document.getElementById('sidebarProgressBar');

    if (navTaskCount) navTaskCount.textContent = state.tasks.length;
    if (navCategoryCount) navCategoryCount.textContent = state.categories.length;

    const activeReminders = state.reminders.filter(r => r.enabled).length;
    if (navReminderCount) navReminderCount.textContent = activeReminders;

    // Overall completion %
    const total = state.tasks.length;
    let completedCount = 0;
    state.tasks.forEach(t => {
        const p = getTaskProgress(t.id);
        if (p.completed) completedCount++;
    });

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    if (sidebarPercent) sidebarPercent.textContent = `${percent}%`;
    if (sidebarBar) sidebarBar.style.width = `${percent}%`;
}

function populateCategorySelects() {
    // 1. Task Filter Category
    const filterCat = document.getElementById('taskFilterCategory');
    if (filterCat) {
        const currentVal = filterCat.value;
        filterCat.innerHTML = '<option value="ALL">Tất cả danh mục</option>';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            filterCat.appendChild(opt);
        });
        filterCat.value = currentVal;
    }

    // 2. Task Form Category Select
    const formCat = document.getElementById('taskFormCategory');
    if (formCat) {
        formCat.innerHTML = '<option value="">-- Không chọn danh mục --</option>';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            formCat.appendChild(opt);
        });
    }
}

function populateTaskSelects() {
    // Populate task dropdown for Schedule & Reminder forms
    const scheduleTaskSelect = document.getElementById('scheduleFormTask');
    if (scheduleTaskSelect) {
        scheduleTaskSelect.innerHTML = '<option value="">-- Chọn công việc --</option>';
        state.tasks.forEach(task => {
            const opt = document.createElement('option');
            opt.value = task.id;
            opt.textContent = `#${task.id} - ${task.title} (${formatDate(task.date)})`;
            scheduleTaskSelect.appendChild(opt);
        });
    }

    const reminderTaskSelect = document.getElementById('reminderFormTask');
    if (reminderTaskSelect) {
        reminderTaskSelect.innerHTML = '<option value="">-- Chọn công việc --</option>';
        state.tasks.forEach(task => {
            const opt = document.createElement('option');
            opt.value = task.id;
            opt.textContent = `#${task.id} - ${task.title}`;
            reminderTaskSelect.appendChild(opt);
        });
    }
}

// ==================== SECTION ROUTING ====================
function navigateTo(sectionId, updateHash = true) {
    const validSections = ['dashboard', 'tasks', 'calendar', 'categories', 'reminders', 'progress'];
    if (!validSections.includes(sectionId)) {
        sectionId = 'dashboard';
    }

    state.currentSection = sectionId;
    if (updateHash) {
        window.location.hash = sectionId;
    }

    // Update Nav active
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Sections
    document.querySelectorAll('.page-section').forEach(sec => {
        if (sec.id === `section-${sectionId}`) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });

    // Update Header Titles
    const titleEl = document.getElementById('pageTitle');
    const subEl = document.getElementById('pageSubtitle');
    const titles = {
        dashboard: { title: 'Tổng Quan', sub: 'Quản lý hiệu quả thời gian và công việc mỗi ngày' },
        tasks: { title: 'Quản Lý Công Việc', sub: 'Danh sách và kiểm soát tiến độ các nhiệm vụ cá nhân' },
        calendar: { title: 'Lịch & Lịch Trình', sub: 'Thời gian biểu chi tiết theo ngày và tháng' },
        categories: { title: 'Quản Lý Danh Mục', sub: 'Phân loại công việc theo nhóm để dễ theo dõi' },
        reminders: { title: 'Nhắc Nhở Hẹn Giờ', sub: 'Không bao giờ bỏ sót sự kiện và hạn chót quan trọng' },
        progress: { title: 'Tiến Độ & Thống Kê', sub: 'Báo cáo chi tiết hiệu suất hoàn thành công việc' }
    };

    if (titles[sectionId]) {
        if (titleEl) titleEl.textContent = titles[sectionId].title;
        if (subEl) subEl.textContent = titles[sectionId].sub;
    }

    // Close mobile sidebar if open
    closeMobileSidebar();

    renderCurrentSection();
}

function renderCurrentSection() {
    switch (state.currentSection) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'tasks':
            renderTasks();
            break;
        case 'calendar':
            renderCalendar();
            break;
        case 'categories':
            renderCategories();
            break;
        case 'reminders':
            renderReminders();
            break;
        case 'progress':
            renderProgress();
            break;
    }
}

// ==================== 1. DASHBOARD RENDERER ====================
function renderDashboard() {
    const todayStr = getFormattedDate();
    const total = state.tasks.length;
    let completedCount = 0;
    let doingCount = 0;
    let todoCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;

    const todayTasks = [];
    const upcomingTasks = [];

    state.tasks.forEach(task => {
        const prog = getTaskProgress(task.id);
        if (prog.completed) {
            completedCount++;
        } else if (prog.percentage > 0 || prog.status === 'IN_PROGRESS') {
            doingCount++;
        } else {
            todoCount++;
        }

        if (task.date === todayStr) {
            todayCount++;
            todayTasks.push({ task, prog });
        } else if (task.date > todayStr) {
            upcomingCount++;
            upcomingTasks.push({ task, prog });
        }
    });

    const incompleteCount = total - completedCount;
    const completionPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Update KPI metric cards
    const totalEl = document.getElementById('dashTotalTasks');
    const completedEl = document.getElementById('dashCompletedTasks');
    const completedRateEl = document.getElementById('dashCompletedRate');
    const incompleteEl = document.getElementById('dashIncompleteTasks');
    const todayTasksEl = document.getElementById('dashTodayTasks');
    const upcomingCountEl = document.getElementById('dashUpcomingCount');

    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completedCount;
    if (completedRateEl) completedRateEl.textContent = `${completionPercent}% hoàn thành`;
    if (incompleteEl) incompleteEl.textContent = incompleteCount;
    if (todayTasksEl) todayTasksEl.textContent = todayCount;
    if (upcomingCountEl) upcomingCountEl.textContent = `${upcomingCount} việc sắp tới`;

    // Circular gauge
    const ringEl = document.getElementById('dashCircularProgress');
    const ringVal = document.getElementById('dashRingPercent');
    const progBadge = document.getElementById('dashProgressBadge');
    if (ringEl && ringVal) {
        ringVal.textContent = `${completionPercent}%`;
        if (progBadge) progBadge.textContent = `${completionPercent}% Đạt`;
        // Circumference = 2 * PI * 66 = ~414.69
        const circumference = 414.69;
        const offset = circumference - (completionPercent / 100) * circumference;
        ringEl.style.strokeDashoffset = offset;
    }

    const gaugeDone = document.getElementById('dashGaugeDone');
    const gaugeDoing = document.getElementById('dashGaugeDoing');
    const gaugeTodo = document.getElementById('dashGaugeTodo');

    if (gaugeDone) gaugeDone.textContent = completedCount;
    if (gaugeDoing) gaugeDoing.textContent = doingCount;
    if (gaugeTodo) gaugeTodo.textContent = todoCount;

    // Category breakdown bars
    renderDashboardCategoryBars();

    // Render Today Tasks List
    renderDashboardTodayList(todayTasks);

    // Render Upcoming Items
    renderDashboardUpcomingList(upcomingTasks);
}

function renderDashboardCategoryBars() {
    const container = document.getElementById('dashCategoryBars');
    if (!container) return;

    if (state.categories.length === 0) {
        container.innerHTML = '<div class="empty-state-mini">Chưa có danh mục nào. Hãy tạo danh mục mới!</div>';
        return;
    }

    const catCounts = {};
    state.categories.forEach(c => { catCounts[c.id] = 0; });
    let unclassifiedCount = 0;

    state.tasks.forEach(t => {
        if (t.category && t.category.id) {
            catCounts[t.category.id] = (catCounts[t.category.id] || 0) + 1;
        } else {
            unclassifiedCount++;
        }
    });

    const totalTasks = state.tasks.length || 1;
    let html = '';

    state.categories.forEach(cat => {
        const count = catCounts[cat.id] || 0;
        const pct = Math.round((count / totalTasks) * 100);
        html += `
            <div class="cat-bar-item">
                <div class="cat-bar-header">
                    <span>${escapeHtml(cat.name)}</span>
                    <span class="text-muted">${count} việc (${pct}%)</span>
                </div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    });

    if (unclassifiedCount > 0) {
        const pct = Math.round((unclassifiedCount / totalTasks) * 100);
        html += `
            <div class="cat-bar-item">
                <div class="cat-bar-header">
                    <span>Chưa phân loại</span>
                    <span class="text-muted">${unclassifiedCount} việc (${pct}%)</span>
                </div>
                <div class="cat-bar-track">
                    <div class="cat-bar-fill" style="width: ${pct}%; background-color: var(--text-muted);"></div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderDashboardTodayList(todayItems) {
    const listEl = document.getElementById('dashTodayTasksList');
    const badgeEl = document.getElementById('dashTodayBadge');
    if (badgeEl) badgeEl.textContent = `${todayItems.length} việc`;
    if (!listEl) return;

    if (todayItems.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state-mini">
                <p>Hôm nay không có công việc nào!</p>
                <small class="text-muted">Bạn có thể thêm công việc mới hoặc nghỉ ngơi.</small>
            </div>
        `;
        return;
    }

    listEl.innerHTML = todayItems.map(({ task, prog }) => `
        <div class="dash-item-card">
            <div class="dash-item-left">
                <input type="checkbox" class="custom-checkbox-toggle" data-task-id="${task.id}" ${prog.completed ? 'checked' : ''} title="Đánh dấu hoàn thành">
                <div class="dash-item-info">
                    <div class="dash-item-title ${prog.completed ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                    <div class="dash-item-meta">
                        <span>⏰ ${formatTime(task.time)}</span>
                        ${task.category ? `<span class="badge badge-primary text-sm">${escapeHtml(task.category.name)}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="dash-item-actions">
                <button class="btn btn-sm btn-secondary" onclick="window.viewTaskDetails(${task.id})">Chi tiết</button>
            </div>
        </div>
    `).join('');

    // Attach checkbox complete handlers
    listEl.querySelectorAll('.custom-checkbox-toggle').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const taskId = Number(e.target.dataset.taskId);
            toggleTaskComplete(taskId);
        });
    });
}

function renderDashboardUpcomingList(upcomingItems) {
    const listEl = document.getElementById('dashUpcomingList');
    const badgeEl = document.getElementById('dashUpcomingBadge');
    if (badgeEl) badgeEl.textContent = `${upcomingItems.length} việc`;
    if (!listEl) return;

    if (upcomingItems.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state-mini">
                <p>Không có kế hoạch nào sắp tới.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = upcomingItems.slice(0, 6).map(({ task }) => `
        <div class="dash-item-card">
            <div class="dash-item-left">
                <div class="dash-item-info">
                    <div class="dash-item-title">${escapeHtml(task.title)}</div>
                    <div class="dash-item-meta">
                        <span>📅 ${formatDate(task.date)} lúc ${formatTime(task.time)}</span>
                        ${task.category ? `<span class="badge badge-neutral text-sm">${escapeHtml(task.category.name)}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="dash-item-actions">
                <button class="btn btn-sm btn-secondary" onclick="window.viewTaskDetails(${task.id})">Xem</button>
            </div>
        </div>
    `).join('');
}

// ==================== 2. TASK MANAGEMENT RENDERER ====================
function renderTasks() {
    const container = document.getElementById('tasksListContainer');
    if (!container) return;

    // Apply filtering
    let filtered = [...state.tasks];
    const { search, category, status, date } = state.taskFilters;
    const todayStr = getFormattedDate();

    // 1. Search filter
    if (search.trim()) {
        const query = search.trim().toLowerCase();
        filtered = filtered.filter(t =>
            (t.title && t.title.toLowerCase().includes(query)) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
    }

    // 2. Category filter
    if (category !== 'ALL') {
        const catId = Number(category);
        filtered = filtered.filter(t => t.category && t.category.id === catId);
    }

    // 3. Status filter
    if (status !== 'ALL') {
        filtered = filtered.filter(t => {
            const p = getTaskProgress(t.id);
            if (status === 'COMPLETED') return p.completed;
            if (status === 'IN_PROGRESS') return !p.completed && p.percentage > 0;
            if (status === 'TODO') return !p.completed && (p.percentage === 0 || !p.percentage);
            return true;
        });
    }

    // 4. Date filter
    if (date !== 'ALL') {
        filtered = filtered.filter(t => {
            if (date === 'TODAY') return t.date === todayStr;
            if (date === 'UPCOMING') return t.date > todayStr;
            if (date === 'OVERDUE') {
                const p = getTaskProgress(t.id);
                return t.date < todayStr && !p.completed;
            }
            return true;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>Không tìm thấy công việc phù hợp</h3>
                <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                <button class="btn btn-primary" onclick="window.openNewTaskModal()">+ Thêm công việc mới</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(task => {
        const prog = getTaskProgress(task.id);
        const percent = prog.completed ? 100 : (prog.percentage || 0);

        let statusBadge = '';
        if (prog.completed) {
            statusBadge = '<span class="badge badge-success">✓ Đã hoàn thành</span>';
        } else if (percent > 0) {
            statusBadge = `<span class="badge badge-warning">⚡ Đang làm (${percent}%)</span>`;
        } else {
            statusBadge = '<span class="badge badge-neutral">Chưa bắt đầu</span>';
        }

        const isOverdue = task.date < todayStr && !prog.completed;

        return `
            <div class="task-card ${prog.completed ? 'task-card-completed' : ''}" data-id="${task.id}">
                <div>
                    <div class="task-card-header">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${statusBadge}
                    </div>

                    ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

                    <div class="task-meta-bar" style="margin-top: 0.85rem;">
                        <span class="meta-chip ${isOverdue ? 'text-danger font-bold' : ''}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            ${formatDate(task.date)} ${isOverdue ? '(Quá hạn)' : ''}
                        </span>

                        <span class="meta-chip">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${formatTime(task.time)}
                        </span>

                        ${task.category ? `
                            <span class="meta-chip" style="background: var(--purple-light); color: var(--purple); font-weight: 700;">
                                🏷️ ${escapeHtml(task.category.name)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <div class="task-card-progress">
                    <div class="task-prog-labels">
                        <span>Tiến độ</span>
                        <span>${percent}%</span>
                    </div>
                    <div class="task-prog-bar">
                        <div class="task-prog-fill ${prog.completed ? 'completed' : ''}" style="width: ${percent}%;"></div>
                    </div>
                </div>

                <div class="task-card-footer">
                    <div class="custom-checkbox">
                        <label class="custom-checkbox" title="Đánh dấu hoàn thành">
                            <input type="checkbox" class="task-toggle-done" data-id="${task.id}" ${prog.completed ? 'checked' : ''}>
                            <span class="checkbox-indicator"></span>
                            <span class="text-sm font-bold">${prog.completed ? 'Đã xong' : 'Xong'}</span>
                        </label>
                    </div>

                    <div class="task-actions-group">
                        <button class="btn-icon btn-sm" title="Xem chi tiết" onclick="window.viewTaskDetails(${task.id})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="btn-icon btn-sm" title="Chỉnh sửa tiến độ" onclick="window.openProgressModal(${task.id})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        </button>
                        <button class="btn-icon btn-sm" title="Sửa công việc" onclick="window.editTask(${task.id})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon btn-sm" title="Xóa" onclick="window.confirmDeleteTask(${task.id})" style="color: var(--danger);">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Attach quick done toggle
    container.querySelectorAll('.task-toggle-done').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const taskId = Number(e.target.dataset.id);
            toggleTaskComplete(taskId);
        });
    });
}

// Toggle Task Complete State
async function toggleTaskComplete(taskId) {
    try {
        const prog = getTaskProgress(taskId);
        if (prog.id) {
            // Already has progress entity
            if (prog.completed) {
                // Revert to incomplete TODO
                await ProgressAPI.update(prog.id, {
                    status: 'TODO',
                    completed: false,
                    percentage: 0
                });
                showToast('Đã đánh dấu chưa hoàn thành!', 'info');
            } else {
                // Complete task
                await ProgressAPI.complete(prog.id);
                showToast('Tuyệt vời! Đã hoàn thành công việc!', 'success');
            }
        } else {
            // Create progress as completed
            await ProgressAPI.create({
                status: 'COMPLETED',
                completed: true,
                percentage: 100,
                task: { id: taskId }
            });
            showToast('Tuyệt vời! Đã hoàn thành công việc!', 'success');
        }
        await loadAllData();
    } catch (err) {
        showToast('Lỗi cập nhật trạng thái: ' + err.message, 'error');
    }
}

// ==================== 3. CALENDAR & SCHEDULE RENDERER ====================
function renderCalendar() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth(); // 0-indexed

    const monthTitle = document.getElementById('calCurrentMonthTitle');
    if (monthTitle) {
        monthTitle.textContent = `Tháng ${month + 1}, ${year}`;
    }

    const grid = document.getElementById('calendarDaysGrid');
    if (!grid) return;

    // First day of month
    const firstDay = new Date(year, month, 1);
    // In Vietnam Monday is day 1, Sunday is day 7 (0 in JS)
    let startDayOfWeek = firstDay.getDay(); // 0 is Sun, 1 is Mon...
    // Convert to Mon=0, Sun=6
    let startingIndex = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayStr = getFormattedDate();

    // Map schedules and tasks by date
    const dateMap = {};
    state.tasks.forEach(task => {
        if (!dateMap[task.date]) dateMap[task.date] = { tasks: [], schedules: [] };
        dateMap[task.date].tasks.push(task);
    });
    state.schedules.forEach(sch => {
        if (!dateMap[sch.date]) dateMap[sch.date] = { tasks: [], schedules: [] };
        dateMap[sch.date].schedules.push(sch);
    });

    let html = '';

    // Previous month filler days
    for (let i = startingIndex - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i;
        html += `<div class="cal-day-cell other-month"><div class="day-number">${dayNum}</div></div>`;
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dStr === todayStr;
        const isSelected = dStr === state.selectedDate;

        const dayData = dateMap[dStr] || { tasks: [], schedules: [] };
        const totalItems = dayData.tasks.length + dayData.schedules.length;

        let badgesHtml = '';
        if (dayData.schedules.length > 0) {
            badgesHtml += `<div class="cal-event-chip" style="background:#e0e7ff; color:#4338ca;">📅 ${dayData.schedules.length} lịch trình</div>`;
        }
        if (dayData.tasks.length > 0) {
            badgesHtml += `<div class="cal-event-chip">📋 ${dayData.tasks.length} công việc</div>`;
        }

        html += `
            <div class="cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dStr}" onclick="window.selectCalendarDay('${dStr}')">
                <div class="day-cell-top">
                    <span class="day-number">${day}</span>
                    ${totalItems > 0 ? `<span class="badge badge-primary" style="font-size:0.65rem; padding: 1px 5px;">${totalItems}</span>` : ''}
                </div>
                <div class="day-events-dots">
                    ${badgesHtml}
                </div>
            </div>
        `;
    }

    // Next month filler to fill out 35 or 42 grid cells
    const totalRendered = startingIndex + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="cal-day-cell other-month"><div class="day-number">${i}</div></div>`;
    }

    grid.innerHTML = html;

    renderSelectedDayPanel();
}

function selectCalendarDay(dateStr) {
    state.selectedDate = dateStr;
    renderCalendar();
}

function renderSelectedDayPanel() {
    const titleEl = document.getElementById('selectedDateTitle');
    const container = document.getElementById('selectedDayItemsContainer');
    if (!container) return;

    if (titleEl) {
        titleEl.textContent = formatDate(state.selectedDate);
    }

    // Find schedules for this day
    const schedulesOnDay = state.schedules.filter(s => s.date === state.selectedDate);
    // Find tasks for this day
    const tasksOnDay = state.tasks.filter(t => t.date === state.selectedDate);

    if (schedulesOnDay.length === 0 && tasksOnDay.length === 0) {
        container.innerHTML = `
            <div class="empty-state-mini">
                <p>Chưa có lịch trình hay công việc nào trong ngày này.</p>
                <button class="btn btn-sm btn-outline mt-4" onclick="window.openNewScheduleForDate('${state.selectedDate}')">+ Lên lịch trình</button>
            </div>
        `;
        return;
    }

    let html = '';

    if (schedulesOnDay.length > 0) {
        html += `<h4 class="text-sm font-bold text-muted" style="margin-bottom:0.4rem;">Lịch trình đã xếp:</h4>`;
        html += schedulesOnDay.map(sch => `
            <div class="day-schedule-item" style="border-left: 3px solid var(--primary);">
                <div class="day-schedule-item-top">
                    <strong style="font-size: 0.9rem;">${escapeHtml(sch.task ? sch.task.title : 'Công việc #' + sch.id)}</strong>
                    <button class="btn-icon btn-sm" title="Hủy lịch trình" onclick="window.deleteSchedule(${sch.id})" style="color:var(--danger); border:none;">&times;</button>
                </div>
                <div class="text-sm text-secondary">
                    <span>⏰ ${sch.task ? formatTime(sch.task.time) : '--:--'}</span>
                    ${sch.task && sch.task.category ? `<span class="badge badge-neutral text-sm">${escapeHtml(sch.task.category.name)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    if (tasksOnDay.length > 0) {
        html += `<h4 class="text-sm font-bold text-muted" style="margin-top:0.85rem; margin-bottom:0.4rem;">Công việc hạn ngày này:</h4>`;
        html += tasksOnDay.map(t => {
            const prog = getTaskProgress(t.id);
            return `
                <div class="day-schedule-item">
                    <div class="day-schedule-item-top">
                        <span style="font-size: 0.9rem; font-weight: 600; ${prog.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${escapeHtml(t.title)}</span>
                        ${prog.completed ? '<span class="badge badge-success text-sm">Xong</span>' : '<span class="badge badge-warning text-sm">Chưa xong</span>'}
                    </div>
                    <div class="text-sm text-secondary">
                        <span>⏰ ${formatTime(t.time)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    container.innerHTML = html;
}

// ==================== 4. CATEGORY MANAGEMENT RENDERER ====================
function renderCategories() {
    const container = document.getElementById('categoriesGridContainer');
    if (!container) return;

    if (state.categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h3>Chưa có danh mục nào</h3>
                <p>Tạo các danh mục như Công việc, Học tập, Cá nhân để tổ chức cuộc sống tốt hơn.</p>
                <button class="btn btn-primary" onclick="window.openNewCategoryModal()">+ Thêm danh mục mới</button>
            </div>
        `;
        return;
    }

    // Count tasks per category
    const catCounts = {};
    state.tasks.forEach(t => {
        if (t.category && t.category.id) {
            catCounts[t.category.id] = (catCounts[t.category.id] || 0) + 1;
        }
    });

    container.innerHTML = state.categories.map(cat => {
        const count = catCounts[cat.id] || 0;
        return `
            <div class="category-card" data-id="${cat.id}">
                <div>
                    <div class="cat-header">
                        <div class="cat-icon-badge">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                        </div>
                        <span class="badge badge-primary">${count} công việc</span>
                    </div>

                    <h3 class="cat-title" style="margin-top: 0.85rem;">${escapeHtml(cat.name)}</h3>
                    <p class="cat-desc" style="margin-top: 0.35rem;">${cat.description ? escapeHtml(cat.description) : '<em>Không có mô tả</em>'}</p>
                </div>

                <div class="cat-footer">
                    <span class="text-sm text-muted">ID: #${cat.id}</span>
                    <div class="task-actions-group">
                        <button class="btn btn-sm btn-secondary" onclick="window.editCategory(${cat.id})">Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="window.confirmDeleteCategory(${cat.id}, ${count})">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 5. REMINDER MANAGEMENT RENDERER ====================
function renderReminders() {
    const container = document.getElementById('remindersGridContainer');
    if (!container) return;

    let filtered = [...state.reminders];
    if (state.reminderFilter === 'ACTIVE') {
        filtered = filtered.filter(r => r.enabled);
    } else if (state.reminderFilter === 'DISABLED') {
        filtered = filtered.filter(r => !r.enabled);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3>Chưa có lời nhắc nào</h3>
                <p>Thiết lập nhắc nhở để hệ thống thông báo trước giờ thực hiện công việc.</p>
                <button class="btn btn-primary" onclick="window.openNewReminderModal()">+ Tạo nhắc nhở mới</button>
            </div>
        `;
        return;
    }

    const now = new Date();

    container.innerHTML = filtered.map(reminder => {
        const task = reminder.task || {};
        const rDate = new Date(reminder.reminderTime);
        const isPast = rDate < now;

        return `
            <div class="reminder-card ${reminder.enabled ? '' : 'disabled'}" data-id="${reminder.id}">
                <div>
                    <div class="cat-header">
                        <div class="reminder-time-box">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>${formatDateTime(reminder.reminderTime)}</span>
                        </div>
                        ${reminder.enabled ?
                            (isPast ? '<span class="badge badge-warning">Đã qua giờ</span>' : '<span class="badge badge-success">Đang bật</span>') :
                            '<span class="badge badge-neutral">Đã tắt/hủy</span>'}
                    </div>

                    <div style="margin-top: 1rem;">
                        <span class="text-sm text-muted">Công việc liên kết:</span>
                        <h4 style="font-size: 1.05rem; font-weight: 700; margin-top: 0.2rem;">
                            ${task.title ? escapeHtml(task.title) : `Công việc #${task.id || 'N/A'}`}
                        </h4>
                        ${task.date ? `<span class="text-sm text-secondary">Hạn định: ${formatDate(task.date)} lúc ${formatTime(task.time)}</span>` : ''}
                    </div>
                </div>

                <div class="cat-footer">
                    <div>
                        <button class="btn btn-sm ${reminder.enabled ? 'btn-secondary' : 'btn-outline'}" onclick="window.toggleReminderStatus(${reminder.id}, ${reminder.enabled})">
                            ${reminder.enabled ? 'Tắt nhắc nhở' : 'Bật lại'}
                        </button>
                    </div>
                    <div class="task-actions-group">
                        <button class="btn-icon btn-sm" title="Chỉnh sửa" onclick="window.editReminder(${reminder.id})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon btn-sm" title="Xóa" onclick="window.confirmDeleteReminder(${reminder.id})" style="color:var(--danger);">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== 6. PROGRESS & STATISTICS RENDERER ====================
function renderProgress() {
    const total = state.tasks.length;
    let completedCount = 0;
    let incompleteCount = 0;

    state.tasks.forEach(task => {
        const prog = getTaskProgress(task.id);
        if (prog.completed) {
            completedCount++;
        } else {
            incompleteCount++;
        }
    });

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const progPercentEl = document.getElementById('progOverviewPercent');
    const progBarEl = document.getElementById('progOverviewBar');
    const totalEl = document.getElementById('progStatTotal');
    const doneEl = document.getElementById('progStatCompleted');
    const undoneEl = document.getElementById('progStatIncomplete');

    if (progPercentEl) progPercentEl.textContent = `${percent}%`;
    if (progBarEl) progBarEl.style.width = `${percent}%`;
    if (totalEl) totalEl.textContent = total;
    if (doneEl) doneEl.textContent = completedCount;
    if (undoneEl) undoneEl.textContent = incompleteCount;

    // Table rows
    const tbody = document.getElementById('progressTableBody');
    if (!tbody) return;

    if (state.tasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">Chưa có dữ liệu công việc để hiển thị tiến độ.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.tasks.map(task => {
        const prog = getTaskProgress(task.id);
        const pVal = prog.completed ? 100 : (prog.percentage || 0);

        let statusBadge = '<span class="badge badge-neutral">TODO</span>';
        if (prog.completed) {
            statusBadge = '<span class="badge badge-success">COMPLETED</span>';
        } else if (pVal > 0) {
            statusBadge = '<span class="badge badge-warning">IN PROGRESS</span>';
        }

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(task.title)}</strong>
                    <div class="text-sm text-muted">#${task.id}</div>
                </td>
                <td>${task.category ? `<span class="badge badge-primary">${escapeHtml(task.category.name)}</span>` : '<span class="text-muted">-</span>'}</td>
                <td>${formatDate(task.date)} ${formatTime(task.time)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="table-progress-cell">
                        <div class="inline-prog-bar">
                            <div class="inline-prog-fill" style="width: ${pVal}%; background: ${prog.completed ? 'var(--success)' : 'var(--primary)'}"></div>
                        </div>
                        <span style="font-weight: 700; width: 45px; text-align: right;">${pVal}%</span>
                    </div>
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-sm btn-secondary" onclick="window.openProgressModal(${task.id})">Cập nhật</button>
                    ${!prog.completed ? `
                        <button class="btn btn-sm btn-primary" onclick="window.quickCompleteTask(${task.id})" title="Đánh dấu hoàn thành 100%">✓</button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== TASK FORM & CRUD ====================
function openNewTaskModal() {
    const form = document.getElementById('taskForm');
    if (form) form.reset();
    document.getElementById('taskModalTitle').textContent = 'Thêm Công Việc Mới';
    document.getElementById('taskFormId').value = '';

    // Set defaults: today and current time + 1 hour
    const now = new Date();
    document.getElementById('taskFormDate').value = getFormattedDate(now);
    const hours = String((now.getHours() + 1) % 24).padStart(2, '0');
    document.getElementById('taskFormTime').value = `${hours}:00`;

    const extraOpt = document.getElementById('taskExtraOptions');
    if (extraOpt) extraOpt.style.display = 'block';
    const autoSch = document.getElementById('taskAutoSchedule');
    if (autoSch) autoSch.checked = true;

    openModal('taskModal');
}

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('taskModalTitle').textContent = 'Chỉnh Sửa Công Việc';
    document.getElementById('taskFormId').value = task.id;
    document.getElementById('taskFormTitle').value = task.title || '';
    document.getElementById('taskFormDate').value = task.date || '';
    document.getElementById('taskFormTime').value = formatTime(task.time) || '';
    document.getElementById('taskFormDescription').value = task.description || '';
    document.getElementById('taskFormCategory').value = task.category ? task.category.id : '';

    // Hide extra options on edit
    const extraOpt = document.getElementById('taskExtraOptions');
    if (extraOpt) extraOpt.style.display = 'none';

    openModal('taskModal');
}

async function handleTaskFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('taskFormId').value;
    const title = document.getElementById('taskFormTitle').value.trim();
    const date = document.getElementById('taskFormDate').value;
    let time = document.getElementById('taskFormTime').value;
    const description = document.getElementById('taskFormDescription').value.trim();
    const categoryId = document.getElementById('taskFormCategory').value;
    const autoSchedule = document.getElementById('taskAutoSchedule') ? document.getElementById('taskAutoSchedule').checked : false;

    if (!title || !date || !time) {
        showToast('Vui lòng điền đủ các trường bắt buộc!', 'warning');
        return;
    }

    // Format time to HH:mm:ss if needed
    if (time.length === 5) {
        time = `${time}:00`;
    }

    const payload = {
        title,
        date,
        time,
        description,
        category: categoryId ? { id: Number(categoryId) } : null
    };

    try {
        if (id) {
            // Update
            await TaskAPI.update(Number(id), payload);
            showToast('Đã cập nhật công việc thành công!', 'success');
        } else {
            // Create
            const created = await TaskAPI.create(payload);
            showToast('Đã tạo công việc mới thành công!', 'success');

            // Automatically create default progress
            try {
                await ProgressAPI.create({
                    status: 'TODO',
                    completed: false,
                    percentage: 0,
                    task: { id: created.id }
                });
            } catch (_) {}

            // Auto create schedule if opted
            if (autoSchedule && created && created.id) {
                try {
                    await ScheduleAPI.create({
                        date: date,
                        task: { id: created.id }
                    });
                } catch (schErr) {
                    console.warn('Auto schedule note:', schErr);
                }
            }
        }

        closeModal('taskModal');
        await loadAllData();
    } catch (err) {
        showToast('Lỗi lưu công việc: ' + err.message, 'error');
    }
}

function confirmDeleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    const title = task ? `"${task.title}"` : `#${id}`;

    showConfirm(
        'Xác Nhận Xóa Công Việc',
        `Bạn có chắc chắn muốn xóa công việc ${title}? Lịch trình và nhắc nhở liên kết cũng sẽ được xử lý.`,
        async () => {
            try {
                // Delete associated progress first if exists
                const prog = getTaskProgress(id);
                if (prog && prog.id) {
                    await ProgressAPI.delete(prog.id).catch(() => {});
                }

                // Delete associated reminders
                const reminders = getTaskReminders(id);
                for (const rem of reminders) {
                    await ReminderAPI.delete(rem.id).catch(() => {});
                }

                // Delete associated schedule
                const schedule = getTaskSchedule(id);
                if (schedule && schedule.id) {
                    await ScheduleAPI.delete(schedule.id).catch(() => {});
                }

                // Finally delete task
                await TaskAPI.delete(id);
                showToast('Đã xóa công việc thành công!', 'success');
                closeModal('confirmModal');
                await loadAllData();
            } catch (err) {
                showToast('Lỗi xóa công việc: ' + err.message, 'error');
            }
        }
    );
}

function viewTaskDetails(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const prog = getTaskProgress(task.id);
    const schedule = getTaskSchedule(task.id);
    const reminders = getTaskReminders(task.id);

    const content = document.getElementById('taskDetailContent');
    if (!content) return;

    const percent = prog.completed ? 100 : (prog.percentage || 0);

    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div>
                <span class="text-sm text-muted">Mã công việc: #${task.id}</span>
                <h2 style="font-size: 1.35rem; font-weight: 800; margin-top: 0.2rem;">${escapeHtml(task.title)}</h2>
            </div>

            <div class="metric-grid" style="grid-template-columns: repeat(2, 1fr); gap: 0.85rem; margin-bottom: 0;">
                <div style="background: var(--bg-app); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <span class="text-sm text-secondary">Ngày thực hiện</span>
                    <div style="font-weight: 700; font-size: 1rem; margin-top: 0.2rem;">📅 ${formatDate(task.date)}</div>
                </div>
                <div style="background: var(--bg-app); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <span class="text-secondary text-sm">Thời gian</span>
                    <div style="font-weight: 700; font-size: 1rem; margin-top: 0.2rem;">⏰ ${formatTime(task.time)}</div>
                </div>
            </div>

            <div>
                <span class="text-secondary text-sm font-bold">Danh mục:</span>
                <div style="margin-top: 0.35rem;">
                    ${task.category ? `<span class="badge badge-primary" style="font-size: 0.85rem;">🏷️ ${escapeHtml(task.category.name)}</span>` : '<span class="text-muted">Chưa phân loại</span>'}
                </div>
            </div>

            <div>
                <span class="text-secondary text-sm font-bold">Mô tả chi tiết:</span>
                <p style="margin-top: 0.35rem; background: var(--bg-app); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border); line-height: 1.5;">
                    ${task.description ? escapeHtml(task.description) : '<em class="text-muted">Không có mô tả bổ sung</em>'}
                </p>
            </div>

            <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700;">
                    <span>Tiến độ hiện tại: ${percent}%</span>
                    <span>${prog.completed ? '<span class="text-success">Đã hoàn thành</span>' : '<span class="text-warning">Chưa xong</span>'}</span>
                </div>
                <div class="task-prog-bar" style="height: 8px; margin-top: 0.4rem;">
                    <div class="task-prog-fill ${prog.completed ? 'completed' : ''}" style="width: ${percent}%;"></div>
                </div>
            </div>

            <div style="background: var(--bg-app); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="font-size: 0.85rem; font-weight: 700;">Liên kết hệ thống:</div>
                <div class="text-sm">
                    <strong>Lịch trình:</strong> ${schedule ? `Đã xếp lịch ngày ${formatDate(schedule.date)}` : 'Chưa xếp vào lịch trình'}
                </div>
                <div class="text-sm">
                    <strong>Nhắc nhở:</strong> ${reminders.length > 0 ? `${reminders.length} lời nhắc đã thiết lập` : 'Chưa có lời nhắc'}
                </div>
            </div>
        </div>
    `;

    const editBtn = document.getElementById('taskDetailEditBtn');
    if (editBtn) {
        editBtn.onclick = () => {
            closeModal('taskDetailModal');
            editTask(task.id);
        };
    }

    openModal('taskDetailModal');
}

// ==================== CATEGORY FORM & CRUD ====================
function openNewCategoryModal() {
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
    document.getElementById('categoryModalTitle').textContent = 'Thêm Danh Mục Mới';
    document.getElementById('categoryFormId').value = '';
    openModal('categoryModal');
}

function editCategory(id) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('categoryModalTitle').textContent = 'Chỉnh Sửa Danh Mục';
    document.getElementById('categoryFormId').value = cat.id;
    document.getElementById('categoryFormName').value = cat.name || '';
    document.getElementById('categoryFormDescription').value = cat.description || '';

    openModal('categoryModal');
}

async function handleCategoryFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('categoryFormId').value;
    const name = document.getElementById('categoryFormName').value.trim();
    const description = document.getElementById('categoryFormDescription').value.trim();

    if (!name) {
        showToast('Vui lòng nhập tên danh mục!', 'warning');
        return;
    }

    const payload = { name, description };

    try {
        if (id) {
            await CategoryAPI.update(Number(id), payload);
            showToast('Đã cập nhật danh mục thành công!', 'success');
        } else {
            await CategoryAPI.create(payload);
            showToast('Đã thêm danh mục mới thành công!', 'success');
        }

        closeModal('categoryModal');
        await loadAllData();
    } catch (err) {
        showToast('Lỗi lưu danh mục: ' + err.message, 'error');
    }
}

function confirmDeleteCategory(id, count) {
    if (count > 0) {
        showToast(`Danh mục này đang chứa ${count} công việc. Không thể xóa trực tiếp!`, 'warning');
        return;
    }

    const cat = state.categories.find(c => c.id === id);
    const name = cat ? `"${cat.name}"` : `#${id}`;

    showConfirm(
        'Xác Nhận Xóa Danh Mục',
        `Bạn có chắc chắn muốn xóa danh mục ${name}?`,
        async () => {
            try {
                await CategoryAPI.delete(id);
                showToast('Đã xóa danh mục thành công!', 'success');
                closeModal('confirmModal');
                await loadAllData();
            } catch (err) {
                showToast('Lỗi xóa danh mục: ' + err.message, 'error');
            }
        }
    );
}

// ==================== SCHEDULE FORM & CRUD ====================
function openNewScheduleModal() {
    const form = document.getElementById('scheduleForm');
    if (form) form.reset();
    document.getElementById('scheduleModalTitle').textContent = 'Thêm Vào Lịch Trình';
    document.getElementById('scheduleFormId').value = '';
    document.getElementById('scheduleFormDate').value = state.selectedDate || getFormattedDate();
    populateTaskSelects();
    openModal('scheduleModal');
}

function openNewScheduleForDate(dateStr) {
    openNewScheduleModal();
    document.getElementById('scheduleFormDate').value = dateStr;
}

async function handleScheduleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('scheduleFormId').value;
    const taskId = document.getElementById('scheduleFormTask').value;
    const date = document.getElementById('scheduleFormDate').value;

    if (!taskId || !date) {
        showToast('Vui lòng chọn công việc và ngày!', 'warning');
        return;
    }

    // Check if task already has schedule (unique constraint in backend)
    const existing = state.schedules.find(s => s.task && s.task.id === Number(taskId));
    if (existing && (!id || existing.id !== Number(id))) {
        showToast(`Công việc này đã có lịch trình vào ngày ${formatDate(existing.date)}!`, 'warning');
        return;
    }

    const payload = {
        date,
        task: { id: Number(taskId) }
    };

    try {
        if (id) {
            await ScheduleAPI.update(Number(id), payload);
            showToast('Đã cập nhật lịch trình!', 'success');
        } else {
            await ScheduleAPI.create(payload);
            showToast('Đã thêm vào lịch trình!', 'success');
        }

        closeModal('scheduleModal');
        await loadAllData();
    } catch (err) {
        showToast('Lỗi lưu lịch trình: ' + err.message, 'error');
    }
}

async function deleteSchedule(id) {
    showConfirm(
        'Xác Nhận Hủy Lịch Trình',
        'Bạn có chắc muốn bỏ mục này khỏi lịch trình không?',
        async () => {
            try {
                await ScheduleAPI.delete(id);
                showToast('Đã xóa lịch trình thành công!', 'success');
                closeModal('confirmModal');
                await loadAllData();
            } catch (err) {
                showToast('Lỗi xóa lịch trình: ' + err.message, 'error');
            }
        }
    );
}

// ==================== REMINDER FORM & CRUD ====================
function openNewReminderModal() {
    const form = document.getElementById('reminderForm');
    if (form) form.reset();
    document.getElementById('reminderModalTitle').textContent = 'Tạo Nhắc Nhở';
    document.getElementById('reminderFormId').value = '';

    // Default datetime-local to 1 hour from now
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const dtString = `${getFormattedDate(now)}T${String(now.getHours()).padStart(2, '0')}:00`;
    document.getElementById('reminderFormTime').value = dtString;
    document.getElementById('reminderFormEnabled').checked = true;

    populateTaskSelects();
    openModal('reminderModal');
}

function editReminder(id) {
    const reminder = state.reminders.find(r => r.id === id);
    if (!reminder) return;

    document.getElementById('reminderModalTitle').textContent = 'Chỉnh Sửa Nhắc Nhở';
    document.getElementById('reminderFormId').value = reminder.id;
    if (reminder.task) {
        document.getElementById('reminderFormTask').value = reminder.task.id;
    }
    if (reminder.reminderTime) {
        document.getElementById('reminderFormTime').value = reminder.reminderTime.slice(0, 16);
    }
    document.getElementById('reminderFormEnabled').checked = reminder.enabled;

    openModal('reminderModal');
}

async function handleReminderFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('reminderFormId').value;
    const taskId = document.getElementById('reminderFormTask').value;
    let reminderTime = document.getElementById('reminderFormTime').value;
    const enabled = document.getElementById('reminderFormEnabled').checked;

    if (!taskId || !reminderTime) {
        showToast('Vui lòng chọn công việc và thời gian nhắc!', 'warning');
        return;
    }

    if (reminderTime.length === 16) {
        reminderTime = `${reminderTime}:00`;
    }

    const payload = {
        reminderTime,
        enabled,
        task: { id: Number(taskId) }
    };

    try {
        if (id) {
            await ReminderAPI.update(Number(id), payload);
            showToast('Đã cập nhật nhắc nhở!', 'success');
        } else {
            await ReminderAPI.create(payload);
            showToast('Đã tạo nhắc nhở mới!', 'success');
        }

        closeModal('reminderModal');
        await loadAllData();
    } catch (err) {
        showToast('Lỗi lưu nhắc nhở: ' + err.message, 'error');
    }
}

async function toggleReminderStatus(id, currentEnabled) {
    try {
        if (currentEnabled) {
            await ReminderAPI.cancel(id);
            showToast('Đã tắt nhắc nhở!', 'info');
        } else {
            const rem = state.reminders.find(r => r.id === id);
            if (rem) {
                await ReminderAPI.update(id, {
                    ...rem,
                    enabled: true
                });
                showToast('Đã bật lại nhắc nhở!', 'success');
            }
        }
        await loadAllData();
    } catch (err) {
        showToast('Lỗi cập nhật trạng thái nhắc nhở: ' + err.message, 'error');
    }
}

function confirmDeleteReminder(id) {
    showConfirm(
        'Xác Nhận Xóa Nhắc Nhở',
        'Bạn có chắc chắn muốn xóa lời nhắc này?',
        async () => {
            try {
                await ReminderAPI.delete(id);
                showToast('Đã xóa nhắc nhở thành công!', 'success');
                closeModal('confirmModal');
                await loadAllData();
            } catch (err) {
                showToast('Lỗi xóa nhắc nhở: ' + err.message, 'error');
            }
        }
    );
}

// ==================== PROGRESS FORM & ACTIONS ====================
function openProgressModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const prog = getTaskProgress(taskId);

    document.getElementById('progressFormId').value = prog.id || '';
    document.getElementById('progressFormTaskId').value = taskId;
    document.getElementById('progressFormTaskTitle').textContent = `#${task.id} - ${task.title}`;

    const statusSelect = document.getElementById('progressFormStatus');
    const percentInput = document.getElementById('progressFormPercent');
    const percentDisplay = document.getElementById('progressFormPercentDisplay');
    const completedCheckbox = document.getElementById('progressFormCompleted');

    const percent = prog.completed ? 100 : (prog.percentage || 0);

    statusSelect.value = prog.completed ? 'COMPLETED' : (prog.status || 'TODO');
    percentInput.value = percent;
    percentDisplay.textContent = `${percent}%`;
    completedCheckbox.checked = prog.completed;

    openModal('progressModal');
}

async function handleProgressFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('progressFormId').value;
    const taskId = Number(document.getElementById('progressFormTaskId').value);
    const status = document.getElementById('progressFormStatus').value;
    let percentage = Number(document.getElementById('progressFormPercent').value);
    const completed = document.getElementById('progressFormCompleted').checked;

    if (completed || status === 'COMPLETED') {
        percentage = 100;
    }

    const payload = {
        status: completed ? 'COMPLETED' : status,
        completed,
        percentage,
        task: { id: taskId }
    };

    try {
        if (id) {
            await ProgressAPI.update(Number(id), payload);
            showToast('Đã cập nhật tiến độ công việc!', 'success');
        } else {
            await ProgressAPI.create(payload);
            showToast('Đã tạo ghi nhận tiến độ!', 'success');
        }

        closeModal('progressModal');
        await loadAllData();
    } catch (err) {
        showToast('Lỗi cập nhật tiến độ: ' + err.message, 'error');
    }
}

async function quickCompleteTask(taskId) {
    await toggleTaskComplete(taskId);
}

// ==================== LIVE CLOCK & MOBILE MENU ====================
function startLiveClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;

    function tick() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;
    }
    tick();
    setInterval(tick, 1000);
}

function openMobileSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ==================== EVENT LISTENERS & SETUP ====================
function setupEventListeners() {
    // 1. Navigation clicks
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) navigateTo(section);
        });
    });

    // Hash change routing
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            navigateTo(hash, false);
        }
    });

    // 2. Mobile sidebar
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) mobileBtn.addEventListener('click', openMobileSidebar);

    const closeBtn = document.getElementById('sidebarCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', closeMobileSidebar);

    // 3. Header buttons
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadAllData());

    const quickAddBtn = document.getElementById('headerQuickAddBtn');
    if (quickAddBtn) quickAddBtn.addEventListener('click', openNewTaskModal);

    // 4. Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    // 5. Confirm Dialog Action
    const confirmActionBtn = document.getElementById('confirmModalActionBtn');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (confirmActionCallback) {
                confirmActionCallback();
            }
        });
    }

    // 6. Form submissions
    const taskForm = document.getElementById('taskForm');
    if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);

    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) scheduleForm.addEventListener('submit', handleScheduleFormSubmit);

    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) reminderForm.addEventListener('submit', handleReminderFormSubmit);

    const progressForm = document.getElementById('progressForm');
    if (progressForm) progressForm.addEventListener('submit', handleProgressFormSubmit);

    // 7. Tasks Toolbar Events
    const searchInput = document.getElementById('taskSearchInput');
    const clearSearchBtn = document.getElementById('taskClearSearchBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.taskFilters.search = e.target.value;
            if (clearSearchBtn) {
                clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
            }
            renderTasks();
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.taskFilters.search = '';
            clearSearchBtn.style.display = 'none';
            renderTasks();
        });
    }

    const filterCategory = document.getElementById('taskFilterCategory');
    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            state.taskFilters.category = e.target.value;
            renderTasks();
        });
    }

    const filterStatus = document.getElementById('taskFilterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            state.taskFilters.status = e.target.value;
            renderTasks();
        });
    }

    const filterDate = document.getElementById('taskFilterDate');
    if (filterDate) {
        filterDate.addEventListener('change', (e) => {
            state.taskFilters.date = e.target.value;
            renderTasks();
        });
    }

    const tasksAddNewBtn = document.getElementById('tasksAddNewBtn');
    if (tasksAddNewBtn) tasksAddNewBtn.addEventListener('click', openNewTaskModal);

    // 8. Dashboard button events
    const dashGoCategoriesBtn = document.getElementById('dashGoCategoriesBtn');
    if (dashGoCategoriesBtn) dashGoCategoriesBtn.addEventListener('click', () => navigateTo('categories'));

    const dashAddTodayTaskBtn = document.getElementById('dashAddTodayTaskBtn');
    if (dashAddTodayTaskBtn) dashAddTodayTaskBtn.addEventListener('click', openNewTaskModal);

    const dashAddReminderBtn = document.getElementById('dashAddReminderBtn');
    if (dashAddReminderBtn) dashAddReminderBtn.addEventListener('click', openNewReminderModal);

    // 9. Calendar Events
    const prevMonthBtn = document.getElementById('calPrevMonthBtn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
            renderCalendar();
        });
    }

    const nextMonthBtn = document.getElementById('calNextMonthBtn');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
            renderCalendar();
        });
    }

    const calTodayJumpBtn = document.getElementById('calTodayJumpBtn');
    if (calTodayJumpBtn) {
        calTodayJumpBtn.addEventListener('click', () => {
            state.calendarDate = new Date();
            state.selectedDate = getFormattedDate();
            renderCalendar();
        });
    }

    const calAddScheduleBtn = document.getElementById('calAddScheduleBtn');
    if (calAddScheduleBtn) calAddScheduleBtn.addEventListener('click', openNewScheduleModal);

    const dayPanelAddBtn = document.getElementById('dayPanelAddScheduleBtn');
    if (dayPanelAddBtn) dayPanelAddBtn.addEventListener('click', () => openNewScheduleForDate(state.selectedDate));

    // 10. Categories Events
    const categoryAddNewBtn = document.getElementById('categoryAddNewBtn');
    if (categoryAddNewBtn) categoryAddNewBtn.addEventListener('click', openNewCategoryModal);

    // 11. Reminders Events
    const reminderAddNewBtn = document.getElementById('reminderAddNewBtn');
    if (reminderAddNewBtn) reminderAddNewBtn.addEventListener('click', openNewReminderModal);

    const reminderFilterStatus = document.getElementById('reminderFilterStatus');
    if (reminderFilterStatus) {
        reminderFilterStatus.addEventListener('change', (e) => {
            state.reminderFilter = e.target.value;
            renderReminders();
        });
    }

    // 12. Progress Modal Range Slider sync
    const progSlider = document.getElementById('progressFormPercent');
    const progDisplay = document.getElementById('progressFormPercentDisplay');
    const progCompletedCheck = document.getElementById('progressFormCompleted');
    const progStatusSelect = document.getElementById('progressFormStatus');

    if (progSlider && progDisplay) {
        progSlider.addEventListener('input', (e) => {
            progDisplay.textContent = `${e.target.value}%`;
            if (Number(e.target.value) === 100) {
                if (progCompletedCheck) progCompletedCheck.checked = true;
                if (progStatusSelect) progStatusSelect.value = 'COMPLETED';
            } else if (Number(e.target.value) > 0) {
                if (progCompletedCheck) progCompletedCheck.checked = false;
                if (progStatusSelect && progStatusSelect.value !== 'IN_PROGRESS') {
                    progStatusSelect.value = 'IN_PROGRESS';
                }
            } else {
                if (progCompletedCheck) progCompletedCheck.checked = false;
                if (progStatusSelect) progStatusSelect.value = 'TODO';
            }
        });
    }

    if (progCompletedCheck) {
        progCompletedCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (progSlider) progSlider.value = 100;
                if (progDisplay) progDisplay.textContent = '100%';
                if (progStatusSelect) progStatusSelect.value = 'COMPLETED';
            } else {
                if (progSlider) progSlider.value = 0;
                if (progDisplay) progDisplay.textContent = '0%';
                if (progStatusSelect) progStatusSelect.value = 'TODO';
            }
        });
    }

    if (progStatusSelect) {
        progStatusSelect.addEventListener('change', (e) => {
            if (e.target.value === 'COMPLETED') {
                if (progSlider) progSlider.value = 100;
                if (progDisplay) progDisplay.textContent = '100%';
                if (progCompletedCheck) progCompletedCheck.checked = true;
            } else if (e.target.value === 'TODO') {
                if (progSlider) progSlider.value = 0;
                if (progDisplay) progDisplay.textContent = '0%';
                if (progCompletedCheck) progCompletedCheck.checked = false;
            } else if (e.target.value === 'IN_PROGRESS') {
                if (progSlider && Number(progSlider.value) === 0) {
                    progSlider.value = 50;
                    if (progDisplay) progDisplay.textContent = '50%';
                }
                if (progCompletedCheck) progCompletedCheck.checked = false;
            }
        });
    }
}

// Global window exposure for inline onclick handlers
window.openNewTaskModal = openNewTaskModal;
window.editTask = editTask;
window.confirmDeleteTask = confirmDeleteTask;
window.viewTaskDetails = viewTaskDetails;
window.openNewCategoryModal = openNewCategoryModal;
window.editCategory = editCategory;
window.confirmDeleteCategory = confirmDeleteCategory;
window.openNewScheduleModal = openNewScheduleModal;
window.openNewScheduleForDate = openNewScheduleForDate;
window.deleteSchedule = deleteSchedule;
window.selectCalendarDay = selectCalendarDay;
window.openNewReminderModal = openNewReminderModal;
window.editReminder = editReminder;
window.toggleReminderStatus = toggleReminderStatus;
window.confirmDeleteReminder = confirmDeleteReminder;
window.openProgressModal = openProgressModal;
window.quickCompleteTask = quickCompleteTask;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    startLiveClock();

    // Check initial hash route if any
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        navigateTo(hash, false);
    }

    loadAllData();
});
