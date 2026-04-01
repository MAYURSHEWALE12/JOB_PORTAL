import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    BarChart3, Bell, Bookmark, Briefcase, Building2, FileText, House,
    LogOut, Menu, MessageSquare, Plus, Search, Shield, Sparkles, Target, User, Users, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import ThemeToggle from '../ThemeToggle';
import JobSearch from '../Jobs/JobSearch';
import PostJob from '../Jobs/PostJob';
import ManageJobs from '../Jobs/ManageJobs';
import SavedJobs from '../Jobs/SavedJobs';
import MyApplications from '../Applications/MyApplications';
import ViewApplications from '../Applications/ViewApplications';
import ProfilePage from '../Profile/ProfilePage';
import Overview from './Overview';
import EmployerATS from './EmployerATS';
import ResumeAnalyzer from '../Resume/ResumeAnalyzer';
import AdminPanel from '../Admin/AdminPanel';
import Analytics from './Analytics';
import Messaging from '../Messages/Messaging';
import BrowseCompanies from '../Companies/BrowseCompanies';
import EditCompanyProfile from '../Companies/EditCompanyProfile';
import JobAlerts from '../JobAlerts/JobAlerts';
import Footer from '../Footer';
import useTabOverflow from './useTabOverflow';
import useUnreadMessages, { NotificationDropdown } from './useUnreadMessages.jsx';

const DEFAULT_TAB = 'search';
const TAB_BUTTON_BASE = 'inline-flex flex-none items-center justify-center gap-2 px-4 py-3 font-black uppercase tracking-widest text-[10px] sm:text-xs border-[3px] transition-all whitespace-nowrap';
const ACTIVE_TAB_STYLE = 'bg-orange-500 text-stone-900 border-stone-900 shadow-[3px_3px_0_#1c1917]';
const INACTIVE_TAB_STYLE = 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5';

const TAB_CONFIG = [
    { key: 'overview',    icon: House,        label: 'Overview',     roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'search',      icon: Search,       label: 'Find Jobs',    roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'messages',    icon: MessageSquare, label: 'Messages',    roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'ats',         icon: Target,       label: 'Board (ATS)',  roles: ['EMPLOYER'] },
    { key: 'analyzer',    icon: Sparkles,     label: 'Career AI',    roles: ['JOBSEEKER'] },
    { key: 'applications', icon: FileText,    label: 'Applications', roles: ['JOBSEEKER'] },
    { key: 'viewapps',    icon: Users,        label: 'Applicants',   roles: ['EMPLOYER'] },
    { key: 'profile',     icon: User,         label: 'Profile',      roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'saved',       icon: Bookmark,     label: 'Saved Jobs',   roles: ['JOBSEEKER'] },
    { key: 'resume',      icon: FileText,     label: 'Resume Builder', roles: ['JOBSEEKER'] },
    { key: 'alerts',      icon: Bell,         label: 'Job Alerts',   roles: ['JOBSEEKER'] },
    { key: 'analytics',   icon: BarChart3,    label: 'Analytics',    roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'postjob',     icon: Plus,         label: 'Post Job',     roles: ['EMPLOYER'] },
    { key: 'managejobs',  icon: Briefcase,    label: 'Manage Jobs',  roles: ['EMPLOYER'] },
    { key: 'editcompany', icon: Building2,    label: 'My Company',   roles: ['EMPLOYER'] },
    { key: 'browsecom',   icon: Building2,    label: 'Companies',    roles: ['JOBSEEKER', 'EMPLOYER', 'ADMIN'] },
    { key: 'admin',       icon: Shield,       label: 'Admin',        roles: ['ADMIN'] },
];

