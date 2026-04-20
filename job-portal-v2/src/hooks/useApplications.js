import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jobAPI, applicationAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function useApplications() {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingApps, setLoadingApps] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');
    const [activeStage, setActiveStage] = useState(searchParams.get('stage') || 'ALL');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');

    const updateUrlParams = useCallback((params) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            Object.entries(params).forEach(([key, value]) => {
                if (value) next.set(key, value);
                else next.delete(key);
            });
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const fetchMyJobs = useCallback(async () => {
        setLoadingJobs(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            const myJobs = data.filter(job => job.employer?.id === user.id);
            const reversed = myJobs.reverse();
            setJobs(reversed);
            return reversed;
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs.');
            return [];
        } finally {
            setLoadingJobs(false);
        }
    }, [user.id]);

    const fetchApplications = useCallback(async (job) => {
        if (!job) return;
        setSelectedJob(job);
        setApplications([]);
        setSelectedIds(new Set());
        setLoadingApps(true);
        
        // Sync URL with jobId
        updateUrlParams({ jobId: job.id, stage: activeStage });

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
    }, [user.id, activeStage, updateUrlParams]);

    // Initial load + URL jobId matching
    useEffect(() => {
        const init = async () => {
            const myJobs = await fetchMyJobs();
            const urlJobId = searchParams.get('jobId');
            if (urlJobId && myJobs.length > 0) {
                const jobToSelect = myJobs.find(j => String(j.id) === urlJobId);
                if (jobToSelect) fetchApplications(jobToSelect);
            }
        };
        init();
    }, [fetchMyJobs, fetchApplications, searchParams]);

    const handleUpdateStage = (stage) => {
        setActiveStage(stage);
        updateUrlParams({ stage });
    };

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
        error, activeStage, setActiveStage: handleUpdateStage,
        selectedIds, setSelectedIds,
        isBulkUpdating, searchQuery, setSearchQuery, 
        viewMode, setViewMode,
        fetchMyJobs, fetchApplications,
        handleUpdateStatus, handleBulkUpdate, toggleSelect
    };
}
