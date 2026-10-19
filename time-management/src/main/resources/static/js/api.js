/**
 * API Service for Time Management Application
 * Interacts with Spring Boot backend endpoints
 */
const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `Lỗi yêu cầu: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData && (errorData.message || errorData.error)) {
                    errorMessage = errorData.message || errorData.error;
                }
            } catch (_) {
                // In case response is plain text or HTML error
                const text = await response.text();
                if (text && text.length < 200) {
                    errorMessage = text;
                }
            }
            throw new Error(errorMessage);
        }

        // For HTTP 204 or void responses (like delete, cancel, complete)
        const contentType = response.headers.get('content-type');
        if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch (_) {
                return text;
            }
        }

        return await response.json();
    } catch (err) {
        console.error(`API Error [${options.method || 'GET'} ${url}]:`, err);
        throw err;
    }
}

export const TaskAPI = {
    getAll: () => request('/tasks'),
    getById: (id) => request(`/tasks/${id}`),
    create: (task) => request('/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
    }),
    update: (id, task) => request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(task)
    }),
    delete: (id) => request(`/tasks/${id}`, {
        method: 'DELETE'
    })
};

export const CategoryAPI = {
    getAll: () => request('/categories'),
    getById: (id) => request(`/categories/${id}`),
    create: (category) => request('/categories', {
        method: 'POST',
        body: JSON.stringify(category)
    }),
    update: (id, category) => request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(category)
    }),
    delete: (id) => request(`/categories/${id}`, {
        method: 'DELETE'
    })
};

export const ScheduleAPI = {
    getAll: () => request('/schedules'),
    getById: (id) => request(`/schedules/${id}`),
    getByDate: (date) => request(`/schedules/date/${date}`),
    getByMonth: (year, month) => request(`/schedules/month/${year}/${month}`),
    create: (schedule) => request('/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule)
    }),
    update: (id, schedule) => request(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(schedule)
    }),
    delete: (id) => request(`/schedules/${id}`, {
        method: 'DELETE'
    })
};

export const ReminderAPI = {
    getAll: () => request('/reminders'),
    getById: (id) => request(`/reminders/${id}`),
    getByTaskId: (taskId) => request(`/reminders/task/${taskId}`),
    create: (reminder) => request('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder)
    }),
    update: (id, reminder) => request(`/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reminder)
    }),
    cancel: (id) => request(`/reminders/${id}/cancel`, {
        method: 'PUT'
    }),
    delete: (id) => request(`/reminders/${id}`, {
        method: 'DELETE'
    })
};

export const ProgressAPI = {
    getAll: () => request('/progress'),
    getById: (id) => request(`/progress/${id}`),
    getByTaskId: (taskId) => request(`/progress/task/${taskId}`),
    create: (progress) => request('/progress', {
        method: 'POST',
        body: JSON.stringify(progress)
    }),
    update: (id, progress) => request(`/progress/${id}`, {
        method: 'PUT',
        body: JSON.stringify(progress)
    }),
    complete: (id) => request(`/progress/${id}/complete`, {
        method: 'PUT'
    }),
    delete: (id) => request(`/progress/${id}`, {
        method: 'DELETE'
    }),
    getStatsTotal: () => request('/progress/statistics/total'),
    getStatsCompleted: () => request('/progress/statistics/completed'),
    getStatsIncomplete: () => request('/progress/statistics/incomplete')
};
