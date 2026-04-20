import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ApplicationCard from './ApplicationCard';
import HiringKanban from './HiringKanban';
import JobSelector from './JobSelector';
import PipelineSidebar from './PipelineSidebar';
import BulkActionsToolbar from './BulkActionsToolbar';

import { useApplications } from '../../hooks/useApplications';

const PIPELINE_STAGES = [
    { key: 'ALL', label: 'All', icon: '📋', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'PENDING', label: 'New', icon: '⏳', accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { key: 'REVIEWED', label: 'Reviewed', icon: '👀', accent: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    { key: 'SHORTLISTED', label: 'Shortlisted', icon: '⭐', accent: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)' },
    { key: 'INTERVIEWING', label: 'Interviews', icon: '📅', accent: 'var(--hp-accent2)', bg: 'rgba(var(--hp-accent2-rgb), 0.1)' },
    { key: 'OFFERED', label: 'Offered', icon: '📜', accent: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
    { key: 'ACCEPTED', label: 'Hired', icon: '🎉', accent: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { key: 'REJECTED', label: 'Rejected', icon: '❌', accent: '#f87171', bg: 'rgba(248,113,113,0.1)' },
];

const statusStyles = {
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REVIEWED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SHORTLISTED: 'bg-[rgba(var(--hp-accent-rgb),0.1)] text-[var(--hp-accent)] border-[rgba(var(--hp-accent-rgb),0.2)]',
    INTERVIEWING: 'bg-[rgba(var(--hp-accent2-rgb),0.1)] text-[var(--hp-accent2)] border-[rgba(var(--hp-accent2-rgb),0.2)]',
    OFFERED: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    ACCEPTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    WITHDRAWN: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const statusIcons = {
    PENDING: '⏳', REVIEWED: '👀', SHORTLISTED: '⭐', INTERVIEWING: '📅', OFFERED: '📜',
    ACCEPTED: '🎉', REJECTED: '❌', WITHDRAWN: '↩️',
};

export default function ViewApplications() {
    const {
        jobs, selectedJob, setSelectedJob,
        applications, loadingJobs, loadingApps, updatingId,
        error, activeStage, setActiveStage,
        selectedIds, setSelectedIds,
        isBulkUpdating, searchQuery, setSearchQuery,
        viewMode, setViewMode,
        fetchApplications, handleUpdateStatus, handleBulkUpdate, toggleSelect
    } = useApplications();

    const [selectedApp, setSelectedApp] = useState(null);
    const [showJobDetail, setShowJobDetail] = useState(false);

    const handleSmartSelect = () => {
        const topIds = filteredApps
            .filter(app => {
                const score = app.matchScore || app.matchAnalysis?.score || 0;
                return score >= 80;
            })
            .map(app => app.id);
        
        if (topIds.length === 0) {
            toast('No high-match candidates found in current view.', { icon: '🔍' });
            return;
        }

        setSelectedIds(prev => {
            const next = new Set(prev);
            topIds.forEach(id => next.add(id));
            return next;
        });
        toast.success(`Selected ${topIds.length} top candidates!`, { icon: '🎯' });
    };

    const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.key] = stage.key === 'ALL'
            ? applications.length
            : applications.filter(a => a.status === stage.key).length;
        return acc;
    }, {});

    const filteredApps = applications.filter(a => {
        const matchesStage = activeStage === 'ALL' || a.status === activeStage;
        const name = `${a.jobSeeker?.firstName} ${a.jobSeeker?.lastName}`.toLowerCase();
        const email = (a.jobSeeker?.email || '').toLowerCase();
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
        return matchesStage && matchesSearch;
    });

    if (!selectedJob) {
        return <JobSelector jobs={jobs} onSelect={fetchApplications} loading={loadingJobs} error={error} />;
    }

    return (
        <div className="max-w-[1600px] mx-auto relative z-10 pb-20">
            {/* Top Bar: Back + Job Info */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="hp-card p-6 mb-8 border-l-4 border-l-[var(--hp-accent)] shadow-sm"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-sm">💼</span>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--hp-text)] tracking-tight leading-none mb-1">
                                    {selectedJob.title}
                                </h2>
                                <p className="text-sm font-medium text-[var(--hp-muted)] uppercase tracking-[0.2em] opacity-70">
                                    {selectedJob.location} • {selectedJob.type}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--hp-surface-alt)] border border-[var(--hp-border)]">
                                <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
                                <span className="text-xs font-bold text-[var(--hp-text-sub)]">
                                    {applications.length} TOTAL APPLICATIONS
                                </span>
                            </div>
                            <button 
                                onClick={() => setShowJobDetail(!showJobDetail)}
                                className="text-xs font-bold text-[var(--hp-accent)] hover:underline flex items-center gap-1 transition-all"
                            >
                                {showJobDetail ? 'CLOSE DETAILS —' : 'VIEW JOB DETAILS +'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--hp-border)]">
                        <button
                            onClick={() => fetchApplications(selectedJob)}
                            className="p-3 rounded-xl hover:bg-[var(--hp-surface-alt)] border border-transparent hover:border-[var(--hp-border)] transition-all group"
                        >
                            <svg className={`w-5 h-5 text-[var(--hp-muted)] ${loadingApps ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setSelectedJob(null)}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-[var(--hp-border)] hover:bg-[var(--hp-surface-alt)] hover:border-[var(--hp-accent)] text-[var(--hp-muted)] hover:text-[var(--hp-accent)]"
                        >
                            ✕ Switch Job
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showJobDetail && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-8" style={{ borderColor: 'var(--hp-border)' }}>
                                <div>
                                    <h4 className="font-bold text-xs text-[var(--hp-muted)] mb-3 uppercase tracking-widest">Description</h4>
                                    <div className="prose prose-sm max-w-none text-sm leading-relaxed" style={{ color: 'var(--hp-text-sub)' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedJob.description}</ReactMarkdown>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-[var(--hp-muted)] mb-3 uppercase tracking-widest">Requirements</h4>
                                    <div className="prose prose-sm max-w-none text-sm leading-relaxed" style={{ color: 'var(--hp-text-sub)' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedJob.requirements}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="flex flex-col lg:flex-row items-stretch gap-8">
                <PipelineSidebar 
                    activeStage={activeStage} 
                    onStageChange={setActiveStage} 
                    stageCounts={stageCounts} 
                    applications={applications} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div className="flex-1 min-w-0">
                    {loadingApps ? (
                        <div className="hp-card p-12 text-center flex flex-col items-center">
                            <div className="w-8 h-8 animate-spin border-4 border-[var(--hp-accent)] border-t-transparent rounded-full mb-4"></div>
                            <p className="font-bold text-[var(--hp-muted)]">Loading applications...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="hp-card p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                <span className="text-3xl">📥</span>
                            </div>
                            <p className="text-[var(--hp-text)] font-bold text-lg mb-1">No Applications Yet</p>
                            <p className="text-[var(--hp-muted)] text-sm">Candidates haven't applied to this job posting yet.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {viewMode === 'board' ? (
                                <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <HiringKanban applications={applications} onStatusUpdate={handleUpdateStatus} onSelectApp={setSelectedApp} />
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-1 gap-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight flex items-center gap-2">
                                                <span className="text-2xl">{PIPELINE_STAGES.find(s => s.key === activeStage)?.icon}</span>
                                                {PIPELINE_STAGES.find(s => s.key === activeStage)?.label}
                                            </h3>
                                            <span className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', borderColor: 'var(--hp-border)' }}>
                                                {filteredApps.length} Candidate{filteredApps.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <div className="relative group">
                                                <input 
                                                    type="text" placeholder="Search candidates..." value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-[var(--hp-accent)]/20"
                                                    style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)', color: 'var(--hp-text)' }}
                                                />
                                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>

                                            {filteredApps.length > 0 && (
                                                <button onClick={handleSmartSelect} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border" style={{ color: 'var(--hp-accent)', background: 'rgba(var(--hp-accent-rgb), 0.08)', borderColor: 'rgba(var(--hp-accent-rgb), 0.2)' }}>
                                                    ✨ Select Page
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {filteredApps.length === 0 ? (
                                        <div className="hp-card p-12 text-center border-dashed">
                                            <p className="text-[var(--hp-muted)] font-bold">No candidates in this stage yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <AnimatePresence mode="popLayout">
                                                {filteredApps.map((app) => (
                                                    <ApplicationCard
                                                        key={app.id} app={app} selectedJob={selectedJob} selectedApp={selectedApp}
                                                        setSelectedApp={setSelectedApp} selectedIds={selectedIds} toggleSelect={toggleSelect}
                                                        handleUpdateStatus={handleUpdateStatus} updatingId={updatingId}
                                                        statusStyles={statusStyles} statusIcons={statusIcons}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <BulkActionsToolbar 
                selectedCount={selectedIds.size} 
                onBulkUpdate={handleBulkUpdate} 
                onCancel={() => setSelectedIds(new Set())} 
                isUpdating={isBulkUpdating}
            />
        </div>
    );
}