import { useState, useEffect } from 'react';
import { applicationAPI, resumeAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ApplicationCard from './ApplicationCard';
import Loader from '../Loader';
import ResumePreviewWindow from '../Resume/ResumePreviewWindow';
import { 
    Info, Kanban, RefreshCw, ChevronRight, 
    Clock, Search, CheckCircle2, UserCheck, 
    Send, Archive, AlertCircle, Layout
} from 'lucide-react';

export default function EmployerATS() {
    const { user } = useAuthStore();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('PENDING');

    // --- Resume Preview Window State ---
    const [previewData, setPreviewData] = useState(null);

    useEffect(() => {
        fetchApplications();
        return () => {
            if (previewData?.url) window.URL.revokeObjectURL(previewData.url);
        };
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await applicationAPI.getEmployerApplications(user.id, 0, 1000);
            setApplications(res.data?.content ?? []);
        } catch (err) {
            setError('Failed to load recruitment pipeline.');
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async (applicationId, newStatus) => {
        try {
            await applicationAPI.updateStatus(applicationId, user.id, newStatus);
            fetchApplications();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update stage.';
            alert(`Error: ${errorMsg}`);
        }
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

    const handleClosePreview = () => {
        if (previewData?.url) window.URL.revokeObjectURL(previewData.url);
        setPreviewData(null);
    };

    if (loading) return <Loader text="Synchronizing Pipeline..." />;

    const navigation = [
        { title: 'New Leads', status: 'PENDING', icon: Clock, color: 'text-amber-500' },
        { title: 'Screening', status: 'REVIEWED', icon: Search, color: 'text-blue-500' },
        { title: 'Shortlisted', status: 'SHORTLISTED', icon: UserCheck, color: 'text-orange-500' },
        { title: 'Interviews', status: 'INTERVIEWING', icon: Layout, color: 'text-purple-500' },
        { title: 'Offers', status: 'OFFERED', icon: Send, color: 'text-emerald-500' },
        { title: 'Hired', status: 'ACCEPTED', icon: CheckCircle2, color: 'text-green-600' },
        { title: 'Archive', status: 'REJECTED', icon: Archive, color: 'text-stone-400' }
    ];

    const filteredApps = applications.filter(app => app.status === activeTab);
    const activeLabel = navigation.find(n => n.status === activeTab)?.title;

    return (
        <div className="flex flex-col h-full max-w-[1600px] mx-auto p-4 md:p-8">
            {/* Header / Stats Overlay */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-orange-500 border-[3px] border-stone-900 flex items-center justify-center transform -rotate-12 shadow-[4px_4px_0_#000]">
                            <Kanban size={20} className="text-stone-900" />
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-white flex items-center gap-3">
                            ATS Board
                            <span className="text-xs bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-3 py-1 border-[2px] border-stone-900 font-bold tracking-widest mt-2 block md:inline shadow-[2px_2px_0_#ea580c]">PRO</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 p-4 shadow-[6px_6px_0_#000] flex gap-8 items-center h-[72px]">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Pipeline</p>
                            <p className="text-2xl font-black text-stone-900 dark:text-white">{applications.length}</p>
                        </div>
                        <div className="w-[2px] h-8 bg-stone-200 dark:bg-stone-700" />
                        <div className="text-center pr-2">
                            <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Active Stage</p>
                            <p className="text-2xl font-black text-orange-500">{filteredApps.length}</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchApplications}
                        className="bg-stone-900 text-white p-[21px] border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        title="Refresh Pipeline"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
            </div>

            {/* Side-Nav Workspace Layout */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[600px]">
                
                {/* Left Sidebar Navigation */}
                <div className="w-full lg:w-72 flex-shrink-0 animate-neo-slide-left">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 shadow-[8px_8px_0_#000] sticky top-24">
                        <div className="p-5 border-b-[4px] border-stone-900 bg-stone-900 text-white flex items-center justify-between">
                            <h3 className="font-black uppercase text-xs tracking-widest">Recruitment Stages</h3>
                            <ChevronRight size={14} className="text-orange-500" />
                        </div>
                        <div className="py-2">
                            {navigation.map((item) => {
                                const count = applications.filter(a => a.status === item.status).length;
                                return (
                                    <button
                                        key={item.status}
                                        onClick={() => setActiveTab(item.status)}
                                        className={`w-full flex items-center justify-between p-4 px-6 transition-all border-b-[2px] last:border-0 border-stone-100 dark:border-stone-700
                                            ${activeTab === item.status 
                                                ? 'bg-orange-500 text-stone-900 border-l-[8px] border-l-stone-900 font-black' 
                                                : 'hover:bg-stone-50 dark:hover:bg-stone-900/50 text-stone-500 font-bold'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon size={18} className={activeTab === item.status ? 'text-stone-900' : item.color} />
                                            <span className="uppercase text-[11px] tracking-widest">{item.title}</span>
                                        </div>
                                        <div className={`px-2 py-0.5 text-[10px] border-[2px] transition-colors
                                            ${activeTab === item.status 
                                                ? 'bg-stone-900 text-white border-stone-900' 
                                                : 'bg-stone-100 dark:bg-stone-700 border-stone-200 dark:border-stone-600'}`}>
                                            {count}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 border-[3px] border-stone-900 shadow-[6px_6px_0_#000] animate-neo-pop">
                        <Info size={20} className="text-blue-500 mb-2" />
                        <p className="text-[10px] font-black uppercase leading-relaxed tracking-widest text-stone-600 dark:text-stone-300">
                            Pro-tip: Filter by stage to focus on specific candidate review tasks.
                        </p>
                    </div>
                </div>

                {/* Main Content Area (Applications Grid) */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-6 mb-8 shadow-[8px_8px_0_#ea580c] flex items-center justify-between">
                        <div className="flex items-center gap-4 text-stone-900 dark:text-white">
                            <div className="w-8 h-8 rounded-full border-[3px] border-stone-900 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 font-black">
                                {navigation.findIndex(n => n.status === activeTab) + 1}
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{activeLabel}</h3>
                        </div>
                        <div className="text-[10px] font-black uppercase text-stone-400 bg-stone-50 dark:bg-stone-900 px-4 py-2 border-[2px] border-stone-200 dark:border-stone-700">
                            {filteredApps.length} Candidates in this phase
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-max">
                        {filteredApps.length === 0 ? (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center neo-card border-dashed border-[4px] opacity-40 grayscale">
                                <AlertCircle size={48} className="mb-4 text-stone-400" />
                                <p className="font-black uppercase tracking-[0.2em] text-sm">No applications in this stage</p>
                                <p className="text-[10px] font-bold uppercase mt-2">Move candidates here to start screening</p>
                            </div>
                        ) : (
                            filteredApps.map(app => (
                                <div key={app.id} className="animate-neo-slide-up">
                                    <ApplicationCard 
                                        application={app} 
                                        onMove={handleMove}
                                        onPreview={handleOpenPreview}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Resume Preview Window */}
            <ResumePreviewWindow 
                previewData={previewData}
                onClose={handleClosePreview}
                onDownload={handleDownloadResume}
            />
        </div>
    );
}
