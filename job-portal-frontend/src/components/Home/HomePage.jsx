import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobAPI, getImageUrl } from '../../services/api';
import Loader from '../Loader';
import Footer from '../Footer';
import { useAuthStore } from '../../store/authStore';
import PublicNavbar from '../PublicNavbar';

export default function HomePage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showResumeBuilder, setShowResumeBuilder] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const getCompanyInitial = (companyName) => companyName?.trim()?.charAt(0)?.toUpperCase() || 'C';

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await jobAPI.getAll();
                // Depending on the backend this could be nested
                const jobsData = res.data || [];
                // Sort by newest if there isn't a sort inherently, or just reverse 
                setJobs(jobsData.reverse());  
            } catch (err) {
                console.error("Failed to fetch jobs public", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const recentJobs = jobs.slice(0, 3);

    return (
        <div className="min-h-screen bg-orange-50 dark:bg-stone-950 transition-colors duration-500 font-sans text-stone-900 dark:text-gray-100 selection:bg-orange-500 selection:text-white">
            <PublicNavbar />

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-24">
                {/* Hero Section */}
                <div className="text-center mb-16 md:mb-24 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-400/30 dark:bg-orange-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 z-0 pointer-events-none animate-pulse"></div>
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight mb-6">
                            Find Your Next
                            <br />
                            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent transform inline-block hover:scale-105 transition-transform">
                                Big Opportunity
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-stone-600 dark:text-stone-300 font-medium max-w-2xl mx-auto mb-10">
                            The most aggressively structured job board for aggressively ambitious professionals. 
                            Browse top positions and apply immediately.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link to="/register" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] hover:shadow-[8px_8px_0_#1c1917] dark:shadow-[6px_6px_0_#000] dark:hover:shadow-[8px_8px_0_#000] text-white px-10 py-4 rounded-none font-black text-xl uppercase tracking-wider transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1">
                                Get Started
                            </Link>
                            <a href="#jobs" className="w-full sm:w-auto bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] hover:shadow-[8px_8px_0_#1c1917] dark:shadow-[6px_6px_0_#000] dark:hover:shadow-[8px_8px_0_#000] text-stone-900 dark:text-gray-100 px-10 py-4 rounded-none font-black text-xl uppercase tracking-wider transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1">
                                Browse Jobs
                            </a>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 relative z-10">
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-[8px_8px_0_#f97316]">
                        <div className="text-5xl font-black text-orange-500 mb-2">{jobs.length > 0 ? jobs.length : '100+'}</div>
                        <div className="text-stone-600 dark:text-stone-300 font-bold uppercase tracking-widest text-sm">Active Jobs</div>
                    </div>
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-[8px_8px_0_#f97316]">
                        <div className="text-5xl font-black text-rose-500 mb-2">5.2k</div>
                        <div className="text-stone-600 dark:text-stone-300 font-bold uppercase tracking-widest text-sm">Users Hired</div>
                    </div>
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-[8px_8px_0_#f97316]">
                        <div className="text-5xl font-black text-orange-500 mb-2">350+</div>
                        <div className="text-stone-600 dark:text-stone-300 font-bold uppercase tracking-widest text-sm">Partner Companies</div>
                    </div>
                </div>

                {/* Resume Builder Feature Section */}
                <div className="mb-20 relative z-10">
                    <div className="bg-stone-900 dark:bg-stone-700 border-[3px] border-stone-900 shadow-[8px_8px_0_#ea580c] p-1 md:p-2 transition-all hover:shadow-[12px_12px_0_#ea580c]">
                        <div className="bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-block bg-orange-100 dark:bg-stone-900 text-orange-600 dark:text-orange-500 font-black text-xs px-3 py-1 border-[2px] border-stone-900 mb-6 uppercase tracking-widest">
                                        Free Feature
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100 mb-6 leading-none">
                                        No Profile? <br />
                                        <span className="text-orange-500">No Problem.</span>
                                    </h3>
                                    <p className="text-lg text-stone-600 dark:text-stone-300 font-bold mb-8">
                                        Generate a professional, high-impact resume in seconds. 
                                        No account required. Just fill, choose a template, and download.
                                    </p>
                                    <button 
                                        onClick={() => navigate('/resume-builder')}
                                        className="w-full sm:w-auto bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c] hover:shadow-[6px_6px_0_#ea580c] px-8 py-4 font-black uppercase tracking-wider transition-all hover:-translate-y-1 hover:-translate-x-1"
                                    >
                                        🚀 Launch Resume Builder
                                    </button>
                                </div>
                                <div className="flex-1 hidden md:block relative">
                                    <div className="absolute -inset-4 bg-orange-500/10 rotate-3 border-[3px] border-dashed border-orange-500/30"></div>
                                    <div className="relative bg-white dark:bg-stone-900 border-[3px] border-stone-900 p-4 shadow-[10px_10px_0_#1c1917] group overflow-hidden">
                                        <div className="h-64 bg-stone-50 dark:bg-stone-800 border-[2px] border-stone-200 dark:border-stone-700 p-4 overflow-hidden">
                                             <div className="w-1/2 h-4 bg-stone-300 mb-4 animate-pulse"></div>
                                             <div className="w-full h-2 bg-stone-200 mb-2"></div>
                                             <div className="w-full h-2 bg-stone-200 mb-2"></div>
                                             <div className="w-3/4 h-2 bg-stone-200 mb-6"></div>
                                             <div className="w-1/3 h-3 bg-orange-200 mb-3"></div>
                                             <div className="w-full h-2 bg-stone-200 mb-2"></div>
                                             <div className="w-5/6 h-2 bg-stone-200 mb-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Latest Jobs Section */}
                <div id="jobs" className="relative z-10 scroll-mt-24">
                    <div className="flex justify-between items-end mb-8 border-b-[4px] border-stone-900 dark:border-stone-700 pb-4">
                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">
                            Current Openings
                        </h3>
                        <Link to="/login" className="hidden sm:block text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest hover:underline decoration-[3px] underline-offset-4">
                            View All →
                        </Link>
                    </div>

                    {loading ? (
                        <Loader text="Loading Jobs..." />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentJobs.map(job => (
                                <div 
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="bg-white dark:bg-stone-800 rounded-none p-6 cursor-pointer border-[3px] border-stone-900 dark:border-stone-700 transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#f97316] dark:hover:shadow-[10px_10px_0_#ea580c] flex flex-col h-full relative"
                                >
                                    <div className="absolute top-4 right-4 bg-orange-100 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] text-stone-900 dark:text-orange-400 text-[10px] font-black px-2 py-1 uppercase tracking-wider dark:bg-stone-900">
                                        {job.jobType?.replace('_', ' ')}
                                    </div>
                                    <div className="w-12 h-12 mb-4 bg-stone-100 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 flex items-center justify-center overflow-hidden shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]">
                                        {job.employer?.companyProfile?.logoUrl ? (
                                            <img src={getImageUrl(`/companies/image/${job.employer.companyProfile.logoUrl}`)} alt="logo" className="w-full h-full object-contain p-1" loading="lazy" />
                                        ) : (
                                            <span className="font-black text-2xl text-orange-600 dark:text-orange-500">
                                                {getCompanyInitial(job.employer?.companyProfile?.companyName)}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-black text-stone-900 dark:text-gray-100 text-xl tracking-tight leading-tight mb-1 line-clamp-2">
                                        {job.title}
                                    </h4>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/company/${job.employer.id}`); }}
                                        className="text-stone-600 dark:text-stone-400 font-bold text-sm mb-4 uppercase hover:text-orange-500 transition-colors text-left"
                                    >
                                        {job.employer?.companyProfile?.companyName || `${job.employer?.firstName} ${job.employer?.lastName}`}
                                    </button>
                                    
                                    <div className="mt-auto pt-4 border-t-[3px] border-stone-900 dark:border-stone-700 border-dashed space-y-2 text-sm text-stone-600 dark:text-stone-300 font-medium">
                                        <div className="flex items-center gap-2"><span>📍</span> {job.location}</div>
                                        {job.salaryMin && (
                                            <div className="flex items-center gap-2"><span>💰</span> ₹{Number(job.salaryMin).toLocaleString()} - ₹{Number(job.salaryMax).toLocaleString()}</div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
                                        className="mt-6 w-full bg-white dark:bg-stone-800 text-stone-900 dark:text-gray-100 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] font-black py-2 uppercase tracking-widest hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 transition-colors"
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!loading && jobs.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000]">
                            <p className="text-xl font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest">No jobs available right now.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Job Detail Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
                    <div 
                        className="bg-white dark:bg-stone-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-none border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#ea580c] dark:shadow-[8px_8px_0_#f97316] p-6 sm:p-8 relative flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSelectedJob(null)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-black border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] text-xl font-black transition-all hover:-translate-y-0.5"
                        >
                            ✕
                        </button>

                        <div className="mb-6 flex items-start gap-4 pr-12">
                            <div className="w-16 h-16 flex-shrink-0 bg-stone-100 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 flex items-center justify-center overflow-hidden shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000]">
                                {selectedJob.employer?.companyProfile?.logoUrl ? (
                                    <img src={getImageUrl(`/companies/image/${selectedJob.employer.companyProfile.logoUrl}`)} alt="logo" className="w-full h-full object-contain p-1" loading="lazy" />
                                ) : (
                                    <span className="font-black text-3xl text-orange-600 dark:text-orange-500">
                                        {getCompanyInitial(selectedJob.employer?.companyProfile?.companyName)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100 leading-none mb-2">
                                    {selectedJob.title}
                                </h2>
                                <button 
                                    onClick={() => navigate(`/company/${selectedJob.employer.id}`)}
                                    className="text-lg font-bold text-stone-600 dark:text-stone-400 hover:text-orange-500 transition-colors uppercase"
                                >
                                    {selectedJob.employer?.companyProfile?.companyName || `${selectedJob.employer?.firstName} ${selectedJob.employer?.lastName}`}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="bg-orange-100 dark:bg-stone-900 text-stone-900 dark:text-orange-400 text-xs font-black px-3 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide">
                                {selectedJob.jobType?.replace('_', ' ')}
                            </span>
                            <span className="bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-400 text-xs font-black px-3 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide">
                                {selectedJob.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-stone-50 dark:bg-stone-900/50 p-4 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                            <div>
                                <span className="block text-[10px] font-black uppercase text-stone-500 dark:text-stone-400">Location</span>
                                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedJob.location}</span>
                            </div>
                            {selectedJob.salaryMin && (
                                <div>
                                    <span className="block text-[10px] font-black uppercase text-stone-500 dark:text-stone-400">Salary</span>
                                    <span className="font-bold text-stone-800 dark:text-stone-200">₹{Number(selectedJob.salaryMin).toLocaleString()} - ₹{Number(selectedJob.salaryMax).toLocaleString()}</span>
                                </div>
                            )}
                            {selectedJob.experienceRequired && (
                                <div className="col-span-2 md:col-span-1">
                                    <span className="block text-[10px] font-black uppercase text-stone-500 dark:text-stone-400">Experience</span>
                                    <span className="font-bold text-stone-800 dark:text-stone-200">{selectedJob.experienceRequired}</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100 mb-4 border-b-[3px] border-stone-900 dark:border-stone-700 pb-2">
                                Job Description
                            </h3>
                            <div className="prose dark:prose-invert max-w-none text-stone-700 dark:text-stone-300 font-medium whitespace-pre-line">
                                {selectedJob.description}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t-[4px] border-stone-900 dark:border-stone-700 border-dashed text-center">
                            <p className="text-sm font-bold text-stone-500 dark:text-stone-400 mb-4 uppercase tracking-widest">
                                Want to apply for this job?
                            </p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] dark:shadow-[4px_4px_0_#000] dark:hover:shadow-[6px_6px_0_#000] px-10 py-4 text-xl font-black uppercase tracking-wider transition-all hover:-translate-y-1 hover:-translate-x-1"
                            >
                                Login to Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
