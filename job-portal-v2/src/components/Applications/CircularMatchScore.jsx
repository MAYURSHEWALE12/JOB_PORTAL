import React from 'react';
import { motion } from 'framer-motion';

export default function CircularMatchScore({ score, size = 60, strokeWidth = 5 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s) => {
        if (s >= 80) return '#10b981'; // emerald-500
        if (s >= 60) return '#f59e0b'; // amber-500
        return '#ef4444'; // red-500
    };

    const color = getColor(score);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-[var(--hp-border)]"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] font-black leading-none" style={{ color }}>
                    {score}%
                </span>
                <span className="text-[7px] font-bold uppercase tracking-tighter text-[var(--hp-muted)]">
                    Match
                </span>
            </div>
        </div>
    );
}
