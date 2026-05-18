import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                border: '1px solid var(--hp-border, rgba(255,255,255,0.07))',
                background: 'var(--hp-surface-alt, rgba(255,255,255,0.06))',
                color: 'var(--hp-text, #eef2ff)',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--hp-accent-rgb, 45,212,191), 0.1)'; e.currentTarget.style.borderColor = 'rgba(var(--hp-accent-rgb, 45,212,191), 0.3)'; e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--hp-surface-alt, rgba(255,255,255,0.06))'; e.currentTarget.style.borderColor = 'var(--hp-border, rgba(255,255,255,0.07))'; e.currentTarget.style.color = 'var(--hp-text, #eef2ff)'; }}
        >
            {isDark ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" />
                    <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22" />
                </svg>
            ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            )}
        </button>
    );
}