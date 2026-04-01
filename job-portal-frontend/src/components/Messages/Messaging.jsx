import { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';
import UserAvatar from '../UserAvatar';
import { 
    Search, User as UserIcon, Send, MoreHorizontal, 
    Check, CheckCheck, Plus, MessageSquare, Briefcase, 
    Shield, X, Smile
} from 'lucide-react';

export default function Messaging({ chatWith }) {
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
    const visibilityHandler = useRef(null);

    useEffect(() => {
        fetchInbox();
        fetchUsers();

        pollingInterval.current = setInterval(() => {
            fetchInbox();
            if (selectedPartner) fetchConversation(selectedPartner, false);
        }, 5000);

        visibilityHandler.current = () => {
            if (document.hidden) {
                clearInterval(pollingInterval.current);
            } else {
                fetchInbox();
                if (selectedPartner) fetchConversation(selectedPartner, false);
                pollingInterval.current = setInterval(() => {
                    fetchInbox();
                    if (selectedPartner) fetchConversation(selectedPartner, false);
                }, 5000);
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler.current);

        return () => {
            clearInterval(pollingInterval.current);
            document.removeEventListener('visibilitychange', visibilityHandler.current);
        };
    }, []);

    useEffect(() => {
        if (selectedPartner) fetchConversation(selectedPartner);
    }, [selectedPartner]);

    useEffect(() => {
        if (chatWith && users.length > 0 && !selectedPartner) {
            const partner = users.find(u => u.id === Number(chatWith));
            if (partner) handleSelectPartner(partner);
        }
    }, [chatWith, users]);

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
        <div className="pb-12 max-w-7xl mx-auto h-[750px] flex flex-col">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 border-[3px] border-stone-900 flex items-center justify-center shadow-[4px_4px_0_#000]">
                        <MessageSquare className="text-stone-900" size={24} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-gray-100">Messages</h2>
                        <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-[10px]">Real-time collaboration & networking</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowNewMsg(!showNewMsg); setSearchUser(''); }}
                    className="group bg-orange-500 hover:bg-orange-400 text-stone-900 border-[3px] border-stone-900 px-6 py-3 font-black uppercase tracking-widest transition-all shadow-[6px_6px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 flex items-center gap-2"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>Start Chat</span>
                </button>
            </div>

            {/* ── New Message Panel ─────────────────────────────────── */}
            {showNewMsg && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 shadow-[12px_12px_0_#ea580c] p-8 w-full max-w-xl animate-neo-thump relative">
                        <button onClick={() => setShowNewMsg(false)} className="absolute top-4 right-4 hover:bg-stone-100 p-2"><X size={20}/></button>
                        <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tighter mb-4 text-2xl">Connect with someone new</h3>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <input
                                type="text"
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                placeholder="SEARCH BY NAME, ROLE OR EMAIL..."
                                className="w-full pl-12 pr-5 py-4 border-[3px] border-stone-900 rounded-none focus:outline-none focus:border-orange-500 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black uppercase placeholder:text-stone-300"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredUsers.length === 0 && <p className="text-stone-400 font-bold uppercase text-center py-6">No users match your vibe</p>}
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => handleStartNew(u)}
                                    className="flex items-center gap-4 p-4 border-[3px] border-stone-100 dark:border-stone-700 hover:border-stone-900 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-all group"
                                >
                                    <UserAvatar user={u} size="md" />
                                    <div className="min-w-0">
                                        <p className="font-black text-stone-900 dark:text-gray-100 uppercase truncate">{u.firstName} {u.lastName}</p>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{u.role} • {u.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Chat Layout ──────────────────────────────────── */}
            <div className="flex-grow flex flex-col md:flex-row gap-0 overflow-hidden border-[4px] border-stone-900 bg-white dark:bg-stone-800 shadow-[12px_12px_0_#000]">
                
                {/* ── Sidebar ────────────────────────────────────────── */}
                <div className="md:w-80 w-full flex-shrink-0 border-r-[4px] border-stone-900 flex flex-col bg-stone-50 dark:bg-stone-900/30">
                    <div className="p-5 border-b-[4px] border-stone-900 bg-white dark:bg-stone-800 flex items-center justify-between">
                        <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Active Inbox
                        </h3>
                        <span className="bg-stone-900 text-white px-2 py-0.5 text-[10px] font-black">{inbox.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingInbox && <Loader text="..." />}
                        {!loadingInbox && inbox.length === 0 && (
                            <div className="text-center py-20 px-6 opacity-30 grayscale">
                                <MessageSquare size={40} className="mx-auto mb-4" />
                                <p className="font-black uppercase text-xs">No conversations yet</p>
                            </div>
                        )}
                        {inbox
                            .sort((a, b) => new Date(b.latestMessage?.sentAt || 0) - new Date(a.latestMessage?.sentAt || 0))
                            .map((item) => {
                                const partner = item.partner;
                                const latest  = item.latestMessage;
                                const isSelected = selectedPartner?.id === partner?.id;

                                return (
                                    <div
                                        key={partner?.id || item.id}
                                        onClick={() => handleSelectPartner(partner)}
                                        className={`group p-5 cursor-pointer border-b-[3px] border-stone-200 dark:border-stone-800 transition-all relative overflow-hidden
                                            ${isSelected ? 'bg-orange-500 dark:bg-orange-500 text-stone-900' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                    >
                                        <div className="flex gap-4 items-start relative z-10">
                                            <UserAvatar user={partner} size="md" className={isSelected ? '!bg-white' : ''} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className={`font-black uppercase text-xs truncate pr-2 ${isSelected ? 'text-stone-900' : 'text-stone-900 dark:text-white'}`}>
                                                        {partner?.firstName} {partner?.lastName}
                                                    </p>
                                                    <span className={`text-[9px] font-black uppercase shrink-0 ${isSelected ? 'text-stone-900/60' : 'text-stone-400'}`}>
                                                        {formatTime(latest?.sentAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-[11px] font-bold truncate transition-colors ${isSelected ? 'text-stone-900/80' : 'text-stone-500 dark:text-stone-400'}`}>
                                                    {latest?.sender?.id === user.id ? <span className="opacity-60">YOU: </span> : ''}
                                                    {latest?.content}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && <div className="absolute right-0 top-0 bottom-0 w-2 bg-stone-900" />}
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* ── Conversation Pane ──────────────────────────────── */}
                <div className="flex-1 flex flex-col bg-white dark:bg-stone-800 min-w-0 h-full relative">
                    {!selectedPartner ? (
                        <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-stone-900/50 p-12 text-center">
                            <div className="max-w-xs transition-transform hover:scale-110 duration-500">
                                <div className="w-24 h-24 bg-orange-100 border-[4px] border-stone-900 mx-auto flex items-center justify-center rotate-6 shadow-[8px_8px_0_#000] mb-8">
                                    <MessageSquare size={48} className="text-stone-900 animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tighter mb-4">No Conversation Selected</h3>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] leading-relaxed">
                                    Select a message from your active inbox to start chatting with your connections.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-5 border-b-[4px] border-stone-900 bg-stone-900 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <UserAvatar user={selectedPartner} size="md" className="!bg-white !border-stone-900 shadow-[2px_2px_0_#ea580c] -rotate-2" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-lg uppercase tracking-tighter truncate">{selectedPartner.firstName} {selectedPartner.lastName}</p>
                                            {selectedPartner.role === 'EMPLOYER' && <Shield size={14} className="text-orange-500" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">{selectedPartner.role} • {selectedPartner.email}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Messages List Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50 dark:bg-stone-900/20 custom-scrollbar">
                                {!loadingConvo && conversation.length === 0 && (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="text-6xl mb-6 bg-orange-100 w-24 h-24 flex items-center justify-center border-[3px] border-stone-900 rotate-12 shadow-[6px_6px_0_#ea580c]">👋</div>
                                        <p className="font-black uppercase tracking-[0.3em] text-stone-400 text-xs">No messages. Start the conversation.</p>
                                    </div>
                                )}

                                {conversation.map((msg) => {
                                    const isMine = msg.sender?.id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-neo-thump`}>
                                            <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-6 py-4 text-xs md:text-sm font-black border-[3px] shadow-[4px_4px_0_#000] relative
                                                    ${isMine
                                                        ? 'bg-orange-500 text-stone-900 border-stone-900 overflow-visible'
                                                        : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-stone-900'}`}>
                                                    {msg.content}
                                                    {/* Status indicator inside bubble for 'Mine' */}
                                                    {isMine && (
                                                        <div className="absolute -left-8 bottom-0 p-1 opacity-40">
                                                            {msg.isRead ? <CheckCheck size={14} className="text-emerald-600" /> : <Check size={14} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 px-1">
                                                    <span className="text-stone-400 dark:text-stone-500 text-[9px] font-black uppercase tracking-[0.1em]">
                                                        {formatTime(msg.sentAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Action/Input Area */}
                            <div className="shrink-0 p-6 border-t-[4px] border-stone-900 bg-white dark:bg-stone-800">
                                {error && (
                                    <div className="mb-4 px-4 py-2 bg-rose-500 text-white font-black uppercase text-[10px] border-[2px] border-stone-900 shadow-[3px_3px_0_#000] flex items-center gap-2">
                                        <Info size={14} /> {error}
                                    </div>
                                )}
                                <form onSubmit={handleSend} className="flex gap-4 items-end">
                                    <div className="flex-1 relative group">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                            placeholder="TYPE YOUR MESSAGE HERE..."
                                            rows={1}
                                            className="w-full pl-5 pr-14 py-5 border-[4px] border-stone-900 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black uppercase text-xs placeholder:text-stone-300 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none shadow-[2px_2px_0_#000] group-hover:shadow-[4px_4px_0_#000]"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                                            <Smile size={20} className="text-stone-400 hover:text-orange-500 cursor-pointer" />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="bg-stone-900 hover:bg-orange-500 text-white border-[4px] border-stone-900 px-8 py-5 font-black flex-shrink-0 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
                                    >
                                        <Send size={24} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}