import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import { notificationAPI } from '../services/api';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const WS_URL = VITE_API_BASE_URL.replace('http', 'ws') + '/ws';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    stompClient: null,
    isConnected: false,

    fetchNotifications: async (userId) => {
        try {
            const res = await notificationAPI.getUserNotifications(userId);
            const notifs = res.data || [];
            const count = notifs.filter(n => !n.read).length;
            set({ notifications: notifs, unreadCount: count });
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    },

    markAsRead: async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            set((state) => {
                const updated = state.notifications.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                );
                return {
                    notifications: updated,
                    unreadCount: updated.filter(n => !n.read).length
                };
            });
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    },

    connect: (userId) => {
        if (get().isConnected) return;

        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            onConnect: () => {
                set({ isConnected: true });
                client.subscribe(`/topic/notifications/${userId}`, (message) => {
                    if (message.body) {
                        const notification = JSON.parse(message.body);
                        set((state) => ({
                            notifications: [notification, ...state.notifications],
                            unreadCount: state.unreadCount + 1
                        }));
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        set({ stompClient: client });
        get().fetchNotifications(userId);
    },

    disconnect: () => {
        const client = get().stompClient;
        if (client) {
            client.deactivate();
        }
        set({ stompClient: null, isConnected: false, notifications: [], unreadCount: 0 });
    }
}));
