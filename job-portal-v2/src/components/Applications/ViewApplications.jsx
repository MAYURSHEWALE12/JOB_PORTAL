import { useState, useEffect } from 'react';
import { jobAPI, applicationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';

const statusStyles = {
    PENDING:     'bg-amber-100 text-amber-900 border-amber-900 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    REVIEWED:    'bg-blue-100 text-blue-900 border-blue-900 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    SHORTLISTED: 'bg-orange-100 text-orange-900 border-orange-900 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    ACCEPTED:    'bg-emerald-100 text-emerald-900 border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    REJECTED:    'bg-rose-100 text-rose-900 border-rose-900 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',
    WITHDRAWN:   'bg-stone-100 text-stone-500 border-stone-300 dark:bg-stone-800 dark:text-stone-500 dark:border-stone-700',
};

const statusIcons = {
    PENDING: '⏳',
    REVIEWED: '👀',
    SHORTLISTED: '⭐',
    ACCEPTED: '🎉',
    REJECTED: '❌',
    WITHDRAWN: '↩️',
};

export default function ViewApplications() {
    const { user } = useAuthStore();

    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingApps, setLoadingApps] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');

    // Load employer's jobs on mount
    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        setLoadingJobs(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : [];
            // Filter only this employer's jobs
            const myJobs = data.filter(job => job.employer?.id === user.id);
            setJobs(myJobs);
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs.');
        } finally {
            setLoadingJobs(false);
        }
    };

    const fetchApplications = async (job) => {
        setSelectedJob(job);
        setSelectedApp(null);
        setApplications([]);
        setLoadingApps(true);
        try {
            const res = await applicationAPI.getJobApplications(job.id, user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
            setError('Failed to load applications.');
        } finally {
            setLoadingApps(false);
        }
    };

    const handleUpdateStatus = async (applicationId, newStatus) => {
        setUpdatingId(applicationId);
        try {
            await applicationAPI.updateStatus(applicationId, user.id, newStatus);
            // Update locally
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId
                        ? { ...app, status: newStatus }
                        : app
                )
            );
            if (selectedApp?.id === applicationId) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // Stats for selected job
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                    📨 Applications Received
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs mt-1">
                    Select a job to manage candidates
                </p>
            </div>

            {error && (
                <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-6 py-4 mb-8 font-black uppercase shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000]">
                    {error}
                </div>
            )}

            <div className="flex gap-6">

                {/* ── Jobs List (left panel) ─────────────────────────── */}
                <div className="w-80 flex-shrink-0">
                    <h3 className="text-xs font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">
                        Your Posted Jobs
                    </h3>

                    {loadingJobs && <Loader text="Fetching..." />}

                    {!loadingJobs && jobs.length === 0 && (
                        <div className="neo-card p-8 text-center">
                            <p className="text-stone-400 font-bold">No jobs posted yet.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => fetchApplications(job)}
                                className={`
                                    neo-card p-5 cursor-pointer 
                                    ${selectedJob?.id === job.id 
                                        ? 'border-orange-500 shadow-[6px_6px_0_#ea580c] dark:shadow-[6px_6px_0_#ea580c] -translate-x-1 -translate-y-1' 
                                        : 'dark:border-stone-700'}
                                `}
                            >
                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-base leading-tight">
                                    {job.title}
                                </h4>
                                <p className="text-stone-500 dark:text-stone-400 text-xs font-bold mt-1 uppercase tracking-tight">
                                    📍 {job.location}
                                </p>
                                <div className="flex justify-between items-center mt-4">
                                    <span className={`text-[10px] px-2 py-0.5 border-[2px] font-black uppercase tracking-widest
                                        ${job.status === 'ACTIVE'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                                            : 'bg-stone-100 text-stone-500 border-stone-400 dark:bg-stone-800/50'}`}>
                                        {job.status}
                                    </span>
                                    <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Manage →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Applications Panel (middle) ───────────────────── */}
                <div className="flex-1">

                    {/* No job selected */}
                    {!selectedJob && (
                        <div className="neo-card p-20 text-center flex flex-col items-center dark:border-stone-700">
                            <div className="text-7xl mb-6 transform rotate-12">👈</div>
                            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-2 uppercase tracking-tight">
                                Select a Job
                            </h3>
                            <p className="text-stone-500 dark:text-stone-400 font-bold max-w-sm">
                                Choose one of your posted jobs from the sidebar to start reviewing candidates.
                            </p>
                        </div>
                    )}

                    {/* Job selected */}
                    {selectedJob && (
                        <>
                            {/* Selected job header */}
                            <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 p-6 mb-6 flex flex-col sm:flex-row justify-between items-center shadow-[6px_6px_0_#ea580c]">
                                <div>
                                    <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                                        {selectedJob.title}
                                    </h3>
                                    <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs mt-1">
                                        📍 {selectedJob.location}
                                    </p>
                                </div>
                                <div className="mt-4 sm:mt-0 text-center sm:text-right">
                                    <span className="text-orange-500 font-black text-4xl block leading-none">
                                        {applications.length}
                                    </span>
                                    <span className="text-stone-400 font-black uppercase text-[10px] tracking-widest">
                                        applicants
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            {applications.length > 0 && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: 'Total', value: stats.total, color: 'bg-stone-100 text-stone-900 dark:bg-stone-800' },
                                        { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30' },
                                        { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30' },
                                        { label: 'Accepted', value: stats.accepted, color: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30' },
                                    ].map(stat => (
                                        <div key={stat.label} className={`${stat.color} border-[3px] border-stone-900 dark:border-stone-700 p-4 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]`}>
                                            <p className="text-3xl font-black leading-none mb-1">{stat.value}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Loading apps */}
                            {loadingApps && <Loader text="Loading applications..." />}

                             {/* No applications */}
                            {!loadingApps && applications.length === 0 && (
                                <div className="neo-card p-16 text-center dark:border-stone-700">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-stone-500 font-bold uppercase tracking-widest text-sm">No applications received yet.</p>
                                </div>
                            )}

                            {/* Applications list */}
                            <div className="space-y-4">
                                {!loadingApps && applications.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        className={`
                                            neo-card p-5 cursor-pointer 
                                            ${selectedApp?.id === app.id 
                                                ? 'border-orange-500 shadow-[6px_6px_0_#ea580c] dark:shadow-[6px_6px_0_#ea580c] -translate-x-1 -translate-y-1' 
                                                : 'dark:border-stone-700'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-lg uppercase tracking-tight">
                                                    {app.jobSeeker?.firstName} {app.jobSeeker?.lastName}
                                                </h4>
                                                <p className="text-stone-500 dark:text-stone-400 text-xs font-black lowercase tracking-widest">{app.jobSeeker?.email}</p>
                                                <p className="text-stone-400 dark:text-stone-500 text-[10px] font-black uppercase tracking-widest mt-2">
                                                    📅 Applied {formatDate(app.appliedAt)}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-black px-3 py-1.5 border-[2px] uppercase tracking-widest
                                                ${statusStyles[app.status]}`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        {/* Quick status update buttons */}
                                        {app.status !== 'WITHDRAWN' && (
                                            <div className="flex gap-2 mt-5 flex-wrap">
                                                {['REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateStatus(app.id, status);
                                                        }}
                                                        disabled={app.status === status || updatingId === app.id}
                                                        className={`
                                                            neo-interactive text-[10px] px-3 py-1.5 border-[2px] font-black uppercase tracking-widest transition-all
                                                            ${app.status === status
                                                                ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-stone-900'
                                                                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-600 hover:border-orange-500 hover:text-orange-500'}
                                                            ${updatingId === app.id ? 'opacity-50 cursor-wait' : ''}
                                                        `}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Applicant Detail Panel (right) ────────────────── */}
                {selectedApp && (
                    <div className="hidden lg:block w-80 flex-shrink-0">
                        <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 p-6 h-fit sticky top-24 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest text-xs">
                                    Candidate Profile
                                </h3>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="neo-btn p-1.5 bg-stone-100 dark:bg-stone-700 leading-none"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Avatar */}
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 bg-orange-500 border-[3px] border-stone-900 dark:border-stone-700 text-3xl font-black text-white mx-auto flex items-center justify-center shadow-[4px_4px_0_#1c1917]">
                                    {selectedApp.jobSeeker?.firstName?.[0]}{selectedApp.jobSeeker?.lastName?.[0]}
                                </div>
                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-xl mt-4 uppercase tracking-tight">
                                    {selectedApp.jobSeeker?.firstName} {selectedApp.jobSeeker?.lastName}
                                </h4>
                                <p className="text-stone-500 dark:text-stone-400 font-bold text-xs lowercase mt-1">{selectedApp.jobSeeker?.email}</p>
                                {selectedApp.jobSeeker?.phone && (
                                    <p className="text-stone-400 dark:text-stone-500 font-bold text-[10px] mt-1 italic">📞 {selectedApp.jobSeeker.phone}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className={`text-center text-[10px] font-black px-3 py-2 border-[2px] uppercase tracking-widest mb-6
                                ${statusStyles[selectedApp.status]}`}>
                                {selectedApp.status}
                            </div>

                            <div className="border-t-[2px] border-stone-200 dark:border-stone-700 my-6" />

                            {/* Cover Letter */}
                            <h4 className="font-black text-stone-400 dark:text-stone-500 text-[10px] uppercase tracking-widest mb-3">Cover Letter</h4>
                            {selectedApp.coverLetter ? (
                                <p className="text-stone-700 dark:text-stone-300 text-xs font-medium whitespace-pre-line bg-stone-50 dark:bg-stone-900/50 p-4 border-[2px] border-stone-200 dark:border-stone-700 max-h-48 overflow-y-auto custom-scrollbar">
                                    {selectedApp.coverLetter}
                                </p>
                            ) : (
                                <p className="text-stone-400 font-bold text-[10px] italic py-4">No cover letter submitted.</p>
                            )}

                            <div className="border-t-[2px] border-stone-200 dark:border-stone-700 my-6" />

                            {/* Action Center */}
                            {selectedApp.status !== 'WITHDRAWN' && (
                                <>
                                    <h4 className="font-black text-stone-400 dark:text-stone-500 text-[10px] uppercase tracking-widest mb-4">Decision Actions</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { value: 'REVIEWED',    label: '👀 Mark Reviewed', color: 'bg-white dark:bg-stone-800' },
                                            { value: 'SHORTLISTED', label: '⭐ Shortlist',     color: 'bg-white dark:bg-stone-800 text-orange-600' },
                                            { value: 'ACCEPTED',    label: '🎉 Accept',        color: 'bg-emerald-500 text-white' },
                                            { value: 'REJECTED',    label: '❌ Reject',        color: 'bg-rose-500 text-white' },
                                        ].map(({ value, label, color }) => (
                                            <button
                                                key={value}
                                                onClick={() => handleUpdateStatus(selectedApp.id, value)}
                                                disabled={selectedApp.status === value || updatingId === selectedApp.id}
                                                className={`
                                                    neo-btn text-xs py-2.5 
                                                    ${color}
                                                    ${selectedApp.status === value ? 'opacity-50 grayscale' : ''}
                                                `}
                                            >
                                                {updatingId === selectedApp.id ? '...' : label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}