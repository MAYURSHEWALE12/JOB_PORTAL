import React from 'react';
import { motion } from 'framer-motion';

const PIPELINE_STAGES = [
    { key: 'ALL', label: 'All', icon: '📋', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'PENDING', label: 'New', icon: '⏳', accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { key: 'REVIEWED', label: 'Reviewed', icon: '👀', accent: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { key: 'SHORTLISTED', label: 'Shortlisted', icon: '⭐', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'INTERVIEWING', label: 'Interviews', icon: '📅', accent: 'var(--hp-accent2)', bg: 'rgba(var(--hp-accent2-rgb), 0.1)' },
    { key: 'OFFERED', label: 'Offered', icon: '📜', accent: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
    { key: 'ACCEPTED', label: 'Hired', icon: '🎉', accent: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { key: 'REJECTED', label: 'Rejected', icon: '❌', accent: '#f87171', bg: 'rgba(248,113,113,0.1)' },
];

export default function PipelineSidebar({ activeStage, onStageChange, stageCounts, applications, viewMode, setViewMode }) {
    return (
        <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 h-fit">
            <div className="hp-card p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-extrabold text-[var(--hp-muted)] uppercase tracking-[0.2em]">
                        Pipeline Stages
                    </h3>
                    <div className="flex bg-[var(--hp-surface-alt)] p-1 rounded-lg border border-[var(--hp-border)]">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--hp-card)] shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                            title="List View"
                        >
                            📋
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-[var(--hp-card)] shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                            title="Board View"
                        >
                            📊
                        </button>
                    </div>
                </div>
                <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 hide-scrollbar scroll-smooth">
                    {PIPELINE_STAGES.map(stage => {
                        const count = stageCounts[stage.key] || 0;
                        const isActive = activeStage === stage.key;

                        return (
                            <button
                                key={stage.key}
                                onClick={() => onStageChange(stage.key)}
                                className="flex-shrink-0 lg:flex-shrink flex items-center justify-between px-4 py-3 lg:px-3 lg:py-2.5 rounded-xl text-left transition-all border"
                                style={isActive ? {
                                    backgroundColor: stage.bg,
                                    borderColor: `rgba(var(--hp-accent-rgb), 0.2)`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                } : {
                                    backgroundColor: 'transparent',
                                    borderColor: 'transparent',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl lg:text-lg opacity-90">{stage.icon}</span>
                                    <span className="text-sm font-bold truncate" style={{ color: isActive ? stage.accent : 'var(--hp-text-sub)' }}>
                                        {stage.label}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[var(--hp-surface-alt)]'} hidden lg:block`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t my-6" style={{ borderColor: 'var(--hp-border)' }} />

                <div className="px-2">
                    <h4 className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-widest mb-4">
                        Hiring Funnel
                    </h4>
                    {PIPELINE_STAGES.filter(s => s.key !== 'ALL').map(stage => {
                        const count = stageCounts[stage.key] || 0;
                        const pct = applications.length > 0 ? (count / applications.length) * 100 : 0;
                        return (
                            <div key={stage.key} className="mb-3">
                                <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-wider">
                                    <span style={{ color: 'var(--hp-muted)' }}>{stage.label}</span>
                                    <span style={{ color: stage.accent }}>{count}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hp-surface-alt)' }}>
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: stage.accent }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
