import BrowseCompanies from './BrowseCompanies';
import PublicNavbar from '../PublicNavbar';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export default function BrowseCompaniesPage() {
    const { isLoggedIn } = useAuthStore();

    return (
        <div className="min-h-screen bg-orange-50/50 dark:bg-stone-950 transition-colors duration-500">
            {isLoggedIn ? (
                <div className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b-[3px] border-stone-900 dark:border-stone-700 px-6 py-3 flex justify-between items-center shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-xl font-black uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">Job Portal</Link>
                        <div className="h-6 w-[2px] bg-stone-300 dark:bg-stone-700 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400 hidden sm:block tracking-widest">Company Directory</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/dashboard" 
                            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[2px] border-stone-900 dark:border-stone-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#ea580c] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                <PublicNavbar />
            )}
            <BrowseCompanies />
        </div>
    );
}
