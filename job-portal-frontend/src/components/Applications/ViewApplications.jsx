import { useState, useEffect } from 'react';
import { jobAPI, applicationAPI, resumeAPI, quizAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';
import UserAvatar from '../UserAvatar';
import ResumePreviewWindow from '../Resume/ResumePreviewWindow';
import { 
    FileText, Download, User as UserIcon, Mail, Phone, 
    Calendar as CalendarIcon, Briefcase, MapPin, Eye, X, Minimize2, 
    Maximize2, GripHorizontal, BarChart2, Star
} from 'lucide-react';

const statusStyles = {
    PENDING:     'bg-amber-100 text-amber-900 border-amber-900 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    REVIEWED:    'bg-blue-100 text-blue-900 border-blue-900 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    SHORTLISTED: 'bg-orange-100 text-orange-900 border-orange-900 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    ACCEPTED:    'bg-emerald-100 text-emerald-900 border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    REJECTED:    'bg-rose-100 text-rose-900 border-rose-900 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700',
    WITHDRAWN:   'bg-stone-100 text-stone-500 border-stone-300 dark:bg-stone-800 dark:text-stone-500 dark:border-stone-700',
};

export default function ViewApplications() {
    const { user } = useAuthStore();

    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingApps, setLoadingApps] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedQuizResult, setSelectedQuizResult] = useState(null);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    // --- Resume Preview Window State ---
    const [previewData, setPreviewData] = useState(null); // { id, name, url }

    useEffect(() => {
        fetchMyJobs();
        return () => {
            if (previewData?.url) window.URL.revokeObjectURL(previewData.url);
        };
    }, []);

    useEffect(() => {
        if (selectedApp) {
            fetchQuizResult(selectedApp.id);
        } else {
            setSelectedQuizResult(null);
        }
    }, [selectedApp]);

    const fetchQuizResult = async (applicationId) => {
        try {
            const res = await quizAPI.getResult(applicationId);
            setSelectedQuizResult(res.data);
        } catch (err) {
            setSelectedQuizResult(null);
        }
    };

    const fetchMyJobs = async () => {
        setLoadingJobs(true);
        setError('');
        try {
            const res = await jobAPI.getJobsByEmployer(user.id);
            const data = Array.isArray(res.data) ? res.data : [];
            setJobs(data);
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs.');
        } finally {
            setLoadingJobs(false);
        }
    };

    const fetchApplications = async (job, page = 0) => {
        setSelectedJob(job);
        setSelectedApp(null);
        setApplications([]);
        setLoadingApps(true);
        try {
            const res = await applicationAPI.getJobApplications(job.id, user.id, page, PAGE_SIZE);
            const data = res.data?.content ?? [];
            setApplications(data);
            setTotalPages(res.data?.totalPages ?? 0);
            setTotalElements(res.data?.totalElements ?? 0);
            setCurrentPage(res.data?.page ?? 0);
        } catch (err) {
            console.error('Failed to load applications:', err);
            setError('Failed to load applications.');
        } finally {
            setLoadingApps(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        setSelectedApp(null);
        fetchApplications(selectedJob, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenPreview = async (resumeId, resumeName) => {
        if (!resumeId) return;
        try {
            if (previewData?.id === resumeId) return;
            if (previewData?.url) window.URL.revokeObjectURL(previewData.url);

            const res = await resumeAPI.download(resumeId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            setPreviewData({ id: resumeId, name: resumeName, url });
        } catch (err) {
            console.error('Failed to load preview:', err);
            alert('Failed to load resume preview.');
        }
    };

    const handleDownloadResume = async (resumeId, resumeName) => {
        if (!resumeId) return;
        try {
            const res = await resumeAPI.download(resumeId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${resumeName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download resume.');
        }
    };

    const handleUpdateStatus = async (applicationId, newStatus) => {
        setUpdatingId(applicationId);
        try {
            await applicationAPI.updateStatus(applicationId, user.id, newStatus);
            setApplications(prev =>
                prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
            );
            if (selectedApp?.id === applicationId) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleClosePreview = () => {
        if (previewData?.url) window.URL.revokeObjectURL(previewData.url);
        setPreviewData(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'PENDING').length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    };

    return (
        <div className="max-w-7xl mx-auto relative min-h-[600px]">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-stone-100">
                    📨 Applications Received
                </h2>
                <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-xs mt-1">
                    Review and manage canditates for your active postings
                </p>
            </div>

            {error && (
                <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-6 py-4 mb-8 font-black uppercase shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000]">
                    {error}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* ── Jobs List (Left Panel) ─────────────────────────── */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <h3 className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">Your Posted Jobs</h3>
                    
                    {loadingJobs && <Loader text="Fetching positions..." />}
                    
                    {!loadingJobs && jobs.length === 0 && (
                        <div className="neo-card p-8 text-center border-stone-200 dark:border-stone-700">
                            <p className="text-stone-400 font-bold text-xs uppercase">No jobs posted yet.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => fetchApplications(job)}
                                className={`neo-card p-5 cursor-pointer transition-all ${selectedJob?.id === job.id ? 'border-orange-500 shadow-[6px_6px_0_#ea580c] -translate-x-1 -translate-y-1' : 'dark:border-stone-700 hover:border-stone-900'}`}
                            >
                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-base leading-tight uppercase transition-colors">{job.title}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <MapPin size={10} className="text-stone-400" />
                                    <p className="text-stone-400 text-[10px] font-black uppercase">{job.location}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <span className={`text-[9px] px-2 py-0.5 border-[2px] font-black uppercase tracking-widest ${job.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-800' : 'bg-stone-100 text-stone-500 border-stone-300'}`}>
                                        {job.status}
                                    </span>
                                    <span className="text-[10px] text-orange-500 font-black uppercase tracking-tighter hover:translate-x-1 transition-transform">Review →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Applications Panel (Middle) ───────────────────── */}
                <div className="flex-1 min-w-0">
                    {!selectedJob ? (
                        <div className="neo-card p-20 text-center flex flex-col items-center bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-700">
                            <div className="text-7xl mb-6 transform rotate-12 drop-shadow-lg">👈</div>
                            <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2 uppercase tracking-tight">Select a Job</h3>
                            <p className="text-stone-500 font-bold max-w-sm text-sm uppercase tracking-widest">Pick a role from the sidebar to start reviewing incoming applications.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Selected Job Stat Header */}
                            <div className="bg-stone-900 text-white border-[3px] border-stone-900 p-6 flex flex-col sm:flex-row justify-between items-center shadow-[8px_8px_0_#000]">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">{selectedJob.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                                            <MapPin size={12} /> {selectedJob.location}
                                        </div>
                                        <div className="w-1 h-1 bg-stone-700 rounded-full" />
                                        <div className="text-stone-400 text-[10px] font-black uppercase tracking-widest">
                                            Created {formatDate(selectedJob.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 flex gap-6 items-center">
                                    <div className="text-center group">
                                        <span className="text-orange-500 font-black text-4xl block leading-none group-hover:scale-110 transition-transform">
                                            {applications.length}
                                        </span>
                                        <span className="text-stone-400 font-black uppercase text-[10px] tracking-widest">Applicants</span>
                                    </div>
                                </div>
                            </div>

                            {/* Application Cards */}
                            <div className="space-y-4">
                                {loadingApps && <Loader text="Loading candidates..." />}
                                {!loadingApps && applications.length === 0 && (
                                    <div className="neo-card p-16 text-center border-stone-200 dark:border-stone-700">
                                        <div className="text-6xl mb-4 grayscale opacity-50">📭</div>
                                        <p className="text-stone-400 font-black uppercase tracking-widest text-sm">No applications received yet.</p>
                                    </div>
                                )}

                                {!loadingApps && applications.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => setSelectedApp(app)}
                                        className={`neo-card p-6 cursor-pointer bg-white dark:bg-stone-800 transition-all ${selectedApp?.id === app.id ? 'border-orange-500 shadow-[6px_6px_0_#000]' : 'dark:border-stone-700 hover:border-stone-900 group'}`}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div className="flex gap-4 items-center">
                                                <UserAvatar user={app.jobSeeker} size="md" />
                                                <div>
                                                    <h4 className="font-black text-stone-900 dark:text-stone-100 text-xl leading-tight uppercase group-hover:text-orange-600 transition-colors">
                                                        {app.jobSeeker?.firstName} {app.jobSeeker?.lastName}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-stone-500 mt-1">
                                                        <Mail size={12} />
                                                        <span className="text-[11px] font-bold lowercase tracking-wider">{app.jobSeeker?.email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Resume View / Download Buttons */}
                                                {app.selectedResume && (
                                                    <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-900 p-1 border-[2px] border-stone-900">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleOpenPreview(app.selectedResume.id, app.selectedResume.name); }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-stone-900 font-black text-[10px] uppercase hover:bg-orange-600 transition-colors"
                                                        >
                                                            <Eye size={12} /> VIEW
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadResume(app.selectedResume.id, app.selectedResume.name); }}
                                                            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className={`px-4 py-2 border-[2px] font-black uppercase text-[10px] tracking-widest shadow-[3px_3px_0_#000] ${statusStyles[app.status]}`}>
                                                    {app.status}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Candidate Sidebar (Right) ────────────────────── */}
                {selectedApp && (
                    <div className="w-full lg:w-96 flex-shrink-0 animate-neo-thump">
                        <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 p-8 sticky top-24 shadow-[10px_10px_0_#1c1917] flex flex-col gap-8">
                            <div className="flex justify-between items-center bg-stone-900 text-white -m-8 mb-0 p-4 border-b-[3px] border-stone-900">
                                <h3 className="font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500" />
                                    Candidate Details
                                </h3>
                                <button onClick={() => setSelectedApp(null)} className="hover:bg-rose-500 p-1 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="text-center pt-4">
                                <UserAvatar user={selectedApp.jobSeeker} size="xl" className="!bg-orange-500 !border-4 !border-stone-900 dark:!border-stone-700 !text-white !shadow-[6px_6px_0_#000] mx-auto mb-6" />
                                <h4 className="font-black text-stone-900 dark:text-white text-2xl uppercase tracking-tighter leading-none mb-2">
                                    {selectedApp.jobSeeker?.firstName} {selectedApp.jobSeeker?.lastName}
                                </h4>
                                <div className={`inline-block px-4 py-1.5 border-[2px] font-black uppercase text-[10px] tracking-[0.3em] ${statusStyles[selectedApp.status]}`}>
                                    {selectedApp.status}
                                </div>
                            </div>

                            {selectedApp.selectedResume && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleOpenPreview(selectedApp.selectedResume.id, selectedApp.selectedResume.name)}
                                        className="flex-1 bg-stone-900 text-white py-4 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_#ea580c] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#ea580c] transition-all"
                                    >
                                        <Eye size={18} className="text-orange-500" /> VIEW RESUME
                                    </button>
                                    <button 
                                        onClick={() => handleDownloadResume(selectedApp.selectedResume.id, selectedApp.selectedResume.name)}
                                        className="w-14 bg-white dark:bg-stone-700 border-[3px] border-stone-900 flex items-center justify-center group shadow-[4px_4px_0_#000] hover:-translate-y-0.5 transition-all"
                                        title="Download PDF"
                                    >
                                        <Download size={22} className="group-hover:text-orange-500 transition-colors" />
                                    </button>
                                </div>
                            )}

                            {/* Quiz Result Section */}
                            {selectedQuizResult && (
                                <div className={`p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000] flex flex-col gap-2 
                                    ${selectedQuizResult.passed ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-2">
                                            <BarChart2 size={14} /> Quiz Performance
                                        </h4>
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase border-[2px] border-stone-900 
                                            ${selectedQuizResult.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {selectedQuizResult.passed ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-2xl font-black text-stone-900">{selectedQuizResult.score}%</p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase">Score Achieved</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-stone-900">{selectedQuizResult.correctAnswers}/{selectedQuizResult.totalQuestions}</p>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase">Correct</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[11px] font-black uppercase text-stone-400 mb-3 tracking-widest flex items-center gap-2">
                                    <FileText size={14} /> Cover Letter
                                </h4>
                                <div className="text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed font-bold bg-stone-50 dark:bg-stone-900/40 p-6 border-[3px] border-stone-200 dark:border-stone-700 max-h-48 overflow-y-auto">
                                    {selectedApp.coverLetter || 'No cover letter was submitted with this application.'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t-[3px] border-stone-100 dark:border-stone-700">
                                {['REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(selectedApp.id, s)}
                                        disabled={selectedApp.status === s || updatingId === selectedApp.id}
                                        className={`py-3 text-[10px] font-black uppercase tracking-widest border-[2px] border-stone-900 transition-all ${selectedApp.status === s ? 'bg-stone-900 text-white shadow-none' : 'bg-white dark:bg-stone-800 text-stone-500 hover:text-stone-900 hover:border-orange-500 shadow-[3px_3px_0_#000]'}`}
                                    >
                                        {updatingId === selectedApp.id ? '...' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Resume Preview Window ───────────────────────────────── */}
            <ResumePreviewWindow 
                previewData={previewData}
                onClose={handleClosePreview}
                onDownload={handleDownloadResume}
            />
        </div>
    );
}