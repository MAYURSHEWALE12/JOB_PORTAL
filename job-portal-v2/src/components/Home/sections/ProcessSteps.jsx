import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function ProcessSteps() {
    return (
        <section className="py-32 bg-[var(--hp-surface-alt)] border-y border-[var(--hp-border)]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black mb-4">How It Works</h2>
                    <p className="text-[var(--hp-muted)]">Your journey to a better career in three simple steps.</p>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-12">
                    {[
                        { step: '01', title: 'Create Profile', desc: 'Import your resume or build one with our AI tools in minutes.', icon: '✍️' },
                        { step: '02', title: 'Get Matched', desc: 'Our algorithm finds jobs that fit your skills and career goals.', icon: '🎯' },
                        { step: '03', title: 'Apply Directly', desc: 'Send your profile directly to hiring managers with one click.', icon: '📨' },
                    ].map((s, i) => (
                        <motion.div key={i} variants={fadeUp} className="relative group">
                            {i < 2 && <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-px bg-[var(--hp-border)] z-0" />}
                            <div className="hp-card p-10 relative z-10 hover:border-[var(--hp-accent)]/50">
                                <div className="text-4xl mb-6">{s.icon}</div>
                                <div className="text-[var(--hp-accent)] font-black text-xs uppercase tracking-widest mb-3">{s.step}</div>
                                <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                                <p className="text-sm text-[var(--hp-muted)] leading-relaxed">{s.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
