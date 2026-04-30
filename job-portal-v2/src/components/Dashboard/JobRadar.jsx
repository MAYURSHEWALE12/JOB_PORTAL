import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/api';

const ALERT_TYPES = [
    { value: 'FULL_TIME', label: 'Full-Time' },
    { value: 'PART_TIME', label: 'Part-Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERNSHIP', label: 'Internship' }
];

export default function JobRadar() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newAlert, setNewAlert] = useState({ keywords: '', location: '', jobType: 'FULL_TIME', salaryMin: 0, emailEnabled: true });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await apiClient.get('/job-alerts/user');
            setAlerts(res.data);
        } catch (err) {
            console.error('Radar failure:', err);
            setError('Failed to calibrate job radar.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAlert = async (e) => {
        e.preventDefault();
        if (!newAlert.keywords.trim()) return;
        
        try {
            await apiClient.post('/job-alerts/user', newAlert);
            setNewAlert({ keywords: '', location: '', jobType: 'FULL_TIME', salaryMin: 0, emailEnabled: true });
            setIsCreating(false);
            fetchAlerts();
        } catch (err) {
            setError('Failed to initiate alert sequence.');
        }
    };

    const handleDeleteAlert = async (id) => {
        try {
            await apiClient.delete(`/job-alerts/${id}`);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            setError('System error during deletion.');
        }
    };

    const toggleStatus = async (alert) => {
        try {
            await apiClient.put(`/job-alerts/${alert.id}`, { ...alert, isActive: !alert.isActive });
            setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: !a.isActive } : a));
        } catch (err) {
            setError('Calibration failed.');
        }
    };

    return (
        <div className="space-y-8 py-4">
            <style>{`
                .radar-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 24px; padding: 2rem; position: relative; overflow: hidden; }
                .radar-pulse { width: 12px; height: 12px; background: var(--hp-accent); border-radius: 50%; position: relative; }
                .radar-pulse::after { content: ''; position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; border: 2px solid var(--hp-accent); border-radius: 50%; animation: pulse 2s infinite; opacity: 0; }
                @keyframes pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
                .keyword-chip { background: var(--hp-surface-alt); border: 1px solid var(--hp-border); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--hp-accent); }
            `}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                        Job Radar <div className="radar-pulse"></div>
                    </h2>
                    <p className="text-[var(--hp-muted)] text-sm">We're scanning the network 24/7 for jobs that match your frequency.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="hp-btn-primary !py-3 !px-6 text-[10px] uppercase font-black tracking-widest"
                >
                    + Add New Tracker
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                    {error}
                </div>
            )}

            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="radar-card border-[var(--hp-accent)]"
                    >
                        <form onSubmit={handleCreateAlert} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Target Keywords</label>
                                    <input 
                                        type="text" required placeholder="e.g. React, UI Designer, Remote..."
                                        value={newAlert.keywords}
                                        onChange={e => setNewAlert({...newAlert, keywords: e.target.value})}
                                        className="w-full px-5 py-3.5 rounded-xl border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] text-sm outline-none focus:border-[var(--hp-accent)] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Preferred Location</label>
                                    <input 
                                        type="text" placeholder="e.g. London, Remote, Worldwide..."
                                        value={newAlert.location}
                                        onChange={e => setNewAlert({...newAlert, location: e.target.value})}
                                        className="w-full px-5 py-3.5 rounded-xl border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] text-sm outline-none focus:border-[var(--hp-accent)] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Job Type</label>
                                    <select 
                                        value={newAlert.jobType}
                                        onChange={e => setNewAlert({...newAlert, jobType: e.target.value})}
                                        className="hp-select w-full"
                                    >
                                        {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Min Salary (USD)</label>
                                    <input 
                                        type="number"
                                        value={newAlert.salaryMin}
                                        onChange={e => setNewAlert({...newAlert, salaryMin: e.target.value})}
                                        className="w-full px-5 py-3.5 rounded-xl border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] text-sm outline-none focus:border-[var(--hp-accent)] transition-all"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] w-full">
                                        <input 
                                            type="checkbox"
                                            checked={newAlert.emailEnabled}
                                            onChange={e => setNewAlert({...newAlert, emailEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-[var(--hp-accent)]"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">Enable Email Alerts</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">Cancel</button>
                                <button className="hp-btn-primary !py-3 !px-10 text-[10px] uppercase font-black tracking-widest">Deploy Tracker</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    [1,2].map(i => <div key={i} className="radar-card h-48 animate-pulse opacity-20"></div>)
                ) : alerts.length === 0 ? (
                    <div className="radar-card text-center py-20 border-dashed border-2 opacity-50">
                        <div className="text-4xl mb-4">📡</div>
                        <h4 className="text-lg font-bold mb-2">No active trackers found.</h4>
                        <p className="text-sm text-[var(--hp-muted)] max-w-md mx-auto">Add keywords for your dream jobs and we'll alert you the micro-second they go live.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <motion.div 
                            layout
                            key={alert.id} 
                            className={`radar-card group transition-all ${!alert.isActive ? 'grayscale opacity-50' : 'hover:border-[var(--hp-accent)]/50'}`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {alert.keywords.split(',').map((kw, idx) => (
                                            <span key={idx} className="keyword-chip">{kw.trim()}</span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">
                                        <span className="flex items-center gap-2">📍 {alert.location || 'Anywhere'}</span>
                                        <span className="flex items-center gap-2">💼 {alert.jobType}</span>
                                        <span className="flex items-center gap-2">💰 ${alert.salaryMin}+</span>
                                        {alert.emailEnabled && <span className="text-emerald-500">📧 Email Enabled</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => toggleStatus(alert)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${alert.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                                    >
                                        {alert.isActive ? 'Active' : 'Paused'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteAlert(alert.id)}
                                        className="p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
