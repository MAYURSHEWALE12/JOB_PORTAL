import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

import TiltCard from '../TiltCard';

export default function Testimonials() {
    return (
        <section className="py-32 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black mb-4">Community Stories</h2>
                    <p className="text-[var(--hp-muted)]">Thousands of professionals have found their next home through HireHub.</p>
                </div>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
                    {[
                        { name: 'Arjun Mehta', role: 'Product Designer', company: 'Zomato', text: 'HireHub helped me land my dream role in less than 2 weeks. The AI resume matching is truly a game changer.' },
                        { name: 'Priya Sharma', role: 'SDE-2', company: 'Swiggy', text: 'The interface is so clean and the job quality is much higher than other platforms I’ve used.' },
                        { name: 'Rahul Verma', role: 'Marketing Lead', company: 'Cred', text: 'Verified jobs and direct connection to recruiters saved me months of application ghosting.' },
                    ].map((t, i) => (
                        <TiltCard key={i} tiltAmount={4} className="hp-card p-8">
                            <div className="flex gap-1 text-amber-400 mb-6">
                                {[...Array(5)].map((_, j) => <svg key={j} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                            </div>
                            <p className="text-sm text-[var(--hp-text-sub)] italic mb-8">"{t.text}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] flex items-center justify-center font-bold text-xs">{t.name.charAt(0)}</div>
                                <div>
                                    <div className="text-sm font-bold text-[var(--hp-text)]">{t.name}</div>
                                    <div className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider">{t.role} @ {t.company}</div>
                                </div>
                            </div>
                        </TiltCard>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
