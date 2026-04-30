import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

/**
 * Robustly resolve image and file URLs from various sources:
 * 1. Full URLs (Cloudinary, Google, etc. returned by backend)
 * 2. Base64 data URLs
 * 3. Legacy prefixed IDs (logo_, banner_, avatar_)
 * 4. Raw Cloudinary public IDs (legacy/special data)
 * 5. Relative backend paths (/uploads/...)
 */
export const resolvePublicUrl = (path) => {
    if (!path) return null;
    
    // 1. If it's already a full URL or base64, return as-is
    if (typeof path === 'string' && (path.startsWith('http') || path.startsWith('data:'))) {
        return path;
    }

    // 2. Handle legacy IDs with specific prefixes that route through special backend endpoints
    if (path.startsWith('logo_') || path.startsWith('banner_')) {
        return `${API_BASE_URL}/companies/image/${path}`;
    }

    // 3. Handle raw Cloudinary IDs (no slashes, typical for legacy or manual data)
    // Cloud Name: daa2mvguh (from environment)
    if (!path.includes('/') && !path.includes('\\')) {
        return `https://res.cloudinary.com/daa2mvguh/image/upload/v1/${path}`;
    }

    // 4. Default to relative backend path
    const cleanBase = API_BASE_URL.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

import toast from 'react-hot-toast';

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.response?.data?.error || error.message;

        switch (status) {
            case 401:
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                // Only redirect if not already on login/register
                if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
                    window.location.href = '/login';
                }
                break;
            case 403:
                toast.error('Access Denied: You do not have permission for this action.', { id: 'api-403' });
                break;
            case 500:
                toast.error('Server Error: Our background systems are experiencing turbulence. Please try again.', { id: 'api-500' });
                break;
            case 502:
            case 503:
            case 504:
                toast.error('Network Error: The server is currently unreachable. Please check your connection.', { id: 'api-off' });
                break;
            default:
                // For other errors, we let the component handle specialized logic, but log it
                console.error(`API Error [${status || 'No Status'}]:`, message);
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
    changePassword: (currentPassword, newPassword) =>
        apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }),
};

export const jobAPI = {
    getAll: () => apiClient.get('/jobs'),
    getById: (id) => apiClient.get(`/jobs/${id}`),
    search: (params) => apiClient.get('/jobs/search', { params }),
    advancedSearch: (data) => apiClient.post('/jobs/advanced-search', data),
    getByEmployer: (employerId) => apiClient.get(`/jobs/employer/${employerId}`),
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
    getEmployerApplications: (page = 0, size = 100) =>
        apiClient.get(`/applications/employer?page=${page}&size=${size}`),
    
    // Offer Letter Endpoints
    sendOffer: (applicationId, params) => 
        apiClient.post(`/applications/${applicationId}/send-offer`, null, { params }),
    acceptOffer: (applicationId) => 
        apiClient.put(`/applications/${applicationId}/accept`),
    rejectOffer: (applicationId) => 
        apiClient.put(`/applications/${applicationId}/reject-offer`),
    getOfferLetter: (applicationId) => 
        apiClient.get(`/applications/${applicationId}/offer-letter`),
    directHire: (applicationId) => 
        apiClient.put(`/applications/${applicationId}/direct-hire`),
};

export const savedJobAPI = {
    save: (userId, jobId) => apiClient.post(`/saved-jobs/save?userId=${userId}&jobId=${jobId}`),
    unsave: (userId, jobId) => apiClient.delete(`/saved-jobs/unsave?userId=${userId}&jobId=${jobId}`),
    getSaved: (userId) => apiClient.get(`/saved-jobs?userId=${userId}`),
    checkSaved: (userId, jobId) => apiClient.get(`/saved-jobs/check?userId=${userId}&jobId=${jobId}`),
};

export const resumeAPI = {
    upload: (file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || 'My Resume');
        return apiClient.post('/resume/upload', formData);
    },
    uploadWithUserId: (userId, file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || 'My Resume');
        return apiClient.post(`/resume/upload`, formData);
    },
    check: (userId) => apiClient.get(`/resume/check?userId=${userId}`),
    list: (userId) => apiClient.get(`/resume/list?userId=${userId}`),
    getUrl: (resumeId) => apiClient.get(`/resume/url/${resumeId}`),
    download: (resumeId) => apiClient.get(`/resume/download/${resumeId}`, { responseType: 'blob' }),
    delete: (resumeId) => apiClient.delete(`/resume/delete/${resumeId}`),
    rename: (resumeId, name) => apiClient.put(`/resume/rename/${resumeId}?name=${encodeURIComponent(name)}`),
};

