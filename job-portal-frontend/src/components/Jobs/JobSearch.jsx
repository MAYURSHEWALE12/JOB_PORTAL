import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI, savedJobAPI, getImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ApplyResumePicker from "../Resume/ApplyResumePicker";
import Loader from '../Loader';

export default function JobSearch() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const getCompanyInitial = (companyName) => companyName?.trim()?.charAt(0)?.toUpperCase() || 'C';

    const [jobs, setJobs]         = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [selected, setSelected] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    // Apply modal state
    const [showModal, setShowModal]       = useState(false);
    const [coverLetter, setCoverLetter]   = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [applying, setApplying]         = useState(false);
    const [applyError, setApplyError]     = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [appliedJobs, setAppliedJobs]   = useState(new Set());

    // Saved jobs state
    const [savedJobs, setSavedJobs]   = useState(new Set());
    const [savingJobId, setSavingJobId] = useState(null);

    const [filters, setFilters] = useState({
        keyword:  '',
        location: '',
        jobType:  '',
    });

    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        fetchJobs();
        if (user) fetchSavedJobIds();
        
        try {
            const saved = JSON.parse(localStorage.getItem('recentSearches'));
            if (Array.isArray(saved)) setRecentSearches(saved);
        } catch (e) {
            console.error('Failed to parse recent searches', e);
        }
    }, []);

    const fetchJobs = async (page = 0) => {
        setLoading(true);
        setError('');
        try {
            const res = await jobAPI.getAll(page, PAGE_SIZE);
            const data = res.data?.content ?? [];
            setJobs(data);
            setTotalPages(res.data?.totalPages ?? 0);
            setTotalElements(res.data?.totalElements ?? 0);
            setCurrentPage(res.data?.page ?? 0);
            if (data.length === 0 && page === 0) setError('No jobs available yet.');
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedJobIds = async () => {
        try {
            const res = await savedJobAPI.getSaved(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setSavedJobs(new Set(data.map(s => s.job.id)));
        } catch (err) {
            console.error('Failed to load saved jobs:', err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSelected(null);
        
        if (filters.keyword.trim()) {
            const term = filters.keyword.trim();
            setRecentSearches(prev => {
                const updated = [term, ...prev.filter(k => k.toLowerCase() !== term.toLowerCase())].slice(0, 5);
                localStorage.setItem('recentSearches', JSON.stringify(updated));
                return updated;
            });
        }
        try {
            const res = await jobAPI.search({ ...filters, page: 0, size: PAGE_SIZE });
            const data = res.data?.content ?? [];
            setJobs(data);
            setTotalPages(res.data?.totalPages ?? 0);
            setTotalElements(res.data?.totalElements ?? 0);
            setCurrentPage(0);
            if (data.length === 0) setError('No jobs found matching your search.');
        } catch (err) {
            console.error('Search failed:', err);
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleClear = () => {
        setFilters({ keyword: '', location: '', jobType: '' });
        setSelected(null);
        fetchJobs(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setSelected(null);
        fetchJobs(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleSave = async (e, jobId) => {
        e.stopPropagation();
        if (!user) return;
        setSavingJobId(jobId);
        try {
            if (savedJobs.has(jobId)) {
                await savedJobAPI.unsave(user.id, jobId);
                setSavedJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
            } else {
                await savedJobAPI.save(user.id, jobId);
                setSavedJobs(prev => new Set([...prev, jobId]));
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        } finally {
            setSavingJobId(null);
        }
    };

    const handleOpenApply = () => {
        setApplyError('');
        setApplySuccess('');
        setCoverLetter('');
        setSelectedResumeId(null);
        setShowModal(true);
    };

    const handleApply = async () => {
        if (!user) return;
        setApplying(true);
        setApplyError('');
        setApplySuccess('');
        try {
            await applicationAPI.apply(selected.id, user.id, coverLetter, selectedResumeId);
            setApplySuccess('🎉 Application submitted successfully!');
            setAppliedJobs(prev => new Set([...prev, selected.id]));
            setCoverLetter('');
            setSelectedResumeId(null);
            setTimeout(() => {
                setShowModal(false);
                setApplySuccess('');
            }, 2000);
        } catch (err) {
            setApplyError(err.response?.data?.error || 'Failed to apply. Please try again.');
        } finally {
            setApplying(false);
        }
    };

    const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'ADMIN';
    const hasApplied = selected && appliedJobs.has(selected.id);
    const isSaved    = selected && savedJobs.has(selected.id);

    return (
        <div>
            {/* ── Search Bar ─────────────────────────────────────────── */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-6 sm:p-8 mb-8 rounded-none">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 mb-6 uppercase tracking-tight">🔍 Search Jobs</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleChange}
                        placeholder="Job title, skill, keyword..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 transition-all dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold uppercase placeholder:normal-case placeholder:font-normal"
                    />
                    <input
                        type="text"
                        name="location"
                        value={filters.location}
                        onChange={handleChange}
                        placeholder="Location (e.g. Pune, Mumbai)"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 transition-all dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold uppercase placeholder:normal-case placeholder:font-normal"
                    />
                    <select
                        name="jobType"
                        value={filters.jobType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 transition-all dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold uppercase"
                    >
                        <option value="">All Job Types</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="REMOTE">Remote</option>
                        <option value="FREELANCE">Freelance</option>
                        <option value="TEMPORARY">Temporary</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="neo-btn flex-1 sm:flex-initial bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-3 dark:border-stone-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="neo-btn flex-1 sm:flex-initial bg-white dark:bg-stone-800 dark:border-stone-700 text-stone-900 dark:text-gray-100 px-8 py-3"
                    >
                        Clear
                    </button>
                </div>

                {/* ── Recent Searches ────────────────────────────────────── */}
                {recentSearches.length > 0 && (
                    <div className="mt-6 pt-4 border-t-[3px] border-stone-200 dark:border-stone-700 border-dashed">
                        <span className="text-xs font-black text-stone-500 dark:text-stone-400 uppercase tracking-widest mr-3">
                            Recent:
                        </span>
                        <div className="inline-flex flex-wrap gap-2">
                            {recentSearches.map((term, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, keyword: term }));
                                    }}
                                    className="text-xs font-bold bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-3 py-1.5 border-[2px] border-stone-900 dark:border-stone-600 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:-translate-y-0.5 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] transition-all uppercase font-sans tracking-wide"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </form>

            {/* ── Results + Detail ───────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-6 relative">

                {/* Job List */}
                <div className={`flex-1 space-y-4 ${selected ? 'hidden md:block md:w-1/2' : 'w-full'}`}>

                    {loading && <Loader text="Loading jobs..." />}

                    {!loading && error && (
                        <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-bold">{error}</div>
                    )}

                    {!loading && !error && jobs.length > 0 && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-2 font-bold uppercase tracking-wider">
                            Showing {jobs.length} of {totalElements} job{totalElements !== 1 ? 's' : ''} found
                        </p>
                    )}

                    {!loading && jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => setSelected(job)}
                            className={`
                                neo-card p-6 cursor-pointer
                                ${selected?.id === job.id 
                                    ? 'border-orange-500 shadow-[6px_6px_0_#ea580c] dark:shadow-[6px_6px_0_#ea580c] -translate-x-1 -translate-y-1 scale-[1.01]' 
                                    : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 flex gap-4">
                                    <div className="w-12 h-12 flex-shrink-0 bg-stone-100 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 flex items-center justify-center overflow-hidden shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]">
                                        {job.employer?.companyProfile?.logoUrl ? (
                                            <img src={getImageUrl(`/companies/image/${job.employer.companyProfile.logoUrl}`)} alt="logo" className="w-full h-full object-contain p-1" loading="lazy" />
                                        ) : (
                                            <span className="font-black text-2xl text-orange-600 dark:text-orange-500">
                                                {getCompanyInitial(job.employer?.companyProfile?.companyName)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-stone-900 dark:text-gray-100 text-xl tracking-tight leading-tight">{job.title}</h3>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/company/${job.employer.id}`); }}
                                            className="text-stone-600 dark:text-stone-400 font-bold text-sm mt-1 uppercase hover:text-orange-500 transition-colors underline decoration-2 decoration-stone-200 dark:decoration-stone-800"
                                        >
                                            {job.employer?.companyProfile?.companyName || `${job.employer?.firstName} ${job.employer?.lastName}`}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <button
                                        onClick={(e) => handleToggleSave(e, job.id)}
                                        disabled={savingJobId === job.id}
                                        title={savedJobs.has(job.id) ? 'Remove bookmark' : 'Save job'}
                                        className={`text-lg transition disabled:opacity-50 hover:scale-110
                                            ${savedJobs.has(job.id) ? 'text-orange-500' : 'text-gray-300 hover:text-orange-400'}`}
                                    >
                                        {savingJobId === job.id ? '⏳' : savedJobs.has(job.id) ? '🔖' : '🔖'}
                                    </button>

                                    {appliedJobs.has(job.id) && (
                                        <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold px-2 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide">
                                            ✓ Applied
                                        </span>
                                    )}
                                    <span className="bg-orange-100 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] text-stone-900 dark:text-orange-400 text-xs font-bold px-3 py-1 uppercase tracking-wide dark:bg-stone-900">
                                        {job.jobType?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-3 text-sm text-stone-600 dark:text-stone-400 font-bold uppercase">
                                <span>📍 {job.location}</span>
                                {job.salaryMin && (
                                    <span>💰 ₹{Number(job.salaryMin).toLocaleString()} - ₹{Number(job.salaryMax).toLocaleString()}</span>
                                )}
                            </div>

                            <p className="text-stone-700 dark:text-stone-400 text-sm mt-3 line-clamp-2 border-t-[3px] border-stone-200 dark:border-stone-700 border-dashed pt-3 font-medium">
                                {job.description}
                            </p>
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-4 border-t-[3px] border-stone-200 dark:border-stone-700 mt-4">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5"
                            >
                                ← Prev
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (currentPage <= 2) {
                                        pageNum = i;
                                    } else if (currentPage >= totalPages - 3) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 text-sm font-bold border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] transition-all uppercase
                                                ${currentPage === pageNum
                                                    ? 'bg-orange-500 text-white -translate-y-0.5'
                                                    : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-gray-100 hover:-translate-y-0.5'}`}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* Job Detail Panel */}
                {selected && (
                    <div className="w-full md:w-1/2 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-6 h-fit md:sticky md:top-4 rounded-none">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2 -ml-2">
                                <button
                                    onClick={() => setSelected(null)}
                                    className="md:hidden flex items-center justify-center p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition"
                                    title="Back to list"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">{selected.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="hidden md:block w-10 h-10 flex border-[3px] border-stone-900 dark:border-stone-700 items-center justify-center bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-black text-xl hover:bg-rose-500 hover:text-white hover:border-rose-700 transition-colors shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="bg-orange-100 dark:bg-stone-900 text-stone-900 dark:text-orange-400 text-xs font-bold px-3 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide">
                                {selected.jobType?.replace('_', ' ')}
                            </span>
                            <span className="bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold px-3 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide">
                                {selected.status}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-stone-600 dark:text-stone-300 mb-4 font-bold uppercase bg-stone-50 dark:bg-stone-900/50 p-4 border-[3px] border-stone-900 dark:border-stone-700 border-dashed">
                            <p>📍 <span className="text-stone-900 dark:text-white">{selected.location}</span></p>
                            {selected.salaryMin && (
                                <p>💰 <span className="text-emerald-600 dark:text-emerald-400">
                                    ₹{Number(selected.salaryMin).toLocaleString()} — ₹{Number(selected.salaryMax).toLocaleString()}
                                </span></p>
                            )}
                            {selected.experienceRequired && (
                                <p>🧑‍💼 <span className="text-stone-900 dark:text-white">{selected.experienceRequired}</span></p>
                            )}
                            {selected.positionsAvailable && (
                                <p>👥 <span className="text-stone-900 dark:text-white">{selected.positionsAvailable} positions</span></p>
                            )}
                        </div>

                        <h3 className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase tracking-wide mb-3 border-b-[3px] border-stone-900 dark:border-stone-700 pb-1">Description</h3>
                        <p className="text-stone-700 dark:text-stone-400 text-sm whitespace-pre-line leading-relaxed font-medium">{selected.description}</p>

                        {selected.requirements && (
                            <>
                                <h3 className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase tracking-wide mt-6 mb-3 border-b-[3px] border-stone-900 dark:border-stone-700 pb-1">Requirements</h3>
                                <p className="text-stone-700 dark:text-stone-400 text-sm whitespace-pre-line leading-relaxed font-medium">{selected.requirements}</p>
                            </>
                        )}

                        {/* ── Action Buttons ────────────────────────── */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <button
                                onClick={(e) => handleToggleSave(e, selected.id)}
                                disabled={savingJobId === selected.id}
                                className={`px-4 py-3 rounded-none font-bold text-sm transition border-[3px] border-stone-900 dark:border-stone-700 disabled:opacity-50 uppercase
                                    ${isSaved
                                        ? 'bg-orange-200 dark:bg-stone-900 text-stone-900 dark:text-orange-400 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917]'
                                        : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-gray-100 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917]'}`}
                            >
                                {savingJobId === selected.id ? '⏳' : isSaved ? '🔖 Saved' : '🔖 Save'}
                            </button>

                            {isEmployer ? (
                                <div className="flex-1 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-sm text-center font-bold py-3.5 border-[3px] border-stone-900 dark:border-stone-700 uppercase">
                                    {user?.role === 'ADMIN' ? 'Admins cannot apply' : 'Employers cannot apply'}
                                </div>
                            ) : hasApplied ? (
                                <div className="flex-1 bg-green-300 dark:bg-green-900/40 text-stone-900 dark:text-green-400 text-sm text-center font-black py-3.5 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] uppercase tracking-wider">
                                    ✅ Already Applied
                                </div>
                            ) : (
                                <button
                                    onClick={handleOpenApply}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-lg py-3.5 border-[3px] border-stone-900 dark:border-stone-700 shadow-[5px_5px_0_#1c1917] hover:shadow-[7px_7px_0_#1c1917] dark:shadow-[5px_5px_0_#000] hover:-translate-y-1 transition-all uppercase tracking-wider"
                                >
                                    Apply Now
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Apply Modal ────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[12px_12px_0_#1c1917] dark:shadow-[12px_12px_0_#000] w-full max-w-lg p-8 rounded-none max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">Apply for Job</h2>
                                <p className="text-orange-600 dark:text-orange-400 font-bold mt-1 uppercase">{selected?.title}</p>
                                <p className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase">📍 {selected?.location}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex border-[3px] border-stone-900 dark:border-stone-700 items-center justify-center bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-black text-xl hover:bg-rose-500 hover:text-white transition-colors shadow-[3px_3px_0_#1c1917] hover:shadow-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Error/Success Messages with animation-reset via key */}
                        {applyError && (
                            <div key={applyError} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                                {applyError}
                            </div>
                        )}
                        {applySuccess && (
                            <div key={applySuccess} className="bg-emerald-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                                {applySuccess}
                            </div>
                        )}

                        {!applySuccess && (
                            <>
                                {/* Resume Picker */}
                                <ApplyResumePicker
                                    userId={user?.id}
                                    selectedResumeId={selectedResumeId}
                                    onSelect={setSelectedResumeId}
                                />

                                {/* Cover Letter */}
                                <div className="mb-4">
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                        Cover Letter
                                        <span className="text-stone-400 font-bold ml-1">(optional)</span>
                                    </label>
                                    <textarea
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        rows={5}
                                        placeholder="Tell the employer why you're a great fit..."
                                        className="w-full px-4 py-3 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all resize-none text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="bg-orange-100 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 p-3 mb-5 text-sm text-stone-900 dark:text-orange-300 font-bold uppercase">
                                    Applying as: <span className="font-black">{user?.firstName} {user?.lastName}</span>
                                    <span className="text-stone-500 dark:text-stone-400 ml-1">({user?.email})</span>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white font-black uppercase tracking-widest py-3 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApply}
                                        disabled={applying || !selectedResumeId}
                                        className="neo-btn flex-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3"
                                    >
                                        {applying ? 'Submitting...' : '🚀 Submit Application'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
