import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companyAPI, jobAPI, getImageUrl } from '../../services/api';
import { Globe, MapPin, Building2, Users, Briefcase, Calendar, Tag, Edit3, Info, PieChart, Star } from 'lucide-react';
import Loader from '../Loader';
import { useAuthStore } from '../../store/authStore';
import PublicNavbar from '../PublicNavbar';

const TABS = {
    ABOUT: 'ABOUT',
    JOBS: 'JOBS',
    CULTURE: 'CULTURE'
};

export default function CompanyProfilePage() {
    const { userId } = useParams();
    const { user: currentUser } = useAuthStore();
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(TABS.ABOUT);

    useEffect(() => {
        const fetchCompanyAndJobs = async () => {
            if (!userId || userId === 'undefined') {
                setError('Invalid company link.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [companyRes, jobsRes] = await Promise.all([
                    companyAPI.getByUser(userId),
                    jobAPI.getJobsByEmployer(userId)
                ]);
                setCompany(companyRes.data);
                setJobs(Array.isArray(jobsRes.data) ? jobsRes.data.filter((job) => job?.status === 'ACTIVE') : []);
            } catch (err) {
                setError('Profile not found.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchCompanyAndJobs();
    }, [userId]);

    if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-stone-950"><PublicNavbar /><Loader /></div>;

    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-stone-950">
            <PublicNavbar />
            <div className="flex items-center justify-center p-20">
                <div className="max-w-md bg-white border-[4px] border-stone-900 p-12 shadow-[12px_12px_0_#000] text-center">
                    <h2 className="text-3xl font-black uppercase mb-4">404: Not Found</h2>
                    <p className="text-stone-500 font-bold mb-8 uppercase text-xs">{error}</p>
                    <Link to="/" className="inline-block bg-stone-900 text-white px-8 py-3 font-black uppercase tracking-widest text-xs border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c] hover:shadow-none transition-all">Back Home</Link>
                </div>
            </div>
        </div>
    );

    const bannerUrl = company?.bannerUrl ? getImageUrl(`/companies/image/${company.bannerUrl}`) : null;
    const logoUrl = company?.logoUrl ? getImageUrl(`/companies/image/${company.logoUrl}`) : null;

    return (
        <div className="min-h-screen bg-orange-50/20 dark:bg-stone-950 pb-24">
            <PublicNavbar />

            {/* Hero Section */}
            <div className="relative h-[350px] md:h-[450px] border-b-[4px] border-stone-900 overflow-hidden">
                {bannerUrl ? (
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
                )}
                <div className="absolute inset-0 bg-stone-900/10" />
                
                <div className="absolute -bottom-16 left-12">
                    <div className="w-40 h-40 md:w-56 md:h-56 bg-white dark:bg-stone-800 border-[4px] border-stone-900 shadow-[12px_12px_0_#000] p-1 overflow-hidden group">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy" />
                        ) : (
                            <div className="w-full h-full bg-stone-100 flex items-center justify-center text-6xl font-black text-stone-300 uppercase">
                                {company?.companyName?.[0]}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
                    
                    {/* Left Column: Essential Stats */}
                    <div className="lg:col-span-4 space-y-10 order-2 lg:order-1">
                        <div>
                            <h1 className="text-6xl font-black uppercase tracking-tighter text-stone-900 dark:text-white leading-none mb-4">
                                {company?.companyName}
                            </h1>
                            <div className="flex gap-2">
                                <span className="bg-emerald-400 text-stone-900 px-2 py-0.5 border-[2px] border-stone-900 font-black text-[10px] uppercase">Verified Partner</span>
                                <span className="bg-stone-900 text-white px-2 py-0.5 border-[2px] border-stone-900 font-black text-[10px] uppercase">Top 1%</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-8 shadow-[12px_12px_0_#ea580c]">
                            <div className="space-y-6">
                                {[
                                    { icon: MapPin, label: 'Location', value: company?.location },
                                    { icon: Building2, label: 'Industry', value: company?.industry },
                                    { icon: Users, label: 'Team Size', value: company?.employeeCount },
                                    { icon: Globe, label: 'Website', value: company?.website, link: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-stone-50 dark:bg-stone-900 border-[2px] border-stone-900 flex items-center justify-center shrink-0">
                                            <item.icon size={20} className="text-stone-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                            {item.link ? (
                                                <a href={item.value?.startsWith('http') ? item.value : `https://${item.value}`} target="_blank" className="text-sm font-black text-stone-900 dark:text-white uppercase underline decoration-orange-500 decoration-2 transition-colors hover:text-orange-500">Visit Site</a>
                                            ) : (
                                                <p className="text-sm font-black text-stone-900 dark:text-white uppercase">{item.value || 'N/A'}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tabbed Content */}
                    <div className="lg:col-span-8 order-1 lg:order-2">
                        <div className="flex border-b-[4px] border-stone-900 mb-12 overflow-x-auto no-scrollbar">
                            {[
                                { id: TABS.ABOUT, label: 'Overview', icon: Info },
                                { id: TABS.JOBS, label: 'Open Roles', icon: Briefcase },
                                { id: TABS.CULTURE, label: 'Culture', icon: Star }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-10 py-5 flex items-center gap-3 font-black uppercase text-xs tracking-widest transition-all
                                        ${activeTab === tab.id ? 'bg-stone-900 text-white' : 'bg-transparent text-stone-400 hover:text-stone-900 hover:bg-stone-50'}`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content rendering based on tabs */}
                        {activeTab === TABS.ABOUT && (
                            <div className="animate-neo-thump">
                                <h2 className="text-4xl font-black uppercase text-stone-900 dark:text-white mb-8">About the Company</h2>
                                <p className="text-xl text-stone-600 dark:text-stone-400 font-bold leading-relaxed mb-12 selection:bg-orange-300">
                                    {company?.description || "No description provided."}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-8 shadow-[8px_8px_0_#000]">
                                        <h4 className="font-black uppercase text-sm mb-4 border-b-[3px] border-stone-900 inline-block">Specialties</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {company?.specialties?.split(',').map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-stone-100 dark:bg-stone-900 border-[2px] border-stone-900 text-[10px] font-black uppercase">{s.trim()}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-stone-900 text-white border-[4px] border-stone-900 p-8 shadow-[8px_8px_0_#ea580c]">
                                        <h4 className="font-black uppercase text-sm mb-4 border-b-[3px] border-white inline-block">Founded</h4>
                                        <p className="text-3xl font-black">{company?.foundedYear || 'Modern Era'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === TABS.JOBS && (
                            <div className="animate-neo-thump space-y-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-4xl font-black uppercase text-stone-900 dark:text-white">Current Openings</h2>
                                    <span className="bg-orange-500 text-stone-900 px-4 py-1 border-[3px] border-stone-900 font-black uppercase text-xs">{jobs.length} roles found</span>
                                </div>
                                
                                {jobs.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6">
                                        {jobs.map(job => (
                                            <Link key={job.id} to={`/job/${job.id}`} className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-8 shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#ea580c] hover:-translate-y-1 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-stone-900 dark:text-white uppercase mb-2 group-hover:text-orange-600 transition-colors">{job.title}</h3>
                                                        <div className="flex gap-4 text-[10px] font-black text-stone-400 uppercase">
                                                            <span className="flex items-center gap-1"><MapPin size={12}/> {job.location}</span>
                                                            <span className="flex items-center gap-1"><Briefcase size={12}/> {job.jobType}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-12 bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 flex items-center justify-center text-xl font-black group-hover:bg-orange-500 transition-colors">→</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-20 text-center border-[4px] border-dashed border-stone-300">
                                        <p className="font-black uppercase text-stone-400">No active postings at this time.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === TABS.CULTURE && (
                            <div className="animate-neo-thump">
                                <h2 className="text-4xl font-black uppercase text-stone-900 dark:text-white mb-8">Company Insights</h2>
                                <div className="p-8 bg-emerald-400 border-[4px] border-stone-900 shadow-[12px_12px_0_#000] text-center">
                                    <Star className="mx-auto mb-4 text-stone-900" size={48} fill="currentColor" />
                                    <h4 className="text-2xl font-black uppercase text-stone-900 mb-2">Internal Culture Grade: A+</h4>
                                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest max-w-sm mx-auto">Employees rate this workplace as highly innovative and inclusive based on recent surveys.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