const TAB_CONTENT = {
    overview:     Overview,
    search:       JobSearch,
    ats:          EmployerATS,
    analyzer:     ResumeAnalyzer,
    saved:        SavedJobs,
    applications: MyApplications,
    analytics:    Analytics,
    messages:     Messaging,
    postjob:      PostJob,
    managejobs:   ManageJobs,
    editcompany:  EditCompanyProfile,
    browsecom:    BrowseCompanies,
    viewapps:     ViewApplications,
    admin:        AdminPanel,
    profile:      ProfilePage,
    alerts:       JobAlerts,
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, logout } = useAuthStore();
    const { connect, disconnect } = useNotificationStore();
    const { unreadCount, fetchUnreadCount } = useUnreadMessages(user);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            connect(user.id);
            fetchUnreadCount();
        }
        return () => disconnect();
    }, [user?.id]);

    const tabs = TAB_CONFIG.filter((tab) => tab.roles.includes(user?.role));

    const requestedTab = searchParams.get('tab');
    const requestedTabExists = tabs.some((tab) => tab.key === requestedTab && tab.key !== 'resume');
    const activeTab = requestedTabExists
        ? requestedTab
        : (tabs.find((tab) => tab.key === DEFAULT_TAB)?.key ?? tabs[0]?.key ?? 'overview');

    const navTabs = tabs.filter((tab) => tab.key !== 'profile');
    const tabSignature = navTabs.map((tab) => `${tab.key}:${tab.badge ?? ''}`).join('|');

    useEffect(() => {
        if (!tabs.length || requestedTab === activeTab) return;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', activeTab);
        setSearchParams(nextParams, { replace: true });
    }, [activeTab, requestedTab, searchParams, setSearchParams, tabs.length]);

    const { visibleTabKeys, overflowTabKeys, tabBarRef, tabMeasureRefs, moreMeasureRef } =
        useTabOverflow(navTabs, tabSignature);

    useEffect(() => {
        if (!overflowTabKeys.includes(activeTab) && !isMoreMenuOpen) return;
        setIsMoreMenuOpen(false);
    }, [activeTab, overflowTabKeys]);

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    const handleTabChange = (key) => {
        if (key === 'resume') {
            navigate('/resume-builder');
            return;
        }
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', key);
        setSearchParams(nextParams);
        setIsMoreMenuOpen(false);
        if (key === 'messages') fetchUnreadCount();
    };

    const activeTabLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? 'Dashboard';
    const visibleTabs = navTabs.filter((tab) => visibleTabKeys.includes(tab.key));
    const overflowTabs = navTabs.filter((tab) => overflowTabKeys.includes(tab.key));
    const isMoreActive = overflowTabs.some((tab) => tab.key === activeTab);

    const ActiveTabContent = TAB_CONTENT[activeTab] ?? Overview;

    return (
        <div className="min-h-screen bg-orange-50/50 dark:bg-stone-950 transition-colors duration-500 flex flex-col">
            <nav className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b-[3px] border-stone-900 dark:border-stone-700 shadow-md dark:shadow-none">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent">Job Portal</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-stone-400 mt-1">{activeTabLabel}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center px-3 py-2 border-[2px] border-stone-900 dark:border-stone-700 bg-orange-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-black text-xs uppercase tracking-widest">
                            Welcome, {user?.firstName || 'User'}
                        </div>
                        <button
                            type="button"
                            onClick={() => handleTabChange('profile')}
                            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-black border-[2px] uppercase tracking-widest transition-all ${
                                activeTab === 'profile'
                                    ? 'bg-orange-500 text-stone-900 border-stone-900 shadow-[2px_2px_0_#1c1917]'
                                    : 'bg-orange-200 text-orange-900 border-stone-900 dark:bg-orange-900/50 dark:text-orange-300 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5'
                            }`}
                        >
                            <User size={16} />
                            <span>Profile</span>
                        </button>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => handleTabChange('messages')}
                                className="relative inline-flex items-center justify-center w-11 h-11 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]"
                                aria-label="Open messages"
                            >
                                <MessageSquare size={18} />
                                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1 flex items-center justify-center border-[2px] border-stone-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </button>
                        )}

                        <NotificationDropdown />

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="neo-btn inline-flex items-center gap-2 bg-white hover:bg-rose-50 dark:bg-stone-800 dark:border-stone-700 text-stone-900 dark:text-gray-100 px-4 py-2"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b-[3px] border-stone-900 dark:border-stone-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 relative">
                    <div className="absolute inset-0 invisible pointer-events-none h-0 overflow-hidden" aria-hidden="true">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {navTabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={`measure-${tab.key}`}
                                        ref={(node) => { if (node) tabMeasureRefs.current[tab.key] = node; }}
                                        type="button"
                                        className={`${TAB_BUTTON_BASE} ${INACTIVE_TAB_STYLE}`}
                                    >
                                        <Icon size={16} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                            <button ref={moreMeasureRef} type="button" className={`${TAB_BUTTON_BASE} ${INACTIVE_TAB_STYLE}`}>
                                <Menu size={16} />
                                <span>More</span>
                            </button>
                        </div>
                    </div>

                    <div ref={tabBarRef} className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {visibleTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`${TAB_BUTTON_BASE} ${isActive ? ACTIVE_TAB_STYLE : INACTIVE_TAB_STYLE}`}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}

                        {overflowTabs.length > 0 && (
                            <div className="relative flex-none">
                                <button
                                    type="button"
                                    onClick={() => setIsMoreMenuOpen((c) => !c)}
                                    className={`${TAB_BUTTON_BASE} ${isMoreMenuOpen || isMoreActive ? ACTIVE_TAB_STYLE : INACTIVE_TAB_STYLE}`}
                                    aria-expanded={isMoreMenuOpen}
                                    aria-label="Open more navigation items"
                                >
                                    {isMoreMenuOpen ? <X size={16} /> : <Menu size={16} />}
                                    <span>More</span>
                                </button>

                                {isMoreMenuOpen && (
                                    <div className="absolute top-full right-0 mt-3 z-50 w-[min(20rem,calc(100vw-2rem))] bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-2">
                                        {overflowTabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.key;
                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => handleTabChange(tab.key)}
                                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left font-black uppercase tracking-widest text-xs border-[2px] mb-2 last:mb-0 transition-all ${
                                                        isActive
                                                            ? 'bg-orange-500 text-stone-900 border-stone-900'
                                                            : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-gray-100 border-transparent hover:border-stone-900 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                                                    }`}
                                                >
                                                    <span className="inline-flex items-center gap-3">
                                                        <Icon size={16} />
                                                        <span>{tab.label}</span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-4 sm:py-8">
                <div className="max-w-6xl mx-auto animate-fade-in-up" key={activeTab}>
                    {activeTab === 'messages' ? (
                        <ActiveTabContent setActiveTab={handleTabChange} chatWith={searchParams.get('chatWith')} />
                    ) : (
                        <ActiveTabContent setActiveTab={handleTabChange} />
                    )}
                </div>
                <div className="mt-12">
                    <Footer />
                </div>
            </div>
        </div>
    );
}
