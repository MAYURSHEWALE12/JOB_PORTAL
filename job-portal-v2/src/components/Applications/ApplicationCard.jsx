import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAnalysisAPI, applicationAPI, resolvePublicUrl, API_BASE_URL } from '../../services/api';
import ScheduleInterviewModal from '../Interviews/ScheduleInterviewModal';
import CircularMatchScore from './CircularMatchScore';
import VertexIntelligenceModal from './VertexIntelligenceModal';
import ResumePreviewModal from './ResumePreviewModal';

export default function ApplicationCard({
    app,
    selectedJob,
    selectedApp,
    setSelectedApp,
    selectedIds,
    toggleSelect,
    handleUpdateStatus,
    updatingId,
    statusStyles,
    statusIcons
}) {
    const [matchData, setMatchData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    
    // Offer state
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerDetails, setOfferDetails] = useState({ salary: '', startDate: '', subject: '', offerContent: '' });
    const [sendingOffer, setSendingOffer] = useState(false);
    const [offerSuccessAnim, setOfferSuccessAnim] = useState(false);

    // Interview state
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showResumePreview, setShowResumePreview] = useState(false);

    const handleViewResume = (e) => {
        e.stopPropagation();
        if (!resumeId) return;
        setShowResumePreview(true);
    };

    const handleSendOffer = async (e) => {
        e.preventDefault();
        setSendingOffer(true);
        try {
            await applicationAPI.sendOffer(app.id, offerDetails);
            setOfferSuccessAnim(true);
            
            // Wait for animation to finish before updating UI
            setTimeout(() => {
                setOfferSuccessAnim(false);
                setShowOfferModal(false);
                handleUpdateStatus(app.id, 'OFFERED');
            }, 2500);
        } catch (err) {
            console.error("Failed to send offer:", err);
            alert("Failed to send offer letter. " + (err.response?.data?.error || ""));
            setSendingOffer(false);
        }
    };

    // Derive resumeId from the application payload.
    const resumeId = app.selectedResume?.id || app.resumeId;
    const jobId = selectedJob?.id;

    useEffect(() => {
        if (resumeId && jobId) {
            fetchMatchAnalysis();
        }
    }, [resumeId, jobId]);

    const fetchMatchAnalysis = async () => {
        try {
            const res = await resumeAnalysisAPI.getMatchAnalysis(resumeId, jobId);
            if (res.data) {
                setMatchData(res.data);
            }
        } catch (err) {
            // Ignore 404s (no analysis exists yet)
            if (err.response?.status !== 404) {
                console.error("Failed to fetch existing match analysis:", err);
            }
        }
    };

    const handleVerifyMatch = async (e) => {
        e.stopPropagation();
        if (!resumeId || !jobId) {
            alert("Resume or Job missing. Cannot verify match.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await resumeAnalysisAPI.analyzeMatch(resumeId, jobId);
            setMatchData(res.data);
            // Optionally open insights automatically on fresh manual verify
            setShowInsights(true);
        } catch (err) {
            console.error("Analysis Failed", err);
            alert("Failed to analyze resume match. Please check server logs.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "text-emerald-600 bg-emerald-100 border-emerald-200";
        if (score >= 60) return "text-amber-600 bg-amber-100 border-amber-200";
        return "text-rose-600 bg-rose-100 border-rose-200";
    };

    const handleDirectHire = async (e) => {
        e.stopPropagation();
        if (!window.confirm("⚡ Fast-Track Hire: Are you sure you want to officially hire this candidate immediately? A default offer letter will be logged automatically.")) {
            return;
        }

        try {
            await applicationAPI.directHire(app.id);
            // Re-use handleUpdateStatus logic to refresh UI
            if (handleUpdateStatus) {
                handleUpdateStatus(app.id, 'ACCEPTED');
            }
        } catch (err) {
            console.error("Direct Hire Failed:", err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Fast-track hire failed.';
            alert(errorMsg);
        }
    };

    const getNextStatuses = (current) => {
        if (current === 'REJECTED') return ['REVIEWED'];
        if (current === 'ACCEPTED' || current === 'WITHDRAWN') return [];

        const funnel = {
            PENDING: ['REVIEWED'],
            REVIEWED: ['SHORTLISTED'],
            SHORTLISTED: ['INTERVIEWING', 'OFFERED'],
            INTERVIEWING: ['OFFERED', 'SHORTLISTED'],
            OFFERED: ['ACCEPTED'],
        };

        const options = funnel[current] || [];
        return [...options, 'REJECTED'];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedApp(app)}
            className={`
                hp-card p-5 cursor-pointer relative group overflow-hidden
                ${selectedApp?.id === app.id ? 'border-[var(--hp-accent)]' : ''}
                ${selectedIds.has(app.id) ? 'bg-[var(--hp-surface-alt)]' : ''}
            `}
        >
            {/* Selection indicator line */}
            {selectedIds.has(app.id) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--hp-accent)] shadow-[0_0_10px_var(--hp-accent)]"></div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 ml-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold transition-transform group-hover:scale-105 overflow-hidden" 
                             style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-accent)' }}>
                            {app.jobSeeker?.profileImageUrl ? (
                                <img src={resolvePublicUrl(app.jobSeeker.profileImageUrl)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                `${app.jobSeeker?.firstName?.[0] || ''}${app.jobSeeker?.lastName?.[0] || ''}`
                            )}
                        </div>
                        {selectedIds.has(app.id) && (
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] shadow-lg border-2 border-[var(--hp-card)]"
                                style={{ background: 'var(--hp-accent)' }}
                            >
                                ✓
                            </motion.div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-[var(--hp-text)] group-hover:text-[var(--hp-accent)] transition-colors truncate">
                                {app.jobSeeker?.firstName} {app.jobSeeker?.lastName}
                            </h3>
                            {app.quizResult ? (
                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${
                                    app.quizResult.passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                    {app.quizResult.passed ? '✅ Passed' : '❌ Failed'}
                                </span>
                            ) : (
                                app.status === 'PENDING' && (
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border bg-amber-500/10 text-amber-500 border-amber-500/20">
                                        ⏳ Test Pending
                                    </span>
                                )
                            )}
                        </div>
                        <p className="text-[var(--hp-muted)] text-xs sm:text-sm truncate">{app.jobSeeker?.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-[var(--hp-muted)] text-[9px] sm:text-[10px] flex items-center gap-1.5 uppercase font-black tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--hp-accent)' }}></span>
                                {formatDate(app.appliedAt)}
                            </p>
                            {resumeId && (
                                <button
                                    onClick={handleViewResume}
                                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 hover:scale-105"
                                    style={{
                                        color: 'var(--hp-accent2)',
                                        background: 'rgba(var(--hp-accent2-rgb), 0.08)',
                                        borderColor: 'rgba(var(--hp-accent2-rgb), 0.2)'
                                    }}
                                    title={`View ${app.selectedResume?.name || 'Resume'}`}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {app.selectedResume?.name || 'Resume'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:border-l sm:pl-6 border-[var(--hp-border)]">
                    {/* Premium AI Score Indicator */}
                    {matchData ? (
                        <div 
                            onClick={(e) => { e.stopPropagation(); setShowInsights(true); }}
                            className="transition-transform hover:scale-110 flex-shrink-0"
                        >
                            <CircularMatchScore score={matchData.matchScore} size={window.innerWidth < 640 ? 44 : 54} />
                        </div>
                    ) : (
                        resumeId && (
                            <button
                                onClick={handleVerifyMatch}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{ 
                                    background: 'rgba(var(--hp-accent-rgb), 0.05)', 
                                    borderColor: 'rgba(var(--hp-accent-rgb), 0.2)',
                                    color: 'var(--hp-accent)' 
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.05)'}
                            >
                                {isAnalyzing ? "..." : "Verify AI"}
                            </button>
                        )
                    )}

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 ${statusStyles[app.status]}`}>
                            <span className="hidden sm:inline text-sm">{statusIcons[app.status]}</span> {app.status}
                        </span>
                    </div>
                </div>
            </div>

            {app.status !== 'WITHDRAWN' && app.status !== 'ACCEPTED' && (
                <div className="flex flex-wrap items-center gap-2 mt-5 ml-4">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {getNextStatuses(app.status).map(status => (
                            <button
                                key={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(app.id, status);
                                }}
                                disabled={updatingId === app.id}
                                className={`
                                    flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border
                                    ${status === 'REJECTED' 
                                        ? 'bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10' 
                                        : 'bg-[var(--hp-accent)]/5 text-[var(--hp-accent)] border-[var(--hp-accent)]/20 hover:bg-[var(--hp-accent)]/10'}
                                `}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--hp-border)] border-dashed">
                        {/* Show Schedule Interview Button if candidate is shortlisted or reviewed */}
                        {(app.status === 'SHORTLISTED' || app.status === 'REVIEWED') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInterviewModal(true);
                                }}
                                className="w-full sm:w-auto px-4 py-2 bg-[#1565C0] text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-sm hover:bg-[#0D47A1] transition-all flex items-center justify-center gap-2"
                            >
                                <span>📅</span> Schedule Interview
                            </button>
                        )}

                        {/* Show Official Offer Button only if candidate is in INTERVIEWING stage and has a COMPLETED interview */}
                        {(app.status === 'INTERVIEWING' && app.hasCompletedInterview) && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowOfferModal(true);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-[#4A7C59] text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-sm hover:bg-[#3d664a] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>✉️</span> Offer
                                </button>
                                <button
                                    onClick={handleDirectHire}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>⚡</span> Direct Hire
                                </button>
                            </div>
                        )}
                        
                        {app.status === 'INTERVIEWING' && !app.hasCompletedInterview && (
                            <div className="w-full sm:w-auto px-4 py-2 bg-[var(--hp-accent2)]/10 text-[var(--hp-accent2)] rounded-xl text-[10px] sm:text-xs font-bold border border-[var(--hp-accent2)]/20 flex items-center justify-center gap-2">
                                <span>📅</span> Interview Scheduled
                            </div>
                        )}

                        {app.status === 'OFFERED' && (
                            <div className="w-full sm:w-auto px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] sm:text-xs font-bold border border-amber-500/20 flex items-center justify-center gap-2">
                                <span>⏳</span> Offer Pending
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showInterviewModal && (
                    <ScheduleInterviewModal
                        application={app}
                        onClose={() => setShowInterviewModal(false)}
                        onScheduled={() => {
                            setShowInterviewModal(false);
                            handleUpdateStatus(app.id, 'INTERVIEWING');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Full Screen Offer Success Animation */}
            <AnimatePresence>
                {offerSuccessAnim && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'radial-gradient(ellipse at center, rgba(74,124,89,0.95) 0%, rgba(45,31,20,0.97) 100%)' }}
                    >
                        {/* Floating confetti particles */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ 
                                    opacity: 0, 
                                    y: 0, 
                                    x: (Math.random() - 0.5) * 100,
                                    scale: 0 
                                }}
                                animate={{ 
                                    opacity: [0, 1, 1, 0], 
                                    y: [0, -200 - Math.random() * 300],
                                    x: (Math.random() - 0.5) * 400,
                                    scale: [0, 1, 0.8],
                                    rotate: Math.random() * 720
                                }}
                                transition={{ 
                                    duration: 2 + Math.random(), 
                                    delay: 0.2 + Math.random() * 0.5,
                                    ease: 'easeOut' 
                                }}
                                className="absolute rounded-full"
                                style={{
                                    width: 6 + Math.random() * 10,
                                    height: 6 + Math.random() * 10,
                                    background: ['#C2651A', '#4A7C59', '#E8A66A', '#D4A574', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 6)],
                                    top: '55%',
                                    left: '50%',
                                }}
                            />
                        ))}

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
                            className="relative bg-[#FFFBF5] rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-[#EAD9C4]"
                            style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 0 60px rgba(194,101,26,0.15)' }}
                        >
                            {/* Animated checkmark circle */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2, bounce: 0.5 }}
                                className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #4A7C59 0%, #6B9B7A 100%)' }}
                            >
                                <motion.svg
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    width="36" height="36" viewBox="0 0 24 24" fill="none"
                                >
                                    <motion.path
                                        d="M5 13l4 4L19 7"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    />
                                </motion.svg>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="text-2xl font-serif font-bold text-[var(--color-text)] mb-2"
                            >
                                Offer Dispatched!
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 }}
                                className="text-[var(--color-text-muted)] text-sm leading-relaxed"
                            >
                                Your offer letter has been sent to <strong className="text-[var(--color-primary)]">{app.jobSeeker?.firstName} {app.jobSeeker?.lastName}</strong>. They'll be notified instantly.
                            </motion.p>

                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.7, duration: 1.5 }}
                                className="mt-6 h-1 rounded-full origin-left"
                                style={{ background: 'linear-gradient(90deg, var(--color-primary), #4ade80)' }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offer Letter Modal Popup */}
            <AnimatePresence>
                {showOfferModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOfferModal(false);
                        }}
                    >
                        <motion.div
                            initial={{ y: 20, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-[var(--color-primary)]">
                                        Draft Offer Letter
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">To: {app.jobSeeker?.firstName} {app.jobSeeker?.lastName}</p>
                                </div>
                                <button
                                    onClick={() => setShowOfferModal(false)}
                                    className="card px-2 py-1 text-sm font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSendOffer} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Pre-filled Salary (Optional)</label>
                                        <input
                                            type="number"
                                            value={offerDetails.salary}
                                            onChange={(e) => setOfferDetails({...offerDetails, salary: e.target.value})}
                                            placeholder="e.g. 100000"
                                            className="input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Start Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={offerDetails.startDate}
                                            onChange={(e) => setOfferDetails({...offerDetails, startDate: e.target.value})}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Offer Email Subject</label>
                                    <input
                                        type="text"
                                        value={offerDetails.subject}
                                        onChange={(e) => setOfferDetails({...offerDetails, subject: e.target.value})}
                                        placeholder={`Job Offer: ${selectedJob?.title}`}
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">Custom Letter Content (Optional)</label>
                                    <textarea
                                        value={offerDetails.offerContent}
                                        onChange={(e) => setOfferDetails({...offerDetails, offerContent: e.target.value})}
                                        placeholder={`Leave empty to auto-generate based on job description and entered salary/start date.`}
                                        rows={6}
                                        className="input w-full"
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowOfferModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendingOffer}
                                        className="btn-primary flex-1"
                                    >
                                        {sendingOffer ? 'Sending...' : 'Dispatch Offer 🚀'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showInsights && (
                    <VertexIntelligenceModal
                        analysis={matchData || app.matchAnalysis}
                        onClose={() => setShowInsights(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showResumePreview && resumeId && (
                    <ResumePreviewModal
                        resumeUrl={`${API_BASE_URL}/resume/preview/${resumeId}?token=${localStorage.getItem('authToken') || ''}`}
                        resumeName={app.selectedResume?.name || 'Resume'}
                        onClose={() => setShowResumePreview(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
