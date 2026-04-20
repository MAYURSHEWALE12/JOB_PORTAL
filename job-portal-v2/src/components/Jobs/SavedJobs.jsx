import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { savedJobAPI, applicationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonJobCard } from '../Skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

export default function SavedJobs() {
    const { user } = useAuthStore();

    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [selected, setSelected]   = useState(null);
    const [removing, setRemoving]   = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    const fetchAppliedJobIds = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await applicationAPI.getMyApplications(user.id);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
            setAppliedJobs(new Set(data.map(a => a.job?.id).filter(Boolean)));
        } catch (err) {
            console.error('Failed to load applied jobs in SavedJobs:', err);
        }
    }, [user?.id]);

    const fetchSavedJobs = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError('');
        try {
            const res = await savedJobAPI.getSaved(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setSavedJobs(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load saved jobs.');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchSavedJobs();
    }, [fetchSavedJobs]);

    useEffect(() => {
        if (user?.id) {
            fetchAppliedJobIds();
        }
    }, [user?.id, fetchAppliedJobIds]);



    const handleUnsave = async (jobId) => {
        setRemoving(jobId);
        try {
            await savedJobAPI.unsave(user.id, jobId);
            setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
            if (selected?.job?.id === jobId) setSelected(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove saved job.');
        } finally {
            setRemoving(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="mb-8">
                <h2 className="text-3xl font-serif font-semibold mb-2 text-[var(--color-text)]">
                    Saved Jobs
                </h2>
                <p className="text-[var(--color-text-muted)]">
                    Jobs you've bookmarked for later
                </p>
            </div>

            <div className="card p-6 mb-8 flex items-center gap-4">
                <span className="text-4xl font-serif font-semibold text-[var(--color-primary)]">
                    {savedJobs.length}
                </span>
                <span className="text-[var(--color-text-muted)] font-medium">
                    saved job{savedJobs.length !== 1 ? 's' : ''}
                </span>
            </div>

            {loading && (
                <div className="space-y-4">
                    <SkeletonJobCard />
                    <SkeletonJobCard />
                </div>
            )}

            {!loading && error && (
                <div className="card p-8 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {!loading && !error && savedJobs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-12 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-[var(--color-input)] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-serif font-semibold mb-3 text-[var(--color-text)]">
                        No Saved Jobs
                    </h3>
                    <p className="text-[var(--color-text-muted)]">
                        Go to <strong>Find Jobs</strong> and click the bookmark icon to save jobs for later.
                    </p>
                </motion.div>
            )}

            {!loading && savedJobs.length > 0 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex gap-8 flex-col lg:flex-row"
                >
                    <div className={`space-y-4 ${selected ? 'lg:w-1/2' : 'w-full'}`}>
                        {savedJobs.map((savedJob) => {
                            const isSelected = selected?.id === savedJob.id;
                            return (
                                <motion.div
                                    key={savedJob.id}
                                    variants={itemVariants}
                                    onClick={() => setSelected(savedJob)}
                                    className={`card p-5 cursor-pointer transition-all duration-300
                                        ${isSelected ? 'ring-2 ring-[var(--color-primary)]' : 'hover:shadow-lg hover:border-[var(--color-primary)]'}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg mb-1 text-[var(--color-text)]">
                                                {savedJob.job?.title}
                                            </h3>
                                            <p className="text-[var(--color-text-muted)] text-sm mb-3">
                                                {savedJob.job?.employer?.firstName} {savedJob.job?.employer?.lastName}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 rounded-lg text-xs bg-[var(--color-input)] text-[var(--color-text-mid)]">
                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {savedJob.job?.location}
                                                </span>
                                                <span className="px-2 py-1 rounded-lg text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                                                    {savedJob.job?.jobType?.replace('_', ' ')}
                                                </span>
                                                {savedJob.job?.salaryMin && (
                                                    <span className="px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">
                                                        ₹{Number(savedJob.job.salaryMin).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-[var(--color-text-muted)] text-xs mt-3 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                                Saved on {formatDate(savedJob.savedAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`text-xs font-medium px-3 py-1 rounded-full
                                                ${savedJob.job?.status === 'ACTIVE'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-zinc-500/20 text-zinc-400'}`}>
                                                {savedJob.job?.status}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsave(savedJob.job.id);
                                                }}
                                                disabled={removing === savedJob.job.id}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                            >
                                                {removing === savedJob.job.id ? '...' : 'Remove'}
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[var(--color-text-muted)] text-sm mt-4 line-clamp-2">
                                        {savedJob.job?.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>

                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden lg:block lg:w-1/2 card p-6 h-fit sticky top-4"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-semibold text-[var(--color-text)]">
                                    {selected.job?.title}
                                </h2>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="w-8 h-8 rounded-full bg-[var(--color-input)] text-[var(--color-text-mid)] hover:bg-[var(--color-primary)] hover:text-zinc-900 transition-colors flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 rounded-lg text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                                    {selected.job?.jobType?.replace('_', ' ')}
                                </span>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full
                                    ${selected.job?.status === 'ACTIVE'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-zinc-500/20 text-zinc-400'}`}>
                                    {selected.job?.status}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm mb-6 p-4 bg-[var(--color-hover-surface)] rounded-xl">
                                <p className="flex items-center gap-2">
                                    <span className="text-[var(--color-text-muted)]">🏢</span> 
                                    <span className="text-[var(--color-text)]">
                                        {selected.job?.employer?.firstName} {selected.job?.employer?.lastName}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-[var(--color-text)]">{selected.job?.location}</span>
                                </p>
                                {selected.job?.salaryMin && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-green-400">💰</span> 
                                        <span className="text-green-400">
                                            ₹{Number(selected.job.salaryMin).toLocaleString()} — ₹{Number(selected.job.salaryMax).toLocaleString()}
                                        </span>
                                    </p>
                                )}
                                {selected.job?.experienceRequired && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-[var(--color-text-muted)]">🧑‍💼</span> 
                                        <span className="text-[var(--color-text)]">{selected.job.experienceRequired}</span>
                                    </p>
                                )}
                                {selected.job?.positionsAvailable && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-[var(--color-text-muted)]">👥</span> 
                                        <span className="text-[var(--color-text)]">{selected.job.positionsAvailable} positions</span>
                                    </p>
                                )}
                                <p className="text-[var(--color-primary)] flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    Saved on {formatDate(selected.savedAt)}
                                </p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold mb-2 text-[var(--color-text)]">Description</h3>
                                <p className="text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed text-sm">
                                    {selected.job?.description}
                                </p>
                            </div>

                            {selected.job?.requirements && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2 text-[var(--color-text)]">Requirements</h3>
                                    <p className="text-[var(--color-text-muted)] whitespace-pre-line leading-relaxed text-sm p-4 bg-[var(--color-hover-surface)] rounded-xl">
                                        {selected.job.requirements}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 border-t border-[var(--color-border)]">
                                <button
                                    onClick={() => handleUnsave(selected.job.id)}
                                    disabled={removing === selected.job.id}
                                    className="flex-1 btn-secondary py-2.5"
                                >
                                    {removing === selected.job.id ? 'Removing...' : 'Remove'}
                                </button>
                                {selected.job?.status === 'ACTIVE' && !appliedJobs.has(selected.job.id) && (
                                    <button className="flex-1 btn-primary py-2.5">
                                        Apply Now
                                    </button>
                                )}
                                {selected.job?.status === 'ACTIVE' && appliedJobs.has(selected.job.id) && (
                                    <button disabled className="flex-1 py-2.5 bg-green-500/20 text-green-400 rounded-lg cursor-not-allowed">
                                        Applied
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}