import { useLayoutEffect, useRef, useState } from 'react';

const areArraysEqual = (left, right) =>
    left.length === right.length && left.every((value, index) => value === right[index]);

export default function useTabOverflow(navTabs, tabSignature) {
    const [visibleTabKeys, setVisibleTabKeys] = useState([]);
    const [overflowTabKeys, setOverflowTabKeys] = useState([]);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const tabBarRef = useRef(null);
    const tabMeasureRefs = useRef({});
    const moreMeasureRef = useRef(null);

    const recalculateTabs = () => {
        const container = tabBarRef.current;
        const moreButton = moreMeasureRef.current;
        if (!container || !moreButton || !navTabs.length) return;

        const gapValue = window.getComputedStyle(container).columnGap || window.getComputedStyle(container).gap || '0';
        const gap = Number.parseFloat(gapValue) || 0;
        const containerWidth = container.clientWidth;
        const measuredTabs = navTabs.map((tab) => ({
            key: tab.key,
            width: tabMeasureRefs.current[tab.key]?.offsetWidth ?? 0,
        }));

        if (measuredTabs.some((tab) => tab.width === 0)) return;

        const totalTabsWidth = measuredTabs.reduce((total, tab) => total + tab.width, 0)
            + (measuredTabs.length > 1 ? gap * (measuredTabs.length - 1) : 0);

        if (totalTabsWidth <= containerWidth) {
            const nextVisible = measuredTabs.map((tab) => tab.key);
            if (!areArraysEqual(visibleTabKeys, nextVisible)) setVisibleTabKeys(nextVisible);
            if (overflowTabKeys.length) setOverflowTabKeys([]);
            return;
        }

        const visible = [...measuredTabs];
        const overflow = [];
        const moreWidth = moreButton.offsetWidth;

        while (visible.length > 0) {
            const visibleWidth = visible.reduce((total, tab) => total + tab.width, 0)
                + (visible.length > 1 ? gap * (visible.length - 1) : 0);
            const moreGap = visible.length > 0 ? gap : 0;
            if (visibleWidth + moreGap + moreWidth <= containerWidth) break;
            overflow.unshift(visible.pop());
        }

        const nextVisible = visible.map((tab) => tab.key);
        const nextOverflow = overflow.map((tab) => tab.key);
        if (!areArraysEqual(visibleTabKeys, nextVisible)) setVisibleTabKeys(nextVisible);
        if (!areArraysEqual(overflowTabKeys, nextOverflow)) setOverflowTabKeys(nextOverflow);
    };

    useLayoutEffect(() => {
        let frameId = window.requestAnimationFrame(recalculateTabs);
        let cancelled = false;
        let resizeObserver;

        const queueRecalc = () => {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(recalculateTabs);
        };

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(queueRecalc);
            if (tabBarRef.current) resizeObserver.observe(tabBarRef.current);
            Object.values(tabMeasureRefs.current).forEach((node) => { if (node) resizeObserver.observe(node); });
            if (moreMeasureRef.current) resizeObserver.observe(moreMeasureRef.current);
        } else {
            window.addEventListener('resize', queueRecalc);
        }

        if (document.fonts?.ready) {
            document.fonts.ready.then(() => { if (!cancelled) queueRecalc(); });
        }

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', queueRecalc);
        };
    }, [tabSignature]);

    return {
        visibleTabKeys,
        overflowTabKeys,
        isMoreMenuOpen,
        setIsMoreMenuOpen,
        tabBarRef,
        tabMeasureRefs,
        moreMeasureRef,
    };
}
