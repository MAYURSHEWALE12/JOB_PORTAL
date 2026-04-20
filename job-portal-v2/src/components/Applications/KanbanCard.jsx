import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeAnalysisAPI } from '../../services/api';
import VertexIntelligenceModal from './VertexIntelligenceModal';
import CircularMatchScore from './CircularMatchScore';

export default function KanbanCard({ application, onSelect, onDragEnd }) {
    const [showIntelligence, setShowIntelligence] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [localAnalysis, setLocalAnalysis] = useState(application.matchAnalysis);

    const resumeId = application.selectedResume?.id || application.resumeId;
    const jobId = application.job?.id;

    const handleVerifyMatch = async (e) => {
        e.stopPropagation();
        if (!resumeId || !jobId) return;
        setIsAnalyzing(true);
        try {
            const res = await resumeAnalysisAPI.analyzeMatch(resumeId, jobId);
            setLocalAnalysis(res.data);
            setShowIntelligence(true);
        } catch (err) {
            console.error("Analysis Failed", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const statusIcons = {
        PENDING: '⏳', REVIEWED: '👀', SHORTLISTED: '⭐', INTERVIEWING: '📅', OFFERED: '📜',
        ACCEPTED: '🎉', REJECTED: '❌',
    };

    return (
        <motion.div
            layoutId={`card-${application.id}`}
            drag
            dragSnapToOrigin
            dragElastic={0.5}
            whileDrag={{ 
                scale: 1.05, 
                zIndex: 100, 
                boxShadow: window.innerWidth < 768 
                    ? '0 8px 24px rgba(0,0,0,0.35)' 
                    : '0 20px 50px rgba(0,0,0,0.3)',
                cursor: 'grabbing'
            }}
            style={{ willChange: 'transform' }}
            onDragEnd={(e, info) => onDragEnd?.(application, info)}
            onClick={() => onSelect(application)}
            className="kanban-card hp-card p-3 sm:p-4 space-y-3 group select-none shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--hp-accent)]/10 flex items-center justify-center text-base sm:text-lg border border-[var(--hp-accent)]/20">
                        {application.jobSeeker?.firstName?.charAt(0) || application.candidateName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--hp-text)] truncate max-w-[120px] sm:max-w-[160px]">
                            {application.candidateName || (application.jobSeeker?.firstName + ' ' + application.jobSeeker?.lastName)}
                        </h4>
                        <p className="text-[10px] text-[var(--hp-muted)] uppercase tracking-wider truncate">
                            {application.jobTitle || application.job?.title}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-1">
                {localAnalysis || application.matchScore ? (
                    <div 
                        className="transition-transform hover:scale-110 cursor-help"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowIntelligence(true);
                        }}
                    >
                        <CircularMatchScore 
                            score={localAnalysis?.score || application.matchScore} 
                            size={42} 
                            strokeWidth={4} 
                        />
                    </div>
                ) : (
                    resumeId && (
                        <button
                            onClick={handleVerifyMatch}
                            disabled={isAnalyzing}
                            className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all"
                            style={{ 
                                background: 'rgba(var(--hp-accent-rgb), 0.05)', 
                                borderColor: 'rgba(var(--hp-accent-rgb), 0.2)',
                                color: 'var(--hp-accent)' 
                            }}
                        >
                            {isAnalyzing ? "..." : "Verify AI"}
                        </button>
                    )
                )}
                
                <div className="text-base sm:text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                    {statusIcons[application.status]}
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--hp-border)] border-dashed">
                <div className="flex -space-x-1.5">
                    {application.hasCompletedInterview && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px]" title="Interview Completed">
                            ✅
                        </div>
                    )}
                </div>
                <div className="text-[9px] font-bold text-[var(--hp-muted)]">
                    {new Date(application.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
            </div>
            <AnimatePresence>
                {showIntelligence && (
                    <VertexIntelligenceModal
                        analysis={localAnalysis || application.matchAnalysis}
                        onClose={() => setShowIntelligence(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
