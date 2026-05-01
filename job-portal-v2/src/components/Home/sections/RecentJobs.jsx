import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';
import JobCard from '../../Jobs/JobCard';


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
                        recentJobs.map((job) => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                onSelect={onJobSelect} 
                            />
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
