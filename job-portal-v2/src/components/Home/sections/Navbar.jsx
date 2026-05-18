import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../../Logo';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';

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

export default function Navbar() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3 px-6 md:px-12' : 'py-5 px-6 md:px-10'}`}>
            <div 
                className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3 rounded-2xl transition-all duration-300"
                style={{ 
                    background: isScrolled ? 'color-mix(in srgb, var(--hp-nav-bg) 85%, transparent)' : 'transparent',
                    backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                    border: isScrolled ? '1px solid var(--hp-border)' : '1px solid transparent',
                    boxShadow: isScrolled ? '0 10px 40px rgba(0,0,0,0.15)' : 'none'
                }}
            >
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
    );
}
