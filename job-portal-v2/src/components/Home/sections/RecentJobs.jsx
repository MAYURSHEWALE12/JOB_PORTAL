import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';
import { resolvePublicUrl } from '../../../services/api';
import { formatSalary, timeAgo } from '../../../utils/formatters';

const JOB_TYPE_STYLE = {
    FULL_TIME: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
    CONTRACT:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    REMOTE:    'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    FREELANCE: 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30',
};

function CompanyAvatar({ job, size = 'md' }) {
    const rawUrl = job.companyLogo || job.employer?.companyProfile?.logoUrl || job.employer?.profileImageUrl;
    const url = resolvePublicUrl(rawUrl);
    const name = job.companyName || job.employer?.companyProfile?.companyName || job.employer?.firstName || 'J';
    
    const dim = size === 'lg'
        ? 'w-14 h-14 text-xl rounded-2xl'
        : 'w-11 h-11 text-base rounded-xl';

    return url ? (
        <img
            src={url} alt={name}
            className={`${dim} object-cover flex-shrink-0 border border-white/10`}
            onError={e => { e.target.style.display = 'none'; }}
        />
    ) : (
        <div
            className={`${dim} flex-shrink-0 flex items-center justify-center font-bold text-white`}
            style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function RecentJobs({ loading, recentJobs, onJobSelect }) {
    if (loading) {
        return (
            <section id="jobs" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div className="h-10 w-48 bg-[var(--hp-surface-alt)] rounded-lg animate-pulse" />
                    <div className="h-6 w-24 bg-[var(--hp-surface-alt)] rounded-lg animate-pulse" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="hp-card p-6 animate-pulse">
                            <div className="flex justify-between mb-5">
                                <div className="w-11 h-11 rounded-xl bg-[var(--hp-border)]" />
                                <div className="w-16 h-6 rounded-full bg-[var(--hp-border)]" />
                            </div>
                            <div className="h-4 w-3/4 bg-[var(--hp-border)] rounded mb-2" />
                            <div className="h-3 w-1/2 bg-[var(--hp-border)] rounded mb-6" />
                            <div className="flex gap-2 mb-6">
                                <div className="h-6 w-16 bg-[var(--hp-border)] rounded-full" />
                                <div className="h-6 w-16 bg-[var(--hp-border)] rounded-full" />
                            </div>
                            <div className="h-px bg-[var(--hp-border)] mb-4" />
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-[var(--hp-border)] rounded" />
                                <div className="h-3 w-12 bg-[var(--hp-border)] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section id="jobs" className="py-32 px-6 max-w-7xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <div className="flex justify-between items-end mb-12">
                    <motion.h2 variants={fadeUp} className="text-4xl font-black">Latest <span className="gradient-word">Opportunities</span></motion.h2>
                    <motion.a href="/jobs" variants={fadeUp} className="text-sm font-bold text-[var(--hp-accent)] hover:underline">View all jobs →</motion.a>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentJobs.length > 0 ? (
                        recentJobs.map((job, idx) => (
                            <motion.div
                                key={job.id} variants={fadeUp} custom={idx}
                                whileHover={{ y: -4 }}
                                onClick={() => onJobSelect(job)}
                                className="hp-card p-6 flex flex-col group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <CompanyAvatar job={job} />
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
                                </div>
                                
                                <h3 className="font-bold text-[1.05rem] leading-snug mb-1 group-hover:text-[var(--hp-accent)] transition-colors text-[var(--hp-text)]">
                                    {job.title}
                                </h3>
                                <p className="text-sm font-medium mb-3 text-[var(--hp-accent)]">
                                    {job.companyName || job.employer?.companyProfile?.companyName || 'Verified Employer'}
                                </p>

                                <div className="flex flex-wrap gap-1.5 mb-auto pb-4">
                                    {job.location && (
                                        <span className="tag-pill bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] border border-[var(--hp-border)]">
                                            📍 {job.location}
                                        </span>
                                    )}
                                    {job.experienceRequired && (
                                        <span className="tag-pill bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] border border-[var(--hp-border)]">
                                            🎓 {job.experienceRequired}
                                        </span>
                                    )}
                                    {job.remoteType && (
                                        <span className="tag-pill bg-[var(--hp-accent2)]/10 text-[var(--hp-accent2)] border border-[var(--hp-accent2)]/25">
                                            {job.remoteType}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-[var(--hp-border)] flex justify-between items-center mt-auto">
                                    <div>
                                        <div className="font-bold text-sm text-[var(--hp-accent)]">
                                            {formatSalary(job.salaryMin, job.salaryMax) || 'Salary undisclosed'}
                                        </div>
                                        {job.createdAt && (
                                            <div className="text-[10px] font-medium mt-0.5 text-[var(--hp-muted)]">
                                                {timeAgo(job.createdAt)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-8 h-8 rounded-lg bg-[var(--hp-surface-alt)] flex items-center justify-center text-[var(--hp-muted)] group-hover:text-[var(--hp-accent)] transition-colors">
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center hp-card border-dashed">
                            <p className="text-[var(--hp-muted)]">No jobs available right now. Check back later!</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    );
}
