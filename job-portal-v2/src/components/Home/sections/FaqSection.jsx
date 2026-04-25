import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function FaqSection({ faqOpen, onToggle }) {
    const faqs = [
        { q: "Is HireHub free to use?", a: "Yes! Job seekers can browse jobs, create resumes, and apply to roles completely free of charge." },
        { q: "How does the matching work?", a: "Our proprietary algorithm analyzes your resume's skills and experience against job requirements to give you a match score." },
        { q: "Can I track my applications?", a: "Absolutely. Your dashboard provides real-time updates on your application status and recruiter messages." }
    ];

    return (
        <section className="py-32 bg-[var(--hp-surface-alt)]/50 border-t border-[var(--hp-border)]">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black mb-4">Common Questions</h2>
                    <p className="text-[var(--hp-muted)]">Everything you need to know about the platform.</p>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
                    {faqs.map((f, i) => (
                        <motion.div key={i} variants={fadeUp} className="hp-card overflow-hidden">
                            <button
                                onClick={() => onToggle(i === faqOpen ? null : i)}
                                className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-[var(--hp-surface-alt)] transition-colors"
                            >
                                <span className="font-bold text-[var(--hp-text)]">{f.q}</span>
                                <span className={`text-[var(--hp-accent)] transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`}>
                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </span>
                            </button>
                            <AnimatePresence>
                                {faqOpen === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-8 pb-8 text-sm text-[var(--hp-muted)] leading-relaxed">{f.a}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
