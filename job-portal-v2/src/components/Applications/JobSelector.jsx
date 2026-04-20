import React from 'react';
import { motion } from 'framer-motion';

export default function JobSelector({ jobs, onSelect, loading, error }) {
    const particles = [...Array(15)].map((_, i) => ({
        size: Math.random() * 5 + 1,
        left: `${Math.random() * 100}%`,
        duration: Math.random() * 12 + 12,
        delay: Math.random() * 10,
        color: i % 3 === 0 ? 'var(--hp-accent)' : i % 3 === 1 ? 'var(--hp-accent2)' : 'var(--hp-muted)',
    }));

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="hp-card p-6 animate-pulse">
                        <div className="h-5 w-3/4 mb-3 rounded" style={{ background: 'var(--hp-border)' }}></div>
                        <div className="h-4 w-1/2 mb-6 rounded" style={{ background: 'var(--hp-border)' }}></div>
                        <div className="h-px w-full my-4" style={{ background: 'var(--hp-border)' }}></div>
                        <div className="h-4 w-full rounded" style={{ background: 'var(--hp-border)' }}></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto relative z-10">
            <div className="hp-particles-bg">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="hp-particle-anim"
                        style={{
                            width: `${p.size}px`, height: `${p.size}px`, left: p.left, backgroundColor: p.color,
                            animation: `hp-float-up ${p.duration}s linear ${p.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">ATS Pipeline</h2>
                <p className="text-[var(--hp-muted)] mt-1">Select a job to view and manage incoming applications</p>
            </div>

            {error && (
                <div className="mb-6 text-sm font-medium px-4 py-3 rounded-xl border"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
                    {error}
                </div>
            )}

            {!loading && jobs.length === 0 && (
                <div className="hp-card p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                        <svg className="w-8 h-8" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <p className="text-[var(--hp-text)] font-bold text-lg mb-1">No Active Postings</p>
                    <p className="text-[var(--hp-muted)] text-sm">Post a job to start receiving applications.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobs.map((job) => (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelect(job)}
                        className="hp-card p-6 cursor-pointer group flex flex-col"
                    >
                        <h4 className="font-bold text-[var(--hp-text)] text-[1.1rem] leading-snug mb-2 group-hover:text-[var(--hp-accent)] transition-colors">
                            {job.title}
                        </h4>
                        <p className="text-[var(--hp-muted)] text-sm flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                        </p>

                        <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--hp-border)' }}>
                            <span className={`text-xs px-3 py-1.5 rounded-full font-bold tracking-wider uppercase border
                                ${job.status === 'ACTIVE'
                                    ? 'bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[rgba(52,211,153,0.2)]'
                                    : 'bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] border-[var(--hp-border)]'}`}>
                                {job.status}
                            </span>
                            <span className="text-sm font-bold flex items-center gap-1 transition-transform group-hover:translate-x-1" style={{ color: 'var(--hp-accent)' }}>
                                Open Pipeline
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
