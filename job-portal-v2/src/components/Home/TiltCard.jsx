import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function TiltCard({ children, className = '', onClick, tiltAmount = 10 }) {
    const cardRef = useRef(null);
    const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -tiltAmount;
        const rotateY = ((x - centerX) / centerX) * tiltAmount;
        
        setTransform({ rotateX, rotateY, scale: 1.02 });
    }, [tiltAmount]);

    const handleMouseLeave = useCallback(() => {
        setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    }, []);

    return (
        <motion.div
            ref={cardRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            animate={{
                rotateX: transform.rotateX,
                rotateY: transform.rotateY,
                scale: transform.scale
            }}
            transition={{
                type: 'spring',
                stiffness: 150,
                damping: 15,
                mass: 0.1
            }}
            style={{
                transformPerspective: 1000,
                transformStyle: 'preserve-3d'
            }}
        >
            {children}
        </motion.div>
    );
}