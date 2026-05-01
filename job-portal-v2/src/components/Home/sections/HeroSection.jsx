import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function HeroSection({ 
    searchQuery, setSearchQuery, 
    searchLocation, setSearchLocation, 
    handleSearch 
}) {
    return (
        <section className="relative overflow-hidden pt-44 pb-32 min-h-[85vh] flex items-center justify-center text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* ── Aurora Orbs (Atmospheric Backdrop) ── */}
            <div className="absolute top-[0%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[#2dd4bf] opacity-[0.07] blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#a78bfa] opacity-[0.07] blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 relative z-10 w-full py-12 flex flex-col items-center">
                
                {/* ── Eyebrow Badge ── */}
                <motion.div 
                    initial="hidden" animate="visible" variants={fadeUp}
                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[var(--hp-border)] bg-[var(--hp-surface)]/50 mb-10 backdrop-blur-md"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] shadow-[0_0_10px_#2dd4bf]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--hp-text)] opacity-80">Elite Talent Pipeline</span>
                </motion.div>

                {/* ── Headline & Paragraph ── */}
                <motion.div 
                    initial="hidden" animate="visible" variants={staggerContainer}
                    className="flex flex-col items-center mb-14"
                >
                    <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tighter leading-[1] mb-8 text-[var(--hp-text)] max-w-4xl">
                        Find Your <br />
                        <span className="gradient-word">Dream Career</span> Today.
                    </motion.h1>
                    <motion.p variants={fadeUp} className="text-xl text-[var(--hp-muted)] max-w-2xl leading-relaxed font-medium opacity-80">
                        Direct access to verified hiring managers at the world's most innovative companies. Skip the noise, start the conversation.
                    </motion.p>
                </motion.div>

                {/* ── Search Bar (Centered Unit) ── */}
                <motion.form 
                    initial="hidden" animate="visible" variants={fadeUp}
                    onSubmit={handleSearch} 
                    className="mb-14 flex flex-col sm:flex-row items-center w-full max-w-3xl bg-[var(--hp-surface)]/50 backdrop-blur-2xl rounded-2xl border border-[var(--hp-border)] shadow-2xl overflow-hidden p-1.5 focus-within:border-[#2dd4bf]/40 transition-all duration-300"
                >
                    <div className="flex-1 flex items-center gap-3 px-6 py-4 border-r border-[var(--hp-border)]/50">
                        <svg className="w-5 h-5 text-[#2dd4bf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                        <input
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Job title or keyword…"
                            className="flex-1 bg-transparent text-base outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)] font-medium"
                        />
                    </div>
                    <div className="hidden sm:flex items-center gap-3 px-6 py-4 w-56 border-r border-[var(--hp-border)]/50 text-left">
                        <svg className="w-5 h-5 text-[var(--hp-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <input
                            type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
                            placeholder="Location…"
                            className="flex-1 bg-transparent text-sm outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)] font-medium"
                        />
                    </div>
                    <button type="submit" className="hp-btn-primary px-12 py-4 text-sm font-bold rounded-xl whitespace-nowrap">Find Jobs</button>
                </motion.form>

                {/* ── Quick Links ── */}
                <motion.div 
                    initial="hidden" animate="visible" variants={fadeUp}
                    className="flex flex-wrap items-center justify-center gap-8"
                >
                    <Link to="/register" className="hp-btn-primary px-12 py-5 text-base shadow-2xl shadow-[#2dd4bf]/20">Get Started Free</Link>
                    <div className="flex -space-x-3 items-center">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--hp-bg)] bg-[var(--hp-surface-alt)] flex items-center justify-center text-[10px] font-bold">👤</div>
                        ))}
                        <span className="ml-4 text-xs font-bold text-[var(--hp-muted)] tracking-wide">+2.4k Joining today</span>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
