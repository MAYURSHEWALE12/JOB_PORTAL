import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useWebsocketStore } from '../../store/websocketStore';
import { useThemeStore } from '../../store/themeStore';
import { messageAPI, API_BASE_URL, resolvePublicUrl } from '../../services/api';

// Sub-components
import DashboardStyles from './DashboardStyles';
import DashboardBackground from './DashboardBackground';
import DashboardNavbar from './DashboardNavbar';
import DashboardTabbar from './DashboardTabbar';
import { ROLE_STYLE } from './DashboardIcons';

// Content Components
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
import InterviewsPage from '../Interviews/InterviewsPage';
import CompanyBranding from '../Company/CompanyBranding';
import Footer from '../Footer';
import ErrorBoundary from '../ErrorBoundary';



const getAvatarUrl = (profileImageUrl) => {
    return resolvePublicUrl(profileImageUrl);
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { newMessages } = useWebsocketStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'search');
    const [initialUnread, setInitialUnread] = useState(0);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        if (user) fetchUnreadCount();
        const handleSwitchTab = (e) => { if (e.detail) handleTabChange(e.detail); };
        window.addEventListener('switchTab', handleSwitchTab);
        return () => window.removeEventListener('switchTab', handleSwitchTab);
    }, [user]);

    const websocketUnread = Object.values(newMessages).reduce((sum, val) => sum + val, 0);
    const unreadCount = initialUnread + websocketUnread;

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await messageAPI.getUnreadCount(user.id);
            setInitialUnread(res.data.unreadCount || 0);
        } catch (err) { console.error('Failed to fetch unread count:', err); }
    };

    const handleLogout = () => { navigate('/', { replace: true }); logout(); };

    const handleTabChange = (key) => {
        if (key === 'resume') { navigate('/resume-builder'); return; }
        setActiveTab(key);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('tab', key);
            // Clear job/stage if switching away from applicants
            if (key !== 'viewapps') {
                next.delete('jobId');
                next.delete('stage');
            }
            return next;
        });
        if (key === 'messages') fetchUnreadCount();
        setIsMoreMenuOpen(false);
        setProfileMenuOpen(false);
    };

    const tabs = [
        { key: 'search', label: 'Find Jobs', show: user?.role !== 'ADMIN', priority: 1 },
        { key: 'messages', label: 'Messages', show: true, priority: 2, badge: unreadCount > 0 ? unreadCount : null },
        { key: 'applications', label: 'Applications', show: user?.role === 'JOBSEEKER', priority: 3 },
        { key: 'viewapps', label: 'Applicants', show: user?.role === 'EMPLOYER', priority: 3 },
        { key: 'interviews', label: 'Interviews', show: user?.role !== 'ADMIN', priority: 4 },
        { key: 'profile', label: 'Profile', show: false, priority: 5 },
        { key: 'saved', label: 'Saved Jobs', show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'resume', label: 'Resume', show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'analytics', label: 'Analytics', show: user?.role !== 'ADMIN', priority: 10 },
        { key: 'postjob', label: 'Post Job', show: user?.role === 'EMPLOYER', priority: 10 },
        { key: 'managejobs', label: 'Manage Jobs', show: user?.role === 'EMPLOYER', priority: 10 },
        { key: 'company', label: 'Company', show: user?.role === 'EMPLOYER', priority: 10 },
        { key: 'admin', label: 'Admin', show: user?.role === 'ADMIN', priority: 10 },
    ].filter(tab => tab.show).sort((a, b) => a.priority - b.priority);

    const primaryTabs = tabs.filter(t => t.priority < 10);
    const secondaryTabs = tabs.filter(t => t.priority >= 10);

    const renderContent = () => {
        switch (activeTab) {
            case 'search': return <JobSearch />;
            case 'saved': return <SavedJobs />;
            case 'applications': return <MyApplications />;
            case 'analytics': return <Analytics />;
            case 'messages': return <Messaging />;
            case 'interviews': return <InterviewsPage />;
            case 'postjob': return <PostJob />;
            case 'managejobs': return <ManageJobs />;
            case 'viewapps': return <ViewApplications />;
            case 'company': return <CompanyBranding />;
            case 'admin': return <AdminPanel />;
            case 'profile': return <ProfilePage />;
            default: return <JobSearch />;
        }
    };

    const avatarUrl = getAvatarUrl(user?.profileImageUrl);
    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
    const roleStyle = ROLE_STYLE[user?.role] || ROLE_STYLE.JOBSEEKER;

    return (
        <>
            <DashboardStyles />
            <div style={{
                background: 'var(--hp-bg)',
                color: 'var(--hp-text)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
                position: 'relative',
            }}>
                <DashboardBackground />

                <DashboardNavbar 
                    user={user}
                    avatarUrl={avatarUrl}
                    initials={initials}
                    roleStyle={roleStyle}
                    profileMenuOpen={profileMenuOpen}
                    setProfileMenuOpen={setProfileMenuOpen}
                    setIsMoreMenuOpen={setIsMoreMenuOpen}
                    handleTabChange={handleTabChange}
                    handleLogout={handleLogout}
                    navigate={navigate}
                />

                <DashboardTabbar 
                    activeTab={activeTab}
                    handleTabChange={handleTabChange}
                    primaryTabs={primaryTabs}
                    secondaryTabs={secondaryTabs}
                    isMoreMenuOpen={isMoreMenuOpen}
                    setIsMoreMenuOpen={setIsMoreMenuOpen}
                    setProfileMenuOpen={setProfileMenuOpen}
                />

                <div className="db-content" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="max-w-7xl mx-auto w-full flex-grow">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <ErrorBoundary>
                                    {renderContent()}
                                </ErrorBoundary>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div style={{ marginTop: 48, width: '100%', maxWidth: '80rem', margin: '48px auto 0' }}>
                        <Footer />
                    </div>
                </div>
            </div>
        </>
    );
}