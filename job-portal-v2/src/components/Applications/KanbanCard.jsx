import { motion } from 'framer-motion';

export default function KanbanCard({ application, onSelect, onDragEnd }) {
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
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                cursor: 'grabbing'
            }}
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
                <div className="text-base sm:text-lg opacity-60 group-hover:opacity-100 transition-opacity">
                    {statusIcons[application.status]}
                </div>
            </div>

            {application.matchScore && (
                <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1 bg-[var(--hp-border)] rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${application.matchScore}%` }}
                            className="h-full bg-[var(--hp-accent)]" 
                        />
                    </div>
                    <span className="text-[9px] font-black text-[var(--hp-accent)]">{application.matchScore}% Match</span>
                </div>
            )}

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
        </motion.div>
    );
}
