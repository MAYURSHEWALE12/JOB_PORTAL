import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-[var(--color-divider)] bg-[var(--color-card)] pt-10 sm:pt-12 pb-5 sm:pb-6 mt-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
                    <div className="col-span-2 sm:col-span-1">
                        <Link to="/">
                        <Logo size="sm" showTagline />
                    </Link>
                        <p className="text-[var(--color-text-muted)] text-xs sm:text-sm mt-2">
                            Connecting talent with opportunities.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-2 sm:mb-3">Company</h4>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">About Us</a>
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">Careers</a>
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">Contact</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-2 sm:mb-3">Support</h4>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">Help Center</a>
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">Privacy Policy</a>
                            <a href="#" className="text-[var(--color-text-muted)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors">Terms of Service</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-2 sm:mb-3">Connect</h4>
                        <div className="flex gap-2 sm:gap-3">
                            {['Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--color-input)] flex items-center justify-center text-xs sm:text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                    {social === 'Twitter' && '𝕏'}
                                    {social === 'LinkedIn' && 'in'}
                                    {social === 'Instagram' && '📷'}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4 sm:pt-6 border-t border-[var(--color-divider)]">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        © {currentYear} HireHub. Built with React & Spring Boot.
                    </p>
                </div>
            </div>
        </footer>
    );
}
