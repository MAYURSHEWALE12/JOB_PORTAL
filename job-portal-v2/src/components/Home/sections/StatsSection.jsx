import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';
import AnimatedNumber from '../AnimatedNumber';

export default function StatsSection({ jobsCount }) {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
                    {[
                        { label: 'Active Openings', val: jobsCount || 124, color: 'var(--hp-accent)', icon: '💼' },
                        { label: 'Talent Placed', val: 5200, color: 'var(--hp-accent2)', icon: '🚀', suffix: '+' },
                        { label: 'Partner Brands', val: 450, color: '#34d399', icon: '🏢' },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={fadeUp} className="hp-card p-10 flex flex-col items-center text-center">
                            <div className="text-4xl mb-4">{stat.icon}</div>
                            <div className="text-5xl font-black mb-2" style={{ color: stat.color }}>
                                <AnimatedNumber value={stat.val} suffix={stat.suffix} />
                            </div>
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--hp-muted)]">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
