import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonList } from '../Skeleton';

const statusConfig = {
    SCHEDULED: { icon: '⏳', label: 'Scheduled', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
    CONFIRMED: { icon: '✅', label: 'Confirmed', color: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb),0.1)', border: 'rgba(var(--hp-accent-rgb),0.2)' },
    COMPLETED: { icon: '🏁', label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
    CANCELLED: { icon: '❌', label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

export default function InterviewsPage() {
    const { user } = useAuthStore();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInterviews();
    }, [user]);

    const fetchInterviews = async () => {
        setLoading(true);
        try {
            const res = user?.role === 'EMPLOYER'
                ? await interviewAPI.getByInterviewer()
                : await interviewAPI.getByCandidate();
            setInterviews(Array.isArray(res.data) ? res.data.reverse() : []);
        } catch (err) {
            console.error('Failed to fetch interviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (id) => {
        try {
            await interviewAPI.confirm(id);
            setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: 'CONFIRMED' } : i));
            if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'CONFIRMED' }));
        } catch (err) {
            alert('Failed to confirm interview.');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this interview?')) return;
        try {
            await interviewAPI.cancel(id);
            setInterviews(prev => prev.map(i => i.id === id ? { ...i, status: 'CANCELLED' } : i));
            if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'CANCELLED' }));
        } catch (err) {
            alert('Failed to cancel interview.');
        }
    };

    const filteredInterviews = useMemo(() => {
        return interviews.filter(i => {
            const matchesSearch =
                (i.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (i.candidateName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (i.interviewerName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

            let matchesFilter = true;
            if (filter === 'upcoming') matchesFilter = i.status === 'SCHEDULED' || i.status === 'CONFIRMED';
            else if (filter === 'past') matchesFilter = i.status === 'COMPLETED' || i.status === 'CANCELLED';
            else if (filter !== 'all') matchesFilter = i.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [interviews, searchQuery, filter]);

    const stats = {
        total: interviews.length,
        upcoming: interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'CONFIRMED').length,
        completed: interviews.filter(i => i.status === 'COMPLETED').length,
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 1024 : true;

    return (
        <div className="relative overflow-hidden min-h-[80vh] z-10 pb-20">
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all .25s; }
                .hp-card:hover { border-color: rgba(var(--hp-accent-rgb), 0.35); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.15); }
                
                .hp-input { width: 100%; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); border-radius: 12px; padding: 14px 16px 14px 44px; font-size: 0.9rem; transition: all 0.2s; outline: none; }
                .hp-input:focus { border-color: rgba(var(--hp-accent-rgb), 0.5); background: var(--hp-surface); box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1); }
                
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), .35); }
                .hp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover:not(:disabled) { background: rgba(var(--hp-accent-rgb), .1); border-color: rgba(var(--hp-accent-rgb), .3); color: var(--hp-accent); }
                
                .hp-btn-danger { display: inline-flex; align-items: center; justify-content: center; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); }

                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .sheet-scroll::-webkit-scrollbar { width: 5px; }
                .sheet-scroll::-webkit-scrollbar-track { background: transparent; }
                .sheet-scroll::-webkit-scrollbar-thumb { background: var(--hp-border); border-radius: 10px; }
                .sheet-scroll::-webkit-scrollbar-thumb:hover { background: var(--hp-muted); }
            `}</style>

            {/* Parallax Background */}
            <motion.div
                animate={{
                    scale: selected && isDesktop ? 0.98 : 1,
                    filter: selected && isDesktop ? 'blur(2px)' : 'blur(0px)',
                    opacity: selected && isDesktop ? 0.7 : 1
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-7xl mx-auto px-4 sm:px-6"
            >
                {/* Header & Stats */}
                <div className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight mb-2">
                            Interviews
                        </h2>
                        <p className="text-[var(--hp-muted)] font-medium text-sm">Manage your upcoming schedules and past sessions.</p>
                    </div>

                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                        {[
                            { label: 'Total', value: stats.total, color: 'var(--hp-text)' },
                            { label: 'Upcoming', value: stats.upcoming, color: 'var(--hp-accent)' },
                            { label: 'Past', value: stats.completed, color: 'var(--hp-muted)' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] p-4 rounded-2xl min-w-[110px] relative overflow-hidden">
                                <p className="text-[10px] uppercase font-bold text-[var(--hp-muted)] tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group max-w-md">
                        <input
                            type="text"
                            placeholder="Search title, interviewer, or candidate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="hp-input"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--hp-muted)] group-focus-within:text-[var(--hp-accent)] transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center">
                        {['all', 'upcoming', 'past', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((k) => (
                            <button
                                key={k}
                                onClick={() => setFilter(k)}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border"
                                style={filter === k ? {
                                    background: 'rgba(var(--hp-accent-rgb), 0.1)',
                                    color: 'var(--hp-accent)',
                                    borderColor: 'rgba(var(--hp-accent-rgb), 0.3)'
                                } : {
                                    background: 'var(--hp-surface-alt)',
                                    color: 'var(--hp-muted)',
                                    borderColor: 'var(--hp-border)'
                                }}
                            >
                                {k.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && <SkeletonList count={4} />}

                {!loading && filteredInterviews.length === 0 && (
                    <div className="hp-card p-16 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                            <svg className="w-8 h-8" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-[var(--hp-text)] font-bold text-lg mb-1">No Interviews Found</p>
                        <p className="text-[var(--hp-muted)] text-sm">There are no interviews matching your current filters.</p>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredInterviews.map((i) => {
                        const config = statusConfig[i.status] || statusConfig.SCHEDULED;
                        return (
                            <motion.div
                                key={i.id} layout
                                onClick={() => setSelected(i)}
                                className="hp-card p-6 cursor-pointer flex flex-col h-full"
                                style={selected?.id === i.id ? { borderColor: 'var(--hp-accent)', boxShadow: '0 8px 30px rgba(var(--hp-accent-rgb), .15)' } : {}}
                            >
                                <div className="flex justify-between items-start mb-5">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)' }}>
                                        <svg className="w-6 h-6" style={{ color: 'var(--hp-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div
                                        className="text-[10px] font-bold px-3 py-1.5 rounded-full border tracking-wider uppercase"
                                        style={{ color: config.color, backgroundColor: config.bg, borderColor: config.border }}
                                    >
                                        {config.label}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-auto pb-6">
                                    <h3 className="font-bold text-[1.1rem] text-[var(--hp-text)] leading-snug line-clamp-2">
                                        {i.title}
                                    </h3>
                                    <p className="text-[var(--hp-muted)] text-sm font-medium mt-1">
                                        {user?.role === 'EMPLOYER' ? 'Candidate: ' : 'Interviewer: '}
                                        <span style={{ color: 'var(--hp-text)' }}>
                                            {user?.role === 'EMPLOYER'
                                                ? (i.candidateName || i.candidate?.firstName + ' ' + i.candidate?.lastName)
                                                : (i.interviewerName || i.interviewer?.firstName + ' ' + i.interviewer?.lastName)}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs font-medium pt-4 border-t" style={{ borderColor: 'var(--hp-border)', color: 'var(--hp-muted)' }}>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {formatDateTime(i.scheduledAt)}
                                    </span>
                                    <span>{i.durationMinutes}m</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Detail Sheet (Slide out from right on desktop, bottom on mobile) */}
            <AnimatePresence>
                {selected && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className="fixed inset-0 z-[100]"
                            style={{ background: 'var(--hp-modal-overlay, rgba(0,0,0,0.5))', backdropFilter: 'blur(4px)' }}
                        />

                        <motion.div
                            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
                            animate={isDesktop ? { x: 0 } : { y: 0 }}
                            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }}
                            className={`
                                fixed z-[110] shadow-2xl flex flex-col overflow-hidden
                                ${isDesktop
                                    ? 'top-0 right-0 w-[450px] h-full border-l'
                                    : 'bottom-0 left-0 w-full h-[85vh] rounded-t-[24px] border-t'}
                            `}
                            style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(20px)', borderColor: 'var(--hp-border)' }}
                        >
                            {!isDesktop && <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full" style={{ background: 'var(--hp-border)' }} />}

                            {/* Header */}
                            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-card)' }}>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--hp-text)] tracking-tight mb-1">
                                        Interview Details
                                    </h2>
                                    <p className="text-[var(--hp-accent)] font-medium text-sm">
                                        {selected.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 sheet-scroll pb-32">
                                {/* Status Box */}
                                <div className="p-5 rounded-2xl border flex justify-between items-center" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--hp-muted)] uppercase mb-2 tracking-wider">Status</p>
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border`} style={{
                                            color: (statusConfig[selected.status] || statusConfig.SCHEDULED).color,
                                            backgroundColor: (statusConfig[selected.status] || statusConfig.SCHEDULED).bg,
                                            borderColor: (statusConfig[selected.status] || statusConfig.SCHEDULED).border
                                        }}>
                                            {selected.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[var(--hp-muted)] uppercase mb-2 tracking-wider">Duration</p>
                                        <p className="text-sm font-bold text-[var(--hp-text)]">{selected.durationMinutes} Minutes</p>
                                    </div>
                                </div>

                                {/* Schedule Context */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider mb-3">Date & Time</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'rgba(var(--hp-accent2-rgb), 0.1)', color: 'var(--hp-accent2)' }}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-lg font-bold text-[var(--hp-text)] tracking-tight">
                                            {formatDateTime(selected.scheduledAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Participant Overview */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider mb-3">Participant Info</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                                            {(user?.role === 'EMPLOYER' ? (selected.candidateName || 'C') : (selected.interviewerName || 'I'))[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider mb-0.5">{user?.role === 'EMPLOYER' ? 'Candidate' : 'Interviewer'}</p>
                                            <p className="text-base font-bold text-[var(--hp-text)]">
                                                {user?.role === 'EMPLOYER'
                                                    ? (selected.candidateName || selected.candidate?.firstName + ' ' + selected.candidate?.lastName)
                                                    : (selected.interviewerName || selected.interviewer?.firstName + ' ' + selected.interviewer?.lastName)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meeting Link */}
                                {selected.meetingLink && (
                                    <div className="p-6 rounded-2xl border relative overflow-hidden" style={{ background: 'rgba(var(--hp-accent-rgb), 0.05)', borderColor: 'rgba(var(--hp-accent-rgb), 0.2)' }}>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--hp-accent)' }}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            Video Meeting Link
                                        </h4>
                                        <div className="bg-[var(--hp-card)] p-3 rounded-lg border mb-4 font-mono text-xs break-all" style={{ borderColor: 'var(--hp-border)', color: 'var(--hp-text-sub)' }}>
                                            {selected.meetingLink}
                                        </div>
                                        <a
                                            href={selected.meetingLink} target="_blank" rel="noreferrer"
                                            className="hp-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                                        >
                                            Join Meeting
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    </div>
                                )}

                                {/* Location Details */}
                                {selected.location && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase mb-3 tracking-wider">Location</h4>
                                        <p className="text-sm font-medium text-[var(--hp-text)] flex items-center gap-2 p-4 rounded-xl border" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                            <svg className="w-5 h-5" style={{ color: 'var(--hp-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {selected.location}
                                        </p>
                                    </div>
                                )}

                                {/* Session Description */}
                                {selected.description && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase mb-3 tracking-wider">Description</h4>
                                        <div className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-line" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)', color: 'var(--hp-text-sub)' }}>
                                            {selected.description}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Log */}
                                {selected.feedback && (
                                    <div className="p-5 rounded-xl border" style={{ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.2)' }}>
                                        <p className="text-[10px] font-bold text-[#34d399] uppercase mb-3 tracking-wider">Post-Interview Feedback</p>
                                        <div className="text-sm text-[var(--hp-text)] leading-relaxed mb-3 italic">
                                            "{selected.feedback}"
                                        </div>
                                        {selected.rating && (
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className="w-4 h-4" fill={i < selected.rating ? "currentColor" : "none"} stroke={i < selected.rating ? "currentColor" : "var(--hp-border)"} viewBox="0 0 24 24" style={{ color: i < selected.rating ? '#fbbf24' : 'inherit' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer Actions */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 border-t backdrop-blur-xl" style={{ background: 'rgba(var(--hp-card-rgb), 0.85)', borderColor: 'var(--hp-border)' }}>
                                <div className="flex gap-3">
                                    {user?.role === 'EMPLOYER' && selected.status === 'SCHEDULED' && (
                                        <button
                                            onClick={() => handleConfirm(selected.id)}
                                            className="hp-btn-primary flex-1 py-3 text-sm"
                                        >
                                            Confirm Interview
                                        </button>
                                    )}

                                    {(selected.status === 'SCHEDULED' || selected.status === 'CONFIRMED') && (
                                        <button
                                            onClick={() => handleCancel(selected.id)}
                                            className="hp-btn-danger flex-1 py-3 text-sm"
                                        >
                                            Cancel Interview
                                        </button>
                                    )}

                                    {selected.status === 'COMPLETED' && (
                                        <button
                                            className="hp-btn-ghost flex-1 py-3 text-sm"
                                            onClick={() => setSelected(null)}
                                        >
                                            Close Details
                                        </button>
                                    )}

                                    {/* Default close if no other actions exist */}
                                    {selected.status === 'CANCELLED' && (
                                        <button
                                            className="hp-btn-ghost flex-1 py-3 text-sm"
                                            onClick={() => setSelected(null)}
                                        >
                                            Close Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}