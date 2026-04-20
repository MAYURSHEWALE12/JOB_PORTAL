import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { jobAPI, applicationAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function useApplications() {
    const { user } = useAuthStore();
    
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingApps, setLoadingApps] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');
    const [activeStage, setActiveStage] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');

    const fetchMyJobs = useCallback(async () => {
        setLoadingJobs(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            const myJobs = data.filter(job => job.employer?.id === user.id);
            setJobs(myJobs.reverse());
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs.');
        } finally {
            setLoadingJobs(false);
        }
    }, [user.id]);

    const fetchApplications = useCallback(async (job) => {
        if (!job) return;
        setSelectedJob(job);
        setApplications([]);
        setSelectedIds(new Set());
        setActiveStage('ALL');
        setLoadingApps(true);
        try {
            const res = await applicationAPI.getJobApplications(job.id, user.id);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
            setError('Failed to load applications.');
        } finally {
            setLoadingApps(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchMyJobs();
    }, [fetchMyJobs]);

    const handleUpdateStatus = async (applicationId, newStatus) => {
        setUpdatingId(applicationId);
        try {
            await applicationAPI.updateStatus(applicationId, user.id, newStatus);
            toast.success(`Successfully moved to ${newStatus}`);
            setApplications(prev =>
                prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
            );
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update status.';
            toast.error(errorMsg, { duration: 5000, icon: '🛡️' });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleBulkUpdate = async (newStatus) => {
        if (selectedIds.size === 0) return;
        setIsBulkUpdating(true);
        try {
            const promises = Array.from(selectedIds).map(id =>
                applicationAPI.updateStatus(id, user.id, newStatus)
            );
            await Promise.all(promises);
            setApplications(prev =>
                prev.map(app => selectedIds.has(app.id) ? { ...app, status: newStatus } : app)
            );
            setSelectedIds(new Set());
            toast.success(`Updated ${selectedIds.size} applications`);
        } catch (err) {
            toast.error('Failed to update some applications.');
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const toggleSelect = useCallback((e, id) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    return {
        jobs, selectedJob, setSelectedJob, 
        applications, setApplications,
        loadingJobs, loadingApps, updatingId, 
        error, activeStage, setActiveStage,
        selectedIds, setSelectedIds,
        isBulkUpdating, searchQuery, setSearchQuery, 
        viewMode, setViewMode,
        fetchMyJobs, fetchApplications,
        handleUpdateStatus, handleBulkUpdate, toggleSelect
    };
}
