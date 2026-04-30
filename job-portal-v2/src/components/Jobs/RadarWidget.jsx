import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/api';

export default function RadarWidget() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await apiClient.get('/job-alerts/user');
            setAlerts(res.data);
        } catch (err) {
            console.error('Radar calibration failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTracker = async (e) => {
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
            setIsCreating(false);
            fetchAlerts();
        } catch (err) {
            console.error('Failed to deploy tracker');
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/job-alerts/${id}`);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) { /* ignore */ }
    };

    return (
        <div className="radar-widget sticky top-24">
            <style>{`
                .radar-widget-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 20px; padding: 1.5rem; position: relative; overflow: hidden; }
                .radar-pulse-small { width: 8px; height: 8px; background: var(--hp-accent); border-radius: 50%; position: relative; }
                .radar-pulse-small::after { content: ''; position: absolute; top: -6px; left: -6px; right: -6px; bottom: -6px; border: 1.5px solid var(--hp-accent); border-radius: 50%; animation: pulse 2s infinite; opacity: 0; }
                @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
                .radar-keyword-tag { background: var(--hp-surface-alt); border: 1px solid var(--hp-border); padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; color: var(--hp-accent); display: flex; align-items: center; gap: 4px; }
            `}</style>

            <div className="radar-widget-card">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="radar-pulse-small"></div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--hp-text)]">Live Job Radar</h4>
                    </div>
                    {!isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-accent)] hover:underline"
                        >
                            + Add
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isCreating ? (
                        <motion.form 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAddTracker}
                            className="mb-4 space-y-2"
                        >
                            <input 
                                autoFocus
                                type="text"
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                placeholder="Enter keyword..."
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] outline-none focus:border-[var(--hp-accent)]"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 hp-btn-primary !py-1.5 !px-2 text-[9px] uppercase font-black">Deploy</button>
                                <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-[9px] font-black uppercase text-[var(--hp-muted)]">Cancel</button>
                            </div>
                        </motion.form>
                    ) : null}
                </AnimatePresence>

                <div className="space-y-3">
                    {loading ? (
                        <div className="h-20 animate-pulse bg-[var(--hp-surface-alt)] rounded-xl"></div>
                    ) : alerts.length === 0 ? (
                        <div className="py-4 text-center">
                            <p className="text-[10px] text-[var(--hp-muted)] font-medium">No active trackers. Deploy one to get instant job alerts!</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {alerts.map(alert => (
                                <div key={alert.id} className="radar-keyword-tag group">
                                    {alert.keywords.split(',')[0]}
                                    <button onClick={() => handleDelete(alert.id)} className="opacity-0 group-hover:opacity-100 transition-all hover:text-red-500">×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--hp-border)]">
                    <div className="flex items-center justify-between text-[9px] font-bold text-[var(--hp-muted)] uppercase tracking-tighter">
                        <span>Status: </span>
                        <span className="text-emerald-500 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                            Scanning Network
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
