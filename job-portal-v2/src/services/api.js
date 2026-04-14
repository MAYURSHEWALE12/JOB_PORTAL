import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
    getAll: () => apiClient.get('/jobs'),
    getById: (id) => apiClient.get(`/jobs/${id}`),
    search: (params) => apiClient.get('/jobs/search', { params }),
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
    getMyApplications: (jobSeekerId) =>
        apiClient.get(`/applications/my-applications?jobSeekerId=${jobSeekerId}`),
    getJobApplications: (jobId, employerId) =>
        apiClient.get(`/applications/job/${jobId}?employerId=${employerId}`),
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
        return apiClient.post(`/resume/upload?userId=${userId}&name=${encodeURIComponent(name)}`, formData);
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
    changePassword: (id, data) => apiClient.post(`/auth/change-password/${id}`, data),
};

export default apiClient;