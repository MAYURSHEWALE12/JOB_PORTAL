import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI, getImageUrl } from '../../services/api';
import { Search, MapPin, Building2, ExternalLink } from 'lucide-react';
import Loader from '../Loader';

export default function BrowseCompanies() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await companyAPI.getAll();
                setCompanies(res.data);
            } catch (err) {
                console.error('Failed to fetch companies:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const filtered = companies.filter(c => 
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader />;

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black uppercase text-stone-900 dark:text-white tracking-tighter leading-none mb-2">
                        Discover <span className="text-orange-500">Industry</span> Leaders
                    </h1>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] font-mono">
                        Connected ecosystem of {companies.length} active companies
                    </p>
                </div>
                
                <div className="hidden lg:flex gap-4">
                    <div className="p-4 bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#000]">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Global Reach</p>
                        <p className="text-xl font-black text-rose-500 uppercase leading-none">12+ Regions</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#000]">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Hiring Velocity</p>
                        <p className="text-xl font-black text-emerald-500 uppercase leading-none">High 🔥</p>
                    </div>
                </div>
            </div>

            {/* Search Filters */}
            <div className="group bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-2 mb-16 shadow-[10px_10px_0_#1c1917] dark:shadow-[10px_10px_0_#000] focus-within:shadow-[14px_14px_0_#f97316] transition-all flex items-center">
                <div className="p-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-r-[4px] border-stone-900 hidden sm:block shrink-0">
                    <Search size={28} strokeWidth={3} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search by name, industry, or headquarters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent px-6 py-4 text-xl font-black placeholder:text-stone-300 dark:placeholder:text-stone-700 outline-none text-stone-900 dark:text-white"
                />
            </div>

            {/* Company Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {filtered.map(company => {
                    const companyRouteId = company.userId ?? company.user?.id;
                    const canOpenProfile = Boolean(companyRouteId);

                    return (
                    <div 
                        key={company.id}
                        className="group bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[16px_16px_0_#f97316] transition-all duration-300 flex flex-col h-full overflow-hidden"
                    >
                        {/* Company Header */}
                        <div className="h-32 bg-stone-100 dark:bg-stone-800 border-b-[4px] border-stone-900 dark:border-stone-700 relative overflow-hidden">
                            {company.bannerUrl ? (
                                <img 
                                    src={getImageUrl(`/companies/image/${company.bannerUrl}`)} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt="Banner" 
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-rose-500 opacity-60" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
                        </div>

                        {/* Logo Overlap */}
                        <div className="px-6 -mt-12 mb-4 relative z-10">
                            <div className="w-24 h-24 bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#000] overflow-hidden group-hover:rotate-3 transition-transform">
                                {company.logoUrl ? (
                                    <img src={getImageUrl(`/companies/image/${company.logoUrl}`)} alt={company.companyName} className="w-full h-full object-contain p-1" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-orange-400 to-rose-500 flex items-center justify-center text-3xl font-black text-white uppercase">{company.companyName?.charAt(0) || 'C'}</div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="px-8 pb-8 flex-1 flex flex-col">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">{company.companyName}</h2>
                                    <div className="w-4 h-4 bg-emerald-500 text-stone-900 text-[8px] flex items-center justify-center border border-stone-900 font-black rounded-full" title="Verified Profile">✨</div>
                                </div>
                                <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-6">{company.industry || 'Technology'}</p>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                                        <div className="w-8 h-8 flex items-center justify-center border-[2px] border-stone-900 dark:border-stone-700 bg-orange-50 dark:bg-stone-800">
                                            <MapPin size={16} className="text-rose-500" />
                                        </div>
                                        <span>{company.location || 'Distributed'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                                        <div className="w-8 h-8 flex items-center justify-center border-[2px] border-stone-900 dark:border-stone-700 bg-blue-50 dark:bg-stone-800">
                                            <Building2 size={16} className="text-emerald-500" />
                                        </div>
                                        <span>{company.employeeCount || '100+'} Employees</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="button"
                                disabled={!canOpenProfile}
                                onClick={() => {
                                    if (!companyRouteId) return;
                                    navigate(`/company/${companyRouteId}`);
                                }}
                                className={`w-full py-4 uppercase font-black text-xs tracking-[0.2em] border-[3px] border-stone-900 flex items-center justify-center gap-3 transition-all ${
                                    canOpenProfile
                                        ? 'bg-stone-900 text-white shadow-[6px_6px_0_#ea580c] dark:shadow-[6px_6px_0_#000] hover:shadow-none hover:bg-orange-600'
                                        : 'bg-stone-200 text-stone-400 dark:bg-stone-800 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {canOpenProfile ? 'Examine Profile' : 'Access Denied'} <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                )})}
            </div>

            {filtered.length === 0 && (
                <div className="py-24 text-center border-[4px] border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center">
                    <div className="text-8xl mb-6 grayscale opacity-20">🕵️</div>
                    <p className="text-stone-400 dark:text-stone-600 font-black uppercase text-2xl tracking-tighter">Negative results for your scan</p>
                    <button 
                        onClick={() => setSearchTerm('')} 
                        className="mt-6 px-6 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-black uppercase text-xs tracking-widest border-[2px] border-stone-900"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}
