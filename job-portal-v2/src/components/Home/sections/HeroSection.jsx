import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from './variants';

export default function HeroSection({
    searchQuery, setSearchQuery,
    searchLocation, setSearchLocation,
    handleSearch,
}) {
    return (
        <section
            className="relative overflow-hidden pt-32 md:pt-44 pb-20 md:pb-36 min-h-[85vh] flex items-center justify-center text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* ── Aurora Backdrop ── */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] md:w-[1100px] h-[600px] md:h-[900px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--hp-accent) 0%, transparent 65%)', opacity: 0.07, filter: 'blur(140px)' }} />
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[500px] md:w-[800px] h-[400px] md:h-[600px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--hp-accent2) 0%, transparent 65%)', opacity: 0.06, filter: 'blur(120px)' }} />

            {/* Noise texture overlay */}
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.015]">
                <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
                <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>

            <div className="max-w-5xl mx-auto px-6 relative z-10 w-full flex flex-col items-center">

                {/* ── Eyebrow Badge ── */}
                <motion.div
                    initial="hidden" animate="visible" variants={fadeUp}
                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border mb-10 backdrop-blur-md"
                    style={{ borderColor: 'color-mix(in srgb, var(--hp-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--hp-accent) 8%, transparent)' }}
                >
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--hp-accent)' }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--hp-accent)', boxShadow: '0 0 8px var(--hp-accent)' }} />
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--hp-accent)' }}>
                        Elite Talent Pipeline
                    </span>
                </motion.div>

                {/* ── Headline ── */}
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center mb-12 md:mb-16">
                    <motion.h1
                        variants={fadeUp}
                        className="text-[clamp(2.8rem,9vw,6.5rem)] font-black tracking-[-0.04em] leading-[1.0] mb-6 max-w-4xl"
                        style={{ color: 'var(--hp-text)' }}
                    >
                        Find Your<br />
                        <span className="gradient-word relative inline-block">
                            Dream Career
                            {/* Underline accent */}
                            <svg aria-hidden className="absolute -bottom-2 left-0 w-full" viewBox="0 0 500 10" fill="none">
                                <path d="M4 7Q250 2 496 7" stroke="var(--hp-accent)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.45" />
                            </svg>
                        </span>{' '}Today.
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="text-base md:text-xl max-w-2xl leading-relaxed font-medium px-4 md:px-0"
                        style={{ color: 'var(--hp-muted)' }}
                    >
                        Direct access to verified hiring managers at the world's most innovative companies.
                        Skip the noise, start the conversation.
                    </motion.p>
                </motion.div>

                {/* ── Search Bar ── */}
                <motion.form
                    initial="hidden" animate="visible" variants={fadeUp}
                    onSubmit={handleSearch}
                    className="mb-10 md:mb-14 flex flex-col sm:flex-row items-stretch w-full max-w-3xl rounded-2xl md:rounded-[28px] border overflow-hidden p-1.5 transition-all duration-500"
                    style={{
                        background: 'color-mix(in srgb, var(--hp-surface) 40%, transparent)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(40px)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                    }}
                >
                    {/* Keyword */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-4 transition-colors group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onFocus={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onBlur={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Job title or keyword…"
                            className="flex-1 bg-transparent text-base outline-none font-semibold placeholder:font-normal"
                            style={{ color: 'var(--hp-text)', caretColor: 'var(--hp-accent)' }}
                        />
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3 px-5 py-4 sm:w-60 transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onFocus={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onBlur={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--hp-accent)' }} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <input
                            type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
                            placeholder="Location…"
                            className="flex-1 bg-transparent text-base outline-none font-semibold placeholder:font-normal"
                            style={{ color: 'var(--hp-text)', caretColor: 'var(--hp-accent)' }}
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit"
                        className="hp-btn-primary px-10 md:px-14 py-4 text-sm font-black rounded-xl md:rounded-[20px] whitespace-nowrap m-1"
                        style={{ boxShadow: '0 8px 32px color-mix(in srgb, var(--hp-accent) 25%, transparent)' }}>
                        Find Jobs
                    </button>
                </motion.form>

                {/* ── Quick Stats Row ── */}
                <motion.div
                    initial="hidden" animate="visible" variants={fadeUp}
                    className="flex flex-wrap items-center justify-center gap-3 mb-10 md:mb-12"
                >
                    {[
                        { label: 'Active Jobs', value: '12,400+' },
                        { label: 'Verified Companies', value: '3,200+' },
                        { label: 'Hired This Month', value: '2,400+' },
                    ].map(({ label, value }) => (
                        <div key={label}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-full border"
                            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
                        >
                            <span className="text-sm font-black" style={{ color: 'var(--hp-accent)' }}>{value}</span>
                            <span className="text-xs font-medium" style={{ color: 'var(--hp-muted)' }}>{label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* ── CTA + Social Proof ── */}
                <motion.div
                    initial="hidden" animate="visible" variants={fadeUp}
                    className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-8"
                >
                    <Link to="/register"
                        className="hp-btn-primary w-full md:w-auto px-12 py-4 md:py-5 text-base"
                        style={{ boxShadow: '0 12px 40px color-mix(in srgb, var(--hp-accent) 25%, transparent)' }}
                    >
                        Get Started Free
                    </Link>

                    {/* Avatar strip */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i}
                                    className="w-9 h-9 rounded-full overflow-hidden ring-2"
                                    style={{ ringColor: 'var(--hp-bg)' }}
                                >
                                    <img 
                                        src={`/avatars/avatar${i}.png`} 
                                        alt={`User ${i}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold" style={{ color: 'var(--hp-text)' }}>+2,400 joining today</div>
                            <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <svg key={s} className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="var(--hp-accent)">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.051 2.217c-.785.57-1.84-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L3.012 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                                    </svg>
                                ))}
                                <span className="text-[10px] font-medium ml-0.5" style={{ color: 'var(--hp-muted)' }}>4.9/5</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}