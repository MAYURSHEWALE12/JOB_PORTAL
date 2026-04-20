import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RadarChart = ({ data, size = 200 }) => {
    const categories = Object.keys(data);
    const scoreValues = Object.values(data);
    const center = size / 2;
    const radius = size * 0.4;
    const angleStep = (Math.PI * 2) / categories.length;

    // Helper to get coordinates
    const getPoint = (index, value, radiusScale = 1) => {
        const r = (radius * value * radiusScale) / 100;
        const angle = index * angleStep - Math.PI / 2;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Background polygon points
    const bgPoints = categories.map((_, i) => {
        const p = getPoint(i, 100);
        return `${p.x},${p.y}`;
    }).join(' ');

    // Inner grid lines
    const gridLevels = [25, 50, 75].map(level => (
        <polygon
            key={level}
            points={categories.map((_, i) => {
                const p = getPoint(i, level);
                return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="var(--hp-border)"
            strokeWidth="1"
            strokeDasharray="4,4"
        />
    ));

    // Data polygon
    const dataPoints = categories.map((_, i) => {
        const p = getPoint(i, scoreValues[i]);
        return `${p.x},${p.y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Background */}
                <polygon points={bgPoints} fill="var(--hp-surface-alt)" stroke="var(--hp-border)" strokeWidth="2" />
                
                {/* Grid */}
                {gridLevels}
                
                {/* Webs */}
                {categories.map((_, i) => {
                    const p = getPoint(i, 100);
                    return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--hp-border)" strokeWidth="1" />;
                })}

                {/* Data Area */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    points={dataPoints}
                    fill="var(--hp-accent)"
                    stroke="var(--hp-accent)"
                    strokeWidth="2"
                />

                {/* Categories */}
                {categories.map((cat, i) => {
                    const p = getPoint(i, 115);
                    return (
                        <text
                            key={cat}
                            x={p.x}
                            y={p.y}
                            textAnchor="middle"
                            className="text-[10px] font-black uppercase tracking-tighter fill-[var(--hp-text)] opacity-70"
                        >
                            {cat}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

export default function VertexIntelligenceModal({ analysis, onClose }) {
    if (!analysis) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="hp-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--hp-border)] flex justify-between items-center bg-[var(--hp-surface-alt)]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[var(--hp-accent)] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                                Vertex Intelligence
                            </span>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--hp-text)]">
                            Intelligence Report: {analysis.resume?.name || 'Candidate'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Score & Radar */}
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64" cy="64" r="58"
                                        stroke="var(--hp-border)" strokeWidth="8" fill="none"
                                    />
                                    <motion.circle
                                        initial={{ strokeDasharray: "0 365" }}
                                        animate={{ strokeDasharray: `${(analysis.score * 365) / 100} 365` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        cx="64" cy="64" r="58"
                                        stroke="var(--hp-accent)" strokeWidth="8" fill="none" strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-[var(--hp-text)]">{analysis.score}%</span>
                                    <span className="text-[10px] uppercase font-bold opacity-50">Vertex Fit</span>
                                </div>
                            </div>

                            <RadarChart data={analysis.skillMap || { "Technical": 0, "Soft Skills": 0, "Experience": 0, "Education": 0 }} />
                        </div>

                        {/* Right: Insights */}
                        <div className="space-y-6">
                            <section>
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-[var(--hp-accent)] mb-3">
                                    Top Strengths
                                </h4>
                                <div className="space-y-2">
                                    {analysis.strengths?.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex gap-2 text-sm text-[var(--hp-text)] opacity-80">
                                            <span className="text-emerald-500">✦</span>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-500 mb-3">
                                    Critical Gaps
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingKeywords?.map((k, i) => (
                                        <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-bold rounded border border-rose-500/20 uppercase tracking-wider">
                                            {k}
                                        </span>
                                    ))}
                                    {(!analysis.missingKeywords || analysis.missingKeywords.length === 0) && (
                                        <p className="text-xs italic opacity-50">No critical keyword gaps identified.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    <hr className="my-8 border-[var(--hp-border)]" />

                    {/* Interview Playbook */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--hp-accent2)]/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[var(--hp-accent2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h4 className="text-[12px] font-black uppercase tracking-widest text-[var(--hp-text)]">
                                AI Interview Strategy Guide
                            </h4>
                        </div>
                        <div className="space-y-4">
                            {analysis.interviewQuestions?.map((q, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="p-4 rounded-xl bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] relative overflow-hidden group"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--hp-accent2)] opacity-30 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-sm font-medium text-[var(--hp-text)] leading-relaxed italic">
                                        "{q}"
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[var(--hp-surface-alt)] border-t border-[var(--hp-border)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="hp-btn-primary px-8"
                    >
                        Dismiss Analysis
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
