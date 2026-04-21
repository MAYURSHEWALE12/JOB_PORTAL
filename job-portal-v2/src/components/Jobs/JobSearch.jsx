import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jobAPI, applicationAPI, savedJobAPI, resumeAnalysisAPI, resumeAPI, API_BASE_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ApplyResumePicker from '../Resume/ApplyResumePicker';
import { SkeletonJobCard } from '../Skeleton';



/* ─── Constants ──────────────────────────────────────────────────── */
const JOB_TYPE_STYLE = {
    FULL_TIME: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    PART_TIME: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
    CONTRACT:  'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    REMOTE:    'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    FREELANCE: 'bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30',
};

const JOB_TYPE_DOT = {
    FULL_TIME: '#34d399', PART_TIME: '#38bdf8',
    CONTRACT: '#fbbf24', REMOTE: '#a78bfa', FREELANCE: '#f472b6',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function resolveLogoUrl(job) {
    let url = job.companyLogo || job.employer?.companyProfile?.logoUrl || job.employer?.profileImageUrl;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('logo_') || url.startsWith('banner_'))
        return `${API_BASE_URL.replace('/api', '')}/api/companies/image/${url}`;
    if (url.startsWith('avatar_')) return `${API_BASE_URL.replace('/api', '')}${url}`;
    return url;
}

function formatSalary(min, max) {
    if (!min && !max) return null;
    const fmt = n => `₹${(n / 100000).toFixed(1)}L`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max)}`;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function CompanyAvatar({ job, size = 'md' }) {
    const url = resolveLogoUrl(job);
    const name = job.companyName || job.employer?.companyProfile?.companyName || job.employer?.firstName || 'J';
    const dim = size === 'lg'
        ? 'w-14 h-14 text-xl rounded-2xl'
        : size === 'sm'
        ? 'w-9 h-9 text-sm rounded-lg'
        : 'w-11 h-11 text-base rounded-xl';
    return url ? (
        <img
            src={url} alt={name}
            className={`${dim} object-cover flex-shrink-0 border border-white/10`}
            onError={e => { e.target.style.display = 'none'; }}
        />
    ) : (
        <div
            className={`${dim} flex-shrink-0 flex items-center justify-center font-bold text-white`}
            style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

/* ─── Animated Match Score Ring ──────────────────────────────────── */
function MatchRing({ score }) {
    const r = 28, circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';
    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            <circle cx="36" cy="36" r={r} stroke="var(--hp-border)" strokeWidth="5" fill="none" />
            <motion.circle
                cx="36" cy="36" r={r} stroke={color} strokeWidth="5" fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
        </svg>
    );
}

/* ─── Search Bar CSS ─────────────────────────────────────────────── */
const styles = `
    .js-input-wrap { position:relative; display:flex; align-items:center; }
    .js-input-icon { position:absolute; left:14px; width:16px; height:16px; color:var(--hp-muted); pointer-events:none; flex-shrink:0; }
    .js-input {
        width:100%; padding:12px 16px 12px 42px;
        background:var(--hp-surface-alt); border:1px solid var(--hp-border);
        border-radius:12px; color:var(--hp-text); font-size:.875rem;
        outline:none; transition:border-color .2s, box-shadow .2s;
        font-family:inherit;
    }
    .js-input::placeholder { color:var(--hp-muted); }
    .js-input:focus { border-color:rgba(var(--hp-accent-rgb),.5); box-shadow:0 0 0 3px rgba(var(--hp-accent-rgb),.08); }
    .js-input.select-input { appearance:none; cursor:pointer; }
    .js-result-count { font-size:.8rem; font-weight:600; color:var(--hp-muted); padding:2px 10px; background:var(--hp-surface-alt); border:1px solid var(--hp-border); border-radius:999px; }
    .job-title-hover { transition:color .15s; }
    .job-title-hover:hover { color:var(--hp-accent) !important; }
    .bookmark-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; transition:all .15s; display:flex; align-items:center; justify-content:center; }
    .bookmark-btn:hover { background:var(--hp-surface-alt); }
    .hp-modal-overlay { background:rgba(0,0,0,.75); backdrop-filter:blur(12px); }
    .hide-scrollbar::-webkit-scrollbar { display:none; }
    .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
    .tag-pill { display:inline-flex; align-items:center; padding:.25rem .6rem; border-radius:999px; font-size:.68rem; font-weight:600; letter-spacing:.03em; }
    .search-clear-btn { position:absolute; right:12px; background:none; border:none; cursor:pointer; color:var(--hp-muted); display:flex; align-items:center; padding:2px; border-radius:4px; }
    .search-clear-btn:hover { color:var(--hp-text); }
