import React from 'react';

export default function DashboardBackground() {
    return (
        <>
            <div className="db-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, var(--hp-orb1) 0%, transparent 70%)', top: '-5%', right: '-8%' }} />
            <div className="db-orb" style={{ width: 450, height: 450, background: 'radial-gradient(circle, var(--hp-orb2) 0%, transparent 70%)', bottom: '10%', left: '-5%' }} />

            <div className="db-particles">
                {[...Array(18)].map((_, i) => (
                    <div
                        key={i}
                        className="db-particle"
                        style={{
                            width: `${Math.random() * 4 + 1.5}px`,
                            height: `${Math.random() * 4 + 1.5}px`,
                            left: `${Math.random() * 100}%`,
                            backgroundColor: i % 3 === 0 ? 'var(--hp-accent)' : i % 3 === 1 ? 'var(--hp-accent2)' : 'var(--hp-muted)',
                            animationDuration: `${Math.random() * 12 + 14}s`,
                            animationDelay: `${Math.random() * 12}s`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
