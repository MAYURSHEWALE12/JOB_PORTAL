import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { companyAPI, jobAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from '../Loader';
import Logo from '../Logo';
import Footer from '../Footer';
import { useThemeStore } from '../../store/themeStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

export default function CompanyProfilePage() {
    const { userId } = useParams();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Theme class sync - ensure HTML element has correct state
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
        else { root.classList.add('light'); root.classList.remove('dark'); }
    }, [isDark]);

    // Framer Motion scroll progress
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

    // Background Particles
    const particles = useMemo(() =>
        [...Array(30)].map((_, i) => ({
            id: i,
            size: Math.random() * 5 + 2,
            left: Math.random() * 100,
            duration: Math.random() * 10 + 12,
            delay: Math.random() * 5,
            color: i % 2 === 0 ? 'var(--hp-accent)' : 'var(--hp-accent2)',
        })), []
    );

    useEffect(() => {
        if (userId) {
            fetchCompanyData();
        }
    }, [userId]);

    const fetchCompanyData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [profileRes, jobsRes] = await Promise.all([
                companyAPI.getByUser(userId),
                jobAPI.getByEmployer(userId)
            ]);
            setProfile(profileRes.data);

            // Handle different job response formats
            let jobList = [];
            if (Array.isArray(jobsRes.data)) {
                jobList = jobsRes.data;
            } else if (jobsRes.data?.content && Array.isArray(jobsRes.data.content)) {
                jobList = jobsRes.data.content;
            }
            setJobs(jobList.filter(j => j.status === 'ACTIVE'));
        } catch (err) {
            console.error('Failed to fetch company data:', err);
            setError('Could not load company profile. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]" style={{ background: 'var(--hp-bg)' }}>
                <div className="flex flex-col items-center gap-4">
                    <svg className="w-10 h-10 animate-spin" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-medium tracking-wide text-sm" style={{ color: 'var(--hp-muted)' }}>Loading Company Profile...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--hp-bg)' }}>
                <style>{`
                    .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(var(--hp-accent-rgb), .35); }
                    .hp-btn-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), .45); }
                `}</style>
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                    <svg className="w-12 h-12" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h2 className="text-3xl font-bold text-[var(--hp-text)] mb-3 tracking-tight">Profile Not Found</h2>
                <p className="text-[var(--hp-muted)] mb-8 max-w-md">{error || "This company hasn't set up their public profile yet."}</p>
                <Link to="/dashboard" className="hp-btn-primary px-8 py-3.5">Return to Dashboard</Link>
            </div>
        );
    }

    const resolveUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (path.startsWith('logo_') || path.startsWith('banner_')) {
            return `${API_BASE_URL}/companies/image/${path}`;
        }
        return `${API_BASE_URL.replace('/api', '')}${path}`;
    };

    const companyLogo = resolveUrl(profile.logoUrl);
    const bannerImage = resolveUrl(profile.bannerUrl);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        // We'll use a temporary visual state for the button instead of a gross alert
        const btn = document.getElementById('share-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Copied!';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative z-10" style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <style>{`
                :root, html.dark {
                    --hp-bg: #07090f; --hp-surface: #0d1117; --hp-surface-alt: rgba(255,255,255,.06);
                    --hp-card: #111520; --hp-border: rgba(255,255,255,.07); --hp-accent: #2dd4bf;
                    --hp-accent-rgb: 45,212,191; --hp-accent2: #a78bfa; --hp-text: #eef2ff;
                    --hp-text-sub: #c7d0e8; --hp-muted: #6b7799; --hp-nav-bg: rgba(7,9,15,.85);
                    --hp-shadow-card: 0 8px 40px rgba(0,0,0,.55);
                }
                html.light {
                    --hp-bg: #f0f4fa; --hp-surface: #ffffff; --hp-surface-alt: rgba(0,0,0,.05);
                    --hp-card: #ffffff; --hp-border: rgba(0,0,0,.09); --hp-accent: #0d9488;
                    --hp-accent-rgb: 13,148,136; --hp-accent2: #7c3aed; --hp-text: #0c1220;
                    --hp-text-sub: #374151; --hp-muted: #64748b; --hp-nav-bg: rgba(240,244,250,.9);
                    --hp-shadow-card: 0 4px 24px rgba(0,0,0,.08);
                }

                @keyframes hp-float-up {
                    from { transform: translateY(100vh) scale(0); opacity: 0; }
                    20% { opacity: 0.6; }
                    80% { opacity: 0.3; }
                    to { transform: translateY(-10vh) scale(1.5); opacity: 0; }
                }

                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all 0.25s ease; }
                .hp-card-hover:hover { border-color: rgba(var(--hp-accent-rgb), 0.35); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.15); }
                
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(var(--hp-accent-rgb), .35); }
                .hp-btn-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), .45); }
                
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover { background: rgba(var(--hp-accent-rgb), .1); border-color: rgba(var(--hp-accent-rgb), .3); color: var(--hp-accent); }

                /* Markdown Styling for Dark/Light compatibility */
                .hp-markdown h1, .hp-markdown h2, .hp-markdown h3 { color: var(--hp-text); font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; }
                .hp-markdown p { color: var(--hp-text-sub); line-height: 1.7; margin-bottom: 1em; }
                .hp-markdown ul { list-style-type: disc; padding-left: 1.5em; color: var(--hp-text-sub); margin-bottom: 1em; }
                .hp-markdown li { margin-bottom: 0.5em; }
                .hp-markdown strong { color: var(--hp-text); font-weight: 700; }
                .hp-markdown a { color: var(--hp-accent); text-decoration: underline; }
                .hp-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: -1; }
                .hp-particle { position: absolute; border-radius: 50%; animation: hp-float-up linear infinite; opacity: 0; }
                @keyframes hp-float-up {
                    0%   { transform: translateY(100vh) scale(0); opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: .25; }
                    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                }
                .hp-card-opportunity:hover .hp-btn-apply { transform: translateX(4px); opacity: 1; }
            `}</style>

            {/* Scroll Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1 origin-left z-[100]" 
                style={{ scaleX, background: 'linear-gradient(90deg, var(--hp-accent), var(--hp-accent2))' }} 
            />

            {/* Background Effects */}
            <div className="hp-particles">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="hp-particle"
                        style={{
                            width: `${p.size}px`, height: `${p.size}px`,
                            left: `${p.left}%`, backgroundColor: p.color,
                            animation: `hp-float-up ${p.duration}s linear ${p.delay}s infinite`
                        }}
                    />
                ))}
            </div>

            {/* Glowing Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20" style={{ background: 'var(--hp-accent)' }} />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full blur-[100px] opacity-15" style={{ background: 'var(--hp-accent2)' }} />
            </div>

            {/* Public Navigation Bar */}
            <nav className="sticky top-0 z-50 px-6 py-3 flex justify-between items-center border-b" style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(20px)', borderColor: 'var(--hp-border)' }}>
                <Link to="/">
                    <Logo size="md" showTagline />
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button id="share-btn" onClick={handleCopyLink} className="hp-btn-ghost hidden sm:flex text-sm px-4 py-2 gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Share
                    </button>
                    <Link to="/dashboard" className="hp-btn-primary text-sm px-5 py-2">
                        Dashboard
                    </Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto w-full pt-8 pb-20 px-4 sm:px-6 flex-grow">

                {/* Hero Banner Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl overflow-hidden mb-20 shadow-2xl border"
                    style={{ borderColor: 'var(--hp-border)' }}
                >
                    <div className="h-48 md:h-72 w-full relative">
                        {bannerImage ? (
                            <img src={bannerImage} alt={`${profile.companyName} Banner`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }} />
                        )}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col md:flex-row items-start md:items-end gap-6 translate-y-12 md:translate-y-10">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl p-1.5 shadow-2xl flex-shrink-0" style={{ background: 'var(--hp-card)' }}>
                            {companyLogo ? (
                                <img src={companyLogo} alt="Logo" className="w-full h-full object-cover rounded-xl bg-white" />
                            ) : (
                                <div className="w-full h-full rounded-xl flex items-center justify-center text-5xl font-black text-white" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                                    {(profile.companyName || 'C').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 pb-12 md:pb-10 pt-2">
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
                                {profile.companyName}
                            </h1>
                            <p className="text-sm md:text-base text-white/90 font-medium tracking-wide flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm border border-white/30">{profile.industry || 'Company'}</span>
                                {profile.location && <span>📍 {profile.location}</span>}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Info Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] mb-5 text-lg tracking-tight border-b pb-3" style={{ borderColor: 'var(--hp-border)' }}>Company Identity</h3>
                            <div className="space-y-5">
                                {[
                                    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>, label: 'Website', value: profile.website, link: profile.website },
                                    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: 'Headquarters', value: profile.location },
                                    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, label: 'Industry', value: profile.industry },
                                    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, label: 'Company Size', value: profile.employeeCount },
                                    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: 'Founded', value: profile.foundedYear },
                                ].map((info, i) => info.value && (
                                    <div key={i} className="flex gap-3">
                                        <span className="mt-1" style={{ color: 'var(--hp-muted)' }}>{info.icon}</span>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: 'var(--hp-muted)' }}>{info.label}</p>
                                            {info.link ? (
                                                <a href={info.link} target="_blank" rel="noreferrer" className="text-sm font-bold hover:underline break-all" style={{ color: 'var(--hp-accent)' }}>
                                                    {info.value.replace(/^https?:\/\//, '')}
                                                </a>
                                            ) : (
                                                <p className="text-sm font-bold text-[var(--hp-text)]">{info.value}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Sidebar Icons */}
                            {(profile.linkedin || profile.twitter || profile.github) && (
                                <div className="flex gap-3 mt-6 pt-5 border-t" style={{ borderColor: 'var(--hp-border)' }}>
                                    {profile.linkedin && (
                                        <a href={profile.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = '#0077b5'; e.currentTarget.style.borderColor = '#0077b5'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--hp-muted)'; e.currentTarget.style.borderColor = 'var(--hp-border)'; }}>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                        </a>
                                    )}
                                    {profile.twitter && (
                                        <a href={profile.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = '#1da1f2'; e.currentTarget.style.borderColor = '#1da1f2'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--hp-muted)'; e.currentTarget.style.borderColor = 'var(--hp-border)'; }}>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.526-8.616L2.25 2.25H8.08l4.258 5.631L18.244 2.25z" /></svg>
                                        </a>
                                    )}
                                    {profile.github && (
                                        <a href={profile.github} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--hp-text)'; e.currentTarget.style.borderColor = 'var(--hp-text)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--hp-muted)'; e.currentTarget.style.borderColor = 'var(--hp-border)'; }}>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Specialties */}
                        {profile.specialties && (
                            <div className="hp-card p-6">
                                <h3 className="font-bold text-[var(--hp-text)] mb-4 text-lg tracking-tight">Key Specialties</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.specialties.split(',').map((spec, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-text-sub)', borderColor: 'var(--hp-border)' }}>
                                            {spec.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Detailed Info & Jobs */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="hp-card p-8"
                        >
                            <h3 className="text-2xl font-bold text-[var(--hp-text)] mb-6 inline-flex items-center gap-3">
                                <span className="w-8 h-1 rounded-full" style={{ background: 'var(--hp-accent)' }}></span>
                                About {profile.companyName}
                            </h3>
                            <div className="hp-markdown">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {profile.description || "*No detailed description available.*"}
                                </ReactMarkdown>
                            </div>
                        </motion.div>

                        {/* Open Jobs List */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">
                                    Open Opportunities
                                </h3>
                                <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)', color: 'var(--hp-accent)', borderColor: 'rgba(var(--hp-accent-rgb), 0.2)' }}>
                                    {jobs.length} Active
                                </span>
                            </div>

                            <motion.div
                                className="grid grid-cols-1 gap-4"
                                initial="hidden" animate="show"
                                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                            >
                                {jobs.length === 0 ? (
                                    <div className="hp-card p-12 text-center" style={{ color: 'var(--hp-muted)' }}>
                                        No active job openings at the moment. Check back later!
                                    </div>
                                ) : (
                                    jobs.map(job => (
                                        <motion.div
                                            key={job.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 15, scale: 0.98 },
                                                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                            }}
                                        >
                                            <Link
                                                to={`/jobs`}
                                                className="hp-card hp-card-hover hp-card-opportunity p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer block no-underline"
                                            >
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-lg text-[var(--hp-text)] group-hover:text-[var(--hp-accent)] transition-colors">{job.title}</h4>
                                                        {job.isRemote && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-purple-500/10 text-purple-400 border border-purple-500/20">Remote</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-xs font-bold" style={{ color: 'var(--hp-muted)' }}>
                                                        <div className="flex items-center gap-1.5"><span className="text-base opacity-70">📍</span> {job.location}</div>
                                                        <div className="flex items-center gap-1.5 uppercase"><span className="text-base opacity-70">🕒</span> {job.jobType?.replace('_', ' ')}</div>
                                                        {job.salaryMin && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                                                                <span className="text-base opacity-70">💰</span> ₹{Number(job.salaryMin).toLocaleString()} - ₹{Number(job.salaryMax).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="hp-btn-ghost hp-btn-apply text-[10px] uppercase font-black tracking-widest py-3 px-6 whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center gap-2">
                                                    Apply Now
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}