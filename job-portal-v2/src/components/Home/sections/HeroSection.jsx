import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function HeroSection({
    searchQuery, setSearchQuery,
    searchLocation, setSearchLocation,
    handleSearch
}) {
    return (
        <section className="relative overflow-hidden pt-40 pb-32 min-h-[90vh] flex items-center">
            <div className="orb" style={{ width: 800, height: 800, background: 'radial-gradient(circle, var(--hp-accent) 0%, transparent 70%)', top: '-20%', left: '-10%', opacity: 0.1 }} />
            <div className="orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, var(--hp-accent2) 0%, transparent 70%)', bottom: '-10%', right: '-5%', opacity: 0.1 }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-20 items-center">

                    {/* Left: Hero Text */}
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--hp-accent)]/30 bg-[var(--hp-accent)]/10 mb-8">
                            <span className="w-2 h-2 rounded-full bg-[var(--hp-accent)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-accent)]">HireHub: The Future of Hiring</span>
                        </motion.div>

                        <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-8">
                            Find Your <br />
                            <span className="gradient-word">Dream Career</span> <br />
                            Faster.
                        </motion.h1>

                        <motion.p variants={fadeUp} className="text-lg text-[var(--hp-muted)] max-w-md mb-10 leading-relaxed">
                            Skip the cold emails. Connect directly with hiring managers at world-class companies using our verified talent pipeline.
                        </motion.p>

                        {/* ── Search Bar (Unified & Intact) ── */}
                        <motion.form
                            variants={fadeUp}
                            onSubmit={handleSearch}
                            className="mb-10 flex flex-col sm:flex-row items-center w-full max-w-2xl bg-[var(--hp-surface)]/50 backdrop-blur-2xl rounded-2xl border border-[var(--hp-border)] shadow-2xl overflow-hidden p-1.5 focus-within:border-[#2dd4bf]/40 transition-all duration-300"
                        >
                            <div className="flex-1 flex items-center gap-3 px-5 py-3.5 border-r border-[var(--hp-border)]/50">
                                <svg className="w-4 h-4 text-[#2dd4bf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                                <input
                                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Job title or keyword…"
                                    className="flex-1 bg-transparent text-sm outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)] font-medium"
                                />
                            </div>
                            <div className="hidden sm:flex items-center gap-3 px-5 py-3.5 w-48 border-r border-[var(--hp-border)]/50">
                                <svg className="w-4 h-4 text-[var(--hp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <input
                                    type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
                                    placeholder="Location…"
                                    className="flex-1 bg-transparent text-sm outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)] font-medium"
                                />
                            </div>
                            <button type="submit" className="hp-btn-primary px-10 py-3.5 text-sm font-bold rounded-xl whitespace-nowrap">Search</button>
                        </motion.form>

                        <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                            <Link to="/register" className="hp-btn-primary px-10 py-4 text-base">Get Started Free</Link>
                            <a href="#jobs" className="hp-btn-ghost px-10 py-4 text-base">View Jobs ↓</a>
                        </motion.div>
                    </motion.div>

                    {/* Right: Floating Mockup Cards */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="hidden lg:block relative h-[500px]">
                        {/* Main Job Card */}
                        <div className="float1 absolute top-0 right-0 w-full z-10">
                            <div className="hp-card p-6 max-w-sm ml-auto shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">G</div>
                                    <div>
                                        <div className="font-bold text-[var(--hp-text)]">Senior Frontend Developer</div>
                                        <div className="text-xs text-[var(--hp-muted)]">Google · Hyderabad</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-[var(--hp-accent)]">
                                    <span>₹32L – ₹55L</span>
                                    <span className="tag-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Full-time</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <span className="tag-pill bg-teal-500/10 text-teal-400">React</span>
                                    <span className="tag-pill bg-purple-500/10 text-purple-400">Node.js</span>
                                </div>
                            </div>
                        </div>

                        {/* Match Rate Card */}
                        <div className="float2 absolute top-[35%] left-[-5%] z-20">
                            <div className="hp-card p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg">🎯</div>
                                <div>
                                    <div className="text-2xl font-black text-[var(--hp-text)]">94%</div>
                                    <div className="text-[10px] uppercase font-black text-[var(--hp-muted)] tracking-wider">Profile Match</div>
                                </div>
                            </div>
                        </div>

                        {/* Applicants Pulse */}
                        <div className="float1 absolute bottom-12 right-[-2%] z-20" style={{ animationDelay: '1.5s' }}>
                            <div className="hp-card p-4 flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping absolute inset-0" />
                                    <div className="w-3 h-3 rounded-full bg-purple-500 relative" />
                                </div>
                                <div className="text-[11px] font-bold text-[var(--hp-text-sub)]">
                                    <span className="text-[var(--hp-accent2)]">12+ People</span> applied just now
                                </div>
                            </div>
                        </div>

                        {/* Verified Badge */}
                        <div className="float2 absolute bottom-2 left-[10%] z-0 opacity-80" style={{ animationDelay: '0.8s' }}>
                            <div className="hp-card px-4 py-3 flex items-center gap-3 border-dashed" style={{ borderColor: 'var(--hp-border)' }}>
                                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L10 12.586l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">Verified Post</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
