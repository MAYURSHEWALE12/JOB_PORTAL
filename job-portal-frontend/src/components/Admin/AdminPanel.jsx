import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';
import Loader from '../Loader';

export default function AdminPanel() {
    const { user: currentUser } = useAuthStore();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchJobs();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await apiClient.get('/admin/jobs');
            setJobs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load jobs:', err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (currentUser?.id === userId) {
            setError('You cannot delete your own account.');
            return;
        }

        const adminCount = users.filter(u => u.role === 'ADMIN').length;
        const targetUser = users.find(u => u.id === userId);
        if (targetUser?.role === 'ADMIN' && adminCount <= 1) {
            setError('Cannot delete the last admin user. Promote another user first.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setDeletingId(userId);
        try {
            await apiClient.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccessMsg('User deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete user.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        if (currentUser?.id === userId && newRole !== 'ADMIN') {
            setError('You cannot remove your own admin role.');
            fetchUsers();
            return;
        }

        setUpdatingId(userId);
        try {
            await apiClient.put(`/admin/users/${userId}/role?role=${newRole}`);
            setUsers(prev =>
                prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
            );
            setSuccessMsg(`User role updated to ${newRole}.`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update role.');
            fetchUsers();
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This will also delete all associated applications and quizzes.')) return;

        setDeletingId(jobId);
        try {
            await apiClient.delete(`/admin/jobs/${jobId}`);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setSuccessMsg('Job deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete job.');
        } finally {
            setDeletingId(null);
        }
    };

    const adminCount = users.filter(u => u.role === 'ADMIN').length;

    const roleStyles = {
        JOBSEEKER: 'bg-blue-300 text-stone-900',
        EMPLOYER: 'bg-purple-300 text-stone-900',
        ADMIN: 'bg-rose-400 text-white',
    };

    const jobStatusStyles = {
        ACTIVE: 'bg-green-300 text-green-900',
        CLOSED: 'bg-stone-300 text-stone-600',
        DRAFT: 'bg-yellow-300 text-yellow-900',
        EXPIRED: 'bg-rose-300 text-rose-900',
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">Admin Panel</h2>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 font-bold uppercase tracking-widest">Manage users, jobs and platform data</p>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, bg: 'bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' },
                        { label: 'Job Seekers', value: stats.totalJobSeekers, bg: 'bg-blue-200 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
                        { label: 'Employers', value: stats.totalEmployers, bg: 'bg-purple-200 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' },
                        { label: 'Total Jobs', value: stats.totalJobs, bg: 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
                        { label: 'Active Jobs', value: stats.activeJobs, bg: 'bg-emerald-200 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' },
                        { label: 'Applications', value: stats.totalApplications, bg: 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] p-4 text-center`}>
                            <p className="text-2xl font-black">{stat.value}</p>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] overflow-hidden">
                <div className="flex">
                    {[
                        { key: 'users', label: `Users (${users.length})` },
                        { key: 'jobs', label: `Jobs (${jobs.length})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setError(''); setSuccessMsg(''); }}
                            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest border-b-[4px] transition-all
                                ${activeTab === tab.key
                                    ? 'border-orange-500 text-stone-900 dark:text-orange-400 bg-orange-50 dark:bg-stone-900'
                                    : 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-900'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-rose-500 border-[3px] border-stone-900 text-white px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError('')} className="ml-4 text-white/80 hover:text-white font-black">×</button>
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] flex items-center justify-between">
                            <span>{successMsg}</span>
                            <button onClick={() => setSuccessMsg('')} className="ml-4 text-stone-900/60 hover:text-stone-900 font-black">×</button>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            {loading && <Loader text="Loading users..." />}
                            {!loading && users.length === 0 && (
                                <div className="text-center py-8 text-stone-400 dark:text-stone-500 font-bold uppercase">No users found.</div>
                            )}
                            {!loading && users.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-[3px] border-stone-900 dark:border-stone-700">
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">ID</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Name</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Email</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Phone</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Role</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-[2px] divide-stone-200 dark:divide-stone-700">
                                            {users.map(user => {
                                                const isSelf = currentUser?.id === user.id;
                                                const isLastAdmin = user.role === 'ADMIN' && adminCount <= 1;
                                                return (
                                                    <tr key={user.id} className={`hover:bg-orange-50 dark:hover:bg-stone-900 transition ${isSelf ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                                        <td className="py-3 text-stone-400 dark:text-stone-500 font-bold">#{user.id}</td>
                                                        <td className="py-3 font-black text-stone-900 dark:text-gray-100 uppercase">
                                                            {user.firstName} {user.lastName}
                                                            {isSelf && <span className="ml-2 text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 uppercase">You</span>}
                                                        </td>
                                                        <td className="py-3 text-stone-600 dark:text-stone-400 font-bold">{user.email}</td>
                                                        <td className="py-3 text-stone-600 dark:text-stone-400 font-bold">{user.phone || '—'}</td>
                                                        <td className="py-3">
                                                            <span className={`text-xs font-black px-2 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase ${roleStyles[user.role]}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex gap-2 items-center">
                                                                <select
                                                                    value={user.role}
                                                                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                                    disabled={updatingId === user.id}
                                                                    className="text-xs border-[2px] border-stone-900 dark:border-stone-700 px-2 py-1 bg-white dark:bg-stone-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50 font-bold uppercase shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]"
                                                                >
                                                                    <option value="JOBSEEKER">JOBSEEKER</option>
                                                                    <option value="EMPLOYER">EMPLOYER</option>
                                                                    <option value="ADMIN">ADMIN</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    disabled={deletingId === user.id || isSelf || isLastAdmin}
                                                                    title={isSelf ? 'Cannot delete yourself' : isLastAdmin ? 'Cannot delete the last admin' : ''}
                                                                    className="text-xs bg-rose-100 dark:bg-rose-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-rose-700 dark:text-rose-400 font-bold uppercase px-3 py-1 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1c1917] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {deletingId === user.id ? '...' : 'Delete'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'jobs' && (
                        <div>
                            {jobs.length === 0 && (
                                <div className="text-center py-8 text-stone-400 dark:text-stone-500 font-bold uppercase">No jobs found.</div>
                            )}
                            {jobs.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-[3px] border-stone-900 dark:border-stone-700">
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">ID</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Title</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Employer</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Location</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Type</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Status</th>
                                                <th className="pb-3 text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest text-xs text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-[2px] divide-stone-200 dark:divide-stone-700">
                                            {jobs.map(job => (
                                                <tr key={job.id} className="hover:bg-orange-50 dark:hover:bg-stone-900 transition">
                                                    <td className="py-3 text-stone-400 dark:text-stone-500 font-bold">#{job.id}</td>
                                                    <td className="py-3 font-black text-stone-900 dark:text-gray-100 uppercase">{job.title}</td>
                                                    <td className="py-3 text-stone-600 dark:text-stone-400 font-bold">
                                                        {job.employer?.firstName} {job.employer?.lastName}
                                                    </td>
                                                    <td className="py-3 text-stone-600 dark:text-stone-400 font-bold">{job.location}</td>
                                                    <td className="py-3 text-stone-600 dark:text-stone-400 font-bold uppercase">
                                                        {job.jobType?.replace('_', ' ')}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`text-xs font-black px-2 py-1 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase
                                                            ${jobStatusStyles[job.status] || 'bg-stone-200 text-stone-600'}`}>
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <button
                                                            onClick={() => handleDeleteJob(job.id)}
                                                            disabled={deletingId === job.id}
                                                            className="text-xs bg-rose-100 dark:bg-rose-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-rose-700 dark:text-rose-400 font-bold uppercase px-3 py-1 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1c1917] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {deletingId === job.id ? '...' : 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
