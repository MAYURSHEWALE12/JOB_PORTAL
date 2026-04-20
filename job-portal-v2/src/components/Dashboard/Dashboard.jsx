import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import NotificationBell from '../Notifications/NotificationBell';
import InterviewsPage from '../Interviews/InterviewsPage';
import CompanyBranding from '../Company/CompanyBranding';
import CompanyProfilePage from '../Company/CompanyProfilePage';
import Footer from '../Footer';
import Logo from '../Logo';
import { useWebsocketStore } from '../../store/websocketStore';
import ErrorBoundary from '../ErrorBoundary';
import ThemeToggle from '../ThemeToggle';
import { useThemeStore } from '../../store/themeStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const getAvatarUrl = (profileImageUrl) => {
    if (!profileImageUrl) return null;
    if (profileImageUrl.startsWith('http')) return profileImageUrl;
    return `${API_BASE_URL.replace('/api', '')}${profileImageUrl}`;
};

const tabIcons = {
    search: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    messages: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    applications: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    ),
    viewapps: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    interviews: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    saved: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    ),
    resume: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    analytics: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    postjob: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    managejobs: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    company: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    admin: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    profile: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
};

const ROLE_STYLE = {
    ADMIN: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
    EMPLOYER: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
    JOBSEEKER: { bg: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: 'rgba(45,212,191,0.3)' },
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { newMessages } = useWebsocketStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState('search');
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

    const handleLogout = () => { logout(); navigate('/'); };

    const handleTabChange = (key) => {
        if (key === 'resume') { navigate('/resume-builder'); return; }
        setActiveTab(key);
        if (key === 'messages') fetchUnreadCount();
        setIsMoreMenuOpen(false);
        setProfileMenuOpen(false);
    };

    const tabs = [
        { key: 'search', label: 'Find Jobs', show: true, priority: 1 },
        { key: 'messages', label: 'Messages', show: true, priority: 2, badge: unreadCount > 0 ? unreadCount : null },
        { key: 'applications', label: 'Applications', show: user?.role === 'JOBSEEKER', priority: 3 },
        { key: 'viewapps', label: 'Applicants', show: user?.role === 'EMPLOYER', priority: 3 },
        { key: 'interviews', label: 'Interviews', show: true, priority: 4 },
        { key: 'profile', label: 'Profile', show: false, priority: 5 },
        { key: 'saved', label: 'Saved Jobs', show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'resume', label: 'Resume', show: user?.role === 'JOBSEEKER', priority: 10 },
        { key: 'analytics', label: 'Analytics', show: true, priority: 10 },
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
            <style>{`
                :root, html.dark {
                    --hp-bg:           #07090f;
                    --hp-surface:      #0d1117;
                    --hp-surface-alt:  rgba(255,255,255,.06);
                    --hp-card:         #111520;
                    --hp-card-hover:   #151b2a;
                    --hp-border:       rgba(255,255,255,.07);
                    --hp-border-hover: rgba(45,212,191,.3);
                    --hp-accent:       #2dd4bf;
                    --hp-accent-rgb:   45,212,191;
                    --hp-accent2:      #a78bfa;
                    --hp-accent2-rgb:  167,139,250;
                    --hp-text:         #eef2ff;
                    --hp-text-sub:     #c7d0e8;
                    --hp-muted:        #6b7799;
                    --hp-subtle:       #2e3650;
                    --hp-nav-bg:       rgba(7,9,15,.88);
                    --hp-orb1:         rgba(45,212,191,.10);
                    --hp-orb2:         rgba(167,139,250,.07);
                    --hp-shadow-card:  0 8px 40px rgba(0,0,0,.55);
                    --hp-tab-active-bg:linear-gradient(135deg, rgba(45,212,191,.18), rgba(167,139,250,.12));
                    --hp-tab-active-border: rgba(45,212,191,.45);
                }
                html.light {
                    --hp-bg:           #f0f4fa;
                    --hp-surface:      #ffffff;
                    --hp-surface-alt:  rgba(0,0,0,.05);
                    --hp-card:         #ffffff;
                    --hp-card-hover:   #f7faff;
                    --hp-border:       rgba(0,0,0,.09);
                    --hp-border-hover: rgba(13,148,136,.35);
                    --hp-accent:       #0d9488;
                    --hp-accent-rgb:   13,148,136;
                    --hp-accent2:      #7c3aed;
                    --hp-accent2-rgb:  124,58,237;
                    --hp-text:         #0c1220;
                    --hp-text-sub:     #374151;
                    --hp-muted:        #64748b;
                    --hp-subtle:       #cbd5e1;
                    --hp-nav-bg:       rgba(240,244,250,.92);
                    --hp-orb1:         rgba(13,148,136,.07);
                    --hp-orb2:         rgba(124,58,237,.05);
                    --hp-shadow-card:  0 4px 24px rgba(0,0,0,.08);
                    --hp-tab-active-bg:linear-gradient(135deg, rgba(13,148,136,.12), rgba(124,58,237,.08));
                    --hp-tab-active-border: rgba(13,148,136,.4);
                }

                * { box-sizing: border-box; }

                .db-nav {
                    background: var(--hp-nav-bg);
                    backdrop-filter: blur(22px);
                    -webkit-backdrop-filter: blur(22px);
                    border-bottom: 1px solid var(--hp-border);
                }

                .db-tabbar {
                    background: var(--hp-nav-bg);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border-bottom: 1px solid var(--hp-border);
                }

                .db-tab {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 13px;
                    border-radius: 10px;
                    font-size: .78rem;
                    font-weight: 600;
                    white-space: nowrap;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all .2s ease;
                    color: var(--hp-muted);
                    background: transparent;
                    letter-spacing: .01em;
                    position: relative;
                    flex-shrink: 0; /* Ensures tabs don't squish on mobile */
                }
                .db-tab:hover {
                    color: var(--hp-text);
                    background: var(--hp-surface-alt);
                    border-color: var(--hp-border);
                }
                .db-tab.active {
                    color: var(--hp-accent);
                    background: var(--hp-tab-active-bg);
                    border-color: var(--hp-tab-active-border);
                }

                .db-tab.active::before {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 18px;
                    height: 2px;
                    border-radius: 2px;
                    background: linear-gradient(90deg, var(--hp-accent), var(--hp-accent2));
                }

                .db-badge {
                    background: #ef4444;
                    color: #fff;
                    font-size: .6rem;
                    font-weight: 700;
                    padding: 1px 5px;
                    border-radius: 999px;
                    font-family: 'DM Mono', monospace;
                    letter-spacing: 0;
                    line-height: 1.4;
                }

                .db-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 1.5px solid var(--hp-border);
                    flex-shrink: 0;
                    transition: border-color .2s;
                }
                .db-avatar:hover { border-color: rgba(var(--hp-accent-rgb), .5); }

                .db-avatar-placeholder {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: .7rem;
                    color: #fff;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: opacity .2s, box-shadow .2s;
                    box-shadow: 0 2px 12px rgba(var(--hp-accent-rgb),.3);
                }
                .db-avatar-placeholder:hover { opacity: .85; }

                .db-icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    background: var(--hp-surface-alt);
                    border: 1px solid var(--hp-border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--hp-muted);
                    transition: color .2s, border-color .2s, background .2s;
                    flex-shrink: 0;
                }
                .db-icon-btn:hover {
                    color: var(--hp-accent);
                    border-color: rgba(var(--hp-accent-rgb), .35);
                    background: rgba(var(--hp-accent-rgb), .08);
                }

                .db-role-badge {
                    font-size: .62rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 6px;
                    letter-spacing: .05em;
                    border: 1px solid;
                    text-transform: uppercase;
                    font-family: 'DM Mono', monospace;
                }

                .db-logout-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 10px;
                    border-radius: 8px;
                    font-size: .72rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid rgba(239,68,68,.25);
                    color: #f87171;
                    background: rgba(239,68,68,.08);
                    transition: all .2s;
                }
                .db-logout-btn:hover {
                    background: rgba(239,68,68,.16);
                    border-color: rgba(239,68,68,.45);
                }

                .db-btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                    color: #fff;
                    font-weight: 700;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: opacity .2s, transform .2s, box-shadow .2s;
                    box-shadow: 0 4px 18px rgba(var(--hp-accent-rgb), .35);
                }
                .db-btn-primary:hover { opacity: .88; transform: translateY(-1px); }

                .db-dropdown {
                    background: var(--hp-card);
                    border: 1px solid var(--hp-border);
                    border-radius: 14px;
                    box-shadow: 0 16px 60px rgba(0,0,0,.55);
                    overflow: hidden;
                }
                .db-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 14px;
                    font-size: .8rem;
                    font-weight: 500;
                    color: var(--hp-muted);
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    transition: background .15s, color .15s;
                    text-align: left;
                }
                .db-dropdown-item:hover {
                    background: var(--hp-surface-alt);
                    color: var(--hp-text);
                }
                .db-dropdown-item.active {
                    color: var(--hp-accent);
                    background: rgba(var(--hp-accent-rgb), .08);
                }
                .db-dropdown-divider {
                    height: 1px;
                    background: var(--hp-border);
                    margin: 4px 0;
                }

                .db-orb {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    z-index: 0;
                }

                .db-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
                .db-particle {
                    position: absolute;
                    border-radius: 50%;
                    animation: db-float-up linear infinite;
                    opacity: 0;
                }
                @keyframes db-float-up {
                    0%   { transform: translateY(100vh) scale(0); opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: .25; }
                    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                }

                .db-content {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    margin-top: 88px;
                    padding: 28px 20px 32px;
                }

                @media (max-width: 640px) {
                    .db-content { margin-top: 82px; padding: 16px 12px 24px; }
                    .db-tab { padding: 5px 10px; font-size: .72rem; }
                }

                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                .db-gradient-text {
                    background: linear-gradient(135deg, var(--hp-accent) 20%, var(--hp-accent2) 80%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                section, footer { transition: background .3s; }
                *, *::before, *::after { transition: background-color .25s, border-color .25s, color .25s; }
                .db-btn-primary { transition: opacity .2s, transform .2s, box-shadow .2s; }
            `}</style>

            <div style={{
                background: 'var(--hp-bg)',
                color: 'var(--hp-text)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
                position: 'relative',
            }}>

                <div className="db-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, var(--hp-orb1) 0%, transparent 70%)', top: '-5%', right: '-8%' }} />
                <div className="db-orb" style={{ width: 450, height: 450, background: 'radial-gradient(circle, var(--hp-orb2) 0%, transparent 70%)', bottom: '10%', left: '-5%' }} />

                <div className="db-particles">
                    {[...Array(18)].map((_, i) => (
                        <div
                            key={i}
                            className="db-particle"
                            style={{
                                width: `${Math.random() * 4 + 1.5}px`,
                                height: `${Math.random() * 4 + 1.5}px`,
                                left: `${Math.random() * 100}%`,
                                backgroundColor: i % 3 === 0 ? 'var(--hp-accent)' : i % 3 === 1 ? 'var(--hp-accent2)' : 'var(--hp-muted)',
                                animationDuration: `${Math.random() * 12 + 14}s`,
                                animationDelay: `${Math.random() * 12}s`,
                            }}
                        />
                    ))}
                </div>

                <nav className="db-nav fixed top-0 left-0 right-0 z-50 px-4 sm:px-6"
                    style={{ height: 52 }}>
                    <div className="max-w-7xl mx-auto flex justify-between items-center h-full gap-2">

                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Logo size="sm" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                            <div className="hidden md:flex items-center gap-2">
                                <span style={{ fontSize: '.78rem', color: 'var(--hp-muted)' }}>
                                    Hello, <span style={{ color: 'var(--hp-text)', fontWeight: 600 }}>{user?.firstName}</span>
                                </span>
                                <span
                                    className="db-role-badge"
                                    style={{ background: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border }}
                                >
                                    {user?.role}
                                </span>
                            </div>

                            <NotificationBell />

                            <ThemeToggle />

                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => { setProfileMenuOpen(v => !v); setIsMoreMenuOpen(false); }}
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                    title="Profile"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" className="db-avatar" />
                                    ) : (
                                        <div className="db-avatar-placeholder">{initials}</div>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {profileMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: .95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: .95 }}
                                            transition={{ duration: .18 }}
                                            className="db-dropdown"
                                            style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 200, zIndex: 200 }}
                                            onMouseLeave={() => setProfileMenuOpen(false)}
                                        >
                                            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--hp-border)' }}>
                                                <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--hp-text)' }}>
                                                    {user?.firstName} {user?.lastName}
                                                </div>
                                                <div style={{ fontSize: '.72rem', color: 'var(--hp-muted)', marginTop: 2 }}>
                                                    {user?.email}
                                                </div>
                                                <span
                                                    className="db-role-badge"
                                                    style={{ marginTop: 6, display: 'inline-block', background: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border }}
                                                >
                                                    {user?.role}
                                                </span>
                                            </div>

                                            <div style={{ padding: '6px 0' }}>
                                                <button
                                                    className="db-dropdown-item"
                                                    onClick={() => { handleTabChange('profile'); setProfileMenuOpen(false); }}
                                                >
                                                    {tabIcons.profile}
                                                    <span>View Profile</span>
                                                </button>
                                                <div className="db-dropdown-divider" />
                                                <button
                                                    className="db-dropdown-item"
                                                    onClick={handleLogout}
                                                    style={{ color: '#f87171' }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="db-tabbar fixed left-0 right-0 z-40"
                    style={{ top: 52, height: 46 }}>
                    <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-3 sm:px-6 gap-2">

                        {/* FIX: Changed from maxWidth to flex-1 to fill all available space dynamically */}
                        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {primaryTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`db-tab${activeTab === tab.key ? ' active' : ''}`}
                                >
                                    <span style={{ width: 14, height: 14, flexShrink: 0 }}>{tabIcons[tab.key]}</span>
                                    <span>{tab.label}</span>
                                    {tab.badge && <span className="db-badge">{tab.badge}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
                            {secondaryTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`db-tab${activeTab === tab.key ? ' active' : ''}`}
                                >
                                    <span style={{ width: 14, height: 14, flexShrink: 0 }}>{tabIcons[tab.key]}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {secondaryTabs.length > 0 && (
                            // FIX: Added flex-shrink-0 so the "More" button doesn't get squeezed by the scrolling tabs
                            <div className="lg:hidden relative flex-shrink-0 ml-1">
                                <button
                                    onClick={() => { setIsMoreMenuOpen(v => !v); setProfileMenuOpen(false); }}
                                    className={`db-tab${isMoreMenuOpen ? ' active' : ''}`}
                                >
                                    <span>More</span>
                                    <svg style={{ width: 12, height: 12, transform: isMoreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <AnimatePresence>
                                    {isMoreMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: .95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: .95 }}
                                            transition={{ duration: .18 }}
                                            className="db-dropdown"
                                            style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210, zIndex: 200, padding: '6px 0' }}
                                        >
                                            {secondaryTabs.map(tab => (
                                                <button
                                                    key={tab.key}
                                                    onClick={() => handleTabChange(tab.key)}
                                                    className={`db-dropdown-item${activeTab === tab.key ? ' active' : ''}`}
                                                >
                                                    {tabIcons[tab.key]}
                                                    <span>{tab.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

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