export const resumeAnalysisAPI = {
    analyze: (resumeId) => apiClient.post(`/resume-analysis/${resumeId}`),
    analyzeMatch: (resumeId, jobId) => apiClient.post(`/resume-analysis/${resumeId}/match/${jobId}`),
    getMatchAnalysis: (resumeId, jobId) => apiClient.get(`/resume-analysis/${resumeId}/match/${jobId}`),
    getHistory: (userId) => apiClient.get(`/resume-analysis/user/${userId}`),
};

export const messageAPI = {
    send: (senderId, receiverId, content, fileUrl = null, fileName = null) =>
        apiClient.post(`/messages/send?senderId=${senderId}&receiverId=${receiverId}`, { 
            content, 
            fileUrl, 
            fileName,
            messageType: fileUrl ? 'FILE' : 'TEXT' 
        }),
    getConversation: (userId, partnerId) =>
        apiClient.get(`/messages/conversation?userId=${userId}&partnerId=${partnerId}`),
    getInbox: (userId) =>
        apiClient.get(`/messages/inbox?userId=${userId}`),
    getUnreadCount: (userId) =>
        apiClient.get(`/messages/unread-count?userId=${userId}`),
    getUsers: (userId) =>
        apiClient.get(`/messages/users?userId=${userId}`),
    uploadFile: (file, receiverId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiverId', receiverId);
        return apiClient.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    editMessage: (id, content) =>
        apiClient.put(`/messages/${id}`, { content }),
    deleteMessage: (id) =>
        apiClient.delete(`/messages/${id}`),
};

export const adminAPI = {
    getStats: () => apiClient.get('/admin/stats'),
    getUsers: () => apiClient.get('/admin/users'),
    deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),
    updateRole: (id, role) => apiClient.put(`/admin/users/${id}/role?role=${role}`),
    getJobs: () => apiClient.get('/admin/jobs'),
    getApplications: () => apiClient.get('/admin/applications'),
};

export const userAPI = {
    getById: (id) => apiClient.get(`/users/${id}`),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    changePassword: (id, data) => apiClient.post(`/auth/change-password/${id}`, data),
    uploadAvatar: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/users/${id}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

export const notificationAPI = {
    getAll: (userId) => apiClient.get(`/notifications/user/${userId}`),
    markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: (userId) => apiClient.put(`/notifications/read-all?userId=${userId}`),
};

export const quizAPI = {
    create: (data) => apiClient.post(`/quizzes/job/${data.jobId}`, data),
    getByJob: (jobId) => apiClient.get(`/quizzes/job/${jobId}/view`),
    getFull: (jobId) => apiClient.get(`/quizzes/job/${jobId}`),
    getById: (quizId) => apiClient.get(`/quizzes/${quizId}`),
    submit: (submission) => apiClient.post(`/quizzes/submit`, submission),
    getResults: (applicationId) => apiClient.get(`/quizzes/result/${applicationId}`),
};

export const interviewAPI = {
    schedule: (applicationId, data) => apiClient.post(`/interviews/schedule?applicationId=${applicationId}`, data),
    getByCandidate: () => apiClient.get('/interviews/candidate'),
    getByInterviewer: () => apiClient.get('/interviews/interviewer'),
    getByApplication: (applicationId) => apiClient.get(`/interviews/application/${applicationId}`),
    getById: (id) => apiClient.get(`/interviews/${id}`),
    confirm: (id) => apiClient.put(`/interviews/${id}/confirm`),
    cancel: (id) => apiClient.put(`/interviews/${id}/cancel`),
    complete: (id, feedback, rating) => apiClient.put(`/interviews/${id}/complete`, { feedback, rating }),
    reschedule: (id, scheduledAt) => apiClient.put(`/interviews/${id}/reschedule`, { scheduledAt }),
};

export const companyAPI = {
    getMy: () => apiClient.get('/companies/user'),
    getByUser: (userId) => apiClient.get(`/companies/user/${userId}`),
    getAll: () => apiClient.get('/companies'),
    update: (data) => apiClient.put('/companies/user', data),
    uploadLogo: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/companies/user/upload-logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadBanner: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/companies/user/upload-banner', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export default apiClient;