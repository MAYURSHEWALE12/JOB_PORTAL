import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/api/')) {
        return `http://localhost:8080${path}`;
    }
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
    validateToken: () => apiClient.post('/auth/validate-token'),
    changePassword: (userId, currentPassword, newPassword) =>
        apiClient.post(`/auth/change-password/${userId}?currentPassword=${encodeURIComponent(currentPassword)}&newPassword=${encodeURIComponent(newPassword)}`),
};

export const jobAPI = {
    getAll: (page = 0, size = 10) => apiClient.get('/jobs', { params: { page, size } }),
    getById: (id) => apiClient.get(`/jobs/${id}`),
    getJobsByEmployer: (employerId, page = 0, size = 10) => apiClient.get(`/jobs/employer/${employerId}`, { params: { page, size } }),
    search: (params) => {
        const { page = 0, size = 10, ...filters } = params;
        return apiClient.get('/jobs/search', { params: { ...filters, page, size } });
    },
    create: (data, employerId) => apiClient.post(`/jobs?employerId=${employerId}`, data),
    update: (id, data, employerId) => apiClient.put(`/jobs/${id}?employerId=${employerId}`, data),
    delete: (id, employerId) => apiClient.delete(`/jobs/${id}?employerId=${employerId}`),
    close: (id, employerId) => apiClient.post(`/jobs/${id}/close?employerId=${employerId}`),
};

export const applicationAPI = {
    apply: (jobId, jobSeekerId, coverLetter, resumeId) => {
        const params = resumeId
            ? `/applications/apply?jobId=${jobId}&jobSeekerId=${jobSeekerId}&resumeId=${resumeId}`
            : `/applications/apply?jobId=${jobId}&jobSeekerId=${jobSeekerId}`;
        return apiClient.post(params, { coverLetter });
    },
    getMyApplications: (jobSeekerId, page = 0, size = 10) =>
        apiClient.get(`/applications/my-applications`, { params: { jobSeekerId, page, size } }),
    getJobApplications: (jobId, employerId, page = 0, size = 10) =>
        apiClient.get(`/applications/job/${jobId}`, { params: { employerId, page, size } }),
    getEmployerApplications: (employerId, page = 0, size = 10) =>
        apiClient.get(`/applications/employer/${employerId}`, { params: { page, size } }),
    checkApplied: (jobId, jobSeekerId) =>
        apiClient.get(`/applications/check?jobId=${jobId}&jobSeekerId=${jobSeekerId}`),
    withdraw: (applicationId, jobSeekerId) =>
        apiClient.put(`/applications/${applicationId}/withdraw?jobSeekerId=${jobSeekerId}`),
    updateStatus: (applicationId, employerId, status) =>
        apiClient.put(`/applications/${applicationId}/status?employerId=${employerId}&status=${status}`),
};

export const savedJobAPI = {
    save: (userId, jobId) => apiClient.post(`/saved-jobs/save?userId=${userId}&jobId=${jobId}`),
    unsave: (userId, jobId) => apiClient.delete(`/saved-jobs/unsave?userId=${userId}&jobId=${jobId}`),
    getSaved: (userId) => apiClient.get(`/saved-jobs?userId=${userId}`),
    checkSaved: (userId, jobId) => apiClient.get(`/saved-jobs/check?userId=${userId}&jobId=${jobId}`),
};

export const resumeAPI = {
    upload: (userId, file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/resume/upload?userId=${userId}&name=${encodeURIComponent(name)}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    check: (userId) => apiClient.get(`/resume/check?userId=${userId}`),
    list: (userId) => apiClient.get(`/resume/list?userId=${userId}`),
    download: (resumeId) => apiClient.get(`/resume/download/${resumeId}`, { responseType: 'blob' }),
    delete: (resumeId) => apiClient.delete(`/resume/delete/${resumeId}`),
    rename: (resumeId, name) => apiClient.put(`/resume/rename/${resumeId}?name=${encodeURIComponent(name)}`),
};

export const messageAPI = {
    send: (senderId, receiverId, content) =>
        apiClient.post(`/messages/send?senderId=${senderId}&receiverId=${receiverId}`, { content }),
    getConversation: (userId, partnerId) =>
        apiClient.get(`/messages/conversation?userId=${userId}&partnerId=${partnerId}`),
    getInbox: (userId) =>
        apiClient.get(`/messages/inbox?userId=${userId}`),
    getUnreadCount: (userId) =>
        apiClient.get(`/messages/unread-count?userId=${userId}`),
    getUsers: (userId) =>
        apiClient.get(`/messages/users?userId=${userId}`),
};

export const userAPI = {
    getById: (id) => apiClient.get(`/users/${id}`),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    uploadAvatar: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/users/${id}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    changePassword: (id, data) => apiClient.post(`/auth/change-password/${id}`, data),
};

export const notificationAPI = {
    getUserNotifications: (userId) => apiClient.get(`/notifications/user/${userId}`),
    markAsRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
};

export const companyAPI = {
    getAll: () => apiClient.get('/companies'),
    getByUser: (userId) => apiClient.get(`/companies/user/${userId}`),
    update: (userId, data) => apiClient.put(`/companies/user/${userId}`, data),
    uploadLogo: (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/companies/user/${userId}/upload-logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadBanner: (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/companies/user/${userId}/upload-banner`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

export const resumeAnalysisAPI = {
    analyze: (resumeId) => 
        apiClient.post(`/resume-analysis/${resumeId}`),
    analyzeMatch: (resumeId, jobId) =>
        apiClient.post(`/resume-analysis/${resumeId}/match/${jobId}`),
    getMatch: (resumeId, jobId) =>
        apiClient.get(`/resume-analysis/${resumeId}/match/${jobId}`),
    getHistory: (userId) =>
        apiClient.get(`/resume-analysis/user/${userId}`),
};

export const quizAPI = {
    create: (jobId, data) =>
        apiClient.post(`/quizzes/job/${jobId}`, data),
    getForCandidate: (jobId) =>
        apiClient.get(`/quizzes/job/${jobId}/view`),
    submit: (data) =>
        apiClient.post(`/quizzes/submit`, data),
    getResult: (applicationId) =>
        apiClient.get(`/quizzes/result/${applicationId}`)
};

export const jobAlertAPI = {
    getUserAlerts: (userId) => apiClient.get(`/job-alerts/user/${userId}`),
    createAlert: (userId, data) => apiClient.post(`/job-alerts/user/${userId}`, data),
    updateAlert: (alertId, data) => apiClient.put(`/job-alerts/${alertId}`, data),
    deleteAlert: (alertId) => apiClient.delete(`/job-alerts/${alertId}`),
};

export default apiClient;
