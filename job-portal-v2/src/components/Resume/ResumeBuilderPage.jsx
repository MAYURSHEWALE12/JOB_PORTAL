import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ResumeHub from './ResumeHub';
import ResumeGenerator from './ResumeGenerator';
import Footer from '../Footer';

export default function ResumeBuilderPage() {
    const { user, isLoggedIn } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="h-screen flex flex-col bg-orange-50 dark:bg-stone-950 transition-colors duration-500 overflow-hidden font-sans text-stone-900 dark:text-gray-100">
            {/* ── Navbar ────────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-white dark:bg-stone-900 px-6 py-4 flex justify-between items-center border-b-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                <div className="flex items-center gap-6">
                    <h1 
                        className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        Job Portal
                    </h1>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-100 dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
                        <span className="text-orange-500">●</span> 
                        {isLoggedIn ? 'PRO BUILDER' : 'GUEST MODE'}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[2px] border-stone-900 shadow-[3px_3px_0_#ea580c] px-4 py-2 font-black uppercase tracking-wider text-xs transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0_#ea580c]"
                        >
                            Back to Dashboard
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <Link to="/login" className="hidden sm:inline-block font-black uppercase tracking-wider text-xs text-stone-900 dark:text-gray-100 hover:text-orange-500 transition-colors mt-2 mr-2">
                                Login
                            </Link>
                            <Link to="/register" className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[2px] border-stone-900 shadow-[3px_3px_0_#ea580c] px-4 py-2 font-black uppercase tracking-wider text-xs transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0_#ea580c]">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Main Content Area ────────────────────────────────────── */}
            <main className="flex-grow overflow-y-auto px-6 py-8 relative">
                {/* Background Decor */}
                <div className="absolute top-10 right-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>
                <div className="absolute bottom-10 left-10 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[10px_10px_0_#1c1917] dark:shadow-[10px_10px_0_#000] p-6 sm:p-10 mb-12">
                         {isLoggedIn ? (
                             <ResumeHub />
                         ) : (
                             <ResumeGenerator guestMode={true} />
                         )}
                    </div>

                    <div className="mb-12">
                         <Footer />
                    </div>
                </div>
            </main>
        </div>
    );
}
