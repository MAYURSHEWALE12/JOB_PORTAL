import { useState, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

export default function useThemeSplash() {
    const toggleTheme = useThemeStore(s => s.toggleTheme);
    const [splash, setSplash] = useState({
        active: false,
        originX: 0,
        originY: 0,
        bgColor: '#07090f',
    });

    const trigger = useCallback((e) => {
        const button = e.currentTarget.getBoundingClientRect();
        const originX = button.left + button.width / 2;
        const originY = button.top + button.height / 2;

        // Capture the current background color before theme toggles
        const currentBg = getComputedStyle(document.documentElement)
            .getPropertyValue('--hp-bg').trim() || '#07090f';

        toggleTheme();

        setSplash({ active: true, originX, originY, bgColor: currentBg });
    }, [toggleTheme]);

    const complete = useCallback(() => {
        setSplash(s => ({ ...s, active: false }));
    }, []);

    return { splash, trigger, complete };
}
