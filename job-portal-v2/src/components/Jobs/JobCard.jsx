import { motion } from 'framer-motion';
import { formatSalary, timeAgo } from '../../utils/formatters';
import CompanyAvatar from '../CompanyAvatar';

export const JOB_TYPE_STYLE = {
    FULL_TIME: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
    CONTRACT:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    REMOTE:    'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    FREELANCE: 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30',
};

export default function JobCard({ 
    job, 
    isSelected, 
    isApplied, 
    isSaved, 
    isSaving, 
    onSelect, 
    onToggleSave 
}) {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const companyName = job.companyName || job.employer?.companyProfile?.companyName
        || `${job.employer?.firstName || ''} ${job.employer?.lastName || ''}`.trim()
        || 'Verified Employer';

    return (
        <motion.div
            layout
            variants={{
                hidden: { opacity: 0, y: 16, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
            }}
            whileHover={{ y: -4 }}
            onClick={() => onSelect(job)}
            className="hp-card p-6 cursor-pointer flex flex-col h-full group"
            style={isSelected ? {
                borderColor: 'var(--hp-accent)',
                boxShadow: '0 8px 30px rgba(var(--hp-accent-rgb),.15)'
            } : {}}
        >
            {/* Top row */}
            <div className="flex items-start justify-between mb-4 gap-2">
                <CompanyAvatar job={job} />
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {job.jobType && (
                        <span className={`tag-pill ${JOB_TYPE_STYLE[job.jobType] || ''}`}
                            style={!JOB_TYPE_STYLE[job.jobType] ? {
                                background: 'var(--hp-surface-alt)',
                                color: 'var(--hp-muted)',
                                border: '1px solid var(--hp-border)'
                            } : {}}>
                            {job.jobType?.replace(/_/g, ' ')}
                        </span>
                    )}
                    {isApplied && (
                        <span className="tag-pill" style={{
                            background: 'rgba(52,211,153,.12)',
                            color: '#34d399',
                            border: '1px solid rgba(52,211,153,.25)'
                        }}>
                            ✓ Applied
                        </span>
                    )}
                </div>
            </div>

            {/* Title + Company */}
            <h3
                className="job-title-hover font-bold text-[1.05rem] leading-snug mb-1 transition-colors"
                style={{ color: 'var(--hp-text)' }}
            >
                {job.title}
            </h3>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--hp-accent)' }}>{companyName}</p>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-1.5 mb-auto pb-4">
                {job.location && (
                    <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                        📍 {job.location}
                    </span>
                )}
                {job.experienceRequired && (
                    <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                        🎓 {job.experienceRequired}
                    </span>
                )}
                {job.remoteType && (
                    <span className="tag-pill" style={{
                        background: 'rgba(var(--hp-accent2-rgb),.1)',
                        color: 'var(--hp-accent2)',
                        border: '1px solid rgba(var(--hp-accent2-rgb),.25)'
                    }}>
                        {job.remoteType}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--hp-border)' }}>
                <div>
                    {salary ? (
                        <div className="font-bold text-sm" style={{ color: 'var(--hp-accent)', fontVariantNumeric: 'tabular-nums' }}>
                            {salary}
                        </div>
                    ) : (
                        <div className="text-xs" style={{ color: 'var(--hp-muted)' }}>Salary undisclosed</div>
                    )}
                    {job.createdAt && (
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--hp-muted)' }}>{timeAgo(job.createdAt)}</div>
                    )}
                </div>

                <button
                    onClick={e => { e.stopPropagation(); onToggleSave(e, job.id); }}
                    disabled={isSaving}
                    aria-label={isSaved ? 'Unsave job' : 'Save job'}
                    className="bookmark-btn"
                    style={{ color: isSaved ? 'var(--hp-accent)' : 'var(--hp-muted)' }}
                >
                    {isSaving ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
