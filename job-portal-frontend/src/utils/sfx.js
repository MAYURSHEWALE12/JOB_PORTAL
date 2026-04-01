// Neo-Brutalist UI Sound Effects Utility
// Using high-quality, snappy UI sounds from Mixkit (Royalty-free)

const sfxUrls = {
    click:   'https://assets.mixkit.co/sfx/preview/mixkit-simple-clicking-interface-2475.mp3',
    success: 'https://assets.mixkit.co/sfx/preview/mixkit-success-bell-942.mp3',
    error:   'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
    tab:     'https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3',
    toggle:  'https://assets.mixkit.co/sfx/preview/mixkit-mechanical-switch-clack-939.mp3',
};

// Cache for audio objects to avoid latency
const audioCache = {};

/**
 * Pre-instantiates audio objects to remove the first-click delay.
 * Should be called once at app initialization.
 */
export const preloadSFX = () => {
    Object.keys(sfxUrls).forEach(key => {
        if (!audioCache[key]) {
            const audio = new Audio(sfxUrls[key]);
            audio.load();
            audioCache[key] = audio;
        }
    });
};

/**
 * Plays a UI sound by cloning the cached audio object.
 * Cloning allows simultaneous overlapping sounds of the same type.
 */
export const playSFX = (type) => {
    try {
        const cached = audioCache[type];
        if (!cached) {
            // Fallback if not preloaded
            const audio = new Audio(sfxUrls[type]);
            audio.volume = 0.6;
            audio.play().catch(() => {});
            return;
        }

        // Clone and play to handle rapid-fire clicks
        const player = cached.cloneNode();
        player.volume = 0.6;
        player.play().catch(err => {
            // Silent catch for browser policy blocks
        });
    } catch (err) {
        console.error("Failed to play SFX:", err);
    }
};
