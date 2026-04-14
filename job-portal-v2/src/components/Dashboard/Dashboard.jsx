import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { messageAPI } from '../../services/api';
import JobSearch from '../Jobs/JobSearch';
import PostJob from '../Jobs/PostJob';
import ManageJobs from '../Jobs/ManageJobs';
import SavedJobs from '../Jobs/SavedJobs';
import MyApplications from '../Applications/MyApplications';
import ViewApplications from '../Applications/ViewApplications';
import ProfilePage from '../Profile/ProfilePage';
import AdminPanel from '../Admin/AdminPanel';
import Analytics from './Analytics';
import Messaging from '../Messages/Messaging';
import Footer from '../Footer';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab]     = useState('search');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    useEffect(() => {
        if (user) fetchUnreadCount();
        const interval = setInterval(() => {
            if (user) fetchUnreadCount();
        }, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const res = await messageAPI.getUnreadCount(user.id);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleTabChange = (key) => {
        if (key === 'resume') {
            navigate('/resume-builder');
            return;
        }
        setActiveTab(key);
        if (key === 'messages') fetchUnreadCount();
    };

    const tabs = [
        { key: 'search',       icon: '🔍', label: 'Find Jobs',         show: true,                       priority: 1 },
        { key: 'messages',     icon: '💬', label: 'Messages',          show: true,                       priority: 2, badge: unreadCount > 0 ? unreadCount : null },
        { key: 'applications', icon: '📋', label: 'Applications',      show: user?.role === 'JOBSEEKER', priority: 3 },
        { key: 'viewapps',     icon: '📨', label: 'Applicants',        show: user?.role === 'EMPLOYER',  priority: 3 },
        { key: 'profile',      icon: '👤', label: 'Profile',           show: true,                       priority: 4 },
        { key: 'saved',        icon: '🔖', label: 'Saved Jobs',        show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'resume',       icon: '📄', label: 'Resume',            show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'analytics',    icon: '📊', label: 'Analytics',         show: true,                       priority: 10 },
        { key: 'postjob',      icon: '➕', label: 'Post Job',          show: user?.role === 'EMPLOYER',  priority: 10 },
        { key: 'managejobs',   icon: '⚙️', label: 'Manage Jobs',       show: user?.role === 'EMPLOYER',  priority: 10 },
        { key: 'admin',        icon: '🛡️', label: 'Admin',             show: user?.role === 'ADMIN',     priority: 10 },
    ].filter(tab => tab.show).sort((a,b) => a.priority - b.priority);

    const primaryTabs = tabs.filter(t => t.priority < 10);
    const secondaryTabs = tabs.filter(t => t.priority >= 10);

    const renderContent = () => {
        switch (activeTab) {
            case 'search': return <JobSearch />;
            case 'saved': return <SavedJobs />;
            case 'applications': return <MyApplications />;
            case 'analytics': return <Analytics />;
            case 'messages': return <Messaging />;
            case 'postjob': return <PostJob />;
            case 'managejobs': return <ManageJobs />;
            case 'viewapps': return <ViewApplications />;
            case 'admin': return <AdminPanel />;
            case 'profile': return <ProfilePage />;
            default: return <JobSearch />;
        }
    };

    return (
        <div className="min-h-screen gradient-warm flex flex-col">
            <nav className="navbar-glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-[#EAD9C4]">
                <h1 className="text-xl font-serif font-semibold text-gradient">Job Portal</h1>
                <div className="flex items-center gap-3">
                    <span className="text-[#4A3728] text-sm hidden sm:block">
                        Welcome, <span className="font-semibold">{user?.firstName}</span>
                    </span>
                    <span className={`text-xs px-3 py-1.5 font-medium rounded-full
                        ${user?.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'warm-pill'}`}>
                        {user?.role}
                    </span>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => handleTabChange('messages')}
                            className="relative warm-card px-3 py-1.5 text-sm hidden sm:flex items-center gap-1"
                        >
                            💬
                            <span className="absolute -top-2 -right-2 bg-[#C2651A] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="warm-btn-outline text-sm px-4 py-2"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="bg-[#FFFBF5] border-b border-[#EAD9C4] px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 py-3 overflow-x-auto">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {primaryTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`
                                    px-3 sm:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-warm
                                    ${activeTab === tab.key
                                        ? 'bg-[#C2651A] text-white'
                                        : 'text-[#8B7355] hover:text-[#C2651A] hover:bg-[#F5EDE3]'}
                                `}
                            >
                                <span className="mr-1">{tab.icon}</span>
                                <span className="hidden xs:inline">{tab.label}</span>
                                {tab.badge && (
                                    <span className="ml-1 bg-[#4A7C59] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-2">
                        {secondaryTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-warm
                                    ${activeTab === tab.key
                                        ? 'bg-[#C2651A] text-white'
                                        : 'text-[#8B7355] hover:text-[#C2651A] hover:bg-[#F5EDE3]'}
                                `}
                            >
                                <span className="mr-1">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {secondaryTabs.length > 0 && (
                        <div className="lg:hidden relative">
                            <button
                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                                className="warm-card px-4 py-2 text-sm font-medium"
                            >
                                {isMoreMenuOpen ? '✕' : 'More ▼'}
                            </button>

                            {isMoreMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-2 z-50 w-48 warm-card p-2 shadow-lg"
                                >
                                    {secondaryTabs.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                handleTabChange(tab.key);
                                                setIsMoreMenuOpen(false);
                                            }}
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-3 text-left text-sm rounded-xl mb-1 last:mb-0 transition-warm
                                                ${activeTab === tab.key
                                                    ? 'bg-[#C2651A] text-white'
                                                    : 'text-[#4A3728] hover:bg-[#F5EDE3]'}
                                            `}
                                        >
                                            <span>{tab.icon}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-12">
                    <Footer />
                </div>
            </div>
        </div>
    );
}
