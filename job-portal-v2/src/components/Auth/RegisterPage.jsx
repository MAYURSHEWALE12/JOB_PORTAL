import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';

export default function RegisterPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    // Ensure the document root reflects the current theme for global variable sync
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [isDark]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'JOBSEEKER',
    });
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

        const password = formData.password;
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
            setError('Password must be at least 8 characters with uppercase, number, and special character.');
            setLoading(false);
            return;
        }

        try {
            const res = await authAPI.register(formData);
            const { token, ...user } = res.data;
            setUser(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        const { password } = formData;
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const passwordStrength = getPasswordStrength();
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

    const particles = [...Array(20)].map((_, i) => ({
        size: Math.random() * 5 + 2,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 8,
        delay: Math.random() * 5,
        color: i % 2 === 0 ? 'var(--hp-accent)' : 'var(--hp-accent2)',
    }));

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col transition-colors duration-300"
            style={{ background: 'var(--hp-bg)', color: 'var(--hp-text)' }}>

            <style>{`
    /* --- HireHub Unified Design System --- */
    
    /* Premium Glassmorphic Card */
    .hp-login-card { 
        background: var(--hp-card); 
        border: 1px solid var(--hp-border); 
        border-radius: 24px; 
        box-shadow: var(--hp-shadow-card); 
        backdrop-filter: blur(20px); 
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    /* Standardized Theme-Aware Inputs */
    .hp-input { 
        width: 100%; 
        background: var(--hp-surface-alt); 
        border: 1px solid var(--hp-border); 
        /* Enforce color consistency across all browsers and autofills */
        color: var(--hp-text) !important; 
        border-radius: 12px; 
        padding: 14px 16px; 
        font-size: 0.9rem; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        outline: none; 
    }
    
    .hp-input::placeholder { 
        color: var(--hp-muted); 
        opacity: 0.7;
    }
    
    /* Input Focus State with HireHub Accent Glow */
    .hp-input:focus { 
        border-color: var(--hp-accent); 
        background: var(--hp-surface); 
        box-shadow: 0 0 0 4px rgba(var(--hp-accent-rgb), 0.15); 
    }

    /* Browser Autofill Override - WebKit */
    .hp-input:-webkit-autofill, 
    .hp-input:-webkit-autofill:hover, 
    .hp-input:-webkit-autofill:focus { 
        -webkit-box-shadow: 0 0 0 1000px var(--hp-surface-alt) inset !important; 
        -webkit-text-fill-color: var(--hp-text) !important; 
        transition: background-color 5000s ease-in-out 0s;
    }
    .hp-input:-webkit-autofill:focus { 
        -webkit-box-shadow: 0 0 0 1000px var(--hp-surface) inset !important; 
    }

    /* Primary Action Button (Teal-to-Purple Gradient) */
    .hp-btn-primary { 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); 
        color: #fff !important; 
        font-weight: 700; 
        border: none; 
        border-radius: 12px; 
        cursor: pointer; 
        transition: all 0.2s ease; 
        height: 50px; 
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.85rem;
    }
    
    .hp-btn-primary:hover:not(:disabled) { 
        opacity: 0.9; 
        transform: translateY(-1px); 
        box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), 0.35); 
    }

    .hp-btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        filter: grayscale(0.5);
    }
    
    /* Ghost/Secondary Button (Subtle Glass) */
    .hp-btn-ghost { 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        background: var(--hp-surface-alt); 
        border: 1px solid var(--hp-border); 
        color: var(--hp-text); 
        font-weight: 600; 
        border-radius: 12px; 
        cursor: pointer; 
        transition: all 0.2s ease; 
        height: 50px; 
    }
    
    .hp-btn-ghost:hover {
        background: rgba(var(--hp-accent-rgb), 0.1);
        border-color: rgba(var(--hp-accent-rgb), 0.3);
        color: var(--hp-accent);
    }

    /* Background Particle System */
    .particle { 
        position: absolute; 
        border-radius: 50%; 
        animation: float-up linear infinite; 
        opacity: 0; 
        pointer-events: none;
    }

    @keyframes float-up {
        0% { transform: translateY(110vh) scale(0); opacity: 0; }
        20% { opacity: 0.4; }
        80% { opacity: 0.2; }
        100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
    }

    /* Helper for Gradient Words */
    .gradient-word {
        background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
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
                <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full opacity-10 blur-[100px]"
                    style={{ background: 'var(--hp-accent)' }} />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center"
                style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--hp-border)' }}>
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
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
                        <p className="text-[var(--hp-muted)] font-medium">Join HireHub to get started</p>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[var(--hp-muted)] ml-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="hp-input"
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-[var(--hp-muted)] ml-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="hp-input"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-[var(--hp-muted)] ml-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="hp-input"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-[var(--hp-muted)] ml-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="hp-input pr-12"
                                    placeholder="8+ chars: uppercase, number, special"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-[var(--hp-border)]'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                                        <span className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-500' : 'text-[var(--hp-muted)]'}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            8+ chars
                                        </span>
                                        <span className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-[var(--hp-muted)]'}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Uppercase
                                        </span>
                                        <span className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-[var(--hp-muted)]'}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Number
                                        </span>
                                        <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-[var(--hp-muted)]'}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Special
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-[var(--hp-muted)] ml-1">I am a...</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'JOBSEEKER' })}
                                    className={`p-4 rounded-xl border transition-all text-center ${formData.role === 'JOBSEEKER'
                                        ? 'border-[var(--hp-accent)] bg-[rgba(var(--hp-accent-rgb),0.1)] text-[var(--hp-accent)]'
                                        : 'border-[var(--hp-border)] text-[var(--hp-muted)] hover:border-[var(--hp-accent)]/50'
                                        }`}
                                >
                                    <div className="font-bold text-sm">Job Seeker</div>
                                    <div className="text-[10px] opacity-70 mt-1">Looking for jobs</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'EMPLOYER' })}
                                    className={`p-4 rounded-xl border transition-all text-center ${formData.role === 'EMPLOYER'
                                        ? 'border-[var(--hp-accent)] bg-[rgba(var(--hp-accent-rgb),0.1)] text-[var(--hp-accent)]'
                                        : 'border-[var(--hp-border)] text-[var(--hp-muted)] hover:border-[var(--hp-accent)]/50'
                                        }`}
                                >
                                    <div className="font-bold text-sm">Employer</div>
                                    <div className="text-[10px] opacity-70 mt-1">Hiring talent</div>
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
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                'Sign Up to HireHub'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs font-medium text-[var(--hp-muted)] mt-8">
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--hp-accent)' }} className="font-bold hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}