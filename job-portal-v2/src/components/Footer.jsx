import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="pt-10 sm:pt-12 pb-5 sm:pb-6 mt-auto" style={{
            borderTop: '1px solid var(--hp-border, rgba(255,255,255,0.07))',
            background: 'var(--hp-card, #111520)',
        }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
                    <div className="col-span-2 sm:col-span-1">
                        <Link to="/">
                            <Logo size="sm" showTagline />
                        </Link>
                        <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--hp-muted, #6b7799)' }}>
                            Connecting talent with opportunities.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'var(--hp-text, #eef2ff)' }}>Company</h4>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>About Us</a>
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>Careers</a>
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>Contact</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'var(--hp-text, #eef2ff)' }}>Support</h4>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>Help Center</a>
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>Privacy Policy</a>
                            <a href="#" className="text-xs sm:text-sm transition-colors" style={{ color: 'var(--hp-muted, #6b7799)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}>Terms of Service</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'var(--hp-text, #eef2ff)' }}>Connect</h4>
                        <div className="flex gap-2 sm:gap-3">
                            {['Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="flex items-center justify-center text-xs sm:text-sm transition-colors" 
                                    style={{
                                        width: '2.25rem',
                                        height: '2.25rem',
                                        borderRadius: '10px',
                                        background: 'var(--hp-surface-alt, rgba(255,255,255,0.06))',
                                        color: 'var(--hp-muted, #6b7799)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-accent, #2dd4bf)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted, #6b7799)'}
                                >
                                    {social === 'Twitter' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    )}
                                    {social === 'LinkedIn' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    )}
                                    {social === 'Instagram' && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4 sm:pt-6" style={{ borderTop: '1px solid var(--hp-border, rgba(255,255,255,0.07))' }}>
                    <p className="text-xs" style={{ color: 'var(--hp-muted, #6b7799)' }}>
                        © {currentYear} HireHub. Built with React & Spring Boot.
                    </p>
                </div>
            </div>
        </footer>
    );
}
