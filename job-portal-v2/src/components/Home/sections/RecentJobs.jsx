import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';
import { Skeleton } from '../../Skeleton';

export default function RecentJobs({ loading, recentJobs, onJobSelect }) {
    if (loading) {
        return (
            <section id="jobs" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div className="h-10 w-48 bg-[var(--hp-surface-alt)] rounded-lg animate-pulse" />
                    <div className="h-6 w-24 bg-[var(--hp-surface-alt)] rounded-lg animate-pulse" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 hp-card animate-pulse" />)}
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
                                onClick={() => onJobSelect(job)}
                                className="hp-card p-6 flex flex-col group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--hp-surface-alt)] flex items-center justify-center font-bold text-lg text-[var(--hp-accent)]">
                                        {job.companyName ? job.companyName.charAt(0) : 'J'}
                                    </div>
                                    <span className="tag-pill bg-[var(--hp-accent)]/10 text-[var(--hp-accent)] border border-[var(--hp-accent)]/20">
                                        {job.jobType || 'Full-time'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-1 group-hover:text-[var(--hp-accent)] transition-colors">{job.title}</h3>
                                <p className="text-xs text-[var(--hp-muted)] mb-4">{job.companyName} · {job.location}</p>
                                <div className="flex gap-2 flex-wrap mb-6 flex-grow">
                                    {job.skillsRequired?.slice(0, 3).map(sk => (
                                        <span key={sk} className="tag-pill bg-[var(--hp-surface-alt)] text-[var(--hp-text-sub)]">{sk}</span>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-[var(--hp-border)] flex justify-between items-center mt-auto">
                                    <span className="text-sm font-bold text-[var(--hp-text)]">
                                        {job.salaryRange ? `₹${job.salaryRange}` : 'Not Disclosed'}
                                    </span>
                                    <span className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider">
                                        {job.postedTime || 'Just now'}
                                    </span>
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
