import { create } from 'zustand';

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem('theme-mode') || 'light',
    
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme-mode', newTheme);
        
        // Update DOM immediately
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
    }),
    
    initTheme: () => set((state) => {
        const storedTheme = localStorage.getItem('theme-mode') || 'light';
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { theme: storedTheme };
    })
}));
