import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applicationAPI, quizAPI, resumeAnalysisAPI, resolvePublicUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonList } from '../Skeleton';
import QuizTakePage from '../Quiz/QuizTakePage';
import ApplicationFilter from './ApplicationFilter';
import ApplicationDetailSheet from './ApplicationDetailSheet';
import CompanyAvatar from '../CompanyAvatar';
import { formatDate } from '../../utils/formatters';

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

                {!loading && error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm mb-6">
                        {error}
                    </div>
                )}

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
                                    <CompanyAvatar job={app.job} size="lg" />
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
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1">📍 {app.job?.location}</span>
                                        <span>{formatDate(app.appliedAt)}</span>
                                    </div>
                                    {/* Minimalist assessment indicator */}
                                    {app.status !== 'REJECTED' && (
                                        <div className="flex flex-col items-end">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                                {app.quizResult ? `${Math.round((app.quizResult.score / app.quizResult.total) * 100)}%` : '??'}
                                            </div>
                                        </div>
                                    )}
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
                    <ApplicationDetailSheet 
                        selected={selected}
                        setSelected={setSelected}
                        isDesktop={isDesktop}
                        states={states}
                        matchAnalysis={matchAnalysis}
                        quizInfo={quizInfo}
                        setShowQuizModal={setShowQuizModal}
                        handleOfferAction={handleOfferAction}
                        handleWithdraw={handleWithdraw}
                        withdrawing={withdrawing}
                    />
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
