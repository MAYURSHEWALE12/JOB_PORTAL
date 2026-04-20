import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';

export default function LoginPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) { root.classList.add('dark'); root.classList.remove('light'); }
        else { root.classList.add('light'); root.classList.remove('dark'); }
    }, [isDark]);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authAPI.login(formData);
            const { token, ...user } = res.data;
            setUser(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const particles = [...Array(20)].map((_, i) => ({
        size: Math.random() * 5 + 2,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 5,
        color: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)',
    }));

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--color-page)', color: 'var(--color-text)' }}>
            <style>{`
                .hp-login-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); backdrop-filter: blur(20px); }
                .dark .hp-login-card { background: #1c1c1e; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
                .hp-input { width: 100%; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 12px; padding: 14px 16px; font-size: 0.9rem; transition: all 0.2s; outline: none; }
                .hp-input::placeholder { color: var(--color-text-muted); }
                .hp-input:focus { border-color: var(--color-primary); background: var(--color-card); box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1); }
                html.dark .hp-input { background: #1f1f1f; color: #f5f5f7; border-color: rgba(255,255,255,0.15); }
                html.dark .hp-input::placeholder { color: #a1a1aa; }
                html.dark .hp-input:focus { background: #1c1c1e; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1); }
                /* Browser Autofill Override - WebKit */
                .hp-input:-webkit-autofill, 
                .hp-input:-webkit-autofill:hover, 
                .hp-input:-webkit-autofill:focus { 
                    -webkit-box-shadow: 0 0 0 1000px var(--color-surface) inset !important; 
                    -webkit-text-fill-color: var(--color-text) !important; 
                    transition: background-color 5000s ease-in-out 0s;
                }
                .hp-input:-webkit-autofill:focus { 
                    -webkit-box-shadow: 0 0 0 1000px var(--color-card) inset !important; 
                }
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; height: 50px; }
                .hp-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(45, 212, 191, 0.35); }
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; height: 50px; }
                .hp-btn-ghost:hover { background: rgba(45, 212, 191, 0.1); border-color: rgba(45, 212, 191, 0.3); color: var(--color-primary); }
                
                .particle { position: absolute; border-radius: 50%; animation: float-up linear infinite; opacity: 0; }
                @keyframes float-up {
                    0% { transform: translateY(110vh) scale(0); opacity: 0; }
                    20% { opacity: 0.4; }
                    80% { opacity: 0.2; }
                    100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
                }
            `}</style>

            {/* Background Particles */}
            <div className="fixed inset-0 pointer-events-none">
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
                {/* Decorative Orb */}
                <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full opacity-10 blur-[100px]" style={{ background: 'var(--color-primary)' }} />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center" style={{ background: 'var(--color-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--color-border)' }}>
                <Link to="/"><Logo size="md" showTagline /></Link>
                <ThemeToggle />
            </nav>

            <div className="flex-grow flex items-center justify-center p-4 pt-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hp-login-card w-full max-w-[420px] p-8 sm:p-10"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-[var(--color-text-muted)] font-medium">Please enter your details to sign in</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-xl mb-6 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-muted)] ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@company.com"
                                required
                                className="hp-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-muted)] ml-1">Password</label>
                                <Link to="/forgot-password" style={{ color: 'var(--color-primary)' }} className="text-[10px] font-black uppercase tracking-widest hover:opacity-80">Forgot?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="hp-input pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="hp-btn-primary w-full"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Sign In to HireHub'
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }}></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[var(--color-card)] px-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">OAuth Integration</span>
                        </div>
                    </div>

                    <a
                        href="http://localhost:8080/api/oauth2/authorization/google"
                        className="hp-btn-ghost w-full flex items-center justify-center gap-3 no-underline"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </a>

                    <p className="text-center text-xs font-medium text-[var(--color-text-muted)] mt-8">
                        New to the platform?{' '}
                        <Link to="/register" style={{ color: 'var(--color-primary)' }} className="font-bold hover:underline">
                            Create an account
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}