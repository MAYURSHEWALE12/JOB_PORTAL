import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuthStore } from '../store/authStore';

export default function PublicNavbar() {
    const { isLoggedIn, user } = useAuthStore();

    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-stone-900 px-6 py-4 flex justify-between items-center border-b-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_rgba(0,0,0,0.1)] dark:shadow-[6px_6px_0_#000]">
            <Link
                to="/"
                className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform"
            >
                Job Portal
            </Link>

            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link to="/companies" className="hidden sm:inline-block font-black uppercase tracking-wider text-stone-900 dark:text-gray-100 hover:text-orange-500 transition-colors mr-2">
                    Companies
                </Link>
                
                {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-[10px] font-black uppercase text-stone-400 tracking-widest leading-none">
                            Hi, <span className="text-stone-900 dark:text-white underline decoration-orange-500 decoration-2">{user?.firstName}</span>
                        </span>
                        <Link to="/dashboard" className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[2px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0_#ea580c] hover:shadow-[5px_5px_0_#ea580c] hover:-translate-y-1 hover:-translate-x-1 px-4 py-2 font-black uppercase tracking-wider rounded-none transition-all duration-200">
                            Dashboard
                        </Link>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="hidden sm:inline-block font-black uppercase tracking-wider text-stone-900 dark:text-gray-100 hover:text-orange-500 transition-colors mr-2">
                            Login
                        </Link>
                        <Link to="/register" className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[2px] border-stone-900 dark:border-stone-100 shadow-[3px_3px_0_#ea580c] hover:shadow-[5px_5px_0_#ea580c] hover:-translate-y-1 hover:-translate-x-1 px-4 py-2 font-black uppercase tracking-wider rounded-none transition-all duration-200">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
