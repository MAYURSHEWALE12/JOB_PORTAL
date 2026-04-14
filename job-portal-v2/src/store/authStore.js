import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoggedIn: false,

    // ─── Set user after login/register ───────────────────────────────────────
    setUser: (user, token) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoggedIn: true });
    },

    // ─── Clear user on logout ─────────────────────────────────────────────────
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        set({ user: null, token: null, isLoggedIn: false });
    },

    // ─── Restore user from localStorage on page refresh ──────────────────────
    restoreUser: () => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({ user, token, isLoggedIn: true });
            } catch {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
    },
}));