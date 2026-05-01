import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { savedJobAPI, applicationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonJobCard } from '../Skeleton';
import JobCard from './JobCard';

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

            <div className="hp-card p-6 mb-8 flex items-center gap-4">
                <span className="text-4xl font-black gradient-word">
                    {savedJobs.length}
                </span>
                <span className="text-[var(--hp-muted)] font-bold uppercase tracking-widest text-xs">
                    Saved Opportunities
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
                    <div className={`grid gap-4 ${selected ? 'lg:w-1/2' : 'w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                        {savedJobs.map((savedJob) => (
                            <JobCard
                                key={savedJob.id}
                                job={savedJob.job}
                                isSelected={selected?.id === savedJob.id}
                                isApplied={appliedJobs.has(savedJob.job?.id)}
                                isSaved={true}
                                onSelect={() => setSelected(savedJob)}
                                onToggleSave={(e) => {
                                    e.stopPropagation();
                                    handleUnsave(savedJob.job.id);
                                }}
                            />
                        ))}
                    </div>

                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hidden lg:block lg:w-1/2 hp-card p-6 h-fit sticky top-4 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                                style={{ background: 'radial-gradient(circle, rgba(var(--hp-accent-rgb),.05) 0%, transparent 70%)' }} />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <h2 className="text-xl font-bold text-[var(--hp-text)]">
                                    {selected.job?.title}
                                </h2>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="w-8 h-8 rounded-xl bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] border border-[var(--hp-border)] hover:text-[var(--hp-text)] transition-colors flex items-center justify-center"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                                <span className="tag-pill" style={{ background: 'rgba(var(--hp-accent-rgb),.12)', color: 'var(--hp-accent)' }}>
                                    {selected.job?.jobType?.replace('_', ' ')}
                                </span>
                                <span className={`tag-pill ${selected.job?.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                                    {selected.job?.status}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm mb-6 p-4 bg-[var(--hp-surface-alt)] rounded-xl border border-[var(--hp-border)] relative z-10">
                                <p className="flex items-center gap-2">
                                    <span className="text-[var(--hp-muted)]">🏢</span> 
                                    <span className="font-semibold text-[var(--hp-text)]">
                                        {selected.job?.companyName || selected.job?.employer?.companyProfile?.companyName || 'Verified Employer'}
                                    </span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-[var(--hp-muted)]">📍</span>
                                    <span className="text-[var(--hp-text-sub)]">{selected.job?.location}</span>
                                </p>
                                {selected.job?.salaryMin && (
                                    <p className="flex items-center gap-2">
                                        <span className="text-emerald-400">💰</span> 
                                        <span className="text-emerald-400 font-bold">
                                            ₹{Number(selected.job.salaryMin).toLocaleString()} — ₹{Number(selected.job.salaryMax).toLocaleString()}
                                        </span>
                                    </p>
                                )}
                                <p className="text-[var(--hp-accent)] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                    Saved on {formatDate(selected.savedAt)}
                                </p>
                            </div>

                            <div className="mb-6 relative z-10">
                                <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-[var(--hp-muted)]">Description</h3>
                                <p className="text-[var(--hp-text-sub)] text-sm leading-relaxed line-clamp-6">
                                    {selected.job?.description}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-5 border-t border-[var(--hp-border)] relative z-10">
                                <button
                                    onClick={() => handleUnsave(selected.job.id)}
                                    disabled={removing === selected.job.id}
                                    className="hp-btn-ghost flex-1 py-3 text-xs uppercase font-black"
                                >
                                    {removing === savedJob?.job?.id ? 'Removing...' : 'Remove'}
                                </button>
                                {selected.job?.status === 'ACTIVE' && (
                                    <button 
                                        onClick={() => navigate('/jobs')}
                                        className="hp-btn-primary flex-1 py-3 text-xs uppercase font-black"
                                    >
                                        {appliedJobs.has(selected.job.id) ? 'Applied' : 'Apply Now'}
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