import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { messageAPI } from '../../services/api';

export default function useUnreadMessages(user) {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await messageAPI.getUnreadCount(user.id);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const interval = setInterval(() => fetchUnreadCount(), 10000);
        return () => clearInterval(interval);
    }, [user?.id]);

    return { unreadCount, fetchUnreadCount };
}

const typeIcons = {
    MESSAGE: '💬',
    INFO: '📋',
    JOB_ALERT: '🔔',
    SUCCESS: '✅',
};

const typeColors = {
    MESSAGE: 'border-l-emerald-500',
    INFO: 'border-l-blue-500',
    JOB_ALERT: 'border-l-orange-500',
    SUCCESS: 'border-l-emerald-500',
};

export function NotificationDropdown() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = (n) => {
        if (!n.read) markAsRead(n.id);
        setIsOpen(false);

        const refType = n.referenceType;
        const refId = n.referenceId;

        if (n.type === 'MESSAGE' && refType === 'CONVERSATION' && refId) {
            navigate(`/dashboard?tab=messages&chatWith=${refId}`);
        } else if (n.type === 'INFO' && refType === 'APPLICATION' && refId) {
            navigate(`/dashboard?tab=my-applications`);
        } else if (n.type === 'INFO' && refType === 'JOB' && refId) {
            navigate(`/dashboard?tab=manage-jobs&editJob=${refId}`);
        } else if (n.type === 'JOB_ALERT' && refId) {
            navigate(`/jobs?jobId=${refId}`);
        } else if (n.type === 'SUCCESS') {
            navigate('/dashboard?tab=overview');
        } else {
            navigate('/dashboard?tab=overview');
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((c) => !c)}
                className="relative inline-flex items-center justify-center w-11 h-11 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]"
                aria-label="Open notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1 flex items-center justify-center border-[2px] border-stone-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-3 right-0 z-50 w-[min(22rem,calc(100vw-2rem))] max-h-96 overflow-y-auto bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                    <div className="p-3 border-b-[2px] border-stone-900 dark:border-stone-700 font-black uppercase text-sm bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-gray-100">
                        Notifications
                    </div>
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-stone-500 font-medium">No notifications yet.</div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-3 border-b border-stone-200 dark:border-stone-700 border-l-4 ${typeColors[n.type] || 'border-l-stone-400'} ${!n.read ? 'bg-orange-50 dark:bg-orange-900/20 cursor-pointer' : 'cursor-pointer'} hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors`}
                                >
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{typeIcons[n.type] || '📌'}</span>
                                            <span className="font-bold text-sm text-stone-900 dark:text-gray-100">{n.title}</span>
                                        </div>
                                        {!n.read && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                                className="shrink-0 text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 border border-orange-600 dark:border-orange-400 px-1.5 py-0.5"
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mb-1 ml-7">{n.message}</p>
                                    <span className="text-[10px] text-stone-400 ml-7">{new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
