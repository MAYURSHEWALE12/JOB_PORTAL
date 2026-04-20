import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAnalysisAPI, applicationAPI } from '../../services/api';
import ScheduleInterviewModal from '../Interviews/ScheduleInterviewModal';
import CircularMatchScore from './CircularMatchScore';

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

            <div className="flex justify-between items-start ml-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold transition-transform group-hover:scale-105" 
                             style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-accent)' }}>
                            {app.jobSeeker?.firstName?.[0]}{app.jobSeeker?.lastName?.[0]}
                        </div>
                        {selectedIds.has(app.id) && (
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"
                                style={{ background: 'var(--hp-accent)' }}
                            >
                                ✓
                            </motion.div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--hp-text)] group-hover:text-[var(--hp-accent)] transition-colors">
                                {app.jobSeeker?.firstName} {app.jobSeeker?.lastName}
                            </h3>
                            {app.quizResult ? (
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                    app.quizResult.passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                    {app.quizResult.passed ? '✅ Passed Task' : '❌ Failed Task'}
                                </span>
                            ) : (
                                app.status === 'PENDING' && (
                                    <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
                                        ⏳ Skill Test Pending
                                    </span>
                                )
                            )}
                        </div>
                        <p className="text-[var(--hp-muted)] text-sm">{app.jobSeeker?.email}</p>
                        <p className="text-[var(--hp-muted)] text-[10px] mt-1.5 flex items-center gap-1.5 uppercase font-black tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--hp-accent)' }}></span>
                            Applied {formatDate(app.appliedAt)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Premium AI Score Indicator */}
                    {matchData ? (
                        <div 
                            onClick={(e) => { e.stopPropagation(); setShowInsights(true); }}
                            className="transition-transform hover:scale-110"
                        >
                            <CircularMatchScore score={matchData.matchScore} size={54} />
                        </div>
                    ) : (
                        resumeId && (
                            <button
                                onClick={handleVerifyMatch}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{ 
                                    background: 'rgba(var(--hp-accent-rgb), 0.05)', 
                                    borderColor: 'rgba(var(--hp-accent-rgb), 0.2)',
                                    color: 'var(--hp-accent)' 
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb), 0.05)'}
                            >
                                {isAnalyzing ? "Analyzing..." : "Verify AI"}
                            </button>
                        )
                    )}

                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${statusStyles[app.status]}`}>
                            <span className="text-sm">{statusIcons[app.status]}</span> {app.status}
                        </span>
                    </div>
                </div>
            </div>

            {app.status !== 'WITHDRAWN' && app.status !== 'ACCEPTED' && (
                <div className="flex gap-2 mt-4 flex-wrap ml-4">
                    {getNextStatuses(app.status).map(status => (
                        <button
                            key={status}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(app.id, status);
                            }}
                            disabled={updatingId === app.id}
                            className={`
                                px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                                ${status === 'REJECTED' 
                                    ? 'bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10' 
                                    : 'bg-[var(--hp-accent)]/5 text-[var(--hp-accent)] border-[var(--hp-accent)]/20 hover:bg-[var(--hp-accent)]/10'}
                            `}
                        >
                            {status}
                        </button>
                    ))}

                    {/* Show Schedule Interview Button if candidate is shortlisted or reviewed */}
                    {(app.status === 'SHORTLISTED' || app.status === 'REVIEWED') && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowInterviewModal(true);
                            }}
                            className="px-3 py-1.5 bg-[#1565C0] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#0D47A1] transition-all ml-auto"
                        >
                            <span className="mr-1">📅</span> Schedule Interview
                        </button>
                    )}

                    {/* Show Official Offer Button only if candidate is in INTERVIEWING stage and has a COMPLETED interview */}
                    {(app.status === 'INTERVIEWING' && app.hasCompletedInterview) && (
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOfferModal(true);
                                }}
                                className="px-3 py-1.5 bg-[#4A7C59] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#3d664a] transition-all"
                            >
                                <span className="mr-1">✉️</span> Send Official Offer
                            </button>
                            <button
                                onClick={handleDirectHire}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
                                title="Fast-track hire (Auto-generate & Accept offer)"
                            >
                                ⚡ Direct Hire
                            </button>
                        </div>
                    )}
                    
                    {app.status === 'INTERVIEWING' && (
                        <span className="px-3 py-1.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-xs font-bold border border-[#90CAF9] ml-auto">
                            📅 Interview Scheduled
                        </span>
                    )}

                    {app.status === 'OFFERED' && (
                        <span className="px-3 py-1.5 bg-[#FFF3E0] text-[#C2651A] rounded-full text-xs font-bold border border-[#E8A66A] ml-auto">
                            ⏳ Offer Pending Accept
                        </span>
                    )}
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

            {/* AI Insights High-Contrast Overlay Popup */}
            <AnimatePresence>
                {showInsights && matchData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInsights(false);
                        }}
                    >
                        <motion.div
                            initial={{ y: 20, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#111] text-white border-4 border-stone-800 shadow-[8px_8px_0_#C2651A] max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-none p-6"
                        >
                            <div className="flex justify-between items-center mb-6 border-b-2 border-stone-800 pb-4">
                                <h3 className="text-2xl font-serif font-bold text-orange-400 uppercase tracking-wider">
                                    AI Match Insights
                                </h3>
                                <button
                                    onClick={() => setShowInsights(false)}
                                    className="text-white hover:text-orange-500 font-bold p-2 bg-stone-800 hover:bg-stone-700 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="col-span-1 border-2 border-stone-800 p-4 text-center flex flex-col justify-center items-center">
                                    <span className="text-sm uppercase text-stone-400 mb-2">Overall Match</span>
                                    <span className={`text-6xl font-black ${getScoreColor(matchData.matchScore).split(' ')[0]}`}>
                                        {matchData.matchScore}%
                                    </span>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <h4 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-2">Key Highlights</h4>
                                        {matchData.strengths && matchData.strengths.length > 0 ? (
                                            <ul className="list-disc list-inside text-stone-300 text-sm space-y-1">
                                                {matchData.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="text-stone-500 text-sm italic">No specific strengths highlighted.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Missing Skills / Tailoring Tips</span>
                                    {isAnalyzing ? (
                                        <Loader text="Re-analyzing" />
                                    ) : (
                                        <button 
                                            onClick={handleVerifyMatch}
                                            className="text-xs px-3 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 transition"
                                        >
                                            ↻ Re-Analyze
                                        </button>
                                    )}
                                </h4>
                                <div className="border-2 border-stone-800 p-4 bg-stone-900">
                                    {matchData.missingSkills && matchData.missingSkills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {matchData.missingSkills.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-rose-900 border border-current text-rose-300 text-xs font-bold uppercase">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-stone-400 text-sm">Perfect skill match! No major gaps detected.</p>
                                    )}

                                    {matchData.tailoringTips && matchData.tailoringTips.length > 0 && (
                                        <ul className="mt-4 list-none text-stone-300 text-sm space-y-2">
                                            {matchData.tailoringTips.map((tip, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-orange-500">→</span> 
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
