import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await notificationAPI.getAll(user.id);
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const getIcon = (type) => {
        const iconClass = "w-5 h-5";
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

    const getIconTheme = (type) => {
        switch (type) {
            case 'APPLICATION_RECEIVED': return { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' };
            case 'APPLICATION_STATUS': return { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' };
            case 'INTERVIEW': return { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' };
            case 'MESSAGE': return { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' };
            case 'JOB_ALERT': return { color: 'var(--hp-accent)', bg: 'rgba(var(--hp-accent-rgb), 0.1)', border: 'rgba(var(--hp-accent-rgb), 0.2)' };
            default: return { color: 'var(--hp-muted)', bg: 'var(--hp-surface-alt)', border: 'var(--hp-border)' };
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-20 relative z-10"
        >
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all 0.25s ease; }
                .hp-notif-card:hover { border-color: rgba(var(--hp-accent-rgb), 0.35); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.12); }
                .hp-notif-unread { background: rgba(var(--hp-accent-rgb), 0.02); }
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover:not(:disabled) { background: rgba(var(--hp-accent-rgb), .1); border-color: rgba(var(--hp-accent-rgb), .3); color: var(--hp-accent); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 px-1">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight">
                        Inbox
                    </h2>
                    <p className="text-[var(--hp-muted)] font-medium mt-1">
                        {unreadCount > 0 ? `${unreadCount} new updates since your last visit` : 'You are completely up to date'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="hp-btn-ghost text-xs uppercase tracking-widest px-5 py-3"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
                {[
                    { key: 'all', label: 'Everything' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'APPLICATION_RECEIVED', label: 'Applications' },
                    { key: 'APPLICATION_STATUS', label: 'Progress' },
                    { key: 'INTERVIEW', label: 'Interviews' },
                    { key: 'MESSAGE', label: 'Direct Messages' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border"
                        style={filter === tab.key ? {
                            background: 'rgba(var(--hp-accent-rgb), 0.1)',
                            color: 'var(--hp-accent)',
                            borderColor: 'rgba(var(--hp-accent-rgb), 0.3)'
                        } : {
                            background: 'var(--hp-surface-alt)',
                            color: 'var(--hp-muted)',
                            borderColor: 'var(--hp-border)'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="hp-card p-5 flex items-center gap-5 animate-pulse">
                            <div className="w-12 h-12 rounded-xl" style={{ background: 'var(--hp-border)' }} />
                            <div className="flex-1">
                                <div className="h-4 w-1/4 rounded mb-3" style={{ background: 'var(--hp-border)' }} />
                                <div className="h-3 w-2/4 rounded" style={{ background: 'var(--hp-border)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredNotifications.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="hp-card p-20 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                        <svg className="w-8 h-8 text-[var(--hp-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight mb-2">
                        {filter === 'all' ? 'Your inbox is empty' : 'No matching results'}
                    </h3>
                    <p className="text-[var(--hp-muted)] font-medium">
                        {filter === 'all'
                            ? "We'll let you know when something important happens."
                            : 'Try adjusting your filters to find what you are looking for.'}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notif, index) => {
                        const theme = getIconTheme(notif.type);
                        return (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                className={`hp-card hp-notif-card p-5 cursor-pointer relative overflow-hidden flex gap-5 ${!notif.read ? 'hp-notif-unread' : ''}`}
                                style={!notif.read ? { borderColor: 'rgba(var(--hp-accent-rgb), 0.3)' } : {}}
                            >
                                {!notif.read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ background: 'var(--hp-accent)' }} />
                                )}
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors"
                                    style={{ background: theme.bg, borderColor: theme.border, color: theme.color }}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                        <div className="flex-1">
                                            <h4 className={`text-[1.05rem] font-bold tracking-tight mb-1.5 ${!notif.read ? 'text-[var(--hp-text)]' : 'text-[var(--hp-muted)]'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className={`text-sm leading-relaxed ${!notif.read ? 'text-[var(--hp-text-sub)]' : 'text-[var(--hp-muted)] opacity-80'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] whitespace-nowrap">
                                                {formatTime(notif.createdAt)}
                                            </span>
                                            {!notif.read && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--hp-accent)] shadow-[0_0_10px_rgba(var(--hp-accent-rgb),0.6)]" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}