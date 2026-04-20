import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messageAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useWebsocketStore } from '../../store/websocketStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
};

const isImageFile = (url, name) => {
    if (!url && !name) return false;
    const matchExt = /\.(jpg|jpeg|png|gif|webp)$/i;
    return (url && (matchExt.test(url) || url.includes('/image/'))) || (name && matchExt.test(name));
};

const isPdfFile = (url, name) => {
    if (!url && !name) return false;
    const matchExt = /\.pdf$/i;
    return (url && matchExt.test(url)) || (name && matchExt.test(name));
};

export default function Messaging() {
    const { user } = useAuthStore();
    const { sendTyping, sendReadReceipt, typingStatus, clearNewMessages, connected, messages: socketMessages } = useWebsocketStore();

    const [inbox, setInbox] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingInbox, setLoadingInbox] = useState(false);
    const [loadingConvo, setLoadingConvo] = useState(false);
    const [showNewMsg, setShowNewMsg] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [expandedMsgId, setExpandedMsgId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchInbox();
        fetchUsers();
    }, []);

    // Real-time message listener
    useEffect(() => {
        const handleNewMessage = (event) => {
            const msg = event.detail;
            console.log('newMessage event received in Messaging:', msg);
            if (!msg) return;
            
            if (selectedPartner) {
                const isRelevant = msg.sender?.id === selectedPartner.id || msg.receiverId === selectedPartner.id;
                console.log('Is relevant:', isRelevant, 'selectedPartner:', selectedPartner.id);
            
                if (isRelevant) {
                    console.log('Adding message to conversation');
                    setConversation(prev => {
                        const isDuplicate = prev.some(m => m.id === msg.id);
                        return isDuplicate ? prev : [...prev, msg];
                    });
                
                    if (msg.sender?.id === selectedPartner.id && connected) {
                        sendReadReceipt(selectedPartner.id);
                    }
                }
            }
            fetchInbox();
        };

        window.addEventListener('newMessage', handleNewMessage);
        return () => window.removeEventListener('newMessage', handleNewMessage);
    }, [selectedPartner, connected]);

    // Also listen to messages array as backup
    useEffect(() => {
        if (socketMessages.length > 0 && selectedPartner) {
            const lastMsg = socketMessages[socketMessages.length - 1];
            const isRelevant = lastMsg?.sender?.id === selectedPartner.id || lastMsg?.receiverId === selectedPartner.id;
            
            if (isRelevant) {
                setConversation(prev => {
                    const isDuplicate = prev.some(m => m.id === lastMsg.id);
                    return isDuplicate ? prev : [...prev, lastMsg];
                });
                
                if (lastMsg?.sender?.id === selectedPartner.id && connected) {
                    sendReadReceipt(selectedPartner.id);
                }
            }
            fetchInbox();
        }
    }, [socketMessages, selectedPartner]);

    useEffect(() => {
        if (selectedPartner) {
            fetchConversation(selectedPartner);
            if (connected) {
                sendReadReceipt(selectedPartner.id);
            }
            clearNewMessages(selectedPartner.id);
        }
    }, [selectedPartner]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchInbox = async () => {
        setLoadingInbox(true);
        try {
            const res = await messageAPI.getInbox(user.id);
            setInbox(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load inbox:', err);
        } finally {
            setLoadingInbox(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await messageAPI.getUsers(user.id);
            setUsers(Array.isArray(res.data) ? res.data.filter(u => u.id !== user.id) : []);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const fetchConversation = async (partner) => {
        setLoadingConvo(true);
        try {
            const res = await messageAPI.getConversation(user.id, partner.id);
            setConversation(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load conversation:', err);
        } finally {
            setLoadingConvo(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile) return;

        setSending(true);
        setError('');

        try {
            let fileUrl = null;
            let fileName = null;

            if (selectedFile) {
                const uploadRes = await messageAPI.uploadFile(selectedFile, selectedPartner.id);
                fileUrl = uploadRes.data?.fileUrl;
                fileName = uploadRes.data?.fileName || selectedFile.name;
            }

            const res = await messageAPI.send(user.id, selectedPartner.id, newMessage, fileUrl, fileName);

            const newMsg = {
                ...res.data,
                fileUrl: fileUrl,
                fileName: fileName
            };
            setConversation(prev => [...prev, newMsg]);
            setNewMessage('');
            setSelectedFile(null);
            setFilePreview(null);
            fetchInbox();
        } catch (err) {
            console.error('Send message error:', err);
            setError(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleEditMessage = async (msgId) => {
        if (!editContent.trim()) return;
        try {
            await messageAPI.editMessage(msgId, editContent);
            setConversation(prev => prev.map(m =>
                m.id === msgId ? { ...m, content: editContent, isEdited: true } : m
            ));
            setEditingMsgId(null);
            setEditContent('');
        } catch (err) {
            console.error('Edit message error:', err);
            setError(err.response?.data?.error || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            await messageAPI.deleteMessage(msgId);
            const newConvo = conversation.filter(m => m.id !== msgId);
            setConversation(newConvo);
            setRefreshKey(k => k + 1);
        } catch (err) {
            console.error('Delete message error:', err);
        }
    };

    const startEdit = (msg) => {
        setEditingMsgId(msg.id);
        setEditContent(msg.content || '');
    };

    const handleStartNew = (u) => {
        setSelectedPartner(u);
        setShowNewMsg(false);
        setSearchUser('');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => setFilePreview(ev.target.result);
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getAvatarUrl = (profileImageUrl) => {
        if (!profileImageUrl) return null;
        if (profileImageUrl.startsWith('http')) return profileImageUrl;
        return `${API_BASE_URL.replace('/api', '')}${profileImageUrl}`;
    };

    const renderAvatar = (firstName, lastName, profileImageUrl, sizeClass = 'w-11 h-11 text-base') => {
        const avatarUrl = getAvatarUrl(profileImageUrl);
        if (avatarUrl) {
            return <img src={avatarUrl} alt="Profile" className={`${sizeClass} rounded-xl object-cover flex-shrink-0 border border-[var(--hp-border)]`} onError={e => e.target.style.display = 'none'} />;
        }
        return (
            <div className={`${sizeClass} flex-shrink-0 flex items-center justify-center font-bold text-white rounded-xl shadow-sm`}
                style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                {getInitials(firstName, lastName) || 'U'}
            </div>
        );
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-8"
        >
            <style>{`
                .hp-message-mine {
                    background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                    color: #fff;
                    border-bottom-right-radius: 4px;
                }
                .hp-message-theirs {
                    background: var(--hp-surface-alt);
                    border: 1px solid var(--hp-border);
                    color: var(--hp-text);
                    border-bottom-left-radius: 4px;
                }

                .hp-modal-overlay { 
                    background: var(--hp-modal-overlay, rgba(0,0,0,0.6)); 
                    backdrop-filter: blur(12px); 
                }
                
                /* Custom Scrollbar for chat */
                .chat-scroll::-webkit-scrollbar { width: 6px; }
                .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                .chat-scroll::-webkit-scrollbar-thumb { background: var(--hp-border); border-radius: 10px; }
                .chat-scroll::-webkit-scrollbar-thumb:hover { background: var(--hp-muted); }
            `}</style>

            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--hp-text)] tracking-tight">
                        Messages
                    </h2>
                    <p className="text-[var(--hp-muted)] text-sm mt-1">Connect with employers and job seekers</p>
                </div>
                <button
                    onClick={() => { setShowNewMsg(!showNewMsg); setSearchUser(''); }}
                    className="hp-btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Message
                </button>
            </div>

            <AnimatePresence>
                {showNewMsg && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="hp-card p-5 sm:p-6 mb-6 overflow-hidden"
                    >
                        <h3 className="font-bold mb-4 text-[var(--hp-text)] text-lg">
                            Start a new conversation
                        </h3>
                        <div className="hp-input-group mb-4">
                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                placeholder="Search by name or email..."
                                className="hp-input"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto chat-scroll pr-2">
                            {filteredUsers.length === 0 && (
                                <p className="text-[var(--hp-muted)] text-center py-6">No users found</p>
                            )}
                            {filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => handleStartNew(u)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-left border border-transparent hover:border-[var(--hp-border)]"
                                    style={{ background: 'var(--hp-surface-alt)' }}
                                >
                                    {renderAvatar(u.firstName, u.lastName, u.profileImageUrl)}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-[var(--hp-text)] truncate">
                                            {u.firstName} {u.lastName}
                                        </p>
                                        <p className="text-[var(--hp-muted)] text-xs truncate mt-0.5" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                            {u.role} <span className="lowercase font-normal tracking-normal">• {u.email}</span>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 h-[70vh] min-h-[500px]">
                {/* Conversations List - hidden on mobile when chat is selected */}
                <div className={`hp-card flex flex-col w-full md:w-80 flex-shrink-0 overflow-hidden min-h-0 ${selectedPartner ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-5 border-b" style={{ borderColor: 'var(--hp-border)' }}>
                        <h3 className="font-bold text-[var(--hp-text)] text-lg tracking-tight">Inbox</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto chat-scroll">
                        {loadingInbox && (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                                        <div className="w-11 h-11 rounded-xl" style={{ background: 'var(--hp-border)' }}></div>
                                        <div className="flex-1">
                                            <div className="h-4 w-24 mb-2 rounded" style={{ background: 'var(--hp-border)' }}></div>
                                            <div className="h-3 w-32 rounded" style={{ background: 'var(--hp-border)' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loadingInbox && inbox.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <svg className="w-8 h-8 text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-[var(--hp-text)] font-bold mb-1">No conversations yet</p>
                                <p className="text-[var(--hp-muted)] text-sm">Click "New Message" to start networking!</p>
                            </div>
                        )}

                        {inbox
                            .sort((a, b) => new Date(b.latestMessage?.sentAt || 0) - new Date(a.latestMessage?.sentAt || 0))
                            .map((item) => {
                                const partner = item.partner;
                                const latest = item.latestMessage;
                                const isSelected = selectedPartner?.id === partner?.id;
                                const hasUnread = item.unreadCount > 0;

                                return (
                                    <button
                                        key={partner?.id}
                                        onClick={() => setSelectedPartner(partner)}
                                        className="w-full flex items-center gap-3 p-4 text-left transition-all border-b last:border-b-0 relative"
                                        style={{
                                            borderColor: 'var(--hp-border)',
                                            background: isSelected ? 'rgba(var(--hp-accent-rgb), 0.08)' : 'transparent',
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--hp-surface-alt)'; }}
                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ background: 'var(--hp-accent)' }} />
                                        )}
                                        <div className={`flex-shrink-0 ${hasUnread ? 'ring-2 ring-offset-2 ring-offset-[var(--hp-card)]' : ''}`} style={{ ringColor: 'var(--hp-accent)' }}>
                                            {renderAvatar(partner?.firstName, partner?.lastName, partner?.profileImageUrl)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className={`font-bold text-[.95rem] truncate ${hasUnread ? 'text-[var(--hp-text)]' : 'text-[var(--hp-text)]'}`}>
                                                    {partner?.firstName} {partner?.lastName}
                                                </p>
                                                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: hasUnread ? 'var(--hp-accent)' : 'var(--hp-muted)' }}>
                                                    {formatTime(latest?.sentAt)}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate ${hasUnread ? 'text-[var(--hp-text)] font-semibold' : 'text-[var(--hp-muted)]'}`}>
                                                {latest?.content || (latest?.fileUrl ? '📎 Attachment' : 'No messages yet')}
                                            </p>
                                        </div>
                                        {hasUnread && (
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--hp-accent)', boxShadow: '0 0 10px rgba(var(--hp-accent-rgb), 0.5)' }}></span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`hp-card flex flex-col flex-1 min-w-0 overflow-hidden min-h-0 ${selectedPartner ? 'flex' : 'hidden md:flex'}`}>
                    {!selectedPartner ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="orb" style={{ width: 200, height: 200, background: 'radial-gradient(circle, var(--hp-orb1) 0%, transparent 70%)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }} />
                                <div style={{ position: 'relative', zIndex: 10 }}>
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--hp-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-[var(--hp-muted)] font-medium">Select a conversation to start chatting</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 sm:p-5 flex items-center gap-3 border-b relative z-10" style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-surface-alt)' }}>
                                <button
                                    onClick={() => setSelectedPartner(null)}
                                    className="md:hidden p-2 -ml-2 rounded-lg"
                                    style={{ color: 'var(--hp-text)' }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                {renderAvatar(selectedPartner.firstName, selectedPartner.lastName, selectedPartner.profileImageUrl)}
                                <div>
                                    <p className="font-bold text-[var(--hp-text)] text-[1.05rem]">
                                        {selectedPartner.firstName} {selectedPartner.lastName}
                                    </p>
                                    <p className="text-xs font-bold tracking-wider uppercase mt-0.5" style={{ color: 'var(--hp-accent2)' }}>
                                        {selectedPartner.role}
                                    </p>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 chat-scroll relative">
                                <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(circle at center, var(--hp-surface-alt) 1px, transparent 1px)', backgroundSize: '24px 24px', zIndex: 0 }} />

                                {loadingConvo && (
                                    <div className="space-y-4 relative z-10">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`animate-pulse h-16 w-48 rounded-2xl`} style={{ background: i % 2 === 0 ? 'rgba(var(--hp-accent-rgb), 0.2)' : 'var(--hp-surface-alt)' }}></div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!loadingConvo && conversation.length === 0 && (
                                    <div className="text-center py-10 relative z-10">
                                        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2" style={{ background: 'var(--hp-surface-alt)', border: '1px solid var(--hp-border)', color: 'var(--hp-muted)' }}>Beginning of Chat</span>
                                        <p className="text-[var(--hp-muted)]">Say hello to {selectedPartner.firstName}!</p>
                                    </div>
                                )}

                                {conversation.map((msg) => {
                                    const isMine = msg.senderId === user.id || msg.sender?.id === user.id;
                                    const hasFile = !!msg.fileUrl;
                                    const isImage = hasFile && isImageFile(msg.fileUrl, msg.fileName);

                                    return (
                                        <motion.div
                                            key={`${msg.id}-${refreshKey}`}
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative z-10`}
                                        >
                                            <div className={`max-w-[85%] sm:max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {/* File Handling */}
                                                {msg.fileUrl && isImage && (
                                                    <div className="mb-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--hp-border)' }}>
                                                        <img
                                                            src={getFullFileUrl(msg.fileUrl)}
                                                            alt="Attachment"
                                                            className="max-w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setPreviewFile({ fileUrl: msg.fileUrl })}
                                                        />
                                                    </div>
                                                )}
                                                {msg.fileUrl && !isImage && (
                                                    <div
                                                        onClick={() => setPreviewFile({ fileUrl: msg.fileUrl, fileName: msg.fileName })}
                                                        className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer shadow-sm w-64 max-w-full
                                                            ${isMine ? 'hp-message-mine' : 'hp-message-theirs'}`}
                                                    >
                                                        <div className="p-2 rounded-lg" style={{ background: isMine ? 'rgba(0,0,0,0.2)' : 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                                            <svg className="w-6 h-6" style={{ color: isMine ? '#fff' : 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">
                                                                {msg.fileName || 'Document'}
                                                            </p>
                                                            <p className="text-xs opacity-70">Click to open</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Message Text & Edit Logic */}
                                                {editingMsgId === msg.id ? (
                                                    <div className="flex gap-2 items-end mb-1 w-full">
                                                        <input
                                                            type="text"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="hp-input py-2"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleEditMessage(msg.id);
                                                                if (e.key === 'Escape') { setEditingMsgId(null); setEditContent(''); }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button type="button" onClick={() => handleEditMessage(msg.id)} className="hp-btn-primary p-2.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button type="button" onClick={() => { setEditingMsgId(null); setEditContent(''); }} className="hp-btn-ghost p-2.5 hover:text-red-400 border-red-400/20">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    msg.content && (
                                                        <div className={`px-4 py-3 rounded-2xl text-[.95rem] leading-relaxed shadow-sm
                                                            ${isMine ? 'hp-message-mine' : 'hp-message-theirs'}`}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                    )
                                                )}

                                                {/* Metadata & Actions */}
                                                <div className={`flex items-center gap-2 mt-1.5 px-1 w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--hp-muted)' }}>
                                                        {formatTime(msg.sentAt)}
                                                        {msg.isEdited && <span className="ml-1 opacity-70">(edited)</span>}
                                                    </span>

                                                    {isMine && (
                                                        <>
                                                            <span className="flex items-center" title={msg.isRead ? "Read" : "Delivered"}>
                                                                {msg.isRead ? (
                                                                    <svg className="w-3.5 h-3.5" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 opacity-50" style={{ color: 'var(--hp-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </span>

                                                            {/* Hover Actions */}
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-lg ml-2">
                                                                <button onClick={() => startEdit(msg)} className="p-1 rounded hover:bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors" title="Edit">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded hover:bg-red-500/10 text-[var(--hp-muted)] hover:text-red-400 transition-colors" title="Delete">
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {selectedPartner && typingStatus[selectedPartner.id] && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start relative z-10">
                                        <div className="hp-message-theirs px-4 py-3 flex gap-1.5 items-center">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ background: 'var(--hp-accent)' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} className="h-1" />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSend} className="p-4 sm:p-5 border-t relative z-10" style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-surface)' }}>
                                {selectedFile && (
                                    <div className="flex items-center gap-3 p-3 mb-3 rounded-xl border" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-[var(--hp-border)]" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                                <svg className="w-5 h-5" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            </div>
                                        )}
                                        <span className="text-sm font-bold truncate flex-1" style={{ color: 'var(--hp-text)' }}>{selectedFile.name}</span>
                                        <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--hp-muted)] hover:text-red-400 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="hp-btn-ghost p-3"
                                        style={{ borderRadius: '12px', padding: '0 14px' }}
                                        title="Attach File"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="hp-input flex-1"
                                    />
                                    <button type="submit" disabled={sending || (!newMessage.trim() && !selectedFile)} className="hp-btn-primary px-5 sm:px-6">
                                        {sending ? (
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] flex items-center justify-center p-4 hp-modal-overlay"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="relative max-w-full max-h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setPreviewFile(null)} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-all backdrop-blur-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            {isImageFile(previewFile.fileUrl, previewFile.fileName) ? (
                                <img src={getFullFileUrl(previewFile.fileUrl)} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10" />
                            ) : isPdfFile(previewFile.fileUrl, previewFile.fileName) ? (
                                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                                    <iframe src={getFullFileUrl(previewFile.fileUrl)} title="PDF Preview" className="w-[90vw] max-w-5xl h-[85vh] border-none" />
                                </div>
                            ) : (
                                <div className="hp-card p-10 text-center max-w-sm mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                        <svg className="w-10 h-10" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </div>
                                    <p className="font-bold text-[var(--hp-text)] text-lg mb-2 truncate">{previewFile.fileName || 'Document'}</p>
                                    <p className="text-sm text-[var(--hp-muted)] mb-6">Preview not available for this file type.</p>
                                    <a href={getFullFileUrl(previewFile.fileUrl)} target="_blank" rel="noopener noreferrer" className="hp-btn-primary w-full py-3">
                                        Download File
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}