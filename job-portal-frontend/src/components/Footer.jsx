import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t-[4px] border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 pt-16 pb-8 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 gap-12 lg:grid-cols-4 border-b-[4px] border-stone-900 dark:border-stone-700 border-dashed pb-12 mb-8 items-start">
                
                {/* Col 1: Logo & Socials */}
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-8">
                        <Link to="/" className="text-2xl font-black uppercase tracking-tighter text-stone-900 dark:text-gray-100">
                            <span className="text-orange-600">J</span>ob<span className="text-rose-500">P</span>ortal
                        </Link>
                    </div>
                    <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-widest text-[10px] mb-4">Connect with us</h3>
                    <div className="flex gap-4">
                        {[
                            { icon: '𝕏',  label: 'twitter',   color: 'text-stone-900 dark:text-white' },
                            { icon: 'in', label: 'linkedin',  color: 'text-blue-800' },
                            { icon: 'ig', label: 'instagram', color: 'text-pink-600' },
                            { icon: 'gh', label: 'github',    color: 'text-stone-900 dark:text-white' },
                        ].map((social) => (
                            <a 
                                key={social.label}
                                href="#" 
                                className="w-9 h-9 flex items-center justify-center bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#ea580c] dark:hover:shadow-[4px_4px_0_#f97316] hover:-translate-y-1 transition-all font-black text-sm"
                            >
                                <span className={social.color}>{social.icon}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Col 2, 3, 4: Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-3">
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest text-[10px]">Company</h4>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">About us</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Careers</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Sitemap</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Credits</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest text-[10px]">Support</h4>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Help center</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Grievances</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Report issue</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Trust & Safety</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest text-[10px]">Legal</h4>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Privacy policy</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Terms of service</a>
                        <a href="#" className="text-stone-700 dark:text-stone-300 font-bold text-sm hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-tight">Fraud alert</a>
                    </div>
                </div>
            </div>

            <div className="text-center px-6 text-[10px] font-black text-stone-500 dark:text-stone-600 uppercase tracking-[0.2em]">
                © {currentYear} JobPortal. Neobrutalist Edition. Built on React & Spring Boot.
            </div>
        </footer>
    );
}