`;

/* ─── Individual Job Card ────────────────────────────────────────── */
function JobCard({ job, isSelected, isApplied, isSaved, isSaving, onSelect, onToggleSave }) {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const companyName = job.companyName || job.employer?.companyProfile?.companyName
        || `${job.employer?.firstName || ''} ${job.employer?.lastName || ''}`.trim()
        || 'Verified Employer';

    return (
        <motion.div
            layout
            variants={{
                hidden: { opacity: 0, y: 16, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
            }}
            whileHover={{ y: -4 }}
            onClick={() => onSelect(job)}
            className="hp-card p-6 cursor-pointer flex flex-col h-full group"
            style={isSelected ? {
                borderColor: 'var(--hp-accent)',
                boxShadow: '0 8px 30px rgba(var(--hp-accent-rgb),.15)'
            } : {}}
        >
            {/* Top row */}
            <div className="flex items-start justify-between mb-4 gap-2">
                <CompanyAvatar job={job} />
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {job.jobType && (
                        <span className={`tag-pill ${JOB_TYPE_STYLE[job.jobType] || ''}`}
                            style={!JOB_TYPE_STYLE[job.jobType] ? {
                                background: 'var(--hp-surface-alt)',
                                color: 'var(--hp-muted)',
                                border: '1px solid var(--hp-border)'
                            } : {}}>
                            {job.jobType?.replace(/_/g, ' ')}
                        </span>
                    )}
                    {isApplied && (
                        <span className="tag-pill" style={{
                            background: 'rgba(52,211,153,.12)',
                            color: '#34d399',
                            border: '1px solid rgba(52,211,153,.25)'
                        }}>
                            ✓ Applied
                        </span>
                    )}
                </div>
            </div>

            {/* Title + Company */}
            <h3
                className="job-title-hover font-bold text-[1.05rem] leading-snug mb-1"
                style={{ color: 'var(--hp-text)' }}
            >
                {job.title}
            </h3>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--hp-accent)' }}>{companyName}</p>

            {/* Meta chips */}
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
                    <span className="tag-pill" style={{
                        background: 'rgba(var(--hp-accent2-rgb),.1)',
                        color: 'var(--hp-accent2)',
                        border: '1px solid rgba(var(--hp-accent2-rgb),.25)'
                    }}>
                        {job.remoteType}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--hp-border)' }}>
                <div>
                    {salary ? (
                        <div className="font-bold text-sm" style={{ color: 'var(--hp-accent)', fontVariantNumeric: 'tabular-nums' }}>
                            {salary}
                        </div>
                    ) : (
                        <div className="text-xs" style={{ color: 'var(--hp-muted)' }}>Salary undisclosed</div>
                    )}
                    {job.createdAt && (
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--hp-muted)' }}>{timeAgo(job.createdAt)}</div>
                    )}
                </div>

                <button
                    onClick={e => { e.stopPropagation(); onToggleSave(e, job.id); }}
                    disabled={isSaving}
                    aria-label={isSaved ? 'Unsave job' : 'Save job'}
                    className="bookmark-btn"
                    style={{ color: isSaved ? 'var(--hp-accent)' : 'var(--hp-muted)' }}
                >
                    {isSaving ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function JobSearch() {
    const { user } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Core state
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    // Apply modal
    const [showModal, setShowModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [appliedJobs, setAppliedJobs] = useState(new Set());

    // Save state
    const [savedJobs, setSavedJobs] = useState(new Set());
    const [savingJobId, setSavingJobId] = useState(null);

    // Resume & AI match
    const [primaryResume, setPrimaryResume] = useState(null);
    const [matchAnalysis, setMatchAnalysis] = useState(null);
    const [loadingMatch, setLoadingMatch] = useState(false);

    // Filters — only keyword/location/jobType go to API; rest is client-side
    const [filters, setFilters] = useState({ keyword: '', location: '', jobType: '', salaryMin: '' });
    const [recentSearches, setRecentSearches] = useState([]);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    const [resultCount, setResultCount] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');

    const hasInitialized = useRef(false);
    const keywordRef = useRef(null);

    /* ── URL param sync (one-time on mount) ── */
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const params = new URLSearchParams(location.search);
        const q = params.get('q') || '';
        const loc = params.get('location') || '';

        if (q || loc) {
            const newFilters = { keyword: q, location: loc, jobType: '', salaryMin: '' };
            setFilters(newFilters);
            // Trigger search with the URL filters directly
            runSearch(newFilters);
        } else {
            fetchJobs();
        }

        // User-dependent data
        if (user) {
            fetchSavedJobIds();
            fetchAppliedJobIds();
            fetchPrimaryResume();
        }

        // Recent searches from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem('recentSearches'));
            if (Array.isArray(saved)) setRecentSearches(saved);
        } catch { /* ignore parse errors */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Re-fetch user-dependent data when user changes ── */
    useEffect(() => {
        if (!user || !hasInitialized.current) return;
        fetchSavedJobIds();
        fetchAppliedJobIds();
        fetchPrimaryResume();
    }, [user?.id]);

    /* ── AI match on job / resume change ── */
    useEffect(() => {
        if (selected && primaryResume && user?.role === 'JOBSEEKER') {
            fetchMatchScore(selected.id, primaryResume.id);
        } else {
            setMatchAnalysis(null);
        }
    }, [selected?.id, primaryResume?.id]);

    /* ── Close modal on Escape ── */
    useEffect(() => {
        const onKey = e => {
            if (e.key === 'Escape') {
                if (showModal) setShowModal(false);
                else if (selected) setSelected(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showModal, selected]);

    /* ── API calls ── */
    const fetchJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await jobAPI.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
            const reversed = [...data].reverse();
            setJobs(reversed);
            setResultCount(reversed.length);
            if (data.length === 0) setError('No jobs available yet.');
        } catch {
            setError('Failed to load jobs. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const runSearch = async (f = filters) => {
        setLoading(true);
        setError('');
        setSelected(null);

        const term = f.keyword.trim();
        if (term) {
            setRecentSearches(prev => {
                const updated = [term, ...prev.filter(k => k.toLowerCase() !== term.toLowerCase())].slice(0, 5);
                try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch { /* ignore */ }
                return updated;
            });
        }

        try {
            const payload = {
                ...(f.keyword && { keyword: f.keyword }),
                ...(f.location && { location: f.location }),
                ...(f.jobType && { jobType: f.jobType }),
                ...(f.salaryMin && { salaryMin: Number(f.salaryMin) }),
                page: 0, size: 50,
            };
            const res = await jobAPI.advancedSearch(payload);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
            setJobs(data);
            setResultCount(data.length);
            if (data.length === 0) setError('No jobs found matching your criteria.');
        } catch {
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedJobIds = async () => {
        try {
            const res = await savedJobAPI.getSaved(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setSavedJobs(new Set(data.map(s => s.job?.id).filter(Boolean)));
        } catch { /* silently fail */ }
    };

    const fetchAppliedJobIds = async () => {
        try {
            const res = await applicationAPI.getMyApplications(user.id);
            const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
            setAppliedJobs(new Set(data.map(a => a.job?.id).filter(Boolean)));
        } catch { /* silently fail */ }
    };

    const fetchPrimaryResume = async () => {
        try {
            const res = await resumeAPI.list(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            if (data.length > 0) setPrimaryResume(data[0]);
        } catch { /* silently fail */ }
    };

    const fetchMatchScore = async (jobId, resumeId) => {
        if (!resumeId || !jobId) return;
        setLoadingMatch(true);
        try {
            const res = await resumeAnalysisAPI.getMatchAnalysis(resumeId, jobId);
            if (res.status === 200) setMatchAnalysis(res.data);
            else setMatchAnalysis(null);
        } catch {
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
        } catch {
            /* silently fail */
        } finally {
            setLoadingMatch(false);
        }
    };

    /* ── Handlers ── */
    const handleSearch = useCallback(async e => {
        if (e) e.preventDefault();
        setShowRecentSearches(false);
        await runSearch();
        // Update URL params to reflect current search
        const params = {};
        if (filters.keyword) params.q = filters.keyword;
        if (filters.location) params.location = filters.location;
        navigate(`?${new URLSearchParams(params).toString()}`, { replace: true });
    }, [filters, navigate]);

    const handleChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleClear = () => {
        setFilters({ keyword: '', location: '', jobType: '', salaryMin: '' });
        setSelected(null);
        setError('');
        navigate('?', { replace: true });
        fetchJobs();
    };

    const handleToggleSave = async (e, jobId) => {
        e.stopPropagation();
        if (!user) { navigate('/login'); return; }
        setSavingJobId(jobId);
        try {
            if (savedJobs.has(jobId)) {
                await savedJobAPI.unsave(user.id, jobId);
                setSavedJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
            } else {
                await savedJobAPI.save(user.id, jobId);
                setSavedJobs(prev => new Set([...prev, jobId]));
            }
        } catch { /* silently fail */ }
        finally { setSavingJobId(null); }
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
            setTimeout(() => { setShowModal(false); setApplySuccess(''); }, 2000);
        } catch (err) {
            const msg = err.response?.data?.error
                || err.response?.data?.message
                || (err.response?.data ? JSON.stringify(err.response.data) : err.message)
                || 'Failed to apply. Please try again.';
            setApplyError(msg);
        } finally {
            setApplying(false);
        }
    };

    /* ── Derived: sorted jobs ── */
    const sortedJobs = [...jobs].sort((a, b) => {
        if (sortBy === 'salary_high') return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
        if (sortBy === 'salary_low') return (a.salaryMin || 0) - (b.salaryMin || 0);
        return 0; // newest: already reversed from fetch
    });

    const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'ADMIN';
    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    /* ── Quick filter chips ── */
    const QUICK_FILTERS = [
        { label: '🌐 Remote', field: 'jobType', value: 'REMOTE' },
        { label: '⚡ Full Time', field: 'jobType', value: 'FULL_TIME' },
        { label: '📄 Contract', field: 'jobType', value: 'CONTRACT' },
        { label: '📍 Pune', field: 'location', value: 'Pune' },
        { label: '🏙️ Mumbai', field: 'location', value: 'Mumbai' },
        { label: '💻 Bengaluru', field: 'location', value: 'Bengaluru' },
    ];

    return (
        <div style={{ position: 'relative', zIndex: 10 }}>
            <style>{styles}</style>

            {/* ── Search Card ── */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onSubmit={handleSearch}
                className="hp-card p-6 mb-8 relative overflow-hidden"
            >
                {/* Subtle glow bg */}
                <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(var(--hp-accent-rgb),.05) 0%, transparent 70%)' }} />

                {/* Row 1: Inputs */}
                <div className="flex flex-col lg:flex-row gap-3 relative z-10">
                    {/* Keyword */}
                    <div className="js-input-wrap flex-1 relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={keywordRef}
                            type="text" name="keyword" value={filters.keyword}
                            onChange={handleChange}
                            onFocus={() => setShowRecentSearches(recentSearches.length > 0)}
                            onBlur={() => setTimeout(() => setShowRecentSearches(false), 150)}
                            placeholder="Job title, skill, company…"
                            className="js-input"
                            autoComplete="off"
                        />
                        {filters.keyword && (
                            <button type="button" className="search-clear-btn" onClick={() => setFilters(p => ({ ...p, keyword: '' }))}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                        {/* Recent searches dropdown */}
                        <AnimatePresence>
                            {showRecentSearches && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                    className="absolute top-full left-0 right-0 mt-1 hp-card p-2 z-50"
                                    style={{ border: '1px solid var(--hp-border)' }}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-1" style={{ color: 'var(--hp-muted)' }}>Recent</p>
                                    {recentSearches.map((s, i) => (
                                        <button key={i} type="button"
                                            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                                            style={{ color: 'var(--hp-text-sub)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hp-surface-alt)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            onClick={() => { setFilters(p => ({ ...p, keyword: s })); setShowRecentSearches(false); }}
                                        >
                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {s}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Location */}
                    <div className="js-input-wrap flex-1 relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                            type="text" name="location" value={filters.location}
                            onChange={handleChange} placeholder="City or Remote…"
                            className="js-input"
                        />
                        {filters.location && (
                            <button type="button" className="search-clear-btn" onClick={() => setFilters(p => ({ ...p, location: '' }))}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Job Type */}
                    <div className="js-input-wrap lg:w-52 relative">
                        <svg className="js-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <select name="jobType" value={filters.jobType} onChange={handleChange} className="js-input select-input">
                            <option value="" style={{ background: 'var(--hp-card)' }}>All Types</option>
                            {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'FREELANCE'].map(t => (
                                <option key={t} value={t} style={{ background: 'var(--hp-card)' }}>{t.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--hp-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>

                    {/* CTA */}
                    <button type="submit" className="hp-btn-primary lg:w-auto w-full px-8 text-sm" style={{ height: 48 }}>
                        Search Jobs
                    </button>
                </div>

                {/* Row 2: Quick filter chips */}
                <div className="flex flex-wrap items-center gap-2 mt-5 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--hp-muted)' }}>Quick:</span>
                    {QUICK_FILTERS.map(chip => {
                        const isActive = filters[chip.field] === chip.value;
                        return (
                            <button
                                key={chip.label} type="button"
                                onClick={() => {
                                    const newFilters = { ...filters, [chip.field]: isActive ? '' : chip.value };
                                    setFilters(newFilters);
                                    runSearch(newFilters);
                                }}
                                className="tag-pill transition-all"
                                style={{
                                    cursor: 'pointer',
                                    background: isActive ? 'rgba(var(--hp-accent-rgb),.15)' : 'var(--hp-surface-alt)',
                                    color: isActive ? 'var(--hp-accent)' : 'var(--hp-muted)',
                                    border: `1px solid ${isActive ? 'rgba(var(--hp-accent-rgb),.4)' : 'var(--hp-border)'}`,
                                }}
                            >
                                {chip.label}
                            </button>
                        );
                    })}

                    {/* Clear all */}
                    {activeFilterCount > 0 && (
                        <button type="button" onClick={handleClear}
                            className="tag-pill ml-auto transition-all"
                            style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', cursor: 'pointer' }}>
                            Clear all ({activeFilterCount})
                        </button>
                    )}
                </div>
            </motion.form>

            {/* ── Results Header ── */}
            {!loading && !error && jobs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between mb-5 flex-wrap gap-3"
                >
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-sm" style={{ color: 'var(--hp-text)' }}>
                            {resultCount ?? jobs.length} roles found
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(var(--hp-accent-rgb),.12)', color: 'var(--hp-accent)' }}>
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <div className="relative flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--hp-muted)' }}>Sort:</span>
                            <select
                                value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg outline-none border appearance-none pr-7 cursor-pointer"
                                style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)', color: 'var(--hp-text)', fontFamily: 'inherit' }}
                            >
                                <option value="newest">Newest</option>
                                <option value="salary_high">Salary: High→Low</option>
                                <option value="salary_low">Salary: Low→High</option>
                            </select>
                        </div>
                        {/* View mode */}
                        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)' }}>
                            {[
                                { mode: 'grid', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
                                { mode: 'list', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                            ].map(({ mode, icon }) => (
                                <button key={mode} type="button" onClick={() => setViewMode(mode)}
                                    className="p-1.5 rounded-md transition-all"
                                    style={{
                                        background: viewMode === mode ? 'rgba(var(--hp-accent-rgb),.15)' : 'transparent',
                                        color: viewMode === mode ? 'var(--hp-accent)' : 'var(--hp-muted)',
                                    }}
                                >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Loading Skeletons ── */}
            {loading && (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="hp-card p-6 animate-pulse">
                            <div className="flex justify-between mb-5">
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--hp-border)' }} />
                                <div style={{ width: 72, height: 22, borderRadius: 999, background: 'var(--hp-border)' }} />
                            </div>
                            <div style={{ height: 18, borderRadius: 6, background: 'var(--hp-border)', marginBottom: 8, width: '70%' }} />
                            <div style={{ height: 13, borderRadius: 6, background: 'var(--hp-border)', marginBottom: 16, width: '45%' }} />
                            <div className="flex gap-2 mb-4">
                                {[1, 2].map(j => <div key={j} style={{ height: 22, width: 64, borderRadius: 999, background: 'var(--hp-border)' }} />)}
                            </div>
                            <div style={{ height: 1, background: 'var(--hp-border)', marginBottom: 12 }} />
                            <div className="flex justify-between">
                                <div style={{ height: 14, width: 90, borderRadius: 4, background: 'var(--hp-border)' }} />
                                <div style={{ height: 20, width: 20, borderRadius: 4, background: 'var(--hp-border)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Error / Empty State ── */}
            {!loading && error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="hp-card p-16 text-center"
                >
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="font-semibold mb-4" style={{ color: 'var(--hp-text)' }}>{error}</p>
                    {activeFilterCount > 0 && (
                        <button onClick={handleClear} className="hp-btn-ghost px-6 py-2.5 text-sm mt-2">
                            Clear filters & try again
                        </button>
                    )}
                </motion.div>
            )}

            {/* ── Job Grid / List ── */}
            {!loading && !error && (
                <motion.div
                    className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-3xl'}`}
                    initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                >
                    <AnimatePresence mode="popLayout">
                        {sortedJobs.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                isSelected={selected?.id === job.id}
                                isApplied={appliedJobs.has(job.id)}
                                isSaved={savedJobs.has(job.id)}
                                isSaving={savingJobId === job.id}
                                onSelect={setSelected}
                                onToggleSave={handleToggleSave}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Job Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 hp-modal-overlay"
                        onClick={() => setSelected(null)}
                        role="dialog" aria-modal="true" aria-label={selected.title}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full max-w-2xl rounded-2xl hp-card overflow-hidden flex flex-col"
                            style={{ maxHeight: '90vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 p-6 flex items-start justify-between z-10 gap-4"
                                style={{ background: 'var(--hp-card)', borderBottom: '1px solid var(--hp-border)' }}>
                                <div className="flex items-center gap-4 min-w-0">
                                    <CompanyAvatar job={selected} size="lg" />
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-xl leading-snug truncate" style={{ color: 'var(--hp-text)' }}>
                                            {selected.title}
                                        </h2>
                                        <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'var(--hp-accent)' }}>
                                            {selected.companyName || selected.employer?.companyProfile?.companyName
                                                || `${selected.employer?.firstName || ''} ${selected.employer?.lastName || ''}`.trim()}
                                        </p>
                                        {selected.createdAt && (
                                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--hp-muted)' }}>
                                                Posted {timeAgo(selected.createdAt)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {selected.jobType && (
                                        <span className={`tag-pill hidden sm:inline-flex ${JOB_TYPE_STYLE[selected.jobType] || ''}`}>
                                            {selected.jobType?.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setSelected(null)} aria-label="Close"
                                        style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hp-muted)', cursor: 'pointer', flexShrink: 0 }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-7">

                                {/* Status + type pills */}
                                <div className="flex flex-wrap gap-2">
                                    {selected.jobType && (
                                        <span className={`tag-pill sm:hidden ${JOB_TYPE_STYLE[selected.jobType] || ''}`}>
                                            {selected.jobType?.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    {selected.status && (
                                        <span className="tag-pill" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                                            {selected.status}
                                        </span>
                                    )}
                                </div>

                                {/* Info grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Location', value: selected.location, icon: '📍' },
                                        { label: 'Salary', value: formatSalary(selected.salaryMin, selected.salaryMax), icon: '💰', accent: true },
                                        { label: 'Experience', value: selected.experienceRequired || 'Open', icon: '🎓' },
                                        { label: 'Openings', value: selected.positionsAvailable, icon: '👥' },
                                    ].filter(s => s.value).map(({ label, value, icon, accent }) => (
                                        <div key={label} style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', borderRadius: 12, padding: 12 }}>
                                            <div style={{ fontSize: '.7rem', color: 'var(--hp-muted)', marginBottom: '.25rem' }}>{icon} {label}</div>
                                            <div style={{ fontWeight: 600, fontSize: '.85rem', color: accent ? 'var(--hp-accent)' : 'var(--hp-text)' }}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Match */}
                                {user?.role === 'JOBSEEKER' && primaryResume && (
                                    <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)' }}>
                                        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                                            style={{ background: 'radial-gradient(circle, rgba(var(--hp-accent-rgb),.08) 0%, transparent 70%)' }} />
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--hp-text)' }}>
                                                <svg className="w-4 h-4" style={{ color: 'var(--hp-accent2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                AI Match Analysis
                                            </h4>
                                            {matchAnalysis && (
                                                <span className="text-sm font-black"
                                                    style={{ color: matchAnalysis.score >= 70 ? '#34d399' : matchAnalysis.score >= 40 ? '#fbbf24' : '#f87171' }}>
                                                    {matchAnalysis.score}% Match
                                                </span>
                                            )}
                                        </div>

                                        {!matchAnalysis ? (
                                            <div className="flex items-center justify-between relative z-10">
                                                <p className="text-xs" style={{ color: 'var(--hp-muted)' }}>
                                                    See how your resume matches this role.
                                                </p>
                                                <button
                                                    onClick={handleTriggerMatch} disabled={loadingMatch}
                                                    className="hp-btn-ghost px-5 py-2 text-xs flex-shrink-0"
                                                >
                                                    {loadingMatch ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                            Analyzing…
                                                        </span>
                                                    ) : 'Analyze Resume'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative z-10 flex items-center gap-5">
                                                <div className="flex-shrink-0 relative flex items-center justify-center">
                                                    <MatchRing score={matchAnalysis.score} />
                                                    <span className="absolute text-sm font-black rotate-90"
                                                        style={{ color: matchAnalysis.score >= 70 ? '#34d399' : matchAnalysis.score >= 40 ? '#fbbf24' : '#f87171' }}>
                                                        {matchAnalysis.score}%
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {matchAnalysis.matchDetails && (
                                                        <>
                                                            <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'var(--hp-muted)' }}>Missing Keywords</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {matchAnalysis.matchDetails.split(',').slice(0, 6).map((kw, i) => (
                                                                    <span key={i} className="tag-pill" style={{ background: 'rgba(var(--hp-accent-rgb),.1)', color: 'var(--hp-accent)', border: '1px solid rgba(var(--hp-accent-rgb),.2)' }}>
                                                                        {kw.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Description */}
                                {selected.description && (
                                    <div>
                                        <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--hp-text)' }}>Job Description</h3>
                                        <div className="text-sm leading-relaxed whitespace-pre-line p-4 rounded-xl"
                                            style={{ color: 'var(--hp-text-sub)', background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', lineHeight: 1.8 }}>
                                            {selected.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 flex flex-col sm:flex-row gap-3" style={{ borderTop: '1px solid var(--hp-border)', background: 'rgba(255,255,255,.02)' }}>
                                {isEmployer ? (
                                    <div className="flex-1 text-center py-3 rounded-xl text-sm" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', border: '1px solid var(--hp-border)' }}>
                                        {user?.role === 'ADMIN' ? 'Admins cannot apply' : 'Employers cannot apply'}
                                    </div>
                                ) : appliedJobs.has(selected.id) ? (
                                    <div className="flex-1 text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                        style={{ background: 'rgba(52,211,153,.15)', color: '#34d399', border: '1px solid rgba(52,211,153,.3)' }}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Application Submitted
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleToggleSave(new Event('click'), selected.id)}
                                            className="hp-btn-ghost px-5 py-3 text-sm flex items-center gap-2 flex-shrink-0"
                                            style={{ color: savedJobs.has(selected.id) ? 'var(--hp-accent)' : 'var(--hp-text)' }}
                                        >
                                            <svg className="w-4 h-4" fill={savedJobs.has(selected.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                            {savedJobs.has(selected.id) ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); user ? handleOpenApply() : navigate('/login'); }}
                                            className="hp-btn-primary flex-1 py-3 text-sm"
                                            style={{ boxShadow: '0 6px 24px rgba(var(--hp-accent-rgb),.2)' }}
                                        >
                                            {user ? 'Apply Now →' : 'Login to Apply →'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Application Modal ── */}
            <AnimatePresence>
                {showModal && selected && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center p-4 hp-modal-overlay"
                        onClick={() => setShowModal(false)}
                        role="dialog" aria-modal="true" aria-label="Submit Application"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.22 }}
                            className="hp-card w-full max-w-lg overflow-y-auto hide-scrollbar"
                            style={{ maxHeight: '90vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b" style={{ borderColor: 'var(--hp-border)' }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="font-bold text-lg" style={{ color: 'var(--hp-text)' }}>Submit Application</h2>
                                        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--hp-accent)' }}>{selected.title}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hp-muted)', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--hp-text)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--hp-muted)'}
                                        aria-label="Close"
                                    >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {applyError && (
                                    <div className="p-3 mb-4 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)' }}>
                                        ⚠️ {applyError}
                                    </div>
                                )}
                                {applySuccess ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        className="p-6 text-center rounded-xl"
                                        style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.3)' }}
                                    >
                                        <div className="text-4xl mb-3">🎉</div>
                                        <p className="font-bold" style={{ color: '#34d399' }}>{applySuccess}</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <ApplyResumePicker
                                            userId={user?.id}
                                            selectedResumeId={selectedResumeId}
                                            onSelect={setSelectedResumeId}
                                        />

                                        <div className="mt-5">
                                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--hp-text)' }}>
                                                Cover Letter
                                                <span className="font-normal ml-1 text-xs" style={{ color: 'var(--hp-muted)' }}>(Optional)</span>
                                            </label>
                                            <textarea
                                                value={coverLetter}
                                                onChange={e => setCoverLetter(e.target.value)}
                                                rows={4}
                                                placeholder="Briefly explain why you're a great fit…"
                                                style={{
                                                    width: '100%', background: 'var(--hp-surface-alt)',
                                                    border: '1px solid var(--hp-border)', color: 'var(--hp-text)',
                                                    borderRadius: 12, padding: 12, fontSize: '.875rem',
                                                    resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                                                    transition: 'border-color .2s',
                                                }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(var(--hp-accent-rgb),.5)'}
                                                onBlur={e => e.target.style.borderColor = 'var(--hp-border)'}
                                            />
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <button onClick={() => setShowModal(false)} className="hp-btn-ghost flex-1 py-2.5 text-sm">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApply}
                                                disabled={applying || !selectedResumeId}
                                                className="hp-btn-primary flex-1 py-2.5 text-sm"
                                                style={{ opacity: !selectedResumeId || applying ? 0.5 : 1, cursor: !selectedResumeId ? 'not-allowed' : 'pointer' }}
                                            >
                                                {applying ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2}/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                        Sending…
                                                    </span>
                                                ) : 'Send Application'}
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