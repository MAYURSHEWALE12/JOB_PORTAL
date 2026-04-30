import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/api';

export default function FloatingRadar() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isOpen) fetchAlerts();
    }, [isOpen]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/job-alerts/user');
            setAlerts(res.data);
        } catch (err) {
            console.error('Radar sync failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;
        try {
            await apiClient.post('/job-alerts/user', {
                keywords: newKeyword,
                isActive: true,
                emailEnabled: true,
                inAppEnabled: true
            });
            setNewKeyword('');
            setIsAdding(false);
            fetchAlerts();
        } catch (err) { /* ignore */ }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/job-alerts/${id}`);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) { /* ignore */ }
    };

    const toggleActive = async (alert) => {
        try {
            await apiClient.put(`/job-alerts/${alert.id}`, { ...alert, isActive: !alert.isActive });
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: !a.isActive } : a));
        } catch (err) { /* ignore */ }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <style>{`
                .radar-fab {
                    width: 56px; height: 56px;
                    background: var(--hp-accent);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; cursor: pointer;
                    box-shadow: 0 8px 32px rgba(var(--hp-accent-rgb), 0.4);
                    position: relative;
                }
                .radar-fab::after {
                    content: ''; position: absolute; inset: -4px;
                    border: 2px solid var(--hp-accent); border-radius: 50%;
                    animation: radar-ping 2s infinite; opacity: 0;
                }
                @keyframes radar-ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
                
                .radar-panel {
                    position: absolute; bottom: 70px; right: 0;
                    width: 320px; max-height: 480px;
                    background: var(--hp-card);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--hp-border);
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    display: flex; flexDirection: column; overflow: hidden;
                }
                .radar-item {
                    background: var(--hp-surface-alt);
                    border: 1px solid var(--hp-border);
                    border-radius: 12px;
                    padding: 10px 12px;
                    display: flex; align-items: center; justify-content: space-between;
                    transition: all 0.2s;
                }
            `}</style>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="radar-panel"
                    >
                        <div className="p-5 border-b border-[var(--hp-border)] flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest">Radar Hub</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Scanning Network</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAdding(!isAdding)}
                                className="hp-btn-primary !p-2 !rounded-lg"
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto space-y-3 hide-scrollbar" style={{ minHeight: '100px' }}>
                            {isAdding && (
                                <motion.form 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onSubmit={handleAdd}
                                    className="p-3 bg-[var(--hp-accent)]/5 border border-[var(--hp-accent)]/20 rounded-xl space-y-3"
                                >
                                    <input 
                                        autoFocus
                                        placeholder="Skill or Job Title..."
                                        className="w-full bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--hp-accent)]"
                                        value={newKeyword}
                                        onChange={e => setNewKeyword(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button className="flex-1 hp-btn-primary !py-1.5 !text-[10px] uppercase font-black">Deploy</button>
                                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 text-[10px] font-black uppercase text-[var(--hp-muted)]">Close</button>
                                    </div>
                                </motion.form>
                            )}

                            {loading ? (
                                <div className="space-y-2 py-4">
                                    {[1,2,3].map(i => <div key={i} className="h-10 bg-[var(--hp-surface-alt)] animate-pulse rounded-xl"></div>)}
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-[11px] text-[var(--hp-muted)] font-medium">Your radar is empty. Add keywords to start tracking!</p>
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className={`radar-item ${!alert.isActive ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{alert.keywords.split(',')[0]}</span>
                                            <span className="text-[9px] text-[var(--hp-muted)] uppercase tracking-widest">Global Scan</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleActive(alert)}
                                                className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${alert.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--hp-muted)]/10 text-[var(--hp-muted)]'}`}
                                            >
                                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(alert.id)}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            >
                                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-[var(--hp-surface-alt)] text-[10px] text-center font-bold text-[var(--hp-muted)] uppercase tracking-widest border-t border-[var(--hp-border)]">
                            Auto-Syncing with Platform
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="radar-fab"
            >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                </svg>
            </motion.button>
        </div>
    );
}
