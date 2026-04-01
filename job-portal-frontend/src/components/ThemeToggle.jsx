import { useThemeStore } from '../store/themeStore';

export default function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme } = useThemeStore();

    const handleToggle = () => {
        toggleTheme();
    };

    return (
        <button
            onClick={handleToggle}
            className={`neo-interactive p-2 rounded-full transition-all duration-300 flex items-center justify-center
                ${theme === 'dark' 
                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-md border border-gray-100'} 
                ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                // Sun Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
