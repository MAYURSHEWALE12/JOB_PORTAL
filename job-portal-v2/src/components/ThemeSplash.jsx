import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeSplash({ active, originX, originY, bgColor, onComplete }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ clipPath: `circle(0% at ${originX}px ${originY}px)` }}
                    animate={{ clipPath: `circle(150% at ${originX}px ${originY}px)` }}
                    exit={{ clipPath: `circle(150% at ${originX}px ${originY}px)`, opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    onAnimationComplete={onComplete}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        background: bgColor || '#07090f',
                        willChange: 'clip-path',
                    }}
                />
            )}
        </AnimatePresence>
    );
}
