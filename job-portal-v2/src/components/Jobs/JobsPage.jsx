import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import JobSearch from './JobSearch';
import Logo from '../Logo';
import { useThemeStore } from '../../store/themeStore';

/* ─── Social Icons ───────────────────────────────────────────────── */
const SocialIcons = [
    { label: 'Twitter / X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
    { label: 'GitHub', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
];

function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';
    return (
        <button onClick={toggleTheme} aria-label="Toggle theme" className="hp-btn-ghost w-10 h-10 flex items-center justify-center">
            {isDark
                ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22" /></svg>
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            }
        </button>
    );
}

export default function JobsPage() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // GPU-accelerated scroll progress
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

    // Stable particles — useMemo prevents regeneration on re-renders
    const particles = useMemo(() =>
        [...Array(40)].map((_, i) => ({
            id: i,
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: Math.random() * 100,
            color: i % 2 === 0 ? 'var(--hp-accent)' : 'var(--hp-accent2)',
            duration: Math.random() * 8 + 12,
            delay: Math.random() * 5,
        })), []
    );

    // Theme class sync
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
        else { root.classList.add('light'); root.classList.remove('dark'); }
    }, [isDark]);

    // Close mobile menu on Escape
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') setMobileMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <>
            <style>{`
                :root, html.dark {
                    --hp-bg: #07090f; --hp-surface: #0d1117; --hp-surface-alt: rgba(255,255,255,.06);
                    --hp-card: #111520; --hp-border: rgba(255,255,255,.07); --hp-accent: #2dd4bf;
                    --hp-accent-rgb: 45,212,191; --hp-accent2: #a78bfa; --hp-accent2-rgb: 167,139,250;
                    --hp-text: #eef2ff; --hp-text-sub: #c7d0e8; --hp-muted: #6b7799;
                    --hp-nav-bg: rgba(7,9,15,.85); --hp-shadow-card: 0 8px 40px rgba(0,0,0,.55);
                }
                html.light {
                    --hp-bg: #f0f4fa; --hp-surface: #ffffff; --hp-surface-alt: rgba(0,0,0,.05);
                    --hp-card: #ffffff; --hp-border: rgba(0,0,0,.09); --hp-accent: #0d9488;
                    --hp-accent-rgb: 13,148,136; --hp-accent2: #7c3aed; --hp-accent2-rgb: 124,58,237;
                    --hp-text: #0c1220; --hp-text-sub: #374151; --hp-muted: #64748b;
                    --hp-nav-bg: rgba(240,244,250,.9); --hp-shadow-card: 0 4px 24px rgba(0,0,0,.08);
                }
                .hp-card {
                    background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px;
                    transition: border-color .25s, transform .25s, box-shadow .25s;
                    box-shadow: var(--hp-shadow-card);
                }
                .hp-card:hover { border-color: rgba(var(--hp-accent-rgb),.3); transform: translateY(-3px); }
                .hp-btn-primary {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                    color: #fff; font-weight: 700; border: none; border-radius: 12px;
                    cursor: pointer; transition: opacity .2s, transform .2s, box-shadow .2s;
                }
                .hp-btn-primary:hover { opacity: .88; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(var(--hp-accent-rgb),.25); }
                .hp-btn-ghost {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: var(--hp-surface-alt); border: 1px solid var(--hp-border);
                    color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s;
                }
                .hp-btn-ghost:hover { background: rgba(var(--hp-accent-rgb),.1); border-color: rgba(var(--hp-accent-rgb),.3); color: var(--hp-accent); }
                .gradient-word {
                    background: linear-gradient(135deg, var(--hp-accent) 20%, var(--hp-accent2) 80%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                }
                .hp-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
                .hp-particle { position: absolute; border-radius: 50%; animation: hp-float-up linear infinite; opacity: 0; }
                @keyframes hp-float-up {
                    0%  { transform: translateY(100vh) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: .2; }
                    100%{ transform: translateY(-10vh) scale(1); opacity: 0; }
                }
                .orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
            `}</style>

            <div style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

                {/* ── Particles ── */}
                <div className="hp-particles">
                    {particles.map(p => (
                        <div key={p.id} className="hp-particle" style={{
                            width: `${p.width}px`, height: `${p.height}px`,
                            left: `${p.left}%`, backgroundColor: p.color,
                            animation: `hp-float-up ${p.duration}s linear ${p.delay}s infinite`
                        }} />
                    ))}
                </div>

                {/* ── Scroll Progress ── */}
                <motion.div
                    className="fixed top-0 left-0 right-0 h-[3px] z-[200] origin-left"
                    style={{ scaleX, background: 'linear-gradient(90deg, var(--hp-accent), var(--hp-accent2))' }}
                />

                {/* ── Navbar ── */}
                <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
                    style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--hp-border)' }}>
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <Link to="/"><Logo size="md" showTagline /></Link>

                        {/* Desktop */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            <Link to="/" className="text-sm font-semibold px-2 transition-colors"
                                style={{ color: 'var(--hp-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}>
                                ← Home
                            </Link>
                            <Link to="/login" className="hp-btn-ghost px-5 py-2.5 text-sm">Login</Link>
                            <Link to="/register" className="hp-btn-primary px-6 py-2.5 text-sm">Sign Up</Link>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="flex md:hidden items-center gap-2">
                            <ThemeToggle />
                            <button onClick={() => setMobileMenuOpen(p => !p)} aria-label="Toggle menu"
                                className="hp-btn-ghost w-10 h-10 flex items-center justify-center">
                                {mobileMenuOpen
                                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Mobile dropdown */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="md:hidden border-t mt-3 pt-4 pb-3 space-y-2" style={{ borderColor: 'var(--hp-border)' }}
                            >
                                <Link to="/" onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-xl text-sm font-semibold" style={{ color: 'var(--hp-muted)' }}>← Home</Link>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-xl text-sm font-semibold" style={{ color: 'var(--hp-text)' }}>Login</Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                                    className="hp-btn-primary block text-center px-5 py-2.5 text-sm mt-2">Sign Up</Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                {/* ── Page Content ── */}
                <div className="max-w-7xl mx-auto px-6 pt-32 pb-10 relative z-10">
                    {/* Decorative orb */}
                    <div className="orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, var(--hp-accent) 0%, transparent 70%)', top: '-10%', right: '-5%', opacity: 0.06 }} />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 mb-10"
                    >
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs font-semibold mb-5" style={{ color: 'var(--hp-muted)' }}>
                            <Link to="/" className="transition-colors"
                                style={{ color: 'var(--hp-muted)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}>
                                Home
                            </Link>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            <span style={{ color: 'var(--hp-accent)' }}>Browse Jobs</span>
                        </div>

                        {/* Header row */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                                    Browse <span className="gradient-word">Opportunities</span>
                                </h1>
                                <p className="font-medium max-w-md" style={{ color: 'var(--hp-muted)' }}>
                                    Explore verified roles from top companies. New listings added daily.
                                </p>
                            </div>

                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { icon: '✅', text: 'Verified Employers' },
                                    { icon: '⚡', text: 'Real-time Listings' },
                                    { icon: '🤖', text: 'AI Resume Match' },
                                ].map(f => (
                                    <div key={f.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                                        style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }}>
                                        {f.icon} {f.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── JobSearch ── */}
                    <JobSearch />
                </div>

                {/* ── Footer ── */}
                <footer className="py-14 border-t mt-4" style={{ background: 'var(--hp-bg)', borderColor: 'var(--hp-border)' }}>
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <Logo size="sm" showTagline />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--hp-muted)' }}>© 2026 HIREHUB.</span>
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hidden md:block" style={{ color: 'var(--hp-muted)' }}>
                                Engineering Tomorrow's Workforce
                            </p>
                            <div className="flex gap-3">
                                {SocialIcons.map((s, i) => (
                                    <a key={i} href="#" aria-label={s.label}
                                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all border"
                                        style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)', color: 'var(--hp-muted)' }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = 'var(--hp-accent)';
                                            e.currentTarget.style.borderColor = 'rgba(var(--hp-accent-rgb),.4)';
                                            e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb),.08)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = 'var(--hp-muted)';
                                            e.currentTarget.style.borderColor = 'var(--hp-border)';
                                            e.currentTarget.style.background = 'var(--hp-surface-alt)';
                                        }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                            <path d={s.path} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
