import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from './authStore';

import { API_BASE_URL } from '../services/api';

const getSocketUrl = () => {
    let url = import.meta.env.VITE_WS_URL || (API_BASE_URL.startsWith('http') ? (API_BASE_URL + '/ws') : 'http://localhost:8080/api/ws');
    
    // SockJS requires http/https schema even for websockets
    return url.replace(/^ws(s)?:\/\//, 'http$1://');
};

const SOCKET_URL = getSocketUrl();

export const useWebsocketStore = create((set, get) => ({
    client: null,
    connected: false,
    notifications: [],
    unreadNotifications: 0,
    messages: [], // All incoming messages for real-time updates
    newMessages: {}, // userId -> count
    typingStatus: {}, // userId -> isTyping
    lastRead: null, // latest read receipt event

    connect: (userId) => {
        if (get().client?.active) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            onConnect: () => {
                console.log('Connected to WebSocket');
                set({ connected: true });

                // Subscribe to notifications
                client.subscribe(`/topic/notifications/${userId}`, (message) => {
                    const notification = JSON.parse(message.body);
                    set((state) => ({
                        notifications: [notification, ...state.notifications],
                        unreadNotifications: state.unreadNotifications + 1
                    }));
                    window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
                });

                // Subscribe to chat
                client.subscribe(`/topic/chat/${userId}`, (message) => {
                    const msg = JSON.parse(message.body);
                    const senderId = msg.sender.id;
                    console.log('WebSocket message received:', msg);
                    
                    // Store message for real-time updates
                    set((state) => ({
                        messages: [...state.messages, msg],
                        newMessages: {
                            ...state.newMessages,
                            [senderId]: senderId !== userId ? (state.newMessages[senderId] || 0) + 1 : (state.newMessages[senderId] || 0)
                        }
                    }));

                    window.dispatchEvent(new CustomEvent('newMessage', { detail: msg }));
                    console.log('Dispatched newMessage event for:', senderId);
                });

                // Subscribe to typing indicators
                client.subscribe(`/topic/typing/${userId}`, (message) => {
                    const data = JSON.parse(message.body);
                    set((state) => ({
                        typingStatus: {
                            ...state.typingStatus,
                            [data.userId]: data.isTyping
                        }
                    }));
                });

                // Subscribe to read receipts
                client.subscribe(`/topic/chat.read/${userId}`, (message) => {
                    const data = JSON.parse(message.body);
                    set({ lastRead: data });
                    window.dispatchEvent(new CustomEvent('messageRead', { detail: data }));
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                set({ connected: false });
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.activate();
        set({ client });
    },

    sendTyping: (receiverId, isTyping) => {
        const client = get().client;
        const userId = useAuthStore.getState().user?.id;
        if (client?.connected && userId) {
            try {
                client.publish({
                    destination: '/app/chat.typing',
                    body: JSON.stringify({ receiverId, senderId: userId, isTyping })
                });
            } catch (e) {
                console.log('Typing notification skipped:', e.message);
            }
        }
    },

    sendReadReceipt: (partnerId) => {
        const client = get().client;
        const userId = useAuthStore.getState().user?.id;
        if (client?.connected && userId) {
            try {
                client.publish({
                    destination: '/app/chat.read',
                    body: JSON.stringify({ partnerId, viewerId: userId })
                });
            } catch (e) {
                console.log('Read receipt skipped:', e.message);
            }
        }
    },

    disconnect: () => {
        const client = get().client;
        if (client) {
            client.deactivate();
            set({ client: null, connected: false, messages: [] });
        }
    },

    clearNewMessages: (senderId) => {
        set((state) => ({
            newMessages: {
                ...state.newMessages,
                [senderId]: 0
            }
        }));
    },
    
    resetUnreadNotifications: () => set({ unreadNotifications: 0 })
}));
