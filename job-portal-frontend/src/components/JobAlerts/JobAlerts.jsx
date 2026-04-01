import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { jobAlertAPI } from '../../services/api';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Mail, Monitor, X } from 'lucide-react';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];

export default function JobAlerts() {
    const { user } = useAuthStore();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        keywords: '',
        location: '',
        jobType: '',
        salaryMin: '',
        emailEnabled: true,
        inAppEnabled: true,
        isActive: true,
    });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await jobAlertAPI.getUserAlerts(user.id);
            setAlerts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to load job alerts.';
            setError(msg);
            console.error('Job alerts error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ keywords: '', location: '', jobType: '', salaryMin: '', emailEnabled: true, inAppEnabled: true, isActive: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.keywords.trim()) {
            setError('At least one keyword is required.');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                ...form,
                salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
                jobType: form.jobType || null,
                location: form.location || null,
            };
            if (editingId) {
                await jobAlertAPI.updateAlert(editingId, payload);
                setSuccess('Alert updated successfully!');
            } else {
                await jobAlertAPI.createAlert(user.id, payload);
                setSuccess('Job alert created! You\'ll be notified when matching jobs are posted.');
            }
            resetForm();
            fetchAlerts();
        } catch {
            setError('Failed to save alert. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await jobAlertAPI.deleteAlert(id);
            setAlerts((prev) => prev.filter((a) => a.id !== id));
            setSuccess('Alert deleted.');
        } catch {
            setError('Failed to delete alert.');
        }
    };

    const handleEdit = (alert) => {
        setForm({
            keywords: alert.keywords || '',
            location: alert.location || '',
            jobType: alert.jobType || '',
            salaryMin: alert.salaryMin || '',
            emailEnabled: alert.emailEnabled !== false,
            inAppEnabled: alert.inAppEnabled !== false,
            isActive: alert.isActive !== false,
        });
        setEditingId(alert.id);
        setShowForm(true);
    };

    const ToggleBtn = ({ enabled, onToggle, label }) => (
        <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            aria-label={label}
        >
            {enabled ? (
                <ToggleRight className="text-orange-500" size={20} />
            ) : (
                <ToggleLeft className="text-stone-400" size={20} />
            )}
            <span className={enabled ? 'text-stone-900 dark:text-white' : 'text-stone-400'}>
                {enabled ? 'ON' : 'OFF'}
            </span>
        </button>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">🔔 Job Alerts</h2>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 font-bold uppercase tracking-widest">
                    Get notified when new jobs match your preferences
                </p>
            </div>

            {success && (
                <div className="bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {success}
                    <button onClick={() => setSuccess('')} className="float-right text-lg font-black">×</button>
                </div>
            )}
            {error && (
                <div className="bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {error}
                    <button onClick={() => setError('')} className="float-right text-lg font-black">×</button>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-bold text-stone-600 dark:text-stone-400">
                    {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                </p>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest text-xs py-2 px-4 shadow-[3px_3px_0_#1c1917] hover:shadow-[5px_5px_0_#1c1917] hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={16} /> New Alert
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-stone-900 dark:text-gray-100 text-sm uppercase tracking-widest">
                            {editingId ? '✏️ Edit Alert' : '➕ New Alert'}
                        </h3>
                        <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center bg-stone-100 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                            <X size={14} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Keywords *</label>
                            <input
                                type="text"
                                value={form.keywords}
                                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                                placeholder="e.g. React, Java, Data Analyst (comma separated)"
                                className="w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold placeholder:font-normal"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Location</label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    placeholder="e.g. Pune, Remote"
                                    className="w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold placeholder:font-normal"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Job Type</label>
                                <select
                                    value={form.jobType}
                                    onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                                    className="w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold"
                                >
                                    <option value="">Any</option>
                                    {JOB_TYPES.map((t) => (
                                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Minimum Salary (₹)</label>
                            <input
                                type="number"
                                value={form.salaryMin}
                                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                                placeholder="e.g. 500000"
                                className="w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold placeholder:font-normal"
                            />
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                            <ToggleBtn
                                enabled={form.emailEnabled}
                                onToggle={() => setForm({ ...form, emailEnabled: !form.emailEnabled })}
                                label="Toggle email notifications"
                            />
                            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <Mail size={14} /> Email notifications
                            </span>

                            <ToggleBtn
                                enabled={form.inAppEnabled}
                                onToggle={() => setForm({ ...form, inAppEnabled: !form.inAppEnabled })}
                                label="Toggle in-app notifications"
                            />
                            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1">
                                <Monitor size={14} /> In-app notifications
                            </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest text-xs py-3 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-0.5 transition-all disabled:shadow-none"
                            >
                                {saving ? 'Saving...' : editingId ? 'Update Alert' : 'Create Alert'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 bg-white dark:bg-stone-800 text-stone-900 dark:text-white border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest text-xs py-3 shadow-[3px_3px_0_#1c1917] hover:-translate-y-0.5 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 skeleton bg-stone-200 dark:bg-stone-700" />
                    ))}
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000]">
                    <Bell size={48} className="mx-auto mb-4 text-stone-300 dark:text-stone-600" />
                    <h3 className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase tracking-tight mb-2">No Job Alerts Yet</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm font-bold mb-6 max-w-sm mx-auto">
                        Create alerts to get notified when new jobs match your skills and preferences.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest text-xs py-3 px-6 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={16} /> Create Your First Alert
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] p-4 transition-all ${!alert.isActive ? 'opacity-60' : ''}`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-stone-900 dark:text-gray-100 text-sm uppercase tracking-tight truncate">
                                            {alert.keywords}
                                        </h4>
                                        {!alert.isActive && (
                                            <span className="text-[9px] font-black uppercase bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-2 py-0.5 border border-stone-400">Paused</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400 font-bold">
                                        {alert.location && <span>📍 {alert.location}</span>}
                                        {alert.jobType && <span>📋 {alert.jobType.replace('_', ' ')}</span>}
                                        {alert.salaryMin && <span>💰 ₹{Number(alert.salaryMin).toLocaleString()}+</span>}
                                    </div>
                                    <div className="flex gap-3 mt-2 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                        <span className={alert.emailEnabled ? 'text-orange-500' : ''}>
                                            <Mail size={12} className="inline mr-1" />
                                            {alert.emailEnabled ? 'Email ON' : 'Email OFF'}
                                        </span>
                                        <span className={alert.inAppEnabled ? 'text-orange-500' : ''}>
                                            <Monitor size={12} className="inline mr-1" />
                                            {alert.inAppEnabled ? 'In-App ON' : 'In-App OFF'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEdit(alert)}
                                        className="px-3 py-1.5 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-white border-[2px] border-stone-900 dark:border-stone-700 text-[10px] font-black uppercase tracking-wider hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(alert.id)}
                                        className="p-1.5 bg-stone-100 dark:bg-stone-900 text-rose-500 border-[2px] border-stone-900 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-500 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
