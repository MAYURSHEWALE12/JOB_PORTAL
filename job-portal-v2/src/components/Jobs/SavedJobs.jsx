import { useState, useEffect } from 'react';
import { savedJobAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';

export default function SavedJobs() {
    const { user } = useAuthStore();

    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [selected, setSelected]   = useState(null);
    const [removing, setRemoving]   = useState(null);

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await savedJobAPI.getSaved(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setSavedJobs(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load saved jobs.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (jobId) => {
        setRemoving(jobId);
        try {
            await savedJobAPI.unsave(user.id, jobId);
            setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
            if (selected?.job?.id === jobId) setSelected(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove saved job.');
        } finally {
            setRemoving(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">🔖 Saved Jobs</h2>
                <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 uppercase tracking-wider text-xs">
                    Jobs you've bookmarked for later
                </p>
            </div>

            {/* ── Stats ─────────────────────────────────────────────── */}
            <div className="bg-orange-300 border-[4px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] rounded-none p-5 mb-8 flex items-center gap-4">
                <span className="text-4xl font-black text-stone-900">{savedJobs.length}</span>
                <span className="text-stone-900 font-bold uppercase tracking-widest text-sm">
                    saved job{savedJobs.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Loading ───────────────────────────────────────────── */}
            {loading && <Loader text="Loading saved jobs..." />}

            {/* ── Error ─────────────────────────────────────────────── */}
            {!loading && error && (
                <div className="text-center py-12 text-rose-600 dark:text-rose-500 font-bold">{error}</div>
            )}

            {/* ── Empty State ───────────────────────────────────────── */}
            {!loading && !error && savedJobs.length === 0 && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-12 text-center rounded-none">
                    <div className="text-6xl mb-6">🔖</div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-2">No Saved Jobs</h3>
                    <p className="text-stone-600 dark:text-stone-400 font-bold text-sm">
                        Go to <strong className="text-stone-900 dark:text-stone-100">🔍 Find Jobs</strong> and click the bookmark icon to save jobs for later.
                    </p>
                </div>
            )}

            {/* ── Saved Jobs List + Detail ──────────────────────────── */}
            {!loading && savedJobs.length > 0 && (
                <div className="flex gap-8 flex-col lg:flex-row">

                    {/* List */}
                    <div className={`space-y-6 ${selected ? 'lg:w-1/2' : 'w-full'}`}>
                        {savedJobs.map((savedJob) => {
                            const isSelected = selected?.id === savedJob.id;
                            return (
                                <div
                                    key={savedJob.id}
                                    onClick={() => setSelected(savedJob)}
                                    className={`bg-white dark:bg-stone-800 p-6 cursor-pointer border-[4px] rounded-none transition-all
                                        ${isSelected 
                                            ? 'border-orange-500 shadow-[8px_8px_0_#ea580c] -translate-y-1' 
                                            : 'border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#ea580c]'}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-black text-stone-900 dark:text-gray-100 text-xl uppercase tracking-tight">
                                                {savedJob.job?.title}
                                            </h3>
                                            <p className="text-stone-600 dark:text-stone-400 font-bold text-sm mt-1 uppercase">
                                                {savedJob.job?.employer?.firstName} {savedJob.job?.employer?.lastName}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold uppercase tracking-wider">
                                                <span className="bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 px-2 py-1 border-[2px] border-stone-900 dark:border-stone-600">
                                                    📍 {savedJob.job?.location}
                                                </span>
                                                <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 px-2 py-1 border-[2px] border-orange-200 dark:border-orange-800">
                                                    💼 {savedJob.job?.jobType?.replace('_', ' ')}
                                                </span>
                                                {savedJob.job?.salaryMin && (
                                                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-2 py-1 border-[2px] border-emerald-200 dark:border-emerald-800">
                                                        💰 ₹{Number(savedJob.job.salaryMin).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-stone-500 dark:text-stone-500 font-bold text-xs mt-4 uppercase">
                                                🔖 Saved on {formatDate(savedJob.savedAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                            <span className={`text-xs font-black px-3 py-1 uppercase border-[2px] border-stone-900 dark:border-stone-700
                                                ${savedJob.job?.status === 'ACTIVE'
                                                    ? 'bg-emerald-400 text-stone-900'
                                                    : 'bg-stone-300 text-stone-800 dark:bg-stone-700 dark:text-stone-300'}`}>
                                                {savedJob.job?.status}
                                            </span>

                                            {/* Unsave button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsave(savedJob.job.id);
                                                }}
                                                disabled={removing === savedJob.job.id}
                                                className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 hover:text-white border-[2px] border-rose-500 dark:border-rose-400 hover:bg-rose-500 px-3 py-1 transition-colors disabled:opacity-50"
                                            >
                                                {removing === savedJob.job.id ? '...' : '🗑 Remove'}
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-stone-700 dark:text-stone-300 text-sm mt-4 line-clamp-2 border-t-[3px] border-stone-200 dark:border-stone-700 border-dashed pt-4 font-medium">
                                        {savedJob.job?.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail Panel */}
                    {selected && (
                        <div className="hidden lg:block lg:w-1/2 bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] rounded-none p-8 h-fit sticky top-4">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">
                                    {selected.job?.title}
                                </h2>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="w-10 h-10 flex border-[3px] border-stone-900 dark:border-stone-700 items-center justify-center bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-black text-xl hover:bg-rose-500 hover:text-white hover:border-rose-700 transition-colors shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-none translate-y-[-2px] hover:translate-y-0"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="bg-orange-300 text-stone-900 text-xs font-black uppercase px-3 py-1 border-[2px] border-stone-900">
                                    {selected.job?.jobType?.replace('_', ' ')}
                                </span>
                                <span className={`text-xs font-black px-3 py-1 uppercase border-[2px] border-stone-900 dark:border-stone-700
                                    ${selected.job?.status === 'ACTIVE'
                                        ? 'bg-emerald-400 text-stone-900'
                                        : 'bg-stone-300 text-stone-800 dark:bg-stone-600 dark:text-stone-200'}`}>
                                    {selected.job?.status}
                                </span>
                            </div>

                            <div className="space-y-3 font-bold text-sm text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-6 bg-stone-50 dark:bg-stone-900/50 p-4 border-[3px] border-stone-900 dark:border-stone-700 border-dashed">
                                <p>🏢 <span className="text-stone-900 dark:text-white">
                                    {selected.job?.employer?.firstName} {selected.job?.employer?.lastName}
                                </span></p>
                                <p>📍 <span className="text-stone-900 dark:text-white">{selected.job?.location}</span></p>
                                {selected.job?.salaryMin && (
                                    <p>💰 <span className="text-emerald-600 dark:text-emerald-400">
                                        ₹{Number(selected.job.salaryMin).toLocaleString()} — ₹{Number(selected.job.salaryMax).toLocaleString()}
                                    </span></p>
                                )}
                                {selected.job?.experienceRequired && (
                                    <p>🧑‍💼 <span className="text-stone-900 dark:text-white">{selected.job.experienceRequired}</span></p>
                                )}
                                {selected.job?.positionsAvailable && (
                                    <p>👥 <span className="text-stone-900 dark:text-white">{selected.job.positionsAvailable} positions</span></p>
                                )}
                                <p className="text-orange-600 dark:text-orange-500">🔖 Saved on {formatDate(selected.savedAt)}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase text-lg mb-2">Description</h3>
                                <p className="text-stone-700 dark:text-stone-300 text-sm whitespace-pre-line font-medium leading-relaxed">
                                    {selected.job?.description}
                                </p>
                            </div>

                            {selected.job?.requirements && (
                                <div className="mb-8">
                                    <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase text-lg mb-2">Requirements</h3>
                                    <p className="text-stone-700 dark:text-stone-300 text-sm whitespace-pre-line font-medium leading-relaxed bg-stone-50 dark:bg-stone-900/30 p-4 border-[3px] border-stone-200 dark:border-stone-700">
                                        {selected.job.requirements}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 border-t-[4px] border-stone-900 dark:border-stone-700 border-dashed">
                                <button
                                    onClick={() => handleUnsave(selected.job.id)}
                                    disabled={removing === selected.job.id}
                                    className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest py-3 hover:bg-rose-50 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 hover:-translate-y-1 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#1c1917] dark:hover:shadow-[6px_6px_0_#000]"
                                >
                                    {removing === selected.job.id ? 'Removing...' : '🗑 Remove'}
                                </button>
                                {selected.job?.status === 'ACTIVE' && (
                                    <button className="flex-1 bg-orange-500 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 font-black uppercase tracking-widest py-3 hover:bg-orange-400 hover:-translate-y-1 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#1c1917] dark:hover:shadow-[6px_6px_0_#000] transition-all">
                                        Apply Now
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}