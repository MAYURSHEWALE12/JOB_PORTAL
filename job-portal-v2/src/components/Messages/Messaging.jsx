import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';

export default function Messaging() {
    const { user } = useAuthStore();

    const [inbox, setInbox]               = useState([]);
    const [users, setUsers]               = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [newMessage, setNewMessage]     = useState('');
    const [sending, setSending]           = useState(false);
    const [loadingInbox, setLoadingInbox] = useState(false);
    const [loadingConvo, setLoadingConvo] = useState(false);
    const [showNewMsg, setShowNewMsg]     = useState(false);
    const [searchUser, setSearchUser]     = useState('');
    const [error, setError]               = useState('');

    const messagesEndRef  = useRef(null);
    const pollingInterval = useRef(null);

    useEffect(() => {
        fetchInbox();
        fetchUsers();

        // Poll for new messages every 5 seconds
        pollingInterval.current = setInterval(() => {
            fetchInbox();
            if (selectedPartner) fetchConversation(selectedPartner, false);
        }, 5000);

        return () => clearInterval(pollingInterval.current);
    }, []);

    useEffect(() => {
        if (selectedPartner) fetchConversation(selectedPartner);
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
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const fetchConversation = async (partner, showLoading = true) => {
        if (showLoading) setLoadingConvo(true);
        try {
            const res = await messageAPI.getConversation(user.id, partner.id);
            setConversation(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load conversation:', err);
        } finally {
            setLoadingConvo(false);
        }
    };

    const handleSelectPartner = (partner) => {
        setSelectedPartner(partner);
        setShowNewMsg(false);
        setError('');
    };

    const handleStartNew = (partner) => {
        setSelectedPartner(partner);
        setShowNewMsg(false);
        setSearchUser('');
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPartner) return;

        setSending(true);
        setError('');
        try {
            const res = await messageAPI.send(user.id, selectedPartner.id, newMessage.trim());
            setConversation(prev => [...prev, res.data]);
            setNewMessage('');
            fetchInbox();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now  = new Date();
        const diff = now - date;

        if (diff < 60000)     return 'Just now';
        if (diff < 3600000)   return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000)  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getInitials = (firstName, lastName) =>
        `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase()
            .includes(searchUser.toLowerCase())
    );

    return (
        <div className="pb-12">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">💬 Messages</h2>
                    <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 uppercase tracking-wider text-xs">Chat with employers and job seekers</p>
                </div>
                <button
                    onClick={() => { setShowNewMsg(!showNewMsg); setSearchUser(''); }}
                    className="bg-orange-500 hover:bg-orange-400 text-stone-900 border-[3px] border-stone-900 dark:border-black px-6 py-3 font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-1"
                >
                    ✉️ New Message
                </button>
            </div>

            {/* ── New Message Panel ─────────────────────────────────── */}
            {showNewMsg && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-6 mb-8 rounded-none">
                    <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-4 text-xl">Start a new conversation</h3>
                    <input
                        type="text"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        placeholder="SEARCH BY NAME OR EMAIL..."
                        className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all mb-4 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-bold uppercase placeholder:text-stone-400"
                        autoFocus
                    />
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredUsers.length === 0 && (
                            <p className="text-stone-400 font-bold uppercase text-center py-6">No users found</p>
                        )}
                        {filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={() => handleStartNew(u)}
                                className="flex items-center gap-4 p-4 border-[3px] border-stone-200 dark:border-stone-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-[4px_4px_0_#ea580c] cursor-pointer transition-all bg-white dark:bg-stone-800 hover:-translate-y-1"
                            >
                                <div className="w-12 h-12 bg-orange-200 border-[3px] border-stone-900 rounded-none flex items-center justify-center text-lg font-black text-stone-900 flex-shrink-0">
                                    {getInitials(u.firstName, u.lastName)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-stone-900 dark:text-gray-100 uppercase md:text-lg truncate">
                                        {u.firstName} {u.lastName}
                                    </p>
                                    <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest truncate">{u.role} • {u.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Main Chat Layout ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-8 h-[650px]">

                {/* ── Inbox Sidebar ──────────────────────────────────── */}
                <div className="md:w-80 w-full flex-shrink-0 bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] flex flex-col rounded-none">
                    <div className="p-4 border-b-[4px] border-stone-900 dark:border-stone-700 bg-orange-300">
                        <h3 className="font-black text-stone-900 uppercase tracking-widest">Conversations</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
                        {loadingInbox && <Loader text="Loading..." />}

                        {!loadingInbox && inbox.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="text-5xl mb-4">💬</div>
                                <p className="text-stone-500 dark:text-stone-400 font-bold uppercase">No conversations yet</p>
                                <p className="text-stone-400 text-xs mt-2 font-bold uppercase tracking-widest">Click "New Message" to start!</p>
                            </div>
                        )}

                        {inbox
                            .sort((a, b) => new Date(b.latestMessage?.sentAt || 0) - new Date(a.latestMessage?.sentAt || 0))
                            .map((item, index) => {
                            const partner = item.partner;
                            const latest  = item.latestMessage;
                            const isSelected = selectedPartner?.id === partner?.id;

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleSelectPartner(partner)}
                                    className={`flex items-start gap-3 p-4 cursor-pointer border-b-[3px] border-stone-200 dark:border-stone-700 transition-all border-l-[8px]
                                        ${isSelected 
                                            ? 'bg-orange-100 dark:bg-stone-700 border-l-orange-500' 
                                            : 'border-l-transparent hover:bg-stone-50 dark:hover:bg-stone-700/50 hover:border-l-stone-400'}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-12 h-12 border-[3px] flex items-center justify-center text-sm font-black flex-shrink-0 rounded-none shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]
                                        ${isSelected ? 'bg-orange-500 text-stone-900 border-stone-900 dark:border-black' : 'bg-stone-200 dark:bg-stone-600 text-stone-900 dark:text-white border-stone-900 dark:border-stone-800'}`}>
                                        {getInitials(partner?.firstName, partner?.lastName)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-black text-stone-900 dark:text-gray-100 uppercase truncate pr-2">
                                                {partner?.firstName} {partner?.lastName}
                                            </p>
                                            <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest flex-shrink-0 mt-0.5">
                                                {formatTime(latest?.sentAt)}
                                            </span>
                                        </div>
                                        <p className="text-stone-600 dark:text-stone-400 text-xs font-medium truncate mt-1">
                                            {latest?.sender?.id === user.id ? <span className="font-bold text-stone-900 dark:text-stone-300">YOU: </span> : ''}
                                            {latest?.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Conversation Panel ─────────────────────────────── */}
                <div className="flex-1 bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] flex flex-col rounded-none min-h-[400px]">

                    {/* No conversation selected */}
                    {!selectedPartner && (
                        <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-stone-900/50">
                            <div className="text-center">
                                <div className="text-7xl mb-6">💬</div>
                                <h3 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-stone-500 dark:text-stone-400 font-bold uppercase text-sm">
                                    Choose from the left or start a new message
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Conversation selected */}
                    {selectedPartner && (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b-[4px] border-stone-900 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 rounded-none flex items-center justify-center text-lg font-black text-stone-900 shadow-[2px_2px_0_#1c1917]">
                                    {getInitials(selectedPartner.firstName, selectedPartner.lastName)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase truncate">
                                        {selectedPartner.firstName} {selectedPartner.lastName}
                                    </p>
                                    <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest truncate">
                                        {selectedPartner.role} • {selectedPartner.email}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50 dark:bg-stone-800/50 custom-scrollbar">
                                {loadingConvo && <Loader text="Loading messages..." />}

                                {!loadingConvo && conversation.length === 0 && (
                                    <div className="text-center py-10">
                                        <div className="text-6xl mb-4">👋</div>
                                        <p className="text-stone-500 dark:text-stone-400 font-bold uppercase">
                                            No messages yet. Say hello!
                                        </p>
                                    </div>
                                )}

                                {conversation.map((msg) => {
                                    const isMine = msg.sender?.id === user.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-5 py-4 text-sm md:text-base font-medium border-[3px] shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]
                                                    ${isMine
                                                        ? 'bg-orange-500 text-stone-900 border-stone-900 dark:border-black rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none'
                                                        : 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white border-stone-900 dark:border-stone-900 rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                                                    {formatTime(msg.sentAt)}
                                                    {isMine && (
                                                        <span className="ml-2 text-orange-600 dark:text-orange-400">
                                                            {msg.isRead ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="px-5 py-3 bg-rose-500 text-white font-bold uppercase text-xs border-t-[4px] border-stone-900">
                                    {error}
                                </div>
                            )}

                            {/* Message Input */}
                            <form
                                onSubmit={handleSend}
                                className="p-4 border-t-[4px] border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 flex gap-4 items-end"
                            >
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="TYPE A MESSAGE..."
                                    rows={1}
                                    className="flex-1 px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 transition-all resize-none text-sm md:text-base bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-bold placeholder:text-stone-400 uppercase"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="bg-stone-900 dark:bg-stone-100 hover:bg-orange-500 text-white dark:text-stone-900 dark:hover:bg-orange-500 dark:hover:text-stone-900 border-[3px] border-transparent hover:border-stone-900 disabled:bg-stone-400 disabled:border-stone-400 dark:disabled:bg-stone-600 px-6 py-4 font-black text-xl transition-all flex-shrink-0 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-1"
                                >
                                    {sending ? '...' : '➤'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}