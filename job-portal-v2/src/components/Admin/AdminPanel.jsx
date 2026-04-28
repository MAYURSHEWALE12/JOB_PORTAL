import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import apiClient from '../../services/api';
import { Skeleton } from '../Skeleton';
import CompanyAvatar from '../CompanyAvatar';


const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Operation states
    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [pendingDeletion, setPendingDeletion] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchJobs();
    }, []);

    // Auto-clear UI errors after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('/admin/stats');
            setStats(res.data);
        } catch (err) { console.error('Stats synchronization failed:', err); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) { setError('System failure: Unable to retrieve user network.'); }
        finally { setLoading(false); }
    };

    const fetchJobs = async () => {
        try {
            const res = await apiClient.get('/admin/jobs');
            setJobs(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error('Market data retrieval failed:', err); }
    };

    const confirmDeletion = async () => {
        if (!pendingDeletion) return;
        const { id, type } = pendingDeletion;
        setDeletingId(id);
        setError('');
        setPendingDeletion(null);

        try {
            const endpoint = type === 'user' ? `/admin/users/${id}` : `/admin/jobs/${id}`;
            await apiClient.delete(endpoint);
            if (type === 'user') {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                setJobs(prev => prev.filter(j => j.id !== id));
            }
        } catch (err) {
            setError(err.response?.data?.error || `Protocol failed: ${type} record is protected.`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        setUpdatingId(userId);
        setError('');
        try {
            await apiClient.put(`/admin/users/${userId}/role?role=${newRole}`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) { setError('Authorization update sequence failed.'); }
        finally { setUpdatingId(null); }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = searchQuery === '' ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = searchQuery === '' ||
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${job.employer?.firstName} ${job.employer?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Chart Data
    const userRoleData = [
        { name: 'Job Seekers', value: stats?.totalJobSeekers || 0, color: '#60a5fa' },
        { name: 'Employers', value: stats?.totalEmployers || 0, color: '#a78bfa' },
        { name: 'Admins', value: (stats?.totalUsers || 0) - ((stats?.totalJobSeekers || 0) + (stats?.totalEmployers || 0)), color: '#34d399' }
    ].filter(item => item.value > 0);

    const jobStatusData = [
        { name: 'Active', count: stats?.activeJobs || 0, color: '#4ade80' },
        { name: 'Closed/Expired', count: (stats?.totalJobs || 0) - (stats?.activeJobs || 0), color: '#f87171' }
    ];


    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10" style={{ color: 'var(--hp-text)' }}>
            <style>{`
                .admin-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 24px; backdrop-filter: blur(20px); box-shadow: var(--hp-shadow-card); }
                .stat-card { background: var(--hp-surface-alt); border: 1px solid var(--hp-border); border-radius: 20px; transition: all 0.3s ease; }
                .stat-card:hover { border-color: var(--hp-accent); transform: translateY(-4px); box-shadow: 0 10px 30px rgba(var(--hp-accent-rgb), 0.1); }
                .tab-btn { padding: 10px 24px; border-radius: 12px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s; }
                .tab-btn.active { background: var(--hp-accent); color: #07090f; }
                .tab-btn:not(.active) { color: var(--hp-muted); }

                /* Fix: Popdown Visibility & Select Style */
                .hp-select { 
                    appearance: none; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); 
                    color: var(--hp-text) !important; font-size: 12px; padding: 8px 32px 8px 12px; border-radius: 10px; 
                    outline: none; cursor: pointer; 
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7799'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat; background-position: right 10px center; background-size: 14px;
                }
                .hp-select option { background-color: var(--hp-card) !important; color: var(--hp-text) !important; }
                
                .hp-badge { font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 12px; border-radius: 999px; }
                
                /* 🔥 FIXED: Centered Modal Overlay */
                .hp-modal-overlay { 
                    position: fixed; 
                    inset: 0; 
                    background: rgba(0, 0, 0, 0.75); 
                    backdrop-filter: blur(12px); 
                    z-index: 1000; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 24px;
                }
            `}</style>

            {/* Header with Diagnostics */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                <div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3 flex items-center gap-4">
                        HireHub Command
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Systems Operational</span>
                        </div>
                    </h2>
                    <p className="text-[var(--hp-muted)] font-medium text-sm">Core infrastructure, data visualization, and user network management.</p>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Nodes', value: stats.totalUsers, accent: 'var(--hp-accent)' },
                        { label: 'Seekers', value: stats.totalJobSeekers, accent: '#60a5fa' },
                        { label: 'Employers', value: stats.totalEmployers, accent: '#a78bfa' },
                        { label: 'Listings', value: stats.totalJobs, accent: 'var(--hp-text)' },
                        { label: 'Live', value: stats.activeJobs, accent: '#4ade80' },
                        { label: 'Flow', value: stats.totalApplications, accent: 'var(--hp-accent2)' },
                    ].map(stat => (
                        <motion.div key={stat.label} variants={itemVariants} className="stat-card p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-xl rounded-full transition-transform group-hover:scale-150" style={{ background: stat.accent }}></div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)] mb-3 relative z-10">{stat.label}</div>
                            <div className="text-3xl font-black tracking-tight relative z-10" style={{ color: stat.accent }}>{stat.value}</div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Interactive Charts Area */}
            {stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <div className="admin-card p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] mb-6">Network Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                                <PieChart>
                                    <Pie
                                        data={userRoleData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {userRoleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--hp-card)', borderColor: 'var(--hp-border)', borderRadius: '12px' }}
                                        itemStyle={{ color: 'var(--hp-text)', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            {userRoleData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--hp-muted)]">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }}></span>
                                    {entry.name} ({entry.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-card p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] mb-6">Market Activity</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                                <BarChart data={jobStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--hp-border)" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="name" stroke="var(--hp-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--hp-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: 'var(--hp-surface-alt)', opacity: 0.5 }}
                                        contentStyle={{ backgroundColor: 'var(--hp-card)', borderColor: 'var(--hp-border)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {jobStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Terminal Area */}
            <div className="flex bg-[var(--hp-surface-alt)] p-1.5 rounded-2xl border border-[var(--hp-border)] w-fit mb-6">
                <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>Network Matrix</button>
                <button onClick={() => setActiveTab('jobs')} className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}>Market Postings</button>
            </div>
            <div className="admin-card overflow-hidden">
                <div className="p-6 border-b border-[var(--hp-border)] flex flex-col md:flex-row gap-4">
                    <input
                        type="text" placeholder={`Search ${activeTab}...`} value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] text-sm outline-none focus:border-[var(--hp-accent)]"
                    />
                    <select value={activeTab === 'users' ? roleFilter : statusFilter}
                        onChange={(e) => activeTab === 'users' ? setRoleFilter(e.target.value) : setStatusFilter(e.target.value)}
                        className="hp-select md:w-48">
                        {activeTab === 'users' ? (
                            <>
                                <option value="ALL">All Roles</option>
                                <option value="JOBSEEKER">Job Seekers</option>
                                <option value="EMPLOYER">Employers</option>
                                <option value="ADMIN">Admins</option>
                            </>
                        ) : (
                            <>
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="CLOSED">Closed</option>
                                <option value="DRAFT">Draft</option>
                                <option value="EXPIRED">Expired</option>
                            </>
                        )}
                    </select>
                </div>

                <div className="p-8">
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{error}</span>
                                </div>
                                <button onClick={() => setError('')} className="opacity-50 hover:opacity-100 transition-opacity">✕</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">
                                <tr><th className="pb-6 pl-4">ID</th><th className="pb-6">Profile</th><th className="pb-6">Authority/Status</th><th className="pb-6 text-right pr-4">Operations</th></tr>
                            </thead>
                            <tbody className="text-sm">
                                {activeTab === 'users' ? filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-[var(--hp-border)] hover:bg-[rgba(var(--hp-accent-rgb),0.05)] transition-all group">
                                        <td className="py-5 pl-4 opacity-50 font-mono text-xs group-hover:text-[var(--hp-accent)] transition-colors">#{user.id}</td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10">
                                                    <CompanyAvatar 
                                                        name={`${user.firstName} ${user.lastName}`} 
                                                        logoUrl={user.profileImageUrl} 
                                                        size="sm" 
                                                    />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[var(--hp-text)] block">{user.firstName} {user.lastName}</span>
                                                    <span className="text-[10px] font-medium opacity-50">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <span className={`hp-badge ${user.role === 'ADMIN' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' : user.role === 'EMPLOYER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-4">
                                            <div className="flex justify-end items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <select value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value)} disabled={updatingId === user.id} className="hp-select text-[10px] font-bold !py-2 !pr-8">
                                                    <option value="JOBSEEKER">Seeker</option>
                                                    <option value="EMPLOYER">Employer</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                                <button onClick={() => setPendingDeletion({ id: user.id, type: 'user', name: user.firstName })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Terminate Node">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : filteredJobs.map(job => (
                                    <tr key={job.id} className="border-b border-[var(--hp-border)] hover:bg-[rgba(var(--hp-accent-rgb),0.05)] transition-all group">
                                        <td className="py-5 pl-4 opacity-50 font-mono text-xs group-hover:text-[var(--hp-accent)] transition-colors">#{job.id}</td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10">
                                                    <CompanyAvatar 
                                                        name={job.employer?.companyProfile?.companyName || `${job.employer?.firstName} ${job.employer?.lastName}`} 
                                                        logoUrl={job.employer?.companyProfile?.logoUrl} 
                                                        size="sm" 
                                                    />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[var(--hp-text)] block">{job.title}</span>
                                                    <span className="text-[10px] font-medium opacity-50">{job.employer?.companyProfile?.companyName || 'Unknown'} • {job.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <span className={`hp-badge ${job.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setPendingDeletion({ id: job.id, type: 'job', name: job.title })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="Delete Record">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🔥 CUSTOM CENTERED CONFIRMATION MODAL */}
            <AnimatePresence>
                {pendingDeletion && (
                    <div className="hp-modal-overlay" onClick={() => setPendingDeletion(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="hp-card max-w-sm w-full p-10 text-center relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Warning Icon */}
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl mx-auto mb-6">⚠️</div>

                            <h3 className="text-2xl font-black tracking-tight mb-2">Confirm Purge</h3>
                            <p className="text-sm text-[var(--hp-muted)] mb-10 leading-relaxed">
                                Are you sure you want to permanently delete <span className="text-[var(--hp-text)] font-bold">{pendingDeletion.name}</span>? This action will overwrite existing records and is irreversible.
                            </p>

                            <div className="flex gap-4">
                                <button onClick={() => setPendingDeletion(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-[var(--hp-surface-alt)] rounded-xl hover:bg-[var(--hp-surface)] transition-colors border border-[var(--hp-border)]">Abort</button>
                                <button onClick={confirmDeletion} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:opacity-90 transition-all">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}