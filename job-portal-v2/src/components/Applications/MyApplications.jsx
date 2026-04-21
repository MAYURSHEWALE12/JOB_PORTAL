import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationAPI, quizAPI, resumeAnalysisAPI, API_BASE_URL, resolvePublicUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonList, Skeleton } from '../Skeleton';
import QuizTakePage from '../Quiz/QuizTakePage';
import ApplicationFilter from './ApplicationFilter';



const statusConfig = {
    PENDING:     { icon: '⏳', label: 'Pending',     color: 'var(--color-warning)',   bg: 'rgba(251,146,60,0.1)' },
    REVIEWED:    { icon: '👀', label: 'Reviewed',    color: 'var(--color-secondary)', bg: 'rgba(167,139,250,0.1)' },
    SHORTLISTED: { icon: '⭐', label: 'Shortlisted', color: 'var(--color-primary)',   bg: 'rgba(45,212,191,0.1)' },
    INTERVIEWING:{ icon: '📅', label: 'Interviewing', color: '#3b82f6',              bg: 'rgba(59,130,246,0.1)' },
    OFFERED:     { icon: '📜', label: 'Offered',     color: 'var(--color-success)',   bg: 'rgba(74,222,128,0.1)' },
    ACCEPTED:    { icon: '🎉', label: 'Accepted',    color: 'var(--color-success)',   bg: 'rgba(74,222,128,0.1)' },
    REJECTED:    { icon: '❌', label: 'Rejected',    color: 'var(--color-error)',     bg: 'rgba(248,113,113,0.1)' },
    WITHDRAWN:   { icon: '↩️', label: 'Withdrawn',   color: 'var(--color-text-muted)',bg: 'rgba(156,163,175,0.1)' },
};

export default function MyApplications() {
    const { user } = useAuthStore();
    const states = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED'];

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [withdrawing, setWithdrawing]   = useState(null);
    const [offerSuccessAnim, setOfferSuccessAnim] = useState(null);
    const [selected, setSelected]         = useState(null);
    
    // UI Local State
    const [searchQuery, setSearchQuery]   = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [quizInfo, setQuizInfo]         = useState({ available: false, result: null, loading: false });
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [matchAnalysis, setMatchAnalysis] = useState({ data: null, loading: false });

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        if (selected) {
            checkQuizStatus(selected.job.id, selected.id);
            const rId = selected.resumeId || selected.selectedResume?.id || selected.resume?.id ;
            if (rId) fetchAIScore(selected.job.id, rId);
        } else {
            setQuizInfo({ available: false, result: null, loading: false });
            setMatchAnalysis({ data: null, loading: false });
        }
    }, [selected]);

    const fetchApplications = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await applicationAPI.getMyApplications(user.id);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const checkQuizStatus = async (jobId, applicationId) => {
        setQuizInfo(prev => ({ ...prev, loading: true }));
        try {
            const [quizRes, resultRes] = await Promise.allSettled([
                quizAPI.getByJob(jobId),
                quizAPI.getResults(applicationId)
            ]);
            const available = quizRes.status === 'fulfilled' && !!quizRes.value?.data;
            const result = resultRes.status === 'fulfilled' ? resultRes.value?.data : null;
            setQuizInfo({ available, result, loading: false });
        } catch (e) {
            setQuizInfo({ available: false, result: null, loading: false });
        }
    };

    const fetchAIScore = async (jobId, resumeId) => {
        if (!resumeId || !jobId) return;
        setMatchAnalysis(prev => ({ ...prev, loading: true }));
        try {
            const res = await resumeAnalysisAPI.getMatchAnalysis(resumeId, jobId);
            setMatchAnalysis({ data: res.data, loading: false });
        } catch (err) {
            setMatchAnalysis({ data: null, loading: false });
        }
    };

    const handleWithdraw = async (applicationId) => {
        if (!window.confirm('Are you sure you want to withdraw this application?')) return;
        setWithdrawing(applicationId);
        try {
            await applicationAPI.withdraw(applicationId, user.id);
            setApplications(prev =>
                prev.map(app => app.id === applicationId ? { ...app, status: 'WITHDRAWN' } : app)
            );
            if (selected?.id === applicationId) setSelected(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to withdraw application.');
        } finally {
            setWithdrawing(null);
        }
    };

    const handleOfferAction = async (applicationId, action) => {
        setWithdrawing(applicationId);
        try {
            if (action === 'accept') {
                await applicationAPI.acceptOffer(applicationId);
                setOfferSuccessAnim('ACCEPTED');
                setTimeout(() => {
                    setOfferSuccessAnim(null);
                    updateAppLocally(applicationId, 'ACCEPTED');
                }, 3500);
            } else {
                if(!window.confirm('Are you sure you want to decline this job offer?')) {
                    setWithdrawing(null);
                    return;
                }
                await applicationAPI.rejectOffer(applicationId);
                setOfferSuccessAnim('REJECTED');
                setTimeout(() => {
                    setOfferSuccessAnim(null);
                    updateAppLocally(applicationId, 'REJECTED');
                }, 2500);
            }
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} offer.`);
            setWithdrawing(null);
        }
    };

    const updateAppLocally = (id, status) => {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = 
                (app.job?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (app.job?.employer?.companyProfile?.companyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (app.job?.employer?.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [applications, searchQuery, statusFilter]);

    const stats = {
        total:       applications.length,
        pending:     applications.filter(a => a.status === 'PENDING').length,
        interviews:  applications.filter(a => a.status === 'INTERVIEWING').length,
        offers:      applications.filter(a => a.status === 'OFFERED').length,
    };

    const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 1024 : true;

    const renderLogo = (appOrJob, sizeClass = "w-14 h-14") => {
        const job = appOrJob.job || appOrJob;
        let logoUrl = resolvePublicUrl(job.companyLogo || job.employer?.companyProfile?.logoUrl || job.employer?.profileImageUrl);

        return (
            <div className={`${sizeClass} rounded-2xl bg-[var(--color-page)] border border-[var(--color-border)] flex items-center justify-center text-xl font-black text-[var(--color-primary)] shadow-inner overflow-hidden`}>
                {logoUrl ? (
                    <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <span>{(job.employer?.companyProfile?.companyName || job.employer?.firstName)?.[0].toUpperCase() || '💼'}</span>
                )}
            </div>
        );
    };

    const particles = [...Array(15)].map((_, i) => ({
        size: Math.random() * 5 + 1,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 12,
        delay: Math.random() * 10,
        color: i % 3 === 0 ? 'var(--color-primary)' : i % 3 === 1 ? 'var(--color-secondary)' : '#ffffff',
    }));

    return (
        <div className="relative overflow-hidden min-h-[80vh]">
            <div id="particles">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            left: p.left,
                            backgroundColor: p.color,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                            opacity: Math.random() * 0.3 + 0.05,
                        }}
                    />
                ))}
            </div>
            {/* Parallax Background Wrapper */}
            <motion.div
                animate={{ 
                    scale: selected ? 0.98 : 1,
                    filter: selected ? 'brightness(0.7) blur(2px)' : 'brightness(1) blur(0px)',
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="content-fade-in max-w-7xl mx-auto px-4"
            >
                {/* Header Section */}
                <div className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-serif font-black text-[var(--color-text)] tracking-tight mb-2">
                            Master Portal
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-1 bg-[var(--color-primary)] rounded-full"></span>
                            <p className="text-[var(--color-text-mid)] font-medium text-sm">Real-time status tracking & recruitment insights.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                        {[
                            { label: 'Total', value: stats.total, color: 'var(--color-primary)' },
                            { label: 'Active', value: stats.pending + stats.interviews, color: 'var(--color-warning)' },
                            { label: 'Offers', value: stats.offers, color: 'var(--color-success)' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-[var(--color-card)] border border-[var(--color-border-subtle)] p-4 rounded-2xl min-w-[120px] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-white/5 rotate-45 border-r border-t border-[var(--color-border-subtle)] group-hover:scale-110 transition-transform"></div>
                                <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black text-[var(--color-text)]" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <ApplicationFilter 
                    statusFilter={statusFilter} 
                    setStatusFilter={setStatusFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {loading && <SkeletonList count={6} />}

                {!loading && applications.length === 0 && (
                    <div className="card p-20 text-center bg-[var(--color-input)]/30 border-dashed">
                        <p className="text-[var(--color-text-muted)] text-lg">No active applications currently.</p>
                        <button className="btn-primary mt-6 px-10">Start Job Search</button>
                    </div>
                )}

                {/* Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredApplications.map((app) => {
                        const config = statusConfig[app.status] || statusConfig.PENDING;
                        const isSelected = selected?.id === app.id;
                        
                        return (
                            <motion.div
                                key={app.id}
                                layout
                                onClick={() => setSelected(app)}
                                className={`
                                    card p-6 cursor-pointer relative transition-all group active:scale-95
                                    ${isSelected ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-page)]' : 'hover:border-[var(--color-primary)]/40'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    {renderLogo(app, "w-14 h-14")}
                                    <div 
                                        className="text-[10px] font-black px-3 py-1 rounded-full border tracking-tighter uppercase"
                                        style={{ color: config.color, backgroundColor: config.bg, borderColor: `${config.color}30` }}
                                    >
                                        {config.label}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-6">
                                    <h3 className="font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-tight line-clamp-1">
                                        {app.job?.title}
                                    </h3>
                                    <p className="text-[var(--color-text-mid)] text-xs font-semibold">
                                        {app.job?.employer?.companyProfile?.companyName || `${app.job?.employer?.firstName} ${app.job?.employer?.lastName}`}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono border-t border-[var(--color-divider)] pt-4">
                                    <span className="flex items-center gap-1">📍 {app.job?.location}</span>
                                    <span>{formatDate(app.appliedAt)}</span>
                                </div>

                                {app.status === 'OFFERED' && (
                                    <div className="absolute top-0 right-0 p-1">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Side/Bottom Portal Sheet */}
            <AnimatePresence>
                {selected && (
                    <>
                        {/* Dim Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelected(null)}
                            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]"
                        />

                        {/* Interactive Sheet */}
                        <motion.div
                            initial={isDesktop ? { x: '100%' } : { y: '100%' }}
                            animate={isDesktop ? { x: 0 } : { y: 0 }}
                            exit={isDesktop ? { x: '100%' } : { y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }}
                            className={`
                                fixed z-[110] bg-[var(--color-card)] shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col
                                ${isDesktop 
                                    ? 'top-0 right-0 w-[480px] h-full border-l border-[var(--color-border)]' 
                                    : 'bottom-0 left-0 w-full h-[85vh] rounded-t-[32px] border-t border-[var(--color-border)]'}
                            `}
                        >
                            {/* Sheet Handle (Mobile) */}
                            {!isDesktop && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[var(--color-divider)] rounded-full"></div>
                            )}

                            {/* Sheet Header */}
                            <div className="p-8 pb-6 flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    {renderLogo(selected, "w-16 h-16")}
                                    <div>
                                        <h2 className="text-2xl font-serif font-black text-[var(--color-text)] leading-none mb-2">
                                            Portal Details
                                        </h2>
                                        <p className="text-[var(--color-primary)] font-bold text-sm tracking-tight">
                                            {selected.job?.title}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="p-3 bg-[var(--color-page)] rounded-full border border-[var(--color-border)] hover:bg-[var(--color-hover-bg)] transition-colors"
                                >
                                    <svg className="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-10 scrollbar-hide">
                                {/* Linear Process Stepper */}
                                <div className="relative pt-4 pb-2">
                                    <div className="flex justify-between items-center relative z-10">
                                        {['PENDING', 'SHORTLISTED', 'OFFERED', 'ACCEPTED'].map((status, i) => {
                                            const currentIdx = states.indexOf(selected.status === 'REJECTED' ? 'PENDING' : selected.status);
                                            const targetIdx = states.indexOf(status);
                                            const isActive = targetIdx <= currentIdx;
                                            const isItemSelected = targetIdx === currentIdx || (status === 'PENDING' && selected.status === 'REVIEWED');
                                            
                                            return (
                                                <div key={status} className="flex flex-col items-center gap-3">
                                                    <div 
                                                        className={`w-4 h-4 rounded-full transition-all duration-500 border-2
                                                            ${isItemSelected ? 'bg-[var(--color-primary)] scale-150 border-[var(--color-primary)] shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 
                                                              isActive ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-transparent border-[var(--color-divider)]'}`}
                                                    />
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="absolute top-[23px] left-6 right-6 h-[1.5px] bg-[var(--color-divider)] -z-0">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (states.indexOf(selected.status === 'REJECTED' ? 'PENDING' : selected.status) / 5) * 100)}%` }}
                                            className="h-full bg-[var(--color-primary)]"
                                        />
                                    </div>
                                </div>


                                {/* AI Match Reality Card */}
                                {matchAnalysis.data && (
                                    <div className="bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent p-6 rounded-[28px] border border-[var(--color-primary)]/20">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-widest">Reality Check</h4>
                                            <span className="text-2xl font-black text-[var(--color-text)]">{matchAnalysis.data.score}%</span>
                                        </div>
                                        <div className="h-1.5 bg-[var(--color-page)] rounded-full overflow-hidden mb-4">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${matchAnalysis.data.score}%` }}
                                                className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                                            />
                                        </div>
                                        <p className="text-[10px] text-[var(--color-text-mid)] font-medium leading-relaxed">
                                            Your profile aligns with <span className="text-[var(--color-primary)] font-bold">{matchAnalysis.data.score}%</span> of the employer requirements for this role.
                                        </p>
                                    </div>
                                )}

                                {/* Assessment Section */}
                                {(quizInfo.available || quizInfo.result) && (
                                    <div className="bg-[var(--color-primary)]/[0.03] border border-[var(--color-border-subtle)] p-6 rounded-[28px] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <svg className="w-12 h-12 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-widest mb-1">Expert Assessment</h4>
                                                <p className="text-sm font-bold text-[var(--color-text)]">
                                                    {quizInfo.result ? 'Results Certified' : 'Skill Validation Required'}
                                                </p>
                                            </div>
                                            {quizInfo.result && (
                                                <div className="bg-[var(--color-primary)] text-black px-3 py-1 rounded-full text-[10px] font-black tracking-tighter">
                                                    {quizInfo.result.correctAnswers}/{quizInfo.result.totalQuestions}
                                                </div>
                                            )}
                                        </div>

                                        {quizInfo.result ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-mid)]">
                                                    <span className={quizInfo.result.passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
                                                        {quizInfo.result.passed ? '✅ Verified Proficient' : '❌ Target Score Not Met'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(quizInfo.result.completedAt)}</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed italic">
                                                    "This result has been pinned to your profile for current and future opportunities."
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs text-[var(--color-text-mid)] leading-relaxed">
                                                    Validate your technical competence for this specific role via our dynamic evaluation module.
                                                </p>
                                                <button 
                                                    onClick={() => setShowQuizModal(true)}
                                                    className="w-full py-4 bg-white border border-[var(--color-primary)] text-[var(--color-primary)] font-black text-xs rounded-2xl hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm"
                                                >
                                                    BEGIN EVALUATION ↗
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Context Boxes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[var(--color-page)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
                                        <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase mb-2">Location</p>
                                        <p className="text-xs font-bold text-[var(--color-text)]">{selected.job?.location}</p>
                                    </div>
                                    <div className="bg-[var(--color-page)] p-5 rounded-2xl border border-[var(--color-border-subtle)]">
                                        <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase mb-2">Salary Estimate</p>
                                        <p className="text-xs font-bold text-[var(--color-text)]">₹{Number(selected.job?.salaryMin).toLocaleString()}/yr</p>
                                    </div>
                                </div>

                                {/* Recruitment Feed (Simplified) */}
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(45,212,191,1)]"></div>
                                            <div className="w-[1.5px] h-full bg-[var(--color-divider)] my-2"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase mb-1">Status Update</p>
                                            <p className="text-sm font-bold text-[var(--color-text)] mb-1">
                                                {selected.status === 'PENDING' ? 'Submission Received' : 
                                                 selected.status === 'SHORTLISTED' ? 'Added to Talent Pool' : 
                                                 selected.status === 'OFFERED' ? 'Contract Generated' : 'Activity Logged'}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-mid)] leading-relaxed">
                                                Everything looks optimal. Recruiters are currently reviewing the latest cohort.
                                            </p>
                                        </div>
                                    </div>

                                    {selected.feedback && (
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-blue-500 uppercase mb-1">Hiring Manager Note</p>
                                                <div className="p-4 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 text-xs text-[var(--color-text)] italic leading-relaxed">
                                                    "{selected.feedback}"
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Document View */}
                                <div className="pt-2">
                                    <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase mb-4 tracking-[0.2em]">Application Narrative</h4>
                                    <div className="p-5 rounded-3xl bg-[var(--color-page)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-mid)] leading-relaxed italic whitespace-pre-line shadow-inner min-h-[100px]">
                                        {selected.coverLetter || "Submission sent without an accompanying narrative."}
                                    </div>
                                </div>

                                {/* Offer Interface */}
                                {(selected.status === 'OFFERED' || selected.offerLetterContent) && (
                                    <div className="bg-[#0f0f0f] text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8">
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black font-black text-xl">!</div>
                                        </div>
                                        <h3 className="text-2xl font-black mb-4 pr-12">Congratulations!</h3>
                                        <p className="text-xs text-white/60 leading-relaxed mb-8">
                                            The employment agreement has been finalized. Review terms before digital confirmation.
                                        </p>
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-[11px] font-medium leading-loose text-white/80 mb-8 whitespace-pre-line max-h-40 overflow-y-auto">
                                            {selected.offerLetterContent || "Standard terms apply."}
                                        </div>
                                        {selected.status === 'OFFERED' && (
                                            <div className="flex gap-3">
                                                <button onClick={() => handleOfferAction(selected.id, 'accept')} className="flex-1 py-4 bg-[var(--color-primary)] text-black font-black text-xs rounded-2xl">Confirm ✨</button>
                                                <button onClick={() => handleOfferAction(selected.id, 'reject')} className="px-6 py-4 bg-white/10 text-white font-bold text-xs rounded-2xl">Decline</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Action Footer */}
                            <div className="p-8 bg-gradient-to-t from-[var(--color-card)] via-[var(--color-card)]/90 to-transparent border-t border-[var(--color-border-subtle)] backdrop-blur-md">
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('switchTab', { detail: 'messages' }));
                                            setSelected(null);
                                        }}
                                        className="btn-secondary h-14 w-16 p-0 flex items-center justify-center rounded-2xl"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </button>
                                    
                                    {selected.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleWithdraw(selected.id)}
                                            disabled={withdrawing === selected.id}
                                            className="btn-destructive flex-1 h-14 rounded-2xl font-black text-xs uppercase"
                                        >
                                            {withdrawing === selected.id ? '...' : 'Withdraw'}
                                        </button>
                                    )}
                                    
                                    <button 
                                        className="btn-primary flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
                                        onClick={() => setSelected(null)}
                                    >
                                        Close Portal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Assessment UI */}
            {showQuizModal && selected && (
                <QuizTakePage 
                    passedJobId={selected.job.id} 
                    passedApplicationId={selected.id} 
                    onClose={(newResult) => {
                        setShowQuizModal(false);
                        if (newResult) setQuizInfo(prev => ({ ...prev, result: newResult }));
                    }} 
                />
            )}

            {/* Decision Overlays */}
            <AnimatePresence>
                {offerSuccessAnim && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center p-12"
                        >
                            <div className="text-6xl mb-8 animate-bounce">{offerSuccessAnim === 'ACCEPTED' ? '🏆' : '📁'}</div>
                            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">
                                {offerSuccessAnim === 'ACCEPTED' ? 'System Confirmed' : 'Action Recorded'}
                            </h2>
                            <p className="text-var(--color-primary) font-mono tracking-widest text-sm">TRANSACTION SECURED • UPDATING DATABASE</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
