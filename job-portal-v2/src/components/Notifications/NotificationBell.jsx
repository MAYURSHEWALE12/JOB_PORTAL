import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWebsocketStore } from '../../store/websocketStore';

export default function NotificationBell() {
    const { user } = useAuthStore();
    const { notifications: wsNotifications } = useWebsocketStore();
    const [fetchedNotifications, setFetchedNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await notificationAPI.getAll(user.id);
            setFetchedNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const allNotifications = [...wsNotifications, ...fetchedNotifications]
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

    const unreadCount = allNotifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setFetchedNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await notificationAPI.markAllAsRead(user.id);
            setFetchedNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const getIcon = (type) => {
        const iconClass = "w-4 h-4";
        switch (type) {
            case 'APPLICATION_RECEIVED':
                return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
            case 'APPLICATION_STATUS':
                return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'INTERVIEW':
                return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            case 'MESSAGE':
                return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
            default:
                return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="relative flex items-center" ref={bellRef}>
            <style>{`
                .hp-notif-dropdown {
                    background: var(--hp-nav-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--hp-border);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .hp-notif-item {
                    border-bottom: 1px solid var(--hp-border);
                    transition: all 0.2s ease;
                }
                .hp-notif-item:last-child { border-bottom: none; }
                .hp-notif-item:hover { background: var(--hp-surface-alt); }
                .hp-notif-unread { background: rgba(var(--hp-accent-rgb), 0.03); }
            `}</style>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl transition-all hover:bg-[var(--hp-surface-alt)] border border-transparent hover:border-[var(--hp-border)]"
                type="button"
            >
                <svg className="w-5 h-5" style={{ color: 'var(--hp-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-[var(--hp-accent)] shadow-[0_0_10px_rgba(var(--hp-accent-rgb),0.5)] border-2 border-[var(--hp-nav-bg)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="fixed right-4 top-16 w-85 z-[9999] hp-notif-dropdown overflow-hidden flex flex-col max-h-[500px]"
                            >
                                <div className="p-4 border-b flex justify-between items-center bg-[var(--hp-card)]" style={{ borderColor: 'var(--hp-border)' }}>
                                    <h3 className="font-bold text-[var(--hp-text)] tracking-tight">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-accent2)] hover:opacity-80 transition-opacity"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    {loading ? (
                                        <div className="p-10 text-center">
                                            <div className="w-6 h-6 border-2 border-[var(--hp-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--hp-muted)]">Syncing...</p>
                                        </div>
                                    ) : allNotifications.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)' }}>
                                                <svg className="w-6 h-6 text-[var(--hp-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-[var(--hp-muted)]">All caught up!</p>
                                            <p className="text-[10px] uppercase font-medium tracking-wide mt-1 text-[var(--hp-muted)] opacity-60">No new alerts</p>
                                        </div>
                                    ) : (
                                        allNotifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                                className={`hp-notif-item p-4 flex gap-4 cursor-pointer relative ${!notif.read ? 'hp-notif-unread' : ''}`}
                                            >
                                                {!notif.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--hp-accent)]" />
                                                )}
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border" style={{ background: notif.read ? 'var(--hp-surface-alt)' : 'rgba(var(--hp-accent-rgb), 0.1)', borderColor: notif.read ? 'var(--hp-border)' : 'rgba(var(--hp-accent-rgb), 0.2)', color: notif.read ? 'var(--hp-muted)' : 'var(--hp-accent)' }}>
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className={`text-sm font-bold truncate ${!notif.read ? 'text-[var(--hp-text)]' : 'text-[var(--hp-muted)]'}`}>
                                                            {notif.title}
                                                        </p>
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--hp-muted)] mt-1 whitespace-nowrap ml-2">
                                                            {formatTime(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.read ? 'text-[var(--hp-text-sub)]' : 'text-[var(--hp-muted)] opacity-70'}`}>
                                                        {notif.message}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="mt-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-[var(--hp-accent)] shadow-[0_0_8px_rgba(var(--hp-accent-rgb),0.6)]" />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 bg-[var(--hp-card)] border-t text-center" style={{ borderColor: 'var(--hp-border)' }}>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--hp-muted)]">Live Updates Enabled</p>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}