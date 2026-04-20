// UI Sound Effects Utility — lightweight Web Audio API "ting" sounds
// No external audio files needed

const TING_PRESETS = {
    click:   { freq: 2200, dur: 0.05, vol: 0.2 },
    success: { freq: 1600, dur: 0.12, vol: 0.3 },
    error:   { freq: 400,  dur: 0.15, vol: 0.25 },
    tab:     { freq: 2000, dur: 0.04, vol: 0.15 },
    toggle:  { freq: 1800, dur: 0.06, vol: 0.2 },
};

function playTing(freq, dur, vol) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + dur);
        osc.onended = () => ctx.close();
    } catch (e) {
        // Silently fail
    }
}

/**
 * No-op — no preloading needed since sounds are generated programmatically.
 */
export const preloadSFX = () => {};

/**
 * Plays a short "ting" UI sound.
 */
export const playSFX = (type) => {
    const preset = TING_PRESETS[type] || TING_PRESETS.click;
    playTing(preset.freq, preset.dur, preset.vol);
};
