import React from 'react';
import Logo from './Logo';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--hp-bg, #07090f)',
                    color: 'var(--hp-text, #eef2ff)',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    padding: '1.5rem',
                }}>
                    <div style={{
                        background: 'var(--hp-card, #111520)',
                        border: '1px solid var(--hp-border, rgba(255,255,255,0.07))',
                        borderRadius: '20px',
                        padding: '3rem',
                        maxWidth: '480px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: 'var(--hp-shadow-card, 0 8px 40px rgba(0,0,0,0.55))',
                    }}>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <Logo size="sm" />
                        </div>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            background: 'rgba(var(--hp-accent-rgb, 45,212,191), 0.1)',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--hp-accent, #2dd4bf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--hp-text, #eef2ff)',
                            marginBottom: '0.75rem',
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            color: 'var(--hp-muted, #6b7799)',
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            marginBottom: '2rem',
                        }}>
                            The application encountered an unexpected error. Don't worry, your progress is likely safe.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px 32px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, var(--hp-accent, #2dd4bf), var(--hp-accent2, #a78bfa))',
                                color: '#fff',
                                boxShadow: '0 4px 20px rgba(var(--hp-accent-rgb, 45,212,191), 0.35)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(var(--hp-accent-rgb, 45,212,191), 0.45)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(var(--hp-accent-rgb, 45,212,191), 0.35)'; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                            </svg>
                            Try Refreshing Page
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <pre style={{
                                marginTop: '2rem',
                                padding: '1rem',
                                background: 'rgba(var(--hp-accent-rgb, 45,212,191), 0.05)',
                                border: '1px solid var(--hp-border, rgba(255,255,255,0.07))',
                                borderRadius: '12px',
                                color: 'var(--hp-muted, #6b7799)',
                                fontSize: '0.75rem',
                                textAlign: 'left',
                                overflow: 'auto',
                                maxHeight: '200px',
                            }}>
                                {this.state.error?.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
