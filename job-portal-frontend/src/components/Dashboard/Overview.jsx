import { useEffect, useState } from 'react';
import {
    Activity,
    Briefcase,
    ChevronRight,
    Database,
    FileText,
    MessageSquare,
    Search,
    ShieldAlert,
    Terminal,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { applicationAPI, jobAPI, messageAPI, savedJobAPI } from '../../services/api';
import Loader from '../Loader';

const formatCountLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
const formatStatus = (value) => value?.replace(/_/g, ' ') ?? 'PENDING';
const getLogBadgeClass = (type) => {
    if (type === 'ALERT') {
        return 'bg-orange-500 text-stone-900';
    }

    if (type === 'DATA') {
        return 'bg-stone-100 text-stone-900';
    }

    return 'bg-stone-700 text-white';
};

export default function Overview({ setActiveTab }) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        primary: 0,
        secondary: 0,
        messages: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchOverviewData();
    }, [user?.id]);

    const fetchOverviewData = async () => {
        if (!user) return;

        setLoading(true);

        try {
            const unreadRes = await messageAPI.getUnreadCount(user.id);
            const messages = unreadRes.data.unreadCount || 0;

            if (user.role === 'JOBSEEKER') {
                const [appsRes, savedRes] = await Promise.all([
                    applicationAPI.getMyApplications(user.id),
                    savedJobAPI.getSaved(user.id),
                ]);

                const apps = Array.isArray(appsRes.data) ? appsRes.data : (appsRes.data?.content || []);
                const saved = Array.isArray(savedRes.data) ? savedRes.data : (savedRes.data?.content || []);

                setStats({
                    primary: apps.length,
                    secondary: saved.length,
                    messages,
                });

                const activity = [
                    {
                        type: 'SYSTEM',
                        msg: 'Dashboard synced successfully. Your latest account activity is ready.',
                        time: 'Just now',
                        icon: Terminal,
                    },
                    {
                        type: 'DATA',
                        msg: `Tracking ${formatCountLabel(apps.length, 'application', 'applications')} and ${formatCountLabel(saved.length, 'saved job', 'saved jobs')}.`,
                        time: '2m ago',
                        icon: Database,
                    },
                ];

                if (apps.length > 0) {
                    const topApp = apps[0];
                    activity.push({
                        type: 'ALERT',
                        msg: `Latest update: "${topApp.job?.title ?? 'Recent role'}" is ${formatStatus(topApp.status)}.`,
                        time: '15m ago',
                        icon: Zap,
                    });
                } else {
                    activity.push({
                        type: 'ALERT',
                        msg: 'Start a new search to build your application pipeline.',
                        time: '1h ago',
                        icon: Zap,
                    });
                }

                setRecentActivity(activity);
            } else if (user.role === 'EMPLOYER') {
                const jobsRes = await jobAPI.getJobsByEmployer(user.id);
                const myJobs = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data?.content || []);

                const appsPromises = myJobs.map((job) =>
                    applicationAPI.getJobApplications(job.id, user.id)
                        .then((res) => Array.isArray(res.data) ? res.data : (res.data?.content || []))
                        .catch(() => [])
                );
                const appsArrays = await Promise.all(appsPromises);
                const totalApps = appsArrays.flat().length;

                setStats({
                    primary: myJobs.length,
                    secondary: totalApps,
                    messages,
                });

                const activity = [
                    {
                        type: 'SYSTEM',
                        msg: 'Dashboard synced successfully. Hiring activity is up to date.',
                        time: 'Just now',
                        icon: Terminal,
                    },
                    {
                        type: 'DATA',
                        msg: `Tracking ${formatCountLabel(myJobs.length, 'posted job', 'posted jobs')} and ${formatCountLabel(totalApps, 'applicant', 'applicants')}.`,
                        time: '2m ago',
                        icon: Database,
                    },
                ];

                if (totalApps > 0) {
                    activity.push({
                        type: 'ALERT',
                        msg: `${formatCountLabel(totalApps, 'applicant is', 'applicants are')} waiting for review across your roles.`,
                        time: '15m ago',
                        icon: Zap,
                    });
                } else {
                    activity.push({
                        type: 'ALERT',
                        msg: 'Post a role or refresh your listings to bring in more applicants.',
                        time: '1h ago',
                        icon: Zap,
                    });
                }

                setRecentActivity(activity);
            } else {
                setStats({
                    primary: 0,
                    secondary: 0,
                    messages,
                });
                setRecentActivity([
                    {
                        type: 'SYSTEM',
                        msg: 'Dashboard synced successfully. Admin tools are ready.',
                        time: 'Just now',
                        icon: Terminal,
                    },
                    {
                        type: 'DATA',
                        msg: 'Use the admin panel to review platform activity and moderation tasks.',
                        time: '2m ago',
                        icon: Database,
                    },
                ]);
            }
        } catch (err) {
            console.error('Failed to load overview data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader text="Loading overview..." />
            </div>
        );
    }

    const quickActions = user?.role === 'JOBSEEKER'
        ? [
            { label: 'Search Jobs', icon: Search, tab: 'search', tone: 'primary' },
            { label: 'Resume Builder', icon: FileText, tab: 'resume', tone: 'secondary' },
            { label: 'Applications', icon: Briefcase, tab: 'applications', tone: 'secondary' },
        ]
        : user?.role === 'EMPLOYER'
            ? [
                { label: 'Manage Jobs', icon: Briefcase, tab: 'managejobs', tone: 'primary' },
                { label: 'Applicants', icon: Activity, tab: 'viewapps', tone: 'secondary' },
                { label: 'Company Profile', icon: FileText, tab: 'editcompany', tone: 'secondary' },
            ]
            : [
                { label: 'Admin Panel', icon: ShieldAlert, tab: 'admin', tone: 'primary' },
                { label: 'Analytics', icon: TrendingUp, tab: 'analytics', tone: 'secondary' },
                { label: 'Messages', icon: MessageSquare, tab: 'messages', tone: 'secondary' },
            ];

    const progressValue = user?.role === 'JOBSEEKER' ? 85 : user?.role === 'EMPLOYER' ? 88 : 80;
    const progressMessage = user?.role === 'JOBSEEKER'
        ? 'Keep your resume current and continue applying to improve response rates.'
        : user?.role === 'EMPLOYER'
            ? 'Keep listings updated and review applicants quickly to maintain hiring momentum.'
            : 'Stay on top of platform reviews and messages to keep the workspace healthy.';

    const StatCard = ({ label, value, icon: Icon, subText }) => (
        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 p-8 shadow-[12px_12px_0_#000] relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-3 bg-orange-500" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 bg-orange-100 border-[3px] border-stone-900 flex items-center justify-center">
                        <Icon className="text-stone-900" size={26} />
                    </div>
                    <span className="text-[10px] font-black uppercase bg-stone-900 text-white px-2 py-0.5 tracking-widest">
                        Live Sync
                    </span>
                </div>
                <h4 className="text-5xl font-black text-stone-900 dark:text-white mb-2 tracking-tighter">{value}</h4>
                <p className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-300">{label}</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase mt-2">{subText}</p>
            </div>
        </div>
    );

    return (
        <div className="animate-neo-thump pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <StatCard
                    label={user?.role === 'JOBSEEKER' ? 'Active Applications' : 'Posted Positions'}
                    value={stats.primary}
                    icon={Briefcase}
                    subText="Verified and synchronized"
                />
                <StatCard
                    label={user?.role === 'JOBSEEKER' ? 'Saved Opportunities' : 'Total Applicants'}
                    value={stats.secondary}
                    icon={Activity}
                    subText="Live platform snapshot"
                />
                <StatCard
                    label="Private Messages"
                    value={stats.messages}
                    icon={MessageSquare}
                    subText="Unread conversations"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-stone-900 text-stone-100 border-[4px] border-stone-900 shadow-[16px_16px_0_#000] p-8 h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-[2px] border-stone-700 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-500 border-[3px] border-stone-900 flex items-center justify-center">
                                    <Activity className="text-stone-900" size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-widest text-sm text-white">Recent Activity</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-400 mt-1">
                                        Latest account updates
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase text-stone-300 tracking-[0.22em]">Live Status</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {recentActivity.map((log, index) => (
                                <div key={index} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 bg-white/5 border-[2px] border-stone-700 flex items-center justify-center group-hover:border-orange-500 transition-colors">
                                            <log.icon size={18} className="text-orange-300" />
                                        </div>
                                        {index !== recentActivity.length - 1 && <div className="w-[2px] h-full bg-stone-700 mt-2" />}
                                    </div>
                                    <div className="pb-6">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase ${getLogBadgeClass(log.type)}`}>
                                                {log.type}
                                            </span>
                                            <span className="text-[10px] text-stone-500 font-bold">{log.time}</span>
                                        </div>
                                        <p className="font-bold text-sm tracking-tight text-stone-200">
                                            {log.msg}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveTab('analytics')}
                            className="w-full mt-6 py-4 border-[3px] border-orange-500 text-orange-400 font-black uppercase text-[10px] tracking-[0.24em] hover:bg-orange-500 hover:text-stone-900 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Open Analytics</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 p-8 shadow-[8px_8px_0_#ea580c]">
                        <h3 className="font-black uppercase tracking-tighter text-xl mb-6 border-b-[4px] border-orange-500 inline-block text-stone-900 dark:text-white">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => setActiveTab(action.tab)}
                                    className={`w-full p-4 flex items-center justify-between font-black uppercase text-xs tracking-widest transition-all shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                                        action.tone === 'primary'
                                            ? 'bg-orange-500 text-stone-900 border-[3px] border-stone-900'
                                            : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border-[3px] border-stone-900 dark:border-stone-700 hover:border-orange-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon size={18} />
                                        <span>{action.label}</span>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 p-8 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-orange-500" />
                            <h4 className="font-black uppercase text-xs text-stone-900 dark:text-white">Progress Snapshot</h4>
                        </div>
                        <div className="w-full h-8 bg-stone-100 dark:bg-stone-900 border-[3px] border-stone-900 flex p-1">
                            <div className="h-full bg-orange-500 border-r-[2px] border-stone-900" style={{ width: `${progressValue}%` }} />
                        </div>
                        <p className="text-[10px] font-black mt-3 uppercase tracking-tight leading-tight text-stone-600 dark:text-stone-300">
                            {progressMessage}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 p-6 flex gap-4 items-start shadow-[8px_8px_0_#ea580c]">
                        <ShieldAlert className="text-orange-500 shrink-0" size={24} />
                        <div>
                            <p className="text-[10px] font-black text-stone-500 uppercase mb-1 tracking-[0.24em]">Security Notice</p>
                            <p className="text-xs font-bold text-stone-900 dark:text-white uppercase leading-tight">
                                We recommend updating your password regularly to keep your account secure.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
