import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-[#EAD9C4] bg-[#FFFBF5] pt-12 pb-6">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <Link to="/" className="text-xl font-serif font-semibold text-gradient">
                            Job Portal
                        </Link>
                        <p className="text-[#8B7355] text-sm mt-3">
                            Connecting talent with opportunities. Your journey starts here.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[#4A3728] mb-3">Company</h4>
                        <div className="flex flex-col gap-2">
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">About Us</a>
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">Careers</a>
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">Contact</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[#4A3728] mb-3">Support</h4>
                        <div className="flex flex-col gap-2">
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">Help Center</a>
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">Privacy Policy</a>
                            <a href="#" className="text-[#8B7355] text-sm hover:text-[#C2651A] transition-colors">Terms of Service</a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[#4A3728] mb-3">Connect</h4>
                        <div className="flex gap-3">
                            {['Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-9 h-9 rounded-full warm-card flex items-center justify-center text-sm text-[#8B7355] hover:text-[#C2651A] transition-colors"
                                >
                                    {social === 'Twitter' && '𝕏'}
                                    {social === 'LinkedIn' && 'in'}
                                    {social === 'Instagram' && '📷'}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center pt-6 border-t border-[#EAD9C4]">
                    <p className="text-xs text-[#8B7355]">
                        © {currentYear} Job Portal. Built with React & Spring Boot.
                    </p>
                </div>
            </div>
        </footer>
    );
}
