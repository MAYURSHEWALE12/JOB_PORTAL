import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { jobAPI, API_BASE_URL } from '../../services/api';
import AnimatedNumber from './AnimatedNumber';
import Logo from '../Logo';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';



/* ─── Animation Variants ─────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }
    }),
};
const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/* ─── Job Type Pill Styles ───────────────────────────────────────── */
const JOB_TYPE_STYLE = {
    FULL_TIME:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME:  'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
    CONTRACT:   'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    REMOTE:     'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function resolveLogoUrl(job) {
    let url = job.companyLogo || job.employer?.companyProfile?.logoUrl || job.employer?.profileImageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('logo_') || url.startsWith('banner_')) return `${API_BASE_URL}/companies/image/${url}`;
    if (url.startsWith('avatar_')) return `${API_BASE_URL.replace('/api', '')}${url}`;
    return url;
}

function formatSalary(min, max) {
    if (!min && !max) return 'Salary undisclosed';
    if (min && max) return `₹${(min / 100000).toFixed(1)}L – ₹${(max / 100000).toFixed(1)}L`;
    if (min) return `₹${(min / 100000).toFixed(1)}L+`;
    return `Up to ₹${(max / 100000).toFixed(1)}L`;
}

/* ─── Sub-Components ─────────────────────────────────────────────── */
function CompanyAvatar({ job, size = 'md' }) {
    const url = resolveLogoUrl(job);
    const name = job.companyName || job.employer?.companyProfile?.companyName || job.employer?.firstName || 'J';
    const dim = size === 'lg' ? 'w-14 h-14 text-xl rounded-2xl' : 'w-11 h-11 text-base rounded-xl';
    return url ? (
        <img
            src={url} alt={name}
            className={`${dim} object-cover flex-shrink-0 border border-white/10`}
            onError={e => { e.target.style.display = 'none'; }}
        />
    ) : (
        <div
            className={`${dim} flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg`}
            style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function StarRating({ count = 5 }) {
    return (
        <div className="flex gap-0.5 mb-4">
            {[...Array(count)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';
    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hp-btn-ghost w-10 h-10 flex items-center justify-center"
        >
            {isDark
                ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22" /></svg>
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            }
        </button>
    );
}

/* ─── Animated Chevron for FAQ ───────────────────────────────────── */
function ChevronIcon({ open }) {
    return (
        <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            width="18" height="18" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}
            style={{ color: open ? 'var(--hp-accent)' : 'var(--hp-muted)', flexShrink: 0 }}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
    );
}

/* ─── Social Icons ───────────────────────────────────────────────── */
const SocialIcons = [
    { label: 'Twitter / X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
    { label: 'GitHub', path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22' },
];

/* ─── Main Component ─────────────────────────────────────────────── */
export default function HomePage() {
    const { theme } = useThemeStore();
    const { isLoggedIn } = useAuthStore();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [activeFaq, setActiveFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Framer Motion smooth scroll progress
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

    // Stable particles — computed once
    const particles = useMemo(() =>
        [...Array(60)].map((_, i) => ({
            id: i,
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            left: Math.random() * 100,
            color: i % 3 === 0 ? 'var(--hp-accent)' : i % 3 === 1 ? 'var(--hp-accent2)' : 'var(--hp-muted)',
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 10,
        })), []
    );

    // Theme class on root
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
        else { root.classList.add('light'); root.classList.remove('dark'); }
    }, [isDark]);

    // Close modal on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setSelectedJob(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Fetch jobs
    useEffect(() => {
        (async () => {
            try {
                const res = await jobAPI.getAll();
                let d = res.data;
                if (!Array.isArray(d)) d = d?.jobs || d?.content || [];
                setJobs([...d].reverse());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    const recentJobs = jobs.slice(0, 6);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (searchLocation) params.set('location', searchLocation);
        navigate(`/jobs?${params.toString()}`);
    };

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (subscribeEmail) setSubscribed(true);
    };

    return (
        <>
            <style>{`
                :root, html.dark {
                    --hp-bg: #07090f; --hp-surface: #0d1117; --hp-surface-alt: rgba(255,255,255,.06);
                    --hp-card: #111520; --hp-border: rgba(255,255,255,.07); --hp-accent: #2dd4bf;
                    --hp-accent-rgb: 45,212,191; --hp-accent2: #a78bfa; --hp-text: #eef2ff;
                    --hp-text-sub: #c7d0e8; --hp-muted: #6b7799; --hp-nav-bg: rgba(7,9,15,.85); --hp-marquee: rgba(255,255,255,.18);
                    --hp-shadow-card: 0 8px 40px rgba(0,0,0,.55);
                }
                html.light {
                    --hp-bg: #f0f4fa; --hp-surface: #ffffff; --hp-surface-alt: rgba(0,0,0,.05);
                    --hp-card: #ffffff; --hp-border: rgba(0,0,0,.09); --hp-accent: #0d9488;
                    --hp-accent-rgb: 13,148,136; --hp-accent2: #7c3aed; --hp-text: #0c1220;
                    --hp-text-sub: #374151; --hp-muted: #64748b; --hp-nav-bg: rgba(240,244,250,.9); --hp-marquee: rgba(0,0,0,.25);
                    --hp-shadow-card: 0 4px 24px rgba(0,0,0,.08);
                }

                /* Cards */
                .hp-card {
                    background: var(--hp-card);
                    border: 1px solid var(--hp-border);
                    border-radius: 16px;
                    transition: all .25s ease;
                    box-shadow: var(--hp-shadow-card);
                }
                .hp-card:hover { border-color: rgba(var(--hp-accent-rgb), .3); transform: translateY(-3px); }

                /* Buttons */
                .hp-btn-primary {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                    color: #fff; font-weight: 700; border: none; border-radius: 12px;
                    cursor: pointer; transition: all .2s;
                }
                .hp-btn-primary:hover { opacity: .88; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(var(--hp-accent-rgb),.25); }
                .hp-btn-ghost {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: var(--hp-surface-alt); border: 1px solid var(--hp-border);
                    color: var(--hp-text); font-weight: 600; border-radius: 12px;
                    cursor: pointer; transition: all .2s;
                }
                .hp-btn-ghost:hover { background: rgba(var(--hp-accent-rgb),.1); border-color: rgba(var(--hp-accent-rgb),.3); color: var(--hp-accent); }

                /* Gradient text */
                .gradient-word {
                    background: linear-gradient(135deg, var(--hp-accent) 20%, var(--hp-accent2) 80%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Marquee */
                .marquee-track { animation: marquee 25s linear infinite; display:flex; gap:3.5rem; white-space:nowrap; }
                @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

                /* Pills */
                .tag-pill { display: inline-flex; align-items: center; padding: .25rem .6rem; border-radius: 999px; font-size: .68rem; font-weight: 600; letter-spacing: .03em; }

                /* Float animations */
                .float1 { animation: floatY 6s ease-in-out infinite; }
                .float2 { animation: floatY 7s ease-in-out infinite; animation-delay: 1s; }
                @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

                /* Orbs */
                .orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }

                /* Particles */
                .hp-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
                .hp-particle { position: absolute; border-radius: 50%; animation: hp-float-up linear infinite; opacity: 0; }
                @keyframes hp-float-up {
                    0%{transform:translateY(100vh)scale(0);opacity:0}
                    10%{opacity:1}
                    90%{opacity:.25}
                    100%{transform:translateY(-10vh)scale(1);opacity:0}
                }

                /* Scrollbar */
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Search input */
                .hp-search-input {
                    background: var(--hp-surface-alt);
                    border: 1px solid var(--hp-border);
                    color: var(--hp-text);
                    outline: none;
                    transition: border-color .2s, box-shadow .2s;
                }
                .hp-search-input:focus {
                    border-color: rgba(var(--hp-accent-rgb), .5);
                    box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), .1);
                }
                .hp-search-input::placeholder { color: var(--hp-muted); }

                /* Glow pulse on CTA */
                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(var(--hp-accent-rgb), .2); }
                    50% { box-shadow: 0 0 40px rgba(var(--hp-accent-rgb), .45); }
                }
                .glow-cta { animation: glow-pulse 3s ease-in-out infinite; }

                /* Mobile menu */
                .mobile-menu { backdrop-filter: blur(20px); }
            `}</style>

            <div style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

                {/* ── Floating Particles ── */}
                <div className="hp-particles">
                    {particles.map(p => (
                        <div key={p.id} className="hp-particle" style={{
                            width: `${p.width}px`, height: `${p.height}px`,
                            left: `${p.left}%`, backgroundColor: p.color,
                            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`
                        }} />
                    ))}
                </div>

                {/* ── Scroll Progress (GPU-animated via Framer) ── */}
                <motion.div
                    className="fixed top-0 left-0 right-0 h-[3px] z-[200] origin-left"
                    style={{
                        scaleX,
                        background: 'linear-gradient(90deg, var(--hp-accent), var(--hp-accent2))'
                    }}
                />

                {/* ── Navbar ── */}
                <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4" style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--hp-border)' }}>
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div 
                            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')} 
                            className="cursor-pointer"
                        >
                            <Logo size="md" showTagline />
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            <Link to="/jobs" className="text-sm font-semibold text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors px-2">Browse Jobs</Link>
                            <Link to="/login" className="hp-btn-ghost px-5 py-2.5 text-sm">Login</Link>
                            <Link to="/register" className="hp-btn-primary px-6 py-2.5 text-sm">Sign Up</Link>
                        </div>

                        {/* Mobile Nav Toggle */}
                        <div className="flex md:hidden items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileMenuOpen(p => !p)}
                                className="hp-btn-ghost w-10 h-10 flex items-center justify-center"
                                aria-label="Toggle mobile menu"
                            >
                                <motion.div animate={mobileMenuOpen ? 'open' : 'closed'}>
                                    {mobileMenuOpen
                                        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    }
                                </motion.div>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="md:hidden mobile-menu border-t mt-3 pt-4 pb-3 space-y-2" style={{ borderColor: 'var(--hp-border)' }}
                            >
                                <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm font-semibold text-[var(--hp-muted)] hover:text-[var(--hp-accent)] hover:bg-[var(--hp-surface-alt)] transition-all">Browse Jobs</Link>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-sm font-semibold text-[var(--hp-text)] hover:bg-[var(--hp-surface-alt)] transition-all">Login</Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="hp-btn-primary block text-center px-5 py-2.5 text-sm mt-2">Sign Up</Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                {/* ── Hero Section ── */}
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

                                {/* ── Search Bar ── */}
                                <motion.form variants={fadeUp} onSubmit={handleSearch} className="mb-8 flex flex-col sm:flex-row gap-2 max-w-xl">
                                    <div className="flex-1 flex items-center gap-3 hp-search-input rounded-xl px-4 py-3">
                                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hp-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                                        <input
                                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Job title or keyword…"
                                            className="flex-1 bg-transparent text-sm outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 hp-search-input rounded-xl px-4 py-3 sm:w-44">
                                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hp-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <input
                                            type="text" value={searchLocation} onChange={e => setSearchLocation(e.target.value)}
                                            placeholder="Location…"
                                            className="flex-1 bg-transparent text-sm outline-none text-[var(--hp-text)] placeholder:text-[var(--hp-muted)]"
                                        />
                                    </div>
                                    <button type="submit" className="hp-btn-primary px-6 py-3 text-sm glow-cta">Search</button>
                                </motion.form>

                                <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                                    <Link to="/resume-builder" className="hp-btn-primary px-10 py-4 text-base">Get Started Free</Link>
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

                {/* ── Trusted Marquee ── */}
                <div className="py-8 border-y overflow-hidden relative z-10" style={{ background: 'var(--hp-surface)', borderColor: 'var(--hp-border)' }}>
                    <div className="marquee-track">
                        {[...Array(2)].map((_, idx) => (
                            <div key={idx} className="flex gap-16 items-center">
                                {['Google', 'Microsoft', 'Amazon', 'Netflix', 'Salesforce', 'Uber', 'Airbnb', 'Stripe', 'Spotify', 'Adobe', 'Meta', 'Tesla'].map(c => (
                                    <span key={c} className="text-2xl font-black tracking-tighter" style={{ color: 'var(--hp-marquee)', opacity: 0.5 }}>{c}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Stats Section ── */}
                <section className="py-24 relative z-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
                            {[
                                { label: 'Active Openings', val: jobs.length || 124, color: 'var(--hp-accent)', icon: '💼' },
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

                {/* ── Resume Builder Section ── */}
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

                {/* ── Process Steps ── */}
                <section className="py-24" style={{ background: 'var(--hp-surface)' }}>
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-[var(--hp-text)]">Simple Three-Step Process</h2>
                            <p className="font-medium text-[var(--hp-muted)]">Your professional journey simplified into three clear phases.</p>
                        </motion.div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { n: '01', title: 'Discover Roles', icon: '🔍', desc: 'Browse curated verified job openings matched to your unique skill set.' },
                                { n: '02', title: 'One-Click Apply', icon: '📄', desc: 'Apply instantly using your optimized profile and securely synced resume.' },
                                { n: '03', title: 'Get Hired', icon: '🎯', desc: 'Track application status and manage your interviews directly from the vault.' },
                            ].map((step, i) => (
                                <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} className="hp-card p-8 text-center relative group">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xl"
                                        style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>{step.n}</div>
                                    <div className="text-5xl mb-6 mt-4 group-hover:scale-110 transition-transform">{step.icon}</div>
                                    <h3 className="text-xl font-bold mb-3 text-[var(--hp-text)]">{step.title}</h3>
                                    <p className="text-sm text-[var(--hp-muted)] leading-relaxed">{step.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Recent Jobs Grid ── */}
                <section id="jobs" className="py-24 scroll-mt-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter mb-2 text-[var(--hp-text)]">Recent Postings</h2>
                                <p className="font-medium text-[var(--hp-muted)]">Premium opportunities posted within the last 24 hours.</p>
                            </div>
                            <Link to="/jobs" className="hp-btn-ghost px-6 py-2.5 text-xs font-black uppercase tracking-widest hidden md:block">Explore All Listings</Link>
                        </div>

                        {loading ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => <div key={i} className="hp-card h-64 animate-pulse opacity-40" />)}
                            </div>
                        ) : recentJobs.length === 0 ? (
                            <div className="hp-card p-16 text-center">
                                <div className="text-5xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold mb-2 text-[var(--hp-text)]">No listings yet</h3>
                                <p className="text-sm text-[var(--hp-muted)]">Check back soon — new opportunities are added daily.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentJobs.map(job => (
                                    <motion.div
                                        key={job.id} whileHover={{ y: -6 }}
                                        onClick={() => setSelectedJob(job)}
                                        className="hp-card p-6 flex flex-col cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <CompanyAvatar job={job} />
                                            <span className={`tag-pill ${JOB_TYPE_STYLE[job.jobType] || ''}`}>
                                                {job.jobType?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold group-hover:text-[var(--hp-accent)] transition-colors mb-1 text-[var(--hp-text)]">{job.title}</h3>
                                        <p className="text-sm font-medium mb-2 text-[var(--hp-muted)]">
                                            {job.companyName || job.employer?.companyProfile?.companyName || 'Verified Employer'}
                                        </p>
                                        {job.location && (
                                            <p className="text-xs text-[var(--hp-muted)] flex items-center gap-1 mb-6">
                                                <span>📍</span> {job.location}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-5 border-t flex justify-between items-center" style={{ borderColor: 'var(--hp-border)' }}>
                                            <span className="text-sm font-bold text-[var(--hp-accent)]">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                            <span className="text-[10px] font-black uppercase text-[var(--hp-muted)]">View Details →</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <div className="mt-10 text-center md:hidden">
                            <Link to="/jobs" className="hp-btn-ghost px-6 py-2.5 text-xs font-black uppercase tracking-widest">Explore All Listings</Link>
                        </div>
                    </div>
                </section>

                {/* ── Testimonials ── */}
                <section className="py-24" style={{ background: 'var(--hp-surface)' }}>
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black tracking-tighter mb-4 text-[var(--hp-text)]">Community Stories</h2>
                            <p className="text-[var(--hp-muted)]">Join thousands of professionals who found their path on HireHub.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { name: 'Sarah J.', role: 'Frontend Engineer', text: 'I secured a role at a top-tier startup within 10 days. The direct communication pipeline is unmatched.', stars: 5 },
                                { name: 'David W.', role: 'Product Lead', text: 'The cleanest interface I have used for a job search. No clutter, just high-quality, verified opportunities.', stars: 5 },
                                { name: 'Ananya R.', role: 'Data Scientist', text: 'The built-in assessment tools let me demonstrate my technical skills before the first screening call.', stars: 5 },
                            ].map((t, i) => (
                                <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} className="hp-card p-8" style={{ background: 'var(--hp-bg)' }}>
                                    <StarRating count={t.stars} />
                                    <p className="text-sm italic text-[var(--hp-text-sub)] mb-8 leading-relaxed">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-white/10" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }} />
                                        <div>
                                            <div className="font-bold text-sm text-[var(--hp-text)]">{t.name}</div>
                                            <div className="text-[10px] text-[var(--hp-muted)] uppercase font-black tracking-widest">{t.role}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-24">
                    <div className="max-w-3xl mx-auto px-6">
                        <h2 className="text-4xl font-black tracking-tighter text-center mb-12 text-[var(--hp-text)]">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {[
                                { q: 'Is the platform free for candidates?', a: 'Yes! Job seekers can browse, apply, and use our assessment tools at zero cost.' },
                                { q: 'How do you verify job listings?', a: 'Every employer is manually vetted, and listings are verified within 24 hours of posting.' },
                                { q: 'Can I track my application in real-time?', a: 'Absolutely. Your dashboard provides live status updates from "Applied" to "Hired".' },
                                { q: 'What makes HireHub different from other job boards?', a: 'We focus on verified employers, direct hiring manager access, and AI-powered matching — no spam, no ghost listings.' },
                            ].map((faq, i) => (
                                <div key={i} className="hp-card p-5 cursor-pointer overflow-hidden" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                    <div className="flex justify-between items-center font-bold text-sm text-[var(--hp-text)] gap-4">
                                        <span>{faq.q}</span>
                                        <ChevronIcon open={activeFaq === i} />
                                    </div>
                                    <AnimatePresence>
                                        {activeFaq === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                className="text-sm text-[var(--hp-muted)] pt-4 leading-relaxed overflow-hidden"
                                            >
                                                {faq.a}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Newsletter ── */}
                <section className="py-24 relative overflow-hidden" style={{ background: 'var(--hp-surface)' }}>
                    <div className="orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, var(--hp-accent2) 0%, transparent 70%)', top: '-30%', right: '-10%', opacity: 0.06 }} />
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                            <motion.h2 variants={fadeUp} className="text-4xl font-black tracking-tighter mb-4 text-[var(--hp-text)]">Stay Ahead of the Curve</motion.h2>
                            <motion.p variants={fadeUp} className="mb-10 max-w-md mx-auto text-[var(--hp-muted)]">Get personalized weekly job alerts delivered straight to your inbox.</motion.p>
                            <motion.div variants={fadeUp}>
                                {subscribed ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border"
                                        style={{ background: 'rgba(var(--hp-accent-rgb),.1)', borderColor: 'rgba(var(--hp-accent-rgb),.3)' }}
                                    >
                                        <span className="text-xl">✅</span>
                                        <span className="font-bold text-[var(--hp-accent)]">You're subscribed! Welcome aboard.</span>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                                        <input
                                            type="email" required value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)}
                                            placeholder="professional@email.com"
                                            className="flex-1 hp-search-input rounded-xl px-5 py-3 text-sm"
                                        />
                                        <button type="submit" className="hp-btn-primary px-10 py-3 text-sm">Subscribe</button>
                                    </form>
                                )}
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="py-20 border-t" style={{ background: 'var(--hp-bg)', borderColor: 'var(--hp-border)' }}>
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                            {[
                                { h: 'Platform', l: ['Browse Jobs', 'Career Roadmap', 'Salary Insights', 'Skill Labs'] },
                                { h: 'Company', l: ['About HireHub', 'Success Stories', 'Privacy Vault', 'Contact Support'] },
                                { h: 'Recruiters', l: ['Post a Role', 'ATS Solutions', 'Talent Search', 'Premium Pricing'] },
                                { h: 'Community', l: ['Product Blog', 'User Forums', 'Developer API', 'Social Impact'] },
                            ].map(sec => (
                                <div key={sec.h}>
                                    <h4 className="text-xs font-black uppercase tracking-widest mb-6 opacity-80" style={{ color: 'var(--hp-text)' }}>{sec.h}</h4>
                                    <ul className="space-y-4">
                                        {sec.l.map(link => (
                                            <li key={link}>
                                                <a href="#" className="text-sm transition-colors" style={{ color: 'var(--hp-muted)' }}
                                                    onMouseEnter={e => e.target.style.color = 'var(--hp-accent)'}
                                                    onMouseLeave={e => e.target.style.color = 'var(--hp-muted)'}
                                                >{link}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t gap-6" style={{ borderColor: 'var(--hp-border)' }}>
                            <div className="flex items-center gap-4">
                                <Logo size="sm" showTagline />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--hp-muted)' }}>© 2026 HIREHUB.</span>
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--hp-muted)' }}>Engineering Tomorrow's Workforce</p>
                            <div className="flex gap-3">
                                {SocialIcons.map((s, i) => (
                                    <a key={i} href="#" aria-label={s.label}
                                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all border"
                                        style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)', color: 'var(--hp-muted)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--hp-accent)'; e.currentTarget.style.borderColor = 'rgba(var(--hp-accent-rgb),.4)'; e.currentTarget.style.opacity = '1'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--hp-muted)'; e.currentTarget.style.borderColor = 'var(--hp-border)'; }}
                                    >
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

            {/* ── Job Detail Modal ── */}
            <AnimatePresence>
                {selectedJob && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-black/75"
                        onClick={() => setSelectedJob(null)}
                        role="dialog" aria-modal="true" aria-label={selectedJob.title}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            transition={{ ease: [0.16, 1, 0.3, 1] }}
                            className="hp-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: 'var(--hp-border)', background: 'rgba(255,255,255,.02)' }}>
                                <div className="flex items-center gap-5">
                                    <CompanyAvatar job={selectedJob} size="lg" />
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-[var(--hp-text)]">{selectedJob.title}</h2>
                                        <p className="font-bold text-sm uppercase tracking-widest mt-1" style={{ color: 'var(--hp-accent)' }}>
                                            {selectedJob.companyName || 'Verified Employer'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--hp-muted)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'var(--hp-text)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--hp-muted)'; }}
                                    aria-label="Close modal"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto flex-1 hide-scrollbar">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                                    {[
                                        { l: 'Location', v: selectedJob.location, i: '📍' },
                                        { l: 'Type', v: selectedJob.jobType, i: '💼' },
                                        { l: 'Experience', v: selectedJob.experienceRequired || 'Freshers', i: '🎓' },
                                        { l: 'Openings', v: selectedJob.positionsAvailable || '1', i: '👥' },
                                    ].map(s => (
                                        <div key={s.l} className="p-4 rounded-xl text-center border" style={{ background: 'rgba(255,255,255,.03)', borderColor: 'rgba(255,255,255,.05)' }}>
                                            <div className="text-xl mb-1">{s.i}</div>
                                            <div className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--hp-muted)' }}>{s.l}</div>
                                            <div className="text-xs font-bold truncate text-[var(--hp-text)]">{String(s.v || '').replace(/_/g, ' ')}</div>
                                        </div>
                                    ))}
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-1" style={{ color: 'var(--hp-muted)' }}>Job Specification</h4>
                                <p className="text-sm leading-relaxed whitespace-pre-line p-5 rounded-2xl border" style={{ color: 'var(--hp-text-sub)', background: 'rgba(255,255,255,.01)', borderColor: 'rgba(255,255,255,.05)' }}>
                                    {selectedJob.description}
                                </p>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t" style={{ borderColor: 'var(--hp-border)', background: 'rgba(255,255,255,.02)' }}>
                                <button onClick={() => navigate('/login')} className="hp-btn-primary w-full py-4 text-base" style={{ boxShadow: '0 8px 30px rgba(var(--hp-accent-rgb),.15)' }}>
                                    Sign in to Submit Application
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}