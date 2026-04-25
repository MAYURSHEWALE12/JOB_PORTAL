import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function ResumeBuilderSection() {
    return (
        <section className="py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] opacity-[0.03] pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--hp-accent) 0%, transparent 70%)' }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-5 gap-16 items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="lg:col-span-2">
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI-Powered Builder</span>
                        </motion.div>
                        <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-8 text-[var(--hp-text)]">
                            Don't just apply. <br />
                            <span className="gradient-word">Stand out.</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-[var(--hp-muted)] mb-10 leading-relaxed">
                            Our AI resume builder optimizes your profile for ATS systems, highlights your best skills, and matches you to the roles where you'll thrive.
                        </motion.p>
                        {[
                            { icon: '⚡', text: 'ATS-optimized templates' },
                            { icon: '🧠', text: 'AI keyword suggestions' },
                            { icon: '📊', text: 'Real-time match scoring' },
                        ].map((f, i) => (
                            <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 mb-4">
                                <span className="text-lg">{f.icon}</span>
                                <span className="text-sm font-semibold text-[var(--hp-text-sub)]">{f.text}</span>
                            </motion.div>
                        ))}
                        <motion.div variants={fadeUp} className="mt-8">
                            <Link to="/resume-builder" className="hp-btn-primary px-8 py-3.5 text-sm">Build My Resume →</Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-3 relative"
                    >
                        {/* Editor Window */}
                        <div className="hp-card overflow-hidden" style={{ background: 'var(--hp-bg)' }}>
                            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-surface-alt)' }}>
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                </div>
                                <div className="px-4 py-1 rounded-md border text-[10px] font-bold" style={{ background: 'var(--hp-bg)', borderColor: 'var(--hp-border)', color: 'var(--hp-muted)' }}>
                                    hirehub_resume_v2.pdf
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-4 h-4 rounded" style={{ background: 'var(--hp-surface-alt)' }} />
                                    <div className="w-4 h-4 rounded" style={{ background: 'var(--hp-surface-alt)' }} />
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-3 gap-8">
                                <div className="col-span-1 space-y-6">
                                    <div className="w-16 h-16 rounded-full" style={{ background: 'var(--hp-surface-alt)' }} />
                                    <div className="space-y-2">
                                        <div className="h-2 w-full rounded-full" style={{ background: 'rgba(var(--hp-accent-rgb),.2)' }} />
                                        <div className="h-2 w-2/3 rounded-full" style={{ background: 'rgba(var(--hp-accent-rgb),.2)' }} />
                                    </div>
                                    <div className="space-y-3 pt-4">
                                        {[1,1,0.8].map((w, j) => <div key={j} className="h-1.5 rounded-full" style={{ width: `${w*100}%`, background: 'var(--hp-surface-alt)' }} />)}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-6">
                                    <div className="h-4 w-1/2 rounded-md" style={{ background: 'rgba(255,255,255,.1)' }} />
                                    <div className="space-y-2">
                                        {[1,1,0.75].map((w, j) => <div key={j} className="h-2 rounded-full" style={{ width: `${w*100}%`, background: 'rgba(var(--hp-accent-rgb),.08)' }} />)}
                                    </div>
                                    <div className="pt-4 space-y-4">
                                        <div className="h-3 w-1/3 rounded-md" style={{ background: 'rgba(167,139,250,.2)' }} />
                                        {[1,0.83].map((w, j) => <div key={j} className="h-2 rounded-full" style={{ width: `${w*100}%`, background: 'rgba(var(--hp-accent-rgb),.08)' }} />)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ATS Score Widget */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-12 -right-8 hp-card p-5"
                            style={{ borderColor: 'rgba(16,185,129,.3)' }}
                        >
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[var(--hp-border)]" />
                                    <circle cx="32" cy="32" r="28" stroke="#10b981" strokeWidth="4" fill="transparent" strokeDasharray="175" strokeDashoffset="25" />
                                </svg>
                                <span className="absolute text-xs font-black text-emerald-500">92%</span>
                            </div>
                            <div className="text-center mt-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--hp-muted)]">ATS Score</p>
                                <p className="text-[10px] font-bold text-emerald-500 mt-1">Excellent</p>
                            </div>
                        </motion.div>

                        {/* Template Switcher Widget */}
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            className="absolute -bottom-10 -left-12 hp-card p-4 flex flex-col gap-3 min-w-[140px]"
                        >
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--hp-muted)] mb-1">Templates</p>
                            <div className="flex items-center gap-3 p-2 rounded-lg border" style={{ background: 'rgba(var(--hp-accent-rgb),.1)', borderColor: 'rgba(var(--hp-accent-rgb),.3)' }}>
                                <div className="w-6 h-8 rounded" style={{ background: 'rgba(var(--hp-accent-rgb),.2)' }} />
                                <span className="text-[10px] font-bold text-[var(--hp-text)]">Modern</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg border opacity-60" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                <div className="w-6 h-8 rounded" style={{ background: 'rgba(255,255,255,.1)' }} />
                                <span className="text-[10px] font-bold text-[var(--hp-text)]">Classic</span>
                            </div>
                        </motion.div>

                        {/* Scanning Badge */}
                        <div className="absolute top-1/2 -right-4 translate-x-1/2 hp-card px-4 py-2 backdrop-blur-md" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(var(--hp-accent-rgb),.2)' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Scanning Keywords…</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
