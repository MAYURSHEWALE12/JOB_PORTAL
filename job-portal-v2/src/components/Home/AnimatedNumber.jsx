import { useEffect, useState, useRef } from 'react';

export default function AnimatedNumber({ value, suffix = '', duration = 1500 }) {
    const [displayValue, setDisplayValue] = useState('0');
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setIsInView(true);
                    setHasStarted(true);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
        if (isNaN(numValue)) {
            setDisplayValue(value);
            return;
        }

        const startTime = Date.now();
        const endValue = numValue;
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * endValue);
            
            setDisplayValue(current.toLocaleString());
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, [hasStarted, value, duration]);

    return (
        <span ref={ref}>
            {displayValue}{suffix}
        </span>
    );
}