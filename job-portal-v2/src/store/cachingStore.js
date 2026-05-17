import { create } from 'zustand';

export const useCachingStore = create((set, get) => ({
    // Cache storage for various endpoints
    jobs: null,
    savedJobs: null,
    appliedJobs: null,
    primaryResume: null,
    alerts: null,
    applications: null,
    interviews: null,
    analytics: null,

    // Expiry timestamps
    cacheTimestamps: {},

    // Save item to cache
    setCache: (key, data) => {
        set({ [key]: data });
        set((state) => ({
            cacheTimestamps: {
                ...state.cacheTimestamps,
                [key]: Date.now()
            }
        }));
    },

    // Check if cache is present and within age limit (e.g. 5 minutes)
    isCacheValid: (key, maxAgeMs = 300000) => {
        const timestamp = get().cacheTimestamps[key];
        if (!timestamp) return false;
        const data = get()[key];
        if (!data) return false;
        if (Array.isArray(data) && data.length === 0) return false;
        return (Date.now() - timestamp) < maxAgeMs;
    },

    // Clear all caches on logout
    clearCache: () => {
        set({
            jobs: null,
            savedJobs: null,
            appliedJobs: null,
            primaryResume: null,
            alerts: null,
            applications: null,
            interviews: null,
            analytics: null,
            cacheTimestamps: {}
        });
    }
}));
