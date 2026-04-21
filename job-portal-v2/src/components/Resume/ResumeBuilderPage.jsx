import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeHub from './ResumeHub';
import ResumeGenerator from './ResumeGenerator';
import Footer from '../Footer';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';

export default function ResumeBuilderPage() {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate();

    // Premium Particle System
    const particles = [...Array(30)].map((_, i) => ({
        size: Math.random() * 5 + 2,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 5,
        color: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
    }));

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--color-page)', color: 'var(--color-text)' }}>
            <style>{`
                .hp-builder-container { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); backdrop-filter: blur(20px); }
                .dark .hp-builder-container { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(45, 212, 191, 0.35); }
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover { background: rgba(45, 212, 191, 0.1); border-color: rgba(45, 212, 191, 0.3); color: var(--color-primary); }
                
                .particle { position: absolute; border-radius: 50%; animation: hp-float-up linear infinite; opacity: 0; }
                @keyframes hp-float-up {
                    0% { transform: translateY(105vh) scale(0); opacity: 0; }
                    15% { opacity: 0.5; }
                    85% { opacity: 0.2; }
                    100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
                }
                .orb-glow { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.08; pointer-events: none; }
            `}</style>

            {/* --- Background Visuals --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            left: p.left,
                            backgroundColor: p.color,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ))}
                {/* Decorative orbs for depth */}
                <div className="orb-glow" style={{ width: '600px', height: '600px', background: 'var(--color-primary)', top: '-10%', left: '-10%' }} />
                <div className="orb-glow" style={{ width: '500px', height: '500px', background: 'var(--color-secondary)', bottom: '0%', right: '-5%' }} />
            </div>

            {/* --- Navigation --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4" style={{ background: 'var(--color-card)', backdropFilter: 'blur(15px)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}>
                        <Logo size="md" showTagline />
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Status Indicator */}
                        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-border)] bg-white/5 backdrop-blur-md">
                            <div className="relative flex items-center justify-center">
                                <span className={`w-2 h-2 rounded-full animate-ping absolute ${isLoggedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className={`w-2 h-2 rounded-full relative ${isLoggedIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-mid)]">
                                {isLoggedIn ? 'Pro Engine Active' : 'Guest Mode'}
                            </span>
                        </div>

                        <ThemeToggle />

                        {isLoggedIn ? (
                            <Link to="/dashboard" className="hp-btn-ghost px-5 py-2.5 text-xs uppercase tracking-widest font-bold">
                                Dashboard
                            </Link>
                        ) : (
                            <div className="flex gap-2">
                                <Link to="/login" className="hp-btn-ghost px-4 py-2.5 text-xs uppercase tracking-widest font-bold">
                                    Login
                                </Link>
                                <Link to="/register" className="hp-btn-primary px-5 py-2.5 text-xs uppercase tracking-widest font-bold">
                                    Join Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- Main Content --- */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 pt-32 pb-20 w-full relative z-10">

                {/* Header Section */}
                <div className="mb-10 text-center sm:text-left">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-5xl font-black tracking-tighter mb-2"
                    >
                        HireHub <span className="gradient-word">Resume Forge</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[var(--color-text-muted)] font-medium max-w-2xl"
                    >
                        {isLoggedIn
                            ? "Manage your professional blueprints and track ATS performance."
                            : "Create an ATS-optimized resume in minutes. No credit card required."}
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="hp-builder-container p-4 sm:p-10"
                >
                    <AnimatePresence mode="wait">
                        {isLoggedIn ? (
                            <motion.div
                                key="hub"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <ResumeHub />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="generator"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                            >
                                <ResumeGenerator guestMode={true} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Quick Feature Grid for Guest Mode */}
                {!isLoggedIn && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {[
                            { title: 'ATS-Friendly', desc: 'Recruiter-approved templates.', icon: '🎯' },
                            { title: 'Instant Export', desc: 'Clean, professional PDF files.', icon: '📄' },
                            { title: 'Secure Vault', desc: 'Save progress with an account.', icon: '🔒' }
                        ].map((feat, i) => (
                            <div key={i} className="p-6 flex flex-col items-center text-center border border-dashed border-[var(--color-border)] rounded-2xl" style={{ background: 'var(--color-card)' }}>
                                <div className="text-2xl mb-3">{feat.icon}</div>
                                <h4 className="font-bold text-sm mb-1">{feat.title}</h4>
                                <p className="text-xs text-[var(--color-text-muted)]">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}