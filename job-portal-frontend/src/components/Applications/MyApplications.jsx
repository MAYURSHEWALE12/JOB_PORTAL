import { useState, useEffect } from 'react';
import { applicationAPI, quizAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';
import TakeQuiz from './TakeQuiz';

// ─── Status badge colors ──────────────────────────────────────────────────────
const statusStyles = {
    PENDING:     'bg-yellow-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700',
    REVIEWED:    'bg-blue-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700',
    SHORTLISTED: 'bg-emerald-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700',
    ACCEPTED:    'bg-rose-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700',
    REJECTED:    'bg-red-500 text-white border-[3px] border-stone-900 dark:border-stone-700',
    WITHDRAWN:   'bg-stone-300 text-stone-800 border-[3px] border-stone-900 dark:border-stone-700',
};

const statusIcons = {
    PENDING:     '⏳',
    REVIEWED:    '👀',
    SHORTLISTED: '⭐',
    ACCEPTED:    '🎉',
    REJECTED:    '❌',
    WITHDRAWN:   '↩️',
};

export default function MyApplications() {
    const { user } = useAuthStore();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [withdrawing, setWithdrawing]   = useState(null);
    const [selected, setSelected]         = useState(null);
    const [takingQuiz, setTakingQuiz]     = useState(null);
    const [selectedQuizResult, setSelectedQuizResult] = useState(null);
    const [hasQuiz, setHasQuiz]           = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        if (selected) {
            checkQuizStatus(selected);
        } else {
            setSelectedQuizResult(null);
            setHasQuiz(false);
        }
    }, [selected]);

    const checkQuizStatus = async (app) => {
        try {
            // Check if result exists
            const resResult = await quizAPI.getResult(app.id);
            setSelectedQuizResult(resResult.data);
            setHasQuiz(true); // If result exists, quiz definitely exists
        } catch (err) {
            setSelectedQuizResult(null);
            // Check if quiz exists for job
            try {
                const resQuiz = await quizAPI.getForCandidate(app.job.id);
                setHasQuiz(!!resQuiz.data);
            } catch (qErr) {
                setHasQuiz(false);
            }
        }
    };

    const fetchApplications = async (page = 0) => {
        setLoading(true);
        setError('');
        try {
            const res = await applicationAPI.getMyApplications(user.id, page, PAGE_SIZE);
            const data = res.data?.content ?? [];
            setApplications(data);
            setTotalPages(res.data?.totalPages ?? 0);
            setTotalElements(res.data?.totalElements ?? 0);
            setCurrentPage(res.data?.page ?? 0);
        } catch (err) {
            console.error('Failed to load applications:', err);
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setSelected(null);
        fetchApplications(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWithdraw = async (applicationId) => {
        if (!window.confirm('Are you sure you want to withdraw this application?')) return;
        setWithdrawing(applicationId);
        try {
            await applicationAPI.withdraw(applicationId, user.id);
            // Update status locally
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId
                        ? { ...app, status: 'WITHDRAWN' }
                        : app
                )
            );
            if (selected?.id === applicationId) {
                setSelected(prev => ({ ...prev, status: 'WITHDRAWN' }));
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to withdraw application.');
        } finally {
            setWithdrawing(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // Stats
    const stats = {
        total:       applications.length,
        pending:     applications.filter(a => a.status === 'PENDING').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        accepted:    applications.filter(a => a.status === 'ACCEPTED').length,
    };

    if (takingQuiz) {
        return (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
                <div className="w-full max-w-2xl">
                    <TakeQuiz 
                        jobId={takingQuiz.job.id} 
                        applicationId={takingQuiz.id} 
                        onComplete={() => {
                            setTakingQuiz(null);
                            fetchApplications();
                            setSelected(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">📋 My Applications</h2>
                <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 uppercase tracking-wider text-xs">
                    Track all your job applications here
                </p>
            </div>

            {/* ── Stats Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total',       value: stats.total,       color: 'bg-orange-300 text-stone-900' },
                    { label: 'Pending',     value: stats.pending,     color: 'bg-yellow-300 text-stone-900' },
                    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-emerald-300 text-stone-900'  },
                    { label: 'Accepted',    value: stats.accepted,    color: 'bg-blue-300 text-stone-900'    },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.color} border-[4px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-6 text-center transform hover:-translate-y-1 transition-transform cursor-default`}>
                        <p className="text-4xl font-black">{stat.value}</p>
                        <p className="text-xs font-black mt-2 uppercase tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Loading ───────────────────────────────────────────── */}
            {loading && <Loader text="Loading applications..." />}

            {/* ── Error ─────────────────────────────────────────────── */}
            {!loading && error && (
                <div className="text-center py-12 text-rose-600 dark:text-rose-500 font-bold uppercase">{error}</div>
            )}

            {/* ── Empty State ───────────────────────────────────────── */}
            {!loading && !error && applications.length === 0 && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-12 text-center rounded-none">
                    <div className="text-6xl mb-6">📭</div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-2">No Applications Yet</h3>
                    <p className="text-stone-600 dark:text-stone-400 font-bold text-sm">
                        You haven't applied for any jobs yet. Go to <strong className="text-stone-900 dark:text-stone-100">Find Jobs</strong> to get started!
                    </p>
                </div>
            )}

            {/* ── Applications List + Detail ────────────────────────── */}
            {!loading && applications.length > 0 && (
                <div className="flex gap-8 flex-col lg:flex-row">

                    {/* List */}
                    <div className={`space-y-6 ${selected ? 'lg:w-[45%]' : 'w-full'}`}>
                        {applications.map((app) => {
                            const isSelected = selected?.id === app.id;
                            return (
                                <div
                                    key={app.id}
                                    onClick={() => setSelected(app)}
                                    className={`bg-white dark:bg-stone-800 p-6 cursor-pointer border-[4px] rounded-none transition-all
                                        ${isSelected 
                                            ? 'border-orange-500 shadow-[8px_8px_0_#ea580c] -translate-y-1' 
                                            : 'border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[8px_8px_0_#ea580c]'}`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-black text-stone-900 dark:text-gray-100 text-xl uppercase tracking-tight">
                                                {app.job?.title}
                                            </h3>
                                            <p className="text-stone-600 dark:text-stone-400 font-bold text-sm mt-1 uppercase">
                                                {app.job?.employer?.firstName} {app.job?.employer?.lastName}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold uppercase tracking-wider">
                                                <span className="bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 px-2 py-1 border-[2px] border-stone-900 dark:border-stone-600">
                                                    📍 {app.job?.location}
                                                </span>
                                                <span className="bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200 px-2 py-1 border-[2px] border-stone-900 dark:border-stone-600">
                                                    📅 Applied {formatDate(app.appliedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <span className={`text-xs font-black px-3 py-1 uppercase border-[3px] border-stone-900 whitespace-nowrap ml-3 shrink-0 shadow-[2px_2px_0_#1c1917]
                                            ${statusStyles[app.status] || 'bg-stone-300 text-stone-800'}`}>
                                            {statusIcons[app.status]} {app.status}
                                        </span>
                                    </div>

                                    {/* Withdraw button — only for PENDING */}
                                    {app.status === 'PENDING' && (
                                        <div className="mt-6 flex justify-end shrink-0 border-t-[3px] border-stone-200 dark:border-stone-700 border-dashed pt-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // don't open detail
                                                    handleWithdraw(app.id);
                                                }}
                                                disabled={withdrawing === app.id}
                                                className="text-xs font-black uppercase tracking-widest text-white bg-stone-900 hover:bg-rose-600 border-[3px] border-stone-900 shadow-[4px_4px_0_#1c1917] px-4 py-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#1c1917] disabled:opacity-50"
                                            >
                                                {withdrawing === app.id ? 'Withdrawing...' : 'Withdraw'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between py-4 border-t-[3px] border-stone-200 dark:border-stone-700 mt-4">
                                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}
                                    className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5">
                                    ← Prev
                                </button>
                                <span className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase">
                                    Page {currentPage + 1} of {totalPages} ({totalElements} total)
                                </span>
                                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                                    className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5">
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    {selected && (
                        <div className="hidden lg:block lg:w-[55%] bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] rounded-none p-8 h-fit sticky top-4">
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

                            {/* Progress Tracker */}
                            <div className="mb-8 p-6 bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-6 border-b-[3px] border-stone-900 dark:border-stone-700 pb-2">
                                    Application Status
                                </h3>
                                
                                {selected.status === 'WITHDRAWN' ? (
                                    <div className="text-center py-4">
                                        <div className="text-4xl mb-2">↩️</div>
                                        <div className="text-lg font-black text-stone-500 uppercase tracking-widest">Withdrawn</div>
                                    </div>
                                ) : (
                                    <div className="relative flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                        {/* Background connecting line */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-200 dark:bg-stone-700 -translate-y-1/2 z-0 hidden sm:block"></div>
                                        
                                        {/* Stages */}
                                        {[
                                            { key: 'APPLIED', icon: '📝', label: 'Applied',      match: ['PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'] },
                                            { key: 'REVIEWED', icon: '👀', label: 'In Review',    match: ['REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'] },
                                            { key: 'DECISION', icon: selected.status === 'REJECTED' ? '❌' : '🎉', 
                                              label: selected.status === 'REJECTED' ? 'Rejected' : (selected.status === 'ACCEPTED' ? 'Accepted' : 'Decision'), 
                                              match: ['ACCEPTED', 'REJECTED'] }
                                        ].map((stage, index) => {
                                            const isActive = stage.match.includes(selected.status);
                                            const isCurrent = stage.key === 'DECISION' 
                                                ? (selected.status === 'ACCEPTED' || selected.status === 'REJECTED')
                                                : (stage.key === 'REVIEWED' && (selected.status === 'REVIEWED' || selected.status === 'SHORTLISTED')) || (stage.key === 'APPLIED' && selected.status === 'PENDING');
                                                
                                            return (
                                                <div key={index} className="relative z-10 flex flex-col items-center flex-1 sm:flex-none">
                                                    <div className={`w-10 h-10 flex items-center justify-center border-[3px] shadow-[2px_2px_0_#1c1917] mb-2 transition-colors duration-500
                                                        ${isCurrent ? 'bg-orange-400 text-stone-900 border-stone-900 scale-110' : 
                                                          isActive ? 'bg-emerald-400 text-stone-900 border-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-300 dark:border-stone-600 shadow-none'}`}>
                                                        {isActive ? (isCurrent ? stage.icon : '✓') : stage.icon}
                                                    </div>
                                                    <div className={`text-center ${isCurrent ? 'text-orange-600 dark:text-orange-400 font-black' : (isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400')}`}>
                                                        {stage.label}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Assessment Section */}
                            {hasQuiz && (
                                <div className="mb-8 p-6 bg-stone-900 text-white border-[4px] border-stone-900 shadow-[6px_6px_0_#ea580c]">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest">🎯 Recruitment Assessment</h3>
                                        {selectedQuizResult && (
                                            <span className={`px-2 py-1 text-[10px] font-black uppercase border-[2px] border-white
                                                ${selectedQuizResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                {selectedQuizResult.passed ? 'PASSED' : 'FAILED'}
                                            </span>
                                        )}
                                    </div>

                                    {selectedQuizResult ? (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-stone-400 uppercase">Score Achieved</p>
                                                <p className="text-3xl font-black">{selectedQuizResult.score}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-stone-400 uppercase">Completion Date</p>
                                                <p className="text-xs font-bold">{formatDate(selectedQuizResult.completedAt)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-bold text-stone-300 mb-6 uppercase tracking-wider leading-relaxed">
                                                The employer has requested a mandatory screening assessment for this position.
                                            </p>
                                            {['PENDING', 'REVIEWED', 'SHORTLISTED'].includes(selected.status) ? (
                                                <button
                                                    onClick={() => setTakingQuiz(selected)}
                                                    className="w-full py-4 bg-orange-500 text-stone-900 font-black uppercase tracking-widest text-xs border-[3px] border-white shadow-[4px_4px_0_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                                >
                                                    START ASSESSMENT
                                                </button>
                                            ) : (
                                                <div className="p-3 bg-stone-800 border-[2px] border-stone-700 text-center text-[10px] font-black uppercase text-stone-500">
                                                    🔒 Locked for this status
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Job Info */}
                            <div className="space-y-3 font-bold text-sm text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-8 bg-stone-50 dark:bg-stone-900/50 p-5 border-[3px] border-stone-900 dark:border-stone-700 border-dashed">
                                <p>🏢 <span className="text-stone-900 dark:text-white">
                                    {selected.job?.employer?.firstName} {selected.job?.employer?.lastName}
                                </span></p>
                                <p>📍 <span className="text-stone-900 dark:text-white">{selected.job?.location}</span></p>
                                <p>💼 <span className="text-stone-900 dark:text-white">
                                    {selected.job?.jobType?.replace('_', ' ')}
                                </span></p>
                                {selected.job?.salaryMin && (
                                    <p>💰 <span className="text-emerald-600 dark:text-emerald-400">
                                        ₹{Number(selected.job.salaryMin).toLocaleString()} — ₹{Number(selected.job.salaryMax).toLocaleString()}
                                    </span></p>
                                )}
                                <p>📅 Applied on <span className="text-stone-900 dark:text-white">{formatDate(selected.appliedAt)}</span></p>
                            </div>

                            {/* Cover Letter */}
                            <div className="mb-6">
                                <h3 className="font-black text-stone-900 dark:text-stone-100 uppercase text-lg mb-3">Your Cover Letter</h3>
                                {selected.coverLetter ? (
                                    <p className="text-stone-700 dark:text-stone-300 text-sm whitespace-pre-line bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 p-5 font-medium leading-relaxed shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                                        {selected.coverLetter}
                                    </p>
                                ) : (
                                    <p className="text-stone-400 dark:text-stone-500 text-sm font-bold uppercase tracking-wider">
                                        No cover letter submitted.
                                    </p>
                                )}
                            </div>

                            {/* Feedback from employer */}
                            {selected.feedback && (
                                <div className="mt-8 pt-6 border-t-[4px] border-stone-900 dark:border-stone-700 border-dashed">
                                    <h3 className="font-black text-blue-600 dark:text-blue-400 uppercase text-lg mb-3">Employer Feedback</h3>
                                    <p className="text-stone-900 dark:text-white text-sm bg-blue-100 dark:bg-blue-900/40 border-[3px] border-blue-600 dark:border-blue-400 p-5 font-bold leading-relaxed shadow-[4px_4px_0_#2563eb]">
                                        {selected.feedback}
                                    </p>
                                </div>
                            )}

                            {/* Withdraw from detail panel */}
                            {selected.status === 'PENDING' && (
                                <button
                                    onClick={() => handleWithdraw(selected.id)}
                                    disabled={withdrawing === selected.id}
                                    className="w-full mt-8 bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 font-black uppercase tracking-widest py-4 hover:bg-rose-400 hover:-translate-y-1 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#1c1917] dark:hover:shadow-[6px_6px_0_#000] transition-all disabled:opacity-50"
                                >
                                    {withdrawing === selected.id ? 'Withdrawing...' : '↩️ Withdraw Application'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}