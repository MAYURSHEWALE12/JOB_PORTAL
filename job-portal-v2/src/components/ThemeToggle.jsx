import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import useThemeSplash from '../hooks/useThemeSplash';
import ThemeSplash from './ThemeSplash';

export default function ThemeToggle() {
    const { theme } = useThemeStore();
    const { splash, trigger, complete } = useThemeSplash();
    const isDark = theme === 'dark';
    const [hover, setHover] = useState(false);

    return (
        <>
            <button
                onClick={trigger}
                aria-label="Toggle theme"
                style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '1px solid var(--hp-border, rgba(255,255,255,0.07))',
                    background: hover ? 'rgba(var(--hp-accent-rgb, 45,212,191), 0.1)' : 'var(--hp-surface-alt, rgba(255,255,255,0.06))',
                    color: hover ? 'var(--hp-accent, #2dd4bf)' : 'var(--hp-text, #eef2ff)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <AnimatePresence mode="wait">
                    {isDark ? (
                        <motion.div
                            key="dark"
                            initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                            exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="5" />
                                <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22" />
                            </svg>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="light"
                            initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                            exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>
            <ThemeSplash
                active={splash.active}
                originX={splash.originX}
                originY={splash.originY}
                bgColor={splash.bgColor}
                onComplete={complete}
            />
        </>
    );
}