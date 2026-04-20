import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../Logo';
import NotificationBell from '../Notifications/NotificationBell';
import ThemeToggle from '../ThemeToggle';
import { tabIcons } from './DashboardIcons';

export default function DashboardNavbar({ 
    user, 
    avatarUrl, 
    initials, 
    roleStyle, 
    profileMenuOpen, 
    setProfileMenuOpen, 
    setIsMoreMenuOpen, 
    handleTabChange, 
    handleLogout,
    navigate 
}) {
    return (
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
    );
}
