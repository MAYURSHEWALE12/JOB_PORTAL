import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jobAPI, applicationAPI, savedJobAPI, resumeAnalysisAPI, resumeAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ApplyResumePicker from "../Resume/ApplyResumePicker";
import { SkeletonJobCard, Skeleton } from '../Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/* ─── Shared UI Helpers (Matched with HomePage) ──────────────────── */
const JOB_TYPE_STYLE = {
    FULL_TIME: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME: 'bg-sky-500/15   text-sky-400   ring-1 ring-sky-500/30',
    CONTRACT: 'bg-amber-500/15  text-amber-400  ring-1 ring-amber-500/30',
    REMOTE: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
};

function resolveLogoUrl(job) {
    let url = job.companyLogo || job.employer?.companyProfile?.logoUrl || job.employer?.profileImageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('logo_') || url.startsWith('banner_')) return `${API_BASE_URL.replace('/api', '')}/api/companies/image/${url}`;
    if (url.startsWith('avatar_')) return `${API_BASE_URL.replace('/api', '')}${url}`;
    return url;
}

function CompanyAvatar({ job, size = 'md' }) {
    const url = resolveLogoUrl(job);
    const name = job.companyName || job.employer?.companyProfile?.companyName || job.employer?.firstName || 'J';
    const dim = size === 'lg' ? 'w-14 h-14 text-xl rounded-2xl' : 'w-11 h-11 text-base rounded-xl';
    return url ? (
        <img src={url} alt={name} className={`${dim} object-cover flex-shrink-0`} onError={e => e.target.style.display = 'none'} />
    ) : (
        <div className={`${dim} flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm`}
            style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

const fadeUp = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

/* ─── Main Component ─────────────────────────────────────────────── */
export default function JobSearch() {
    const { user } = useAuthStore();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    const [savedJobs, setSavedJobs] = useState(new Set());
    const [savingJobId, setSavingJobId] = useState(null);

    const [primaryResume, setPrimaryResume] = useState(null);
    const [matchAnalysis, setMatchAnalysis] = useState(null);
    const [loadingMatch, setLoadingMatch] = useState(false);

    const [filters, setFilters] = useState({
        keyword: '',
        location: '',
        jobType: '',
        salaryMin: '',
    });

    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        fetchJobs();
        if (user) {
            fetchSavedJobIds();
            fetchAppliedJobIds();
            fetchPrimaryResume();
        }

        try {
            const saved = JSON.parse(localStorage.getItem('recentSearches'));
            if (Array.isArray(saved)) setRecentSearches(saved);
        } catch (e) {
            console.error('Failed to parse recent searches', e);
        }
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
            setJobs([...data].reverse());
            if (data.length === 0) setError('No jobs available yet.');
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

    const fetchAppliedJobIds = async () => {
        try {
            const res = await applicationAPI.getMyApplications(user.id);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
            setAppliedJobs(new Set(data.map(a => a.job?.id).filter(Boolean)));
        } catch (err) {
            console.error('Failed to load applied jobs:', err);
        }
    };

    const fetchPrimaryResume = async () => {
        try {
            const res = await resumeAPI.list(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) {
                setPrimaryResume(data[0]);
            }
        } catch (err) {
            console.error('Failed to fetch resumes:', err);
        }
    };

    const fetchMatchScore = async (jobId, resumeId) => {
        if (!resumeId || !jobId) return;
        setLoadingMatch(true);
        try {
            const res = await resumeAnalysisAPI.getMatchAnalysis(resumeId, jobId);
            if (res.status === 200) {
                setMatchAnalysis(res.data);
            } else {
                setMatchAnalysis(null);
            }
        } catch (err) {
            setMatchAnalysis(null);
        } finally {
            setLoadingMatch(false);
        }
    };

    const handleTriggerMatch = async () => {
        if (!primaryResume || !selected) return;
        setLoadingMatch(true);
        try {
            const res = await resumeAnalysisAPI.analyzeMatch(primaryResume.id, selected.id);
            setMatchAnalysis(res.data);
        } catch (err) {
            console.error('Failed to analyze match:', err);
        } finally {
            setLoadingMatch(false);
        }
    };

    useEffect(() => {
        if (selected && primaryResume && user?.role === 'JOBSEEKER') {
            fetchMatchScore(selected.id, primaryResume.id);
        } else {
            setMatchAnalysis(null);
        }
    }, [selected, primaryResume]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setSelected(null);

        const term = filters.keyword.trim();
        if (term) {
            setRecentSearches(prev => {
                const updated = [term, ...prev.filter(k => k.toLowerCase() !== term.toLowerCase())].slice(0, 5);
                localStorage.setItem('recentSearches', JSON.stringify(updated));
                return updated;
            });
        }

        try {
            const payload = {
                ...(filters.keyword && { keyword: filters.keyword }),
                ...(filters.location && { location: filters.location }),
                ...(filters.jobType && { jobType: filters.jobType }),
                ...(filters.salaryMin && { salaryMin: Number(filters.salaryMin) }),
                page: 0,
                size: 20
            };
            const res = await jobAPI.advancedSearch(payload);
            const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
            setJobs(data);
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
        setFilters({ keyword: '', location: '', jobType: '', salaryMin: '' });
        setSelected(null);
        fetchJobs();
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
            setApplySuccess('Application submitted successfully!');
            setAppliedJobs(prev => new Set([...prev, selected.id]));
            setCoverLetter('');
            setSelectedResumeId(null);
            setTimeout(() => {
                setShowModal(false);
                setApplySuccess('');
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || (err.response?.data ? JSON.stringify(err.response.data) : err.message) || 'Failed to apply. Please try again.';
            setApplyError(`Apply failed: ${errorMsg}`);
        } finally {
            setApplying(false);
        }
    };

    const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'ADMIN';

    return (
        <div style={{ position: 'relative', zIndex: 10 }}>
            <style>{`
                /* UI Element Styles (Ported from HomePage) */
                .hp-card {
                    background: var(--hp-card, #ffffff);
                    border: 1px solid var(--hp-border, rgba(0,0,0,0.09));
                    border-radius: 16px;
                    transition: border-color .25s, transform .25s, box-shadow .25s, background .25s;
                    box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08));
                }
                .hp-card:hover {
                    border-color: var(--hp-border-hover, rgba(13,148,136,0.35));
                    transform: translateY(-3px);
                    box-shadow: 0 20px 60px rgba(0,0,0,.25);
                    background: var(--hp-card-hover, #f7faff);
                }
                
                .hp-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--hp-accent, #0d9488), var(--hp-accent2, #7c3aed));
                    color: #fff;
                    font-weight: 700;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: opacity .2s, transform .2s, box-shadow .2s;
                    box-shadow: 0 4px 20px rgba(var(--hp-accent-rgb, 13, 148, 136), .35);
                }
                .hp-btn-primary:hover:not(:disabled) { 
                    opacity: .88; 
                    transform: translateY(-2px); 
                    box-shadow: 0 8px 30px rgba(var(--hp-accent-rgb, 13, 148, 136), .45); 
                }
                .hp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

                .hp-btn-ghost {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--hp-surface-alt, rgba(0,0,0,0.05));
                    border: 1px solid var(--hp-border, rgba(0,0,0,0.09));
                    color: var(--hp-text, #0c1220);
                    font-weight: 600;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background .2s, transform .2s, border-color .2s, color .2s;
                }
                .hp-btn-ghost:hover:not(:disabled) {
                    background: rgba(var(--hp-accent-rgb, 13, 148, 136), .1);
                    border-color: rgba(var(--hp-accent-rgb, 13, 148, 136), .3);
                    color: var(--hp-accent, #0d9488);
                    transform: translateY(-1px);
                }

                .tag-pill {
                    display: inline-flex;
                    align-items: center;
                    font-size: .7rem; 
                    font-weight: 600;
                    padding: .28rem .65rem;
                    border-radius: 999px;
                    letter-spacing: .03em;
                    white-space: nowrap;
                }

                .hp-modal-overlay { 
                    background: var(--hp-modal-overlay, rgba(0,0,0,0.5)); 
                    backdrop-filter: blur(12px); 
                }
                .hp-modal { 
                    box-shadow: var(--hp-shadow-modal, 0 20px 60px rgba(0,0,0,0.15)); 
                    background: var(--hp-surface, #ffffff);
                }

                /* Job Search Specific Inputs */
                .js-input {
                    width: 100%;
                    background: var(--hp-surface-alt, rgba(0,0,0,0.05));
                    border: 1px solid var(--hp-border, rgba(0,0,0,0.09));
                    color: var(--hp-text, #0c1220);
                    border-radius: 12px;
                    padding: 12px 16px 12px 42px;
                    font-size: 0.88rem;
                    transition: all 0.2s;
                    outline: none;
                }
                .js-input:focus {
                    border-color: rgba(var(--hp-accent-rgb, 13, 148, 136), 0.5);
                    background: var(--hp-surface, #ffffff);
                    box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb, 13, 148, 136), 0.1);
                }
                .js-input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--hp-muted, #64748b);
                    width: 18px;
                    height: 18px;
                    pointer-events: none;
                }
                .js-select {
                    padding-left: 16px;
                }
            `}</style>

            {/* Search Filter Card */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleSearch}
                className="hp-card p-6 mb-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(var(--hp-accent-rgb),0.05)_0%,transparent_70%)] pointer-events-none" />

                <h2 className="text-xl font-bold mb-6 text-[var(--hp-text)] flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Your Next Role
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    <div className="relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" name="keyword" value={filters.keyword} onChange={handleChange} placeholder="Job title, skill..." className="js-input" />
                    </div>
                    <div className="relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <input type="text" name="location" value={filters.location} onChange={handleChange} placeholder="Location" className="js-input" />
                    </div>
                    <div className="relative">
                        <select name="jobType" value={filters.jobType} onChange={handleChange} className="js-input js-select appearance-none">
                            <option value="" style={{ background: 'var(--hp-card)' }}>All Job Types</option>
                            <option value="FULL_TIME" style={{ background: 'var(--hp-card)' }}>Full Time</option>
                            <option value="PART_TIME" style={{ background: 'var(--hp-card)' }}>Part Time</option>
                            <option value="CONTRACT" style={{ background: 'var(--hp-card)' }}>Contract</option>
                            <option value="REMOTE" style={{ background: 'var(--hp-card)' }}>Remote</option>
                            <option value="FREELANCE" style={{ background: 'var(--hp-card)' }}>Freelance</option>
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--hp-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <div className="relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <input type="number" name="salaryMin" value={filters.salaryMin} onChange={handleChange} placeholder="Min Salary" className="js-input" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-5 relative z-10">
                    <span style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.05em', color: 'var(--hp-muted)', textTransform: 'uppercase' }}>Quick Filters:</span>
                    {[
                        { label: 'Remote', field: 'jobType', value: 'REMOTE' },
                        { label: 'Full Time', field: 'jobType', value: 'FULL_TIME' },
                        { label: 'Pune', field: 'location', value: 'Pune' },
                        { label: 'Mumbai', field: 'location', value: 'Mumbai' },
                    ].map(chip => (
                        <button
                            key={chip.label}
                            type="button"
                            onClick={() => { setFilters(prev => ({ ...prev, [chip.field]: chip.value })); setTimeout(() => handleSearch(), 0); }}
                            className="tag-pill"
                            style={{
                                cursor: 'pointer',
                                background: filters[chip.field] === chip.value ? 'rgba(var(--hp-accent-rgb), .15)' : 'var(--hp-surface-alt)',
                                color: filters[chip.field] === chip.value ? 'var(--hp-accent)' : 'var(--hp-muted)',
                                border: `1px solid ${filters[chip.field] === chip.value ? 'rgba(var(--hp-accent-rgb), .4)' : 'var(--hp-border)'}`,
                                transition: 'all .2s'
                            }}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--hp-border)' }}>
                    <button type="submit" className="hp-btn-primary px-8 py-2.5 text-sm">
                        Search Jobs
                    </button>
                    <button type="button" onClick={handleClear} className="hp-btn-ghost px-6 py-2.5 text-sm">
                        Reset
                    </button>
                </div>
            </motion.form>

            {/* Content Area */}
            <div>
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="hp-card p-6 animate-pulse">
                                <div className="flex justify-between mb-5">
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--hp-border)' }} />
                                    <div style={{ width: 70, height: 24, borderRadius: 999, background: 'var(--hp-border)' }} />
                                </div>
                                <div style={{ height: 18, borderRadius: 6, background: 'var(--hp-border)', marginBottom: 8, width: '75%' }} />
                                <div style={{ height: 14, borderRadius: 6, background: 'var(--hp-border)', marginBottom: 20, width: '50%' }} />
                                <div style={{ height: 10, borderRadius: 6, background: 'var(--hp-border)', marginBottom: 8 }} />
                                <div style={{ height: 40, borderRadius: 10, background: 'var(--hp-border)', marginTop: 20 }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="hp-card p-12 text-center" style={{ color: 'var(--hp-muted)' }}>
                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && jobs.length > 0 && (
                    <div className="mb-4" style={{ fontSize: '.85rem', color: 'var(--hp-muted)', fontWeight: 500 }}>
                        Showing {jobs.length} open roles
                    </div>
                )}

                {!loading && !error && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        initial="hidden" animate="show"
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                        <AnimatePresence>
                            {jobs.map((job) => (
                                <motion.div
                                    key={job.id} layout variants={fadeUp}
                                    onClick={() => setSelected(job)}
                                    className="hp-card p-6 cursor-pointer flex flex-col h-full"
                                    style={selected?.id === job.id ? { borderColor: 'var(--hp-accent)', boxShadow: '0 8px 30px rgba(var(--hp-accent-rgb), .15)' } : {}}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <CompanyAvatar job={job} />
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`tag-pill ${JOB_TYPE_STYLE[job.jobType] || ''}`}
                                                style={!JOB_TYPE_STYLE[job.jobType] ? { background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' } : {}}>
                                                {job.jobType?.replace(/_/g, ' ')}
                                            </span>
                                            {appliedJobs.has(job.id) && (
                                                <span className="tag-pill" style={{ background: 'rgba(52,211,153,.12)', color: '#34d399', border: '1px solid rgba(52,211,153,.25)' }}>
                                                    ✓ Applied
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="job-title-hover" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--hp-text)', marginBottom: '.35rem', lineHeight: 1.35 }}>
                                        {job.title}
                                    </h3>
                                    <div
                                        onClick={(e) => { e.stopPropagation(); /* Navigate logic can go here */ }}
                                        style={{ fontSize: '.85rem', color: 'var(--hp-accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        className="hover:underline"
                                    >
                                        {job.companyName || job.employer?.companyProfile?.companyName || `${job.employer?.firstName || ''} ${job.employer?.lastName || ''}`.trim()}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-auto pb-4">
                                        {job.location && (
                                            <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                                                📍 {job.location}
                                            </span>
                                        )}
                                        {job.experienceRequired && (
                                            <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                                                🎓 {job.experienceRequired}
                                            </span>
                                        )}
                                        {job.remoteType && (
                                            <span className="tag-pill" style={{ background: `rgba(var(--hp-accent2-rgb),.1)`, color: 'var(--hp-accent2)', border: `1px solid rgba(var(--hp-accent2-rgb),.25)` }}>
                                                {job.remoteType}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--hp-border)' }}>
                                        <div>
                                            {job.salaryMin ? (
                                                <div style={{ fontWeight: 700, color: 'var(--hp-text)', fontSize: '.95rem', fontVariantNumeric: 'tabular-nums' }}>
                                                    ₹{Number(job.salaryMin).toLocaleString()}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '.8rem', color: 'var(--hp-muted)' }}>Salary Undisclosed</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => handleToggleSave(e, job.id)}
                                            disabled={savingJobId === job.id}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedJobs.has(job.id) ? 'var(--hp-accent)' : 'var(--hp-muted)' }}
                                            className="hover:scale-110 transition-transform p-1"
                                        >
                                            {savingJobId === job.id ? (
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill={savedJobs.has(job.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 hp-modal-overlay"
                        onClick={() => setSelected(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: .95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: .95, y: 20 }}
                            transition={{ duration: .28, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-2xl overflow-y-auto rounded-2xl hp-card hp-modal"
                            style={{ maxHeight: '90vh' }}
                            onClick={e => e.stopPropagation()}>

                            <div className="sticky top-0 p-6 flex items-start justify-between z-10"
                                style={{ background: 'var(--hp-card)', borderBottom: '1px solid var(--hp-border)' }}>
                                <div className="flex items-center gap-4">
                                    <CompanyAvatar job={selected} size="lg" />
                                    <div>
                                        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--hp-text)', lineHeight: 1.3 }}>{selected.title}</h2>
                                        <p style={{ fontSize: '.9rem', color: 'var(--hp-accent)', marginTop: '.2rem', fontWeight: 500 }}>
                                            {selected.companyName || selected.employer?.companyProfile?.companyName || `${selected.employer?.firstName || ''} ${selected.employer?.lastName || ''}`.trim()}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)}
                                    style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hp-muted)', cursor: 'pointer', flexShrink: 0 }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}>
                                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className={`tag-pill ${JOB_TYPE_STYLE[selected.jobType] || ''}`}
                                        style={!JOB_TYPE_STYLE[selected.jobType] ? { background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' } : {}}>
                                        {selected.jobType?.replace(/_/g, ' ')}
                                    </span>
                                    <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                                        {selected.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                    {[
                                        selected.location && { label: 'Location', value: selected.location, icon: '📍' },
                                        selected.salaryMin && { label: 'Salary', value: `₹${Number(selected.salaryMin).toLocaleString()}`, icon: '💰', accent: true },
                                        selected.experienceRequired && { label: 'Experience', value: selected.experienceRequired, icon: '🎓' },
                                        selected.positionsAvailable && { label: 'Openings', value: selected.positionsAvailable, icon: '👥' },
                                    ].filter(Boolean).map(({ label, value, icon, accent }) => (
                                        <div key={label} style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ fontSize: '.7rem', color: 'var(--hp-muted)', marginBottom: '.3rem' }}>{icon} {label}</div>
                                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: accent ? 'var(--hp-accent)' : 'var(--hp-text)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {user?.role === 'JOBSEEKER' && primaryResume && (
                                    <div className="mb-8 p-5 rounded-xl relative overflow-hidden" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)' }}>
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--hp-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <svg className="w-5 h-5 text-[var(--hp-accent2)]" style={{ color: 'var(--hp-accent2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                AI Match Analysis
                                            </h4>
                                            {matchAnalysis && (
                                                <div style={{ fontSize: '.8rem', fontWeight: 800, color: matchAnalysis.score >= 70 ? '#34d399' : '#fbbf24' }}>
                                                    {matchAnalysis.score}% Match
                                                </div>
                                            )}
                                        </div>

                                        {!matchAnalysis ? (
                                            <div className="text-center relative z-10">
                                                <button onClick={handleTriggerMatch} disabled={loadingMatch} className="hp-btn-ghost px-6 py-2 text-sm">
                                                    {loadingMatch ? 'Analyzing...' : 'Analyze My Resume'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative z-10">
                                                <div style={{ height: '6px', background: 'var(--hp-border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${matchAnalysis.score}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: `linear-gradient(90deg, var(--hp-accent), ${matchAnalysis.score >= 70 ? '#34d399' : '#fbbf24'})` }} />
                                                </div>
                                                {matchAnalysis.matchDetails && (
                                                    <div>
                                                        <div style={{ fontSize: '.7rem', color: 'var(--hp-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Missing Keywords</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {matchAnalysis.matchDetails.split(',').map((kw, i) => (
                                                                <span key={i} className="tag-pill" style={{ background: 'rgba(var(--hp-accent-rgb), .1)', color: 'var(--hp-accent)', border: '1px solid rgba(var(--hp-accent-rgb), .2)' }}>{kw.trim()}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--hp-text)', fontSize: '.95rem' }}>Job Description</h3>
                                    <div style={{ fontSize: '.875rem', color: 'var(--hp-text)', lineHeight: 1.8, whiteSpace: 'pre-line', padding: '16px', background: 'var(--hp-surface-alt)', borderRadius: '12px', border: '1px solid var(--hp-border)' }}>
                                        {selected.description}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: '1px solid var(--hp-border)' }}>
                                    {isEmployer ? (
                                        <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', fontSize: '.9rem', border: '1px solid var(--hp-border)' }}>
                                            {user?.role === 'ADMIN' ? 'Admins cannot apply' : 'Employers cannot apply'}
                                        </div>
                                    ) : appliedJobs.has(selected.id) ? (
                                        <div className="flex-1 text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2" style={{ background: 'rgba(52,211,153,.15)', color: '#34d399', border: '1px solid rgba(52,211,153,.3)' }}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Application Submitted
                                        </div>
                                    ) : (
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenApply(); }} className="hp-btn-primary flex-1 py-3.5" style={{ fontSize: '1rem' }}>
                                            Apply Now →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Application Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4 hp-modal-overlay"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="hp-card hp-modal w-full max-w-lg overflow-y-auto"
                            style={{ maxHeight: '90vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b" style={{ borderColor: 'var(--hp-border)' }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--hp-text)' }}>Submit Application</h2>
                                        <p style={{ color: 'var(--hp-accent)', fontSize: '.9rem', marginTop: '4px' }}>{selected?.title}</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)}
                                        style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hp-muted)', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}>
                                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {applyError && (
                                    <div className="p-3 mb-4 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)' }}>
                                        {applyError}
                                    </div>
                                )}
                                {applySuccess && (
                                    <div className="p-3 mb-4 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'rgba(52,211,153,.15)', color: '#34d399', border: '1px solid rgba(52,211,153,.3)' }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {applySuccess}
                                    </div>
                                )}

                                {!applySuccess && (
                                    <>
                                        <ApplyResumePicker userId={user?.id} selectedResumeId={selectedResumeId} onSelect={setSelectedResumeId} />

                                        <div className="mt-5">
                                            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: 'var(--hp-text)', marginBottom: '8px' }}>
                                                Cover Letter <span style={{ color: 'var(--hp-muted)', fontWeight: 400 }}>(Optional)</span>
                                            </label>
                                            <textarea
                                                value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={4}
                                                placeholder="Briefly explain why you are a good fit..."
                                                style={{ width: '100%', background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-text)', borderRadius: '12px', padding: '12px', fontSize: '.85rem', resize: 'vertical', outline: 'none' }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(var(--hp-accent-rgb), .5)'}
                                                onBlur={e => e.target.style.borderColor = 'var(--hp-border)'}
                                            />
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <button onClick={() => setShowModal(false)} className="hp-btn-ghost flex-1 py-2.5">Cancel</button>
                                            <button onClick={handleApply} disabled={applying || !selectedResumeId} className="hp-btn-primary flex-1 py-2.5" style={{ opacity: (!selectedResumeId || applying) ? 0.5 : 1 }}>
                                                {applying ? 'Sending...' : 'Send Application'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}