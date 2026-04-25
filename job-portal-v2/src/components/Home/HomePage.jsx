import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';

// Icons & Stores
import { useThemeStore } from '../../store/themeStore';
import { jobAPI, resolvePublicUrl } from '../../services/api';
import { formatSalary, timeAgo } from '../../utils/formatters';
import CompanyAvatar from '../CompanyAvatar';

const JOB_TYPE_STYLE = {
    FULL_TIME: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
    CONTRACT:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    REMOTE:    'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    FREELANCE: 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30',
};

// Section Components
import Navbar from './sections/Navbar';
import HeroSection from './sections/HeroSection';
import StatsSection from './sections/StatsSection';
import ResumeBuilderSection from './sections/ResumeBuilderSection';
import ProcessSteps from './sections/ProcessSteps';
import RecentJobs from './sections/RecentJobs';
import Testimonials from './sections/Testimonials';
import FaqSection from './sections/FaqSection';
import Footer from '../Footer';

export default function HomePage() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    // State
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [faqOpen, setFaqOpen] = useState(null);
    const [subscribed, setSubscribed] = useState(false);
    const [subscribeEmail, setSubscribeEmail] = useState('');

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

    // Responsive particle count
    const [particleCount, setParticleCount] = useState(window.innerWidth < 768 ? 20 : 60);

    useEffect(() => {
        const handleResize = () => setParticleCount(window.innerWidth < 768 ? 20 : 60);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Stable particles — computed once (max 60)
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
                
                const sorted = [...d].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    if (dateB === dateA) return (b.id || 0) - (a.id || 0);
                    return dateB - dateA;
                });
                
                setJobs(sorted);
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

                .hp-card {
                    background: var(--hp-card);
                    border: 1px solid var(--hp-border);
                    border-radius: 16px;
                    transition: transform .2s ease, border-color .2s ease;
                    box-shadow: var(--hp-shadow-card);
                }
                .hp-card:hover { border-color: rgba(var(--hp-accent-rgb), .3); transform: translateY(-3px); }
                @media (max-width: 768px) {
                    .hp-card:hover { transform: none; }
                }

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

                .gradient-word {
                    background: linear-gradient(135deg, var(--hp-accent) 20%, var(--hp-accent2) 80%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .marquee-track { animation: marquee 25s linear infinite; display:flex; gap:3.5rem; white-space:nowrap; }
                @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

                .tag-pill { display: inline-flex; align-items: center; padding: .25rem .6rem; border-radius: 999px; font-size: .68rem; font-weight: 600; letter-spacing: .03em; }

                .float1 { animation: floatY 6s ease-in-out infinite; }
                .float2 { animation: floatY 7s ease-in-out infinite; animation-delay: 1s; }
                @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

                .orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }

                .hp-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
                .hp-particle { 
                    position: absolute; 
                    border-radius: 50%; 
                    animation: hp-float-up linear infinite; 
                    opacity: 0;
                    will-change: transform;
                }
                @keyframes hp-float-up {
                    0%{transform:translateY(100vh)scale(0);opacity:0}
                    10%{opacity:1}
                    90%{opacity:.25}
                    100%{transform:translateY(-10vh)scale(1);opacity:0}
                }

                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

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

                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(var(--hp-accent-rgb), .2); }
                    50% { box-shadow: 0 0 40px rgba(var(--hp-accent-rgb), .45); }
                }
                .glow-cta { animation: glow-pulse 3s ease-in-out infinite; }

                .mobile-menu { 
                    backdrop-filter: none; 
                    background: var(--hp-surface) !important;
                    border-top: 1px solid var(--hp-border);
                }

                @media (max-width: 768px) {
                    :root { --hp-shadow-card: 0 4px 12px rgba(0,0,0,0.1); }
                    .orb { display: none; }
                    .float1, .float2 { animation: none !important; }
                    nav { backdrop-filter: none !important; background: var(--hp-bg) !important; }
                }
            `}</style>

            <div style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

                {/* ── Floating Particles ── */}
                <div className="hp-particles">
                    {particles.slice(0, particleCount).map(p => (
                        <div key={p.id} className="hp-particle" style={{
                            width: `${p.width}px`, height: `${p.height}px`,
                            left: `${p.left}%`, backgroundColor: p.color,
                            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`
                        }} />
                    ))}
                </div>

                <motion.div className="fixed top-0 left-0 right-0 h-[3px] z-[200] origin-left" style={{ scaleX, background: 'linear-gradient(90deg, var(--hp-accent), var(--hp-accent2))' }} />

                <Navbar />

                <HeroSection 
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    searchLocation={searchLocation} setSearchLocation={setSearchLocation}
                    handleSearch={handleSearch}
                />

                {/* ── Trusted By Marquee ── */}
                <div className="py-12 bg-[var(--hp-surface-alt)]/30 border-y border-[var(--hp-border)] overflow-hidden relative z-10">
                    <div className="marquee-track">
                        {['Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Netflix', 'Airbnb', 'Spotify'].map(brand => (
                            <div key={brand} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--hp-accent)]" />
                                <span className="text-xl font-black tracking-tight text-[var(--hp-marquee)]">{brand}</span>
                            </div>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {['Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Netflix', 'Airbnb', 'Spotify'].map(brand => (
                            <div key={`${brand}-2`} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--hp-accent)]" />
                                <span className="text-xl font-black tracking-tight text-[var(--hp-marquee)]">{brand}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <StatsSection jobsCount={jobs.length} />

                <ResumeBuilderSection />

                <ProcessSteps />

                <RecentJobs loading={loading} recentJobs={recentJobs} onJobSelect={setSelectedJob} />

                <Testimonials />

                <FaqSection faqOpen={faqOpen} onToggle={setFaqOpen} />

                {/* ── CTA / Newsletter ── */}
                <section className="py-32 px-6">
                    <div className="max-w-4xl mx-auto hp-card p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--hp-accent)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Ready to hire or <br /><span className="gradient-word">get hired?</span></h2>
                        <p className="text-[var(--hp-muted)] mb-10 max-w-lg mx-auto">Join 50,000+ professionals and companies already using HireHub.</p>
                        
                        {!subscribed ? (
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input 
                                    type="email" value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)}
                                    placeholder="Enter your email" required
                                    className="flex-1 hp-search-input px-6 py-4 rounded-xl"
                                />
                                <button type="submit" className="hp-btn-primary px-8 py-4 text-sm whitespace-nowrap">Join Waitlist</button>
                            </form>
                        ) : (
                            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                                <span>🎉 You're on the list! Check your inbox soon.</span>
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>

            {/* ── Job Preview Modal ── */}
            <AnimatePresence>
                {selectedJob && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedJob(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="hp-card w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="p-6 flex items-center justify-between gap-4" style={{ background: 'var(--hp-card)', borderBottom: '1px solid var(--hp-border)' }}>
                                <div className="flex items-center gap-4 min-w-0">
                                    <CompanyAvatar job={selectedJob} size="lg" />
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-xl leading-snug truncate" style={{ color: 'var(--hp-text)' }}>
                                            {selectedJob.title}
                                        </h2>
                                        <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'var(--hp-accent)' }}>
                                            {selectedJob.companyName || 'Verified Employer'}
                                        </p>
                                        {selectedJob.createdAt && (
                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--hp-muted)' }}>
                                                Posted {timeAgo(selectedJob.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {selectedJob.jobType && (
                                        <span className={`tag-pill hidden sm:inline-flex ${JOB_TYPE_STYLE[selectedJob.jobType] || ''}`}>
                                            {selectedJob.jobType?.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    <button onClick={() => setSelectedJob(null)} className="hp-btn-ghost w-9 h-9 rounded-lg flex items-center justify-center">✕</button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto hide-scrollbar space-y-8">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Location', value: selectedJob.location, icon: '📍' },
                                        { label: 'Salary', value: formatSalary(selectedJob.salaryMin, selectedJob.salaryMax), icon: '💰', accent: true },
                                        { label: 'Experience', value: selectedJob.experienceRequired || 'Open', icon: '🎓' },
                                        { label: 'Type', value: selectedJob.jobType?.replace(/_/g, ' '), icon: '💼' },
                                    ].filter(s => s.value).map(({ label, value, icon, accent }) => (
                                        <div key={label} style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', borderRadius: 12, padding: 12 }}>
                                            <div style={{ fontSize: '.7rem', color: 'var(--hp-muted)', marginBottom: '.25rem' }}>{icon} {label}</div>
                                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: accent ? 'var(--hp-accent)' : 'var(--hp-text)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-widest text-[var(--hp-muted)] mb-4">Required Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.skillsRequired?.map(sk => (
                                            <span key={sk} className="tag-pill bg-[var(--hp-accent)]/10 text-[var(--hp-accent)] border border-[var(--hp-accent)]/20">{sk}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-widest text-[var(--hp-muted)] mb-4">Description</h4>
                                    <div className="text-sm leading-relaxed whitespace-pre-line p-5 rounded-xl"
                                        style={{ color: 'var(--hp-text-sub)', background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', lineHeight: 1.8 }}>
                                        {selectedJob.description || 'No description provided.'}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-[var(--hp-border)] flex gap-4 bg-[var(--hp-card)]">
                                <button onClick={() => navigate(`/jobs/${selectedJob.id}`)} className="hp-btn-primary flex-1 py-4 text-sm" style={{ boxShadow: '0 6px 24px rgba(var(--hp-accent-rgb),.2)' }}>Apply Now →</button>
                                <button onClick={() => setSelectedJob(null)} className="hp-btn-ghost flex-1 py-4 text-sm">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}