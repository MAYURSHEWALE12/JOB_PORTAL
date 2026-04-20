import { useCallback, useRef } from 'react';

/**
 * Plays a short, crisp "ting" sound using the Web Audio API.
 * No external files needed — purely generated in-browser.
 */
function playTing(frequency = 1800, duration = 0.08, volume = 0.3) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);

        // Clean up after playback
        osc.onended = () => ctx.close();
    } catch (e) {
        // Silently fail if audio isn't available
    }
}

export function useNotificationSound() {
    const playNotificationSound = useCallback(() => {
        playTing(1800, 0.1, 0.35);   // Higher pitch, short ting
    }, []);

    const playMessageSound = useCallback(() => {
        playTing(1400, 0.08, 0.3);   // Slightly lower pitch for messages
    }, []);

    return { playNotificationSound, playMessageSound };
}