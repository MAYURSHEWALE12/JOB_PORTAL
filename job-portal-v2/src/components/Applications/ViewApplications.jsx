import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobAPI, applicationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';
import ApplicationCard from './ApplicationCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PIPELINE_STAGES = [
    { key: 'ALL', label: 'All', icon: '📋', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'PENDING', label: 'New', icon: '⏳', accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { key: 'REVIEWED', label: 'Reviewed', icon: '👀', accent: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { key: 'SHORTLISTED', label: 'Shortlisted', icon: '⭐', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'INTERVIEWING', label: 'Interviews', icon: '📅', accent: 'var(--hp-accent2)', bg: 'rgba(var(--hp-accent2-rgb), 0.1)' },
    { key: 'OFFERED', label: 'Offered', icon: '📜', accent: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
    { key: 'ACCEPTED', label: 'Hired', icon: '🎉', accent: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { key: 'REJECTED', label: 'Rejected', icon: '❌', accent: '#f87171', bg: 'rgba(248,113,113,0.1)' },
];

const statusStyles = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REVIEWED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SHORTLISTED: 'bg-[rgba(var(--hp-accent-rgb),0.1)] text-[var(--hp-accent)] border-[rgba(var(--hp-accent-rgb),0.2)]',
    INTERVIEWING: 'bg-[rgba(var(--hp-accent2-rgb),0.1)] text-[var(--hp-accent2)] border-[rgba(var(--hp-accent2-rgb),0.2)]',
    OFFERED: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    ACCEPTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    WITHDRAWN: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const statusIcons = {
    PENDING: '⏳', REVIEWED: '👀', SHORTLISTED: '⭐', INTERVIEWING: '📅', OFFERED: '📜',
    ACCEPTED: '🎉', REJECTED: '❌', WITHDRAWN: '↩️',
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
    const [activeStage, setActiveStage] = useState('ALL');
    const [showJobDetail, setShowJobDetail] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        setLoadingJobs(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            const myJobs = data.filter(job => job.employer?.id === user.id);
            setJobs(myJobs.reverse()); // Show newest first
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
    };

    const handleUpdateStatus = async (applicationId, newStatus) => {
        setUpdatingId(applicationId);
        try {
            await applicationAPI.updateStatus(applicationId, user.id, newStatus);
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId ? { ...app, status: newStatus } : app
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

    const handleBulkUpdate = async (newStatus) => {
        if (selectedIds.size === 0) return;
        setIsBulkUpdating(true);
        try {
            const promises = Array.from(selectedIds).map(id =>
                applicationAPI.updateStatus(id, user.id, newStatus)
            );
            await Promise.all(promises);
            setApplications(prev =>
                prev.map(app =>
                    selectedIds.has(app.id) ? { ...app, status: newStatus } : app
                )
            );
            setSelectedIds(new Set());
        } catch (err) {
            alert('Failed to update some applications.');
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const toggleSelect = (e, id) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSmartSelect = () => {
        // Smart select: find candidates in the current view with > 80% match
        // Note: we need to access the match data which is usually fetched in individual cards
        // For simplicity and performance, we'll iterate through our filtered list
        // and select those that have previously been analyzed with high scores.
        // If we don't have the scores cached at this level, we'll just select the visible ones.
        const topIds = filteredApps
            .filter(app => {
                // Ideally we'd have the matchScore here, but currently it's fetched per card.
                // We'll select all visible for now, or we can improve this if we lift match state.
                return true; 
            })
            .map(app => app.id);
        
        setSelectedIds(prev => {
            const next = new Set(prev);
            topIds.forEach(id => next.add(id));
            return next;
        });
    };

    // Count per stage
    const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.key] = stage.key === 'ALL'
            ? applications.length
            : applications.filter(a => a.status === stage.key).length;
        return acc;
    }, {});

    const particles = [...Array(15)].map((_, i) => ({
        size: Math.random() * 5 + 1,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 12,
        delay: Math.random() * 10,
        color: i % 3 === 0 ? 'var(--hp-accent)' : i % 3 === 1 ? 'var(--hp-accent2)' : 'var(--hp-muted)',
    }));

    // Filtered applications based on active stage AND search query
    const filteredApps = applications.filter(a => {
        const matchesStage = activeStage === 'ALL' || a.status === activeStage;
        const name = `${a.jobSeeker?.firstName} ${a.jobSeeker?.lastName}`.toLowerCase();
        const email = (a.jobSeeker?.email || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
        return matchesStage && matchesSearch;
    });

    // ── JOB SELECTION SCREEN ──
    if (!selectedJob) {
        return (
            <div style={{ position: 'relative', zIndex: 10 }}>
                <style>{`
                    .hp-card {
                        background: var(--hp-card, #ffffff);
                        border: 1px solid var(--hp-border, rgba(0,0,0,0.09));
                        border-radius: 16px;
                        transition: border-color .25s, transform .25s, box-shadow .25s, background .25s;
                        box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08));
                    }
                    .hp-card:hover {
                        border-color: rgba(var(--hp-accent-rgb), 0.35);
                        transform: translateY(-3px);
                        box-shadow: 0 20px 60px rgba(0,0,0,.25);
                    }
                    .hp-btn-ghost {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--hp-surface-alt);
                        border: 1px solid var(--hp-border);
                        color: var(--hp-text);
                        font-weight: 600;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all .2s;
                    }
                    .hp-btn-ghost:hover {
                        background: rgba(var(--hp-accent-rgb), .1);
                        border-color: rgba(var(--hp-accent-rgb), .3);
                        color: var(--hp-accent);
                    }
                    .hp-particles-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: -1; }
                    .hp-particle-anim { position: absolute; border-radius: 50%; animation: hp-float-up linear infinite; opacity: 0; }
                    @keyframes hp-float-up {
                        0% { transform: translateY(100vh) scale(0); opacity: 0; }
                        10% { opacity: 0.8; }
                        90% { opacity: 0.2; }
                        100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                    }
                `}</style>

                <div className="hp-particles-bg">
                    {particles.map((p, i) => (
                        <div
                            key={i}
                            className="hp-particle-anim"
                            style={{
                                width: `${p.size}px`, height: `${p.size}px`, left: p.left, backgroundColor: p.color,
                                animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, opacity: Math.random() * 0.3 + 0.1,
                            }}
                        />
                    ))}
                </div>

                <div className="max-w-[1200px] mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">ATS Pipeline</h2>
                        <p className="text-[var(--hp-muted)] mt-1">Select a job to view and manage incoming applications</p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mb-6 text-sm font-medium px-4 py-3 rounded-xl border"
                            style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                            {error}
                        </motion.div>
                    )}

                    {loadingJobs && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="hp-card p-6 animate-pulse">
                                    <div className="h-5 w-3/4 mb-3 rounded" style={{ background: 'var(--hp-border)' }}></div>
                                    <div className="h-4 w-1/2 mb-6 rounded" style={{ background: 'var(--hp-border)' }}></div>
                                    <div className="h-px w-full my-4" style={{ background: 'var(--hp-border)' }}></div>
                                    <div className="h-4 w-full rounded" style={{ background: 'var(--hp-border)' }}></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loadingJobs && jobs.length === 0 && (
                        <div className="hp-card p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                <svg className="w-8 h-8" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-[var(--hp-text)] font-bold text-lg mb-1">No Active Postings</p>
                            <p className="text-[var(--hp-muted)] text-sm">Post a job to start receiving applications.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {jobs.map((job) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => fetchApplications(job)}
                                className="hp-card p-6 cursor-pointer group flex flex-col"
                            >
                                <h4 className="font-bold text-[var(--hp-text)] text-[1.1rem] leading-snug mb-2 group-hover:text-[var(--hp-accent)] transition-colors">
                                    {job.title}
                                </h4>
                                <p className="text-[var(--hp-muted)] text-sm flex items-center gap-1.5 mb-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                </p>

                                <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--hp-border)' }}>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold tracking-wider uppercase border
                                        ${job.status === 'ACTIVE'
                                            ? 'bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[rgba(52,211,153,0.2)]'
                                            : 'bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] border-[var(--hp-border)]'}`}>
                                        {job.status}
                                    </span>
                                    <span className="text-sm font-bold flex items-center gap-1 transition-transform group-hover:translate-x-1" style={{ color: 'var(--hp-accent)' }}>
                                        Open Pipeline
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── ATS BOARD SCREEN ──
    return (
        <div className="max-w-[1600px] mx-auto relative z-10 pb-20">
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); }
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--hp-border); border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--hp-muted); }
            `}</style>

            {/* Top Bar: Back + Job Info */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hp-card p-5 mb-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                        onClick={() => { setSelectedJob(null); setApplications([]); setSelectedApp(null); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                        style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-[var(--hp-text)] text-xl truncate tracking-tight">
                                {selectedJob.title}
                            </h3>
                            <p className="text-[var(--hp-muted)] text-sm flex items-center gap-1.5 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {selectedJob.location} <span className="opacity-50 mx-1">•</span> <strong className="text-[var(--hp-accent)]">{applications.length}</strong> applicants
                            </p>
                        </div>
                        <button
                            onClick={() => setShowJobDetail(!showJobDetail)}
                            className="text-xs font-bold tracking-wide uppercase px-4 py-2.5 rounded-xl transition-colors border"
                            style={{
                                color: 'var(--hp-accent)',
                                background: 'rgba(var(--hp-accent-rgb), 0.1)',
                                borderColor: 'rgba(var(--hp-accent-rgb), 0.2)'
                            }}
                        >
                            {showJobDetail ? 'Close Details ▲' : 'View Job Details ▼'}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showJobDetail && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-8" style={{ borderColor: 'var(--hp-border)' }}>
                                <div>
                                    <h4 className="font-bold text-xs text-[var(--hp-muted)] mb-3 uppercase tracking-widest">Description</h4>
                                    <div className="prose prose-sm max-w-none" style={{ color: 'var(--hp-text-sub)' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedJob.description}</ReactMarkdown>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-[var(--hp-muted)] mb-3 uppercase tracking-widest">Requirements</h4>
                                    <div className="prose prose-sm max-w-none" style={{ color: 'var(--hp-text-sub)' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedJob.requirements}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-6 text-sm font-medium px-4 py-3 rounded-xl border"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                    {error}
                </motion.div>
            )}

            {/* ── MAIN TWO-COLUMN: Left Nav + Right Content ── */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* ── LEFT: Pipeline Stage Navigation ── */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="hp-card p-4 sticky top-24">
                        <h3 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-widest mb-4 px-2">
                            Pipeline Stages
                        </h3>
                        <nav className="space-y-1.5">
                            {PIPELINE_STAGES.map(stage => {
                                const count = stageCounts[stage.key] || 0;
                                const isActive = activeStage === stage.key;

                                return (
                                    <button
                                        key={stage.key}
                                        onClick={() => setActiveStage(stage.key)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all border`}
                                        style={isActive ? {
                                            backgroundColor: stage.bg,
                                            borderColor: `rgba(var(--hp-accent-rgb), 0.2)`,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        } : {
                                            backgroundColor: 'transparent',
                                            borderColor: 'transparent',
                                        }}
                                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--hp-surface-alt)'; }}
                                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg opacity-90">{stage.icon}</span>
                                            <span className="text-[.9rem] font-bold" style={{ color: isActive ? stage.accent : 'var(--hp-text-sub)' }}>
                                                {stage.label}
                                            </span>
                                        </div>
                                        <span
                                            className="text-[10px] font-bold min-w-[24px] h-[24px] rounded-full flex items-center justify-center border"
                                            style={isActive ? {
                                                backgroundColor: stage.accent,
                                                color: '#fff',
                                                borderColor: 'transparent'
                                            } : {
                                                backgroundColor: 'var(--hp-surface-alt)',
                                                color: 'var(--hp-muted)',
                                                borderColor: 'var(--hp-border)'
                                            }}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Stage Divider */}
                        <div className="border-t my-6" style={{ borderColor: 'var(--hp-border)' }} />

                        {/* Pipeline Funnel Visual */}
                        <div className="px-2">
                            <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-widest mb-4">
                                Hiring Funnel
                            </h4>
                            {PIPELINE_STAGES.filter(s => s.key !== 'ALL').map(stage => {
                                const count = stageCounts[stage.key] || 0;
                                const pct = applications.length > 0 ? (count / applications.length) * 100 : 0;
                                return (
                                    <div key={stage.key} className="mb-3">
                                        <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                                            <span style={{ color: 'var(--hp-muted)' }}>{stage.label}</span>
                                            <span style={{ color: stage.accent }}>{count}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hp-surface-alt)' }}>
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: stage.accent }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Application Cards ── */}
                <div className="flex-1 min-w-0">
                    {loadingApps && (
                        <div className="hp-card p-12 text-center flex flex-col items-center">
                            <svg className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="font-bold text-[var(--hp-muted)]">Loading applications...</p>
                        </div>
                    )}

                    {!loadingApps && applications.length === 0 && (
                        <div className="hp-card p-16 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                <svg className="w-8 h-8" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-[var(--hp-text)] font-bold text-lg tracking-tight mb-1">
                                No Applications Yet
                            </p>
                            <p className="text-[var(--hp-muted)] text-sm">
                                Candidates haven't applied to this job posting yet.
                            </p>
                        </div>
                    )}

                    {!loadingApps && applications.length > 0 && (
                        <>
                            {/* Active Stage Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-1 gap-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight flex items-center gap-2">
                                        <span className="text-2xl">{PIPELINE_STAGES.find(s => s.key === activeStage)?.icon}</span>
                                        {PIPELINE_STAGES.find(s => s.key === activeStage)?.label}
                                    </h3>
                                    <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', borderColor: 'var(--hp-border)' }}>
                                        {filteredApps.length} Candidate{filteredApps.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    {/* Search Input */}
                                    <div className="relative group">
                                        <input 
                                            type="text"
                                            placeholder="Search candidates..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[var(--hp-accent)]/20"
                                            style={{ 
                                                background: 'var(--hp-surface-alt)', 
                                                borderColor: 'var(--hp-border)',
                                                color: 'var(--hp-text)'
                                            }}
                                        />
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hp-muted)] group-focus-within:text-[var(--hp-accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {filteredApps.length > 0 && (
                                        <button
                                            onClick={handleSmartSelect}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border group"
                                            style={{ 
                                                color: 'var(--hp-accent)',
                                                background: 'rgba(var(--hp-accent-rgb), 0.08)',
                                                borderColor: 'rgba(var(--hp-accent-rgb), 0.2)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.15)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.08)'}
                                        >
                                            <span className="group-hover:scale-125 transition-transform">✨</span>
                                            Select Page
                                        </button>
                                    )}
                                </div>
                            </div>

                            {filteredApps.length === 0 ? (
                                <div className="hp-card p-12 text-center border-dashed">
                                    <div className="text-5xl mb-4 opacity-40 grayscale">
                                        {PIPELINE_STAGES.find(s => s.key === activeStage)?.icon}
                                    </div>
                                    <p className="text-[var(--hp-muted)] font-bold">
                                        No candidates in this stage yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {filteredApps.map((app) => (
                                            <ApplicationCard
                                                key={app.id}
                                                app={app}
                                                selectedJob={selectedJob}
                                                selectedApp={selectedApp}
                                                setSelectedApp={setSelectedApp}
                                                selectedIds={selectedIds}
                                                toggleSelect={toggleSelect}
                                                handleUpdateStatus={handleUpdateStatus}
                                                updatingId={updatingId}
                                                statusStyles={statusStyles}
                                                statusIcons={statusIcons}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bulk Actions Floating Toolbar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] border px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[400px]"
                        style={{
                            background: 'rgba(var(--hp-nav-bg), 0.85)',
                            backdropFilter: 'blur(20px)',
                            borderColor: 'var(--hp-border)',
                            color: 'var(--hp-text)'
                        }}
                    >
                        <div className="flex items-center gap-3 border-r pr-6" style={{ borderColor: 'var(--hp-border)' }}>
                            <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg" style={{ background: 'var(--hp-accent)' }}>
                                {selectedIds.size}
                            </span>
                            <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--hp-muted)' }}>Selected</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdate('SHORTLISTED')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
                                style={{ background: 'var(--hp-accent)', color: '#fff', boxShadow: '0 4px 15px rgba(var(--hp-accent-rgb), 0.3)' }}
                            >
                                Shortlist
                            </button>
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => handleBulkUpdate('REJECTED')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
                                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                                Reject
                            </button>
                            <button
                                disabled={isBulkUpdating}
                                onClick={() => setSelectedIds(new Set())}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                style={{ color: 'var(--hp-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--hp-surface-alt)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Cancel
                            </button>
                        </div>
                        {isBulkUpdating && (
                            <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-sm font-bold tracking-widest uppercase z-10" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff' }}>
                                <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Updating...
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}