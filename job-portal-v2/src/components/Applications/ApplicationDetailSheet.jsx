import { motion, AnimatePresence } from 'framer-motion';
import CompanyAvatar from '../CompanyAvatar';
import { formatDate } from '../../utils/formatters';

export default function ApplicationDetailSheet({
    selected,
    setSelected,
    isDesktop,
    states,
    matchAnalysis,
    quizInfo,
    setShowQuizModal,
    handleOfferAction,
    handleWithdraw,
    withdrawing
}) {
    if (!selected) return null;

    return (
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
                        <CompanyAvatar job={selected.job} size="lg" />
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
                                        {quizInfo.result ? 'Assessment Certified' : 'Skill Validation Required'}
                                    </p>
                                </div>
                                {quizInfo.result && (
                                    <div className="flex flex-col items-end">
                                        <div className="bg-[var(--color-primary)] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-[var(--color-primary)]/20">
                                            {Math.round((quizInfo.result.correctAnswers / quizInfo.result.totalQuestions) * 100)}%
                                        </div>
                                        <span className="text-[9px] font-bold text-[var(--color-text-muted)] mt-1 uppercase tracking-tighter">Verified Score</span>
                                    </div>
                                )}
                            </div>

                            {quizInfo.result ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${quizInfo.result.passed ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
                                            {quizInfo.result.passed ? '🏆' : '📚'}
                                        </div>
                                        <div>
                                            <div className={`text-xs font-bold ${quizInfo.result.passed ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                                                {quizInfo.result.passed ? 'Proficiency Verified' : 'Assessment Completed'}
                                            </div>
                                            <div className="text-[10px] text-[var(--color-text-muted)]">
                                                {quizInfo.result.correctAnswers} of {quizInfo.result.totalQuestions} questions correct
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-[var(--color-page)] border border-[var(--color-border-subtle)]">
                                        <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed italic">
                                            "Your score has been permanently recorded and shared with the hiring team. High scores significantly increase your chances of being shortlisted."
                                        </p>
                                    </div>
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
                                        START ASSESSMENT ↗
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
    );
}
