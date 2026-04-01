import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationAPI, resumeAnalysisAPI, resumeAPI, savedJobAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ApplyResumePicker from './ApplyResumePicker';
import Loader from '../Loader';
import { AlertTriangle, FileSearch, Info, RefreshCcw, Search, ShieldCheck, Target, Zap } from 'lucide-react';

const mergeResults = (existing, incoming) => {
    const next = Array.isArray(incoming) ? incoming.filter(Boolean) : [];
    const nextKeys = new Set(next.map((item) => `${item.resume?.id ?? 'x'}:${item.job?.id ?? 'general'}`));
    return [...next, ...existing.filter((item) => !nextKeys.has(`${item.resume?.id ?? 'x'}:${item.job?.id ?? 'general'}`))];
};

const sortByScore = (items) => [...items].sort((a, b) => Number(b?.score ?? 0) - Number(a?.score ?? 0));
const sortByNewest = (items) => [...items].sort((a, b) => new Date(b?.analyzedAt ?? 0) - new Date(a?.analyzedAt ?? 0));
const dedupeMatchesByJob = (items) => {
    const latestByJob = new Map();

    for (const item of sortByNewest(items)) {
        const jobId = item?.job?.id;
        if (!jobId || latestByJob.has(jobId)) {
            continue;
        }

        latestByJob.set(jobId, item);
    }

    return sortByScore([...latestByJob.values()]);
};
const uniqueValues = (items) => [...new Set(items.filter(Boolean))];

const getMissingKeywords = (match) => {
    if (Array.isArray(match?.missingKeywords) && match.missingKeywords.length > 0) {
        return uniqueValues(match.missingKeywords.map((item) => item.trim()).filter(Boolean));
    }

    const tailoringTip = match?.suggestions?.find((item) => item.includes('missing some keywords found in the job description'));
    if (!tailoringTip) {
        return [];
    }

    const parsedKeywords = tailoringTip.match(/job description:\s*(.+?)\.\s*Try to incorporate/i)?.[1];
    if (!parsedKeywords) {
        return [];
    }

    return uniqueValues(parsedKeywords.split(',').map((item) => item.trim()).filter(Boolean));
};

export default function ResumeAnalyzer() {
    const { user } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [selectedResume, setSelectedResume] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [scanningJobs, setScanningJobs] = useState(false);
    const [scanProgress, setScanProgress] = useState({ completed: 0, total: 0 });
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [error, setError] = useState('');

    const syncView = (resumeId, nextHistory = history, nextSavedJobs = savedJobs) => {
        const numericResumeId = Number(resumeId);

        if (!numericResumeId) {
            setAnalysis(null);
            setMatches([]);
            setSelectedMatch(null);
            return;
        }

        const savedJobIds = new Set(nextSavedJobs.map((item) => item?.job?.id).filter(Boolean));
        const latestGeneral = nextHistory.find((item) => item.resume?.id === numericResumeId && !item.job) ?? null;
        const cachedMatches = dedupeMatchesByJob(
            nextHistory.filter((item) => item.resume?.id === numericResumeId && item.job?.id && savedJobIds.has(item.job.id))
        );

        setAnalysis(latestGeneral);
        setMatches(cachedMatches);
        setSelectedMatch(cachedMatches[0] ?? null);
    };

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError('');

            try {
                const [historyRes, resumesRes, savedJobsRes] = await Promise.all([
                    resumeAnalysisAPI.getHistory(user.id),
                    resumeAPI.list(user.id),
                    savedJobAPI.getSaved(user.id),
                ]);

                const nextHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
                const nextResumes = Array.isArray(resumesRes.data) ? resumesRes.data : [];
                const nextSavedJobs = Array.isArray(savedJobsRes.data) ? savedJobsRes.data : [];
                const defaultResumeId = nextHistory.find((item) => !item.job)?.resume?.id ?? nextResumes[0]?.id ?? '';

                setHistory(nextHistory);
                setResumes(nextResumes);
                setSavedJobs(nextSavedJobs);
                setSelectedResume(defaultResumeId ? String(defaultResumeId) : '');
                syncView(defaultResumeId, nextHistory, nextSavedJobs);
            } catch (err) {
                console.error(err);
                const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
                setError(`Failed to synchronize career data: ${backendError}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    const handleResumeChange = (event) => {
        const resumeId = event.target.value;
        setSelectedResume(resumeId);
        setError('');
        syncView(resumeId, history, savedJobs);
    };

    const handleOpenApply = () => {
        const activeResumeId = Number(selectedResume);

        setApplyError('');
        setApplySuccess('');
        setCoverLetter('');
        setSelectedResumeId(activeResumeId || null);
        setShowApplyModal(true);
    };

    const handleApply = async () => {
        const jobId = selectedMatch?.job?.id;

        if (!user?.id || !jobId) {
            return;
        }

        setApplying(true);
        setApplyError('');
        setApplySuccess('');

        try {
            await applicationAPI.apply(jobId, user.id, coverLetter, selectedResumeId);
            setApplySuccess('Application submitted successfully!');
            setTimeout(() => {
                setShowApplyModal(false);
                setApplySuccess('');
            }, 2000);
        } catch (err) {
            console.error(err);
            setApplyError(err.response?.data?.error || 'Failed to apply. Please try again.');
        } finally {
            setApplying(false);
        }
    };

    const runAnalysis = async () => {
        const resumeId = Number(selectedResume);
        if (!resumeId) {
            setError('Select a resume before running the ATS scan.');
            return;
        }

        setAnalyzing(true);
        setError('');

        try {
            const response = await resumeAnalysisAPI.analyze(resumeId);
            const nextHistory = mergeResults(history, [response.data]);
            setHistory(nextHistory);
            syncView(resumeId, nextHistory, savedJobs);
        } catch (err) {
            console.error(err);
            const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
            setError(`Analysis Error: ${backendError}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const scanSavedJobs = async () => {
        const resumeId = Number(selectedResume);
        const jobsToScan = savedJobs.filter((item) => item?.job?.id);

        if (!resumeId) {
            setError('Select a resume before scanning saved jobs.');
            return;
        }

        if (!jobsToScan.length) {
            setError('Save at least one job before running a saved-job scan.');
            return;
        }

        setScanningJobs(true);
        setScanProgress({ completed: 0, total: jobsToScan.length });
        setError('');

        try {
            const settled = await Promise.allSettled(
                jobsToScan.map((item) =>
                    resumeAnalysisAPI.analyzeMatch(resumeId, item.job.id)
                        .then((response) => response.data)
                        .finally(() => {
                            setScanProgress((current) => ({
                                ...current,
                                completed: Math.min(current.completed + 1, current.total),
                            }));
                        })
                )
            );

            const successful = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value).filter(Boolean);
            if (!successful.length) {
                throw settled.find((item) => item.status === 'rejected')?.reason ?? new Error('Saved-job scanning failed.');
            }

            const sortedMatches = dedupeMatchesByJob(successful);
            const nextHistory = mergeResults(history, successful);

            setHistory(nextHistory);
            setMatches(sortedMatches);
            setSelectedMatch(sortedMatches[0] ?? null);

            if (successful.length < jobsToScan.length) {
                setError(`Scanned ${successful.length} of ${jobsToScan.length} saved jobs. Some jobs could not be analyzed right now.`);
            }
        } catch (err) {
            console.error(err);
            const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
            setError(`Saved Job Scan Error: ${backendError}`);
        } finally {
            setScanningJobs(false);
            setScanProgress({ completed: 0, total: 0 });
        }
    };

    const getSavedJobRecord = (jobId) => savedJobs.find((item) => item?.job?.id === jobId) ?? null;
    const getScoreTone = (score) => (score >= 80 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : score >= 50 ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-rose-50 border-rose-500 text-rose-600');
    const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not available');
    const scanProgressPercent = scanProgress.total ? Math.round((scanProgress.completed / scanProgress.total) * 100) : 0;
    const selectedMissingKeywords = getMissingKeywords(selectedMatch);
    const selectedSavedJob = getSavedJobRecord(selectedMatch?.job?.id);
    const selectedJob = selectedSavedJob?.job ?? null;
    const canApplyFromPanel = user?.role === 'JOBSEEKER' && selectedJob?.status === 'ACTIVE';

    if (loading) return <Loader text="Calibrating ATS Scanner..." />;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-orange-500 border-[3px] border-stone-900 flex items-center justify-center -rotate-12 shadow-[4px_4px_0_#000]">
                            <Zap size={24} className="text-stone-900" />
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-white">ATS Intelligence</h2>
                    </div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">RESUME OPTIMIZATION AND SAVED JOB MATCHING</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                    <select value={selectedResume} onChange={handleResumeChange} className="flex-1 md:w-64 p-4 border-[3px] border-stone-900 font-black uppercase text-xs bg-white dark:bg-stone-800 shadow-[4px_4px_0_#000]">
                        <option value="">SELECT RESUME</option>
                        {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name}</option>)}
                    </select>
                    <button onClick={runAnalysis} disabled={analyzing || !selectedResume} className="bg-stone-900 text-white px-6 py-4 border-[3px] border-stone-900 font-black uppercase text-xs shadow-[4px_4px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {analyzing ? 'SCANNING...' : <><RefreshCcw size={16} /> RUN SCAN</>}
                    </button>
                    <button onClick={scanSavedJobs} disabled={scanningJobs || !selectedResume || savedJobs.length === 0} className="bg-orange-500 text-stone-900 px-6 py-4 border-[3px] border-stone-900 font-black uppercase text-xs shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {scanningJobs ? 'MATCHING JOBS...' : <><Search size={16} /> SCAN SAVED JOBS</>}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-500 text-white border-[3px] border-stone-900 font-black uppercase text-[10px] shadow-[6px_6px_0_#000] flex items-center gap-3"><AlertTriangle size={18} /> {error}</div>}

            {!resumes.length && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-16 text-center shadow-[12px_12px_0_#000]">
                    <div className="w-20 h-20 mx-auto border-[3px] border-stone-900 flex items-center justify-center mb-6 opacity-30"><FileSearch size={40} /></div>
                    <h3 className="text-2xl font-black uppercase text-stone-900 dark:text-white mb-2">No Resume Uploaded Yet</h3>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Upload or generate a resume first, then come back here to scan it.</p>
                </div>
            )}

            {resumes.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    <div className="xl:col-span-4 space-y-6">
                        <div className={`p-8 border-[4px] border-stone-900 text-center shadow-[10px_10px_0_#000] ${getScoreTone(analysis?.score ?? 0)}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">ATS Score</p>
                            <div className="text-7xl font-black tracking-tighter mb-4">{analysis?.score ?? '--'}</div>
                            <div className="w-full h-4 bg-white/60 border-[2px] border-stone-900 overflow-hidden">
                                <div className="h-full bg-stone-900 transition-all duration-700" style={{ width: `${analysis?.score ?? 0}%` }} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-6 shadow-[8px_8px_0_#000]">
                            <h4 className="font-black text-emerald-600 uppercase text-xs mb-4 flex items-center gap-2"><ShieldCheck size={18} /> PROFILE STRENGTHS</h4>
                            <div className="space-y-3">
                                {(analysis?.strengths?.length ? analysis.strengths : ['Run a scan to surface resume strengths.']).map((item, index) => (
                                    <p key={index} className="text-xs font-black uppercase text-stone-900 dark:text-stone-200">{item}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-8 shadow-[10px_10px_0_#000]">
                            <h4 className="font-black text-rose-500 uppercase text-xs mb-6 flex items-center gap-2"><AlertTriangle size={18} /> CRITICAL IMPROVEMENTS</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(analysis?.suggestions?.length ? analysis.suggestions : ['Select a resume and run the ATS scan to generate actionable suggestions.']).map((item, index) => (
                                    <div key={index} className="bg-stone-50 dark:bg-stone-900/40 p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000]">
                                        <p className="text-[11px] font-black uppercase text-stone-900 dark:text-stone-200 leading-relaxed">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-stone-900 text-white p-8 border-[4px] border-stone-900 shadow-[10px_10px_0_#ea580c] relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 opacity-5"><Target size={180} /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3"><Search size={22} className="text-orange-500" /><h4 className="text-2xl font-black uppercase tracking-tighter">Saved Job Match Scan</h4></div>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">{savedJobs.length} saved job{savedJobs.length === 1 ? '' : 's'} ready for scanning.</p>
                                <button onClick={scanSavedJobs} disabled={scanningJobs || !selectedResume || savedJobs.length === 0} className="bg-orange-500 text-stone-900 px-6 py-3 border-[3px] border-stone-900 font-black uppercase text-xs shadow-[4px_4px_0_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50">
                                    {scanningJobs ? 'SCANNING SAVED JOBS...' : 'SCAN AGAINST SAVED JOBS'}
                                </button>

                                {scanningJobs && (
                                    <div className="mt-5 bg-white text-stone-900 border-[3px] border-stone-900 p-4 shadow-[4px_4px_0_#ea580c]">
                                        <div className="flex items-center justify-between gap-4 mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest">
                                                Scan Progress
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest">
                                                {scanProgress.completed} / {scanProgress.total}
                                            </p>
                                        </div>
                                        <div className="w-full h-4 bg-stone-200 border-[2px] border-stone-900 overflow-hidden">
                                            <div
                                                className="h-full bg-orange-500 transition-all duration-300"
                                                style={{ width: `${scanProgressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {scanningJobs && <Loader text={`Scanning saved jobs (${scanProgress.completed}/${scanProgress.total})...`} />}

                        {!scanningJobs && savedJobs.length > 0 && matches.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 space-y-4">
                                    {matches.map((match) => {
                                        const savedJob = getSavedJobRecord(match.job?.id);
                                        const isSelected = selectedMatch?.job?.id === match.job?.id;
                                        const missingKeywords = getMissingKeywords(match);
                                        return (
                                            <button key={`${match.resume?.id}-${match.job?.id}`} type="button" onClick={() => setSelectedMatch(match)} className={`w-full text-left p-5 border-[3px] transition-all ${getScoreTone(match.score)} ${isSelected ? 'shadow-[8px_8px_0_#ea580c] -translate-y-1' : 'shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#ea580c]'}`}>
                                                <div className="flex justify-between gap-4 mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">{match.job?.companyName || 'Company not available'}</p>
                                                        <h5 className="text-lg font-black uppercase tracking-tight text-stone-900">{match.job?.title}</h5>
                                                    </div>
                                                    <div className="w-14 h-14 rounded-full border-[3px] border-stone-900 bg-white text-stone-900 flex items-center justify-center text-lg font-black">{match.score}</div>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-stone-600">Saved {formatDate(savedJob?.savedAt)}</p>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-stone-600 mt-2">{missingKeywords.length} missing keyword{missingKeywords.length === 1 ? '' : 's'}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="lg:col-span-7 bg-white text-stone-900 border-[4px] border-stone-900 p-6 shadow-[8px_8px_0_#ea580c]">
                                    {selectedMatch && (
                                        <>
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">{selectedMatch.job?.companyName || 'Company not available'}</p>
                                                    <h5 className="text-3xl font-black uppercase tracking-tight mb-3">{selectedMatch.job?.title}</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="bg-orange-200 border-[2px] border-stone-900 px-3 py-1 text-[10px] font-black uppercase">Score {selectedMatch.score}</span>
                                                        <span className="bg-stone-100 border-[2px] border-stone-900 px-3 py-1 text-[10px] font-black uppercase">{formatDate(getSavedJobRecord(selectedMatch.job?.id)?.savedAt)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <Link to={`/job/${selectedMatch.job?.id}`} className="inline-flex items-center justify-center bg-stone-900 text-white px-4 py-3 border-[3px] border-stone-900 font-black uppercase text-xs shadow-[4px_4px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                                        OPEN JOB
                                                    </Link>
                                                    {canApplyFromPanel && (
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenApply}
                                                            className="inline-flex items-center justify-center bg-orange-500 text-stone-900 px-4 py-3 border-[3px] border-stone-900 font-black uppercase text-xs shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                                        >
                                                            APPLY NOW
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                                <div className="border-[3px] border-stone-900 bg-stone-50 p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Best Signals</p>
                                                    <div className="space-y-3">
                                                        {(selectedMatch.strengths?.length ? selectedMatch.strengths.slice(0, 3) : ['Run the scan again to refresh strengths.']).map((item, index) => (
                                                            <p key={index} className="text-[11px] font-black uppercase text-stone-900 leading-relaxed">{item}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="border-[3px] border-stone-900 bg-stone-50 p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Tailoring Actions</p>
                                                    <div className="space-y-3">
                                                        {(selectedMatch.suggestions?.length ? selectedMatch.suggestions.slice(0, 3) : ['No saved-job specific gaps were returned for this match.']).map((item, index) => (
                                                            <p key={index} className="text-[11px] font-black uppercase text-stone-900 leading-relaxed">{item}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-[3px] border-stone-900 bg-stone-50 p-4 mb-6">
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Missing Keywords</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{selectedMissingKeywords.length}</p>
                                                </div>
                                                {selectedMissingKeywords.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedMissingKeywords.map((keyword) => (
                                                            <span key={keyword} className="bg-rose-100 text-rose-700 border-[2px] border-stone-900 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                                                                {keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-black uppercase text-stone-500 leading-relaxed">
                                                        No high-impact missing keywords were flagged for this match.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {!scanningJobs && savedJobs.length === 0 && <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-6 shadow-[8px_8px_0_#000]"><p className="text-xs font-black uppercase tracking-widest text-stone-500">Save jobs from Find Jobs to activate job scanning.</p></div>}
                        {!scanningJobs && savedJobs.length > 0 && matches.length === 0 && <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-6 shadow-[8px_8px_0_#000]"><p className="text-xs font-black uppercase tracking-widest text-stone-500">No saved-job scan results yet. Run the scan to rank your saved opportunities.</p></div>}
                    </div>
                </div>
            )}

            {showApplyModal && (
                <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
                    <div className="bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 shadow-[16px_16px_0_#1c1917] dark:shadow-[16px_16px_0_#000] w-full max-w-xl p-8 md:p-10 relative">
                        <button
                            type="button"
                            onClick={() => setShowApplyModal(false)}
                            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center border-[3px] border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-rose-500 hover:text-white transition-colors font-black text-xl shadow-[4px_4px_0_#000] hover:shadow-none"
                        >
                            ×
                        </button>

                        <div className="mb-8">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-2">
                                Apply From Match Panel
                            </h3>
                            <p className="text-orange-600 dark:text-orange-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                                {selectedMatch?.job?.title}
                            </p>
                        </div>

                        {applyError && (
                            <div className="bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-5 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                                {applyError}
                            </div>
                        )}

                        {applySuccess ? (
                            <div className="bg-emerald-500 border-[4px] border-stone-900 p-8 text-white text-center">
                                <p className="text-xl font-black uppercase tracking-widest leading-tight">{applySuccess}</p>
                            </div>
                        ) : (
                            <>
                                <ApplyResumePicker
                                    userId={user?.id}
                                    selectedResumeId={selectedResumeId}
                                    onSelect={setSelectedResumeId}
                                />

                                <div className="mb-5">
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                        Cover Letter
                                        <span className="text-stone-400 font-bold ml-1">(optional)</span>
                                    </label>
                                    <textarea
                                        value={coverLetter}
                                        onChange={(event) => setCoverLetter(event.target.value)}
                                        rows={5}
                                        placeholder="Tell the employer why you're a strong fit for this role..."
                                        className="w-full px-4 py-3 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all resize-none text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="bg-orange-100 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 p-3 mb-5 text-sm text-stone-900 dark:text-orange-300 font-bold uppercase">
                                    Applying as: <span className="font-black">{user?.firstName} {user?.lastName}</span>
                                    <span className="text-stone-500 dark:text-stone-400 ml-1">({user?.email})</span>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowApplyModal(false)}
                                        className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white font-black uppercase tracking-widest py-3 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        disabled={applying}
                                        className="flex-1 bg-orange-500 text-stone-900 border-[3px] border-stone-900 font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {applying ? 'Submitting...' : 'Apply Now'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="p-4 bg-orange-50 border-[3px] border-stone-900 flex items-center gap-4 shadow-[4px_4px_0_#000]">
                <Info size={20} className="text-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-600">Run a general ATS scan first, then scan saved jobs to see which roles need the least resume tailoring.</p>
            </div>
        </div>
    );
}
