import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { applicationAPI, jobAPI, savedJobAPI, adminAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Skeleton, SkeletonAnalytics } from '../Skeleton';

// Theme-compliant colors (Teal, Purple, Emerald, Rose, Amber, Blue)
const THEME_COLORS = ['#2dd4bf', '#a78bfa', '#34d399', '#fb7185', '#fbbf24', '#60a5fa'];

export default function Analytics() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [myApplications, setMyApplications] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [allApplications, setAllApplications] = useState([]);
    const [adminStats, setAdminStats] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (user?.role === 'JOBSEEKER') {
                const [appsRes, savedRes] = await Promise.all([
                    applicationAPI.getMyApplications(user.id),
                    savedJobAPI.getSaved(user.id),
                ]);
                setMyApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
                setSavedJobs(Array.isArray(savedRes.data) ? savedRes.data : []);
            }

            if (user?.role === 'EMPLOYER') {
                const jobsRes = await jobAPI.getByEmployer(user.id);
                const appsRes = await applicationAPI.getEmployerApplications(0, 500);

                let jobs = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data?.content || []);
                setMyJobs(jobs);
                setAllApplications(appsRes.data?.content || appsRes.data || []);
            }

            if (user?.role === 'ADMIN') {
                const res = await adminAPI.getStats();
                setAdminStats(res.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load insights. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    /* ─── Data Formatters ─── */

    // Jobseeker Data
    const applicationStatusData = () => {
        const counts = {};
        myApplications.forEach(app => { counts[app.status] = (counts[app.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const applicationTimelineData = () => {
        const counts = {};
        myApplications.forEach(app => {
            const date = new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.entries(counts).map(([date, count]) => ({ date, count }));
    };

    // Employer Data
    const applicationsPerJobData = () => {
        return myJobs.map(job => ({
            name: job.title.length > 12 ? job.title.substring(0, 12) + '...' : job.title,
            applications: allApplications.filter(a => a.job?.id === job.id).length,
        }));
    };

    const applicationStatusEmployerData = () => {
        const counts = {};
        allApplications.forEach(app => { counts[app.status] = (counts[app.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const jobStatusData = () => {
        const counts = {};
        myJobs.forEach(job => { counts[job.status] = (counts[job.status] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    // Custom Tooltip Component for all charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 rounded-xl border shadow-xl" style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(10px)', borderColor: 'var(--hp-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--hp-muted)' }}>{label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--hp-accent)' }}>
                        {payload[0].name}: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="pb-12">
                <div className="mb-8">
                    <Skeleton variant="title" className="w-40 mb-2" />
                    <Skeleton variant="text" className="w-64" />
                </div>
                <SkeletonAnalytics />
            </div>
        );
    }

    if (error) {
        return (
            <div className="hp-card p-12 text-center max-w-md mx-auto mt-10">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="font-bold text-[var(--hp-text)]">{error}</p>
                <button onClick={fetchData} className="hp-btn-ghost mt-4 px-6 py-2 text-sm">Retry Load</button>
            </div>
        );
    }

    return (
        <div className="pb-12 relative z-10">
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all 0.25s ease; }
                .hp-card:hover { border-color: rgba(var(--hp-accent-rgb), 0.3); transform: translateY(-2px); }
                .chart-container { width: 100%; height: 300px; margin-top: 20px; }
            `}</style>

            <div className="mb-10">
                <h2 className="text-3xl font-bold text-[var(--hp-text)] tracking-tight">Insights</h2>
                <p className="text-[var(--hp-muted)] mt-1 font-medium">Visualizing your platform activity and progress</p>
            </div>

            {/* ── JOBSEEKER VIEW ── */}
            {user?.role === 'JOBSEEKER' && (
                <div className="space-y-8">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Applied', value: myApplications.length, icon: '🚀' },
                            { label: 'Pending', value: myApplications.filter(a => a.status === 'PENDING').length, icon: '⏳' },
                            { label: 'Shortlisted', value: myApplications.filter(a => a.status === 'SHORTLISTED').length, icon: '⭐' },
                            { label: 'Saved', value: savedJobs.length, icon: '🔖' },
                        ].map(stat => (
                            <div key={stat.label} className="hp-card p-6 text-center group">
                                <span className="text-2xl mb-2 block opacity-80 group-hover:scale-125 transition-transform">{stat.icon}</span>
                                <p className="text-4xl font-black mb-1" style={{ color: 'var(--hp-accent)' }}>{stat.value}</p>
                                <p className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Status Distribution</h3>
                            {applicationStatusData().length === 0 ? (
                                <div className="h-[280px] flex items-center justify-center text-[var(--hp-muted)] italic">No applications recorded</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={applicationStatusData()} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {applicationStatusData().map((_, i) => <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Activity Volume</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={applicationStatusData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hp-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: 'var(--hp-surface-alt)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="var(--hp-accent)" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hp-card p-6">
                        <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Application Timeline</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={applicationTimelineData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hp-border)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="count" name="Apps" stroke="var(--hp-accent2)" strokeWidth={4} dot={{ r: 6, fill: 'var(--hp-accent2)', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
            )}

            {/* ── EMPLOYER VIEW ── */}
            {user?.role === 'EMPLOYER' && (
                <div className="space-y-8">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Postings', value: myJobs.length, color: 'var(--hp-text)' },
                            { label: 'Active Roles', value: myJobs.filter(j => j.status === 'ACTIVE').length, color: 'var(--hp-accent)' },
                            { label: 'Total Applicants', value: allApplications.length, color: 'var(--hp-accent2)' },
                            { label: 'Hiring Stage', value: allApplications.filter(a => a.status === 'SHORTLISTED').length, color: '#34d399' },
                        ].map(stat => (
                            <div key={stat.label} className="hp-card p-6 text-center">
                                <p className="text-4xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CHART 1: Applications per Job */}
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Applicant Volume per Job</h3>
                            {applicationsPerJobData().length === 0 ? (
                                <div className="h-[280px] flex items-center justify-center text-[var(--hp-muted)] italic">No jobs posted yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={applicationsPerJobData()} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--hp-border)" />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-text)', fontSize: 11, fontWeight: 600 }} />
                                        <Tooltip cursor={{ fill: 'var(--hp-surface-alt)' }} content={<CustomTooltip />} />
                                        <Bar dataKey="applications" fill="var(--hp-accent)" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>

                        {/* CHART 2: Applicant Lifecycle (Pie) */}
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Applicant Lifecycle</h3>
                            {applicationStatusEmployerData().length === 0 ? (
                                <div className="h-[280px] flex items-center justify-center text-[var(--hp-muted)] italic">No applications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={applicationStatusEmployerData()} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {applicationStatusEmployerData().map((_, i) => <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>
                    </div>

                    {/* CHART 3: Job Status Overview (Bar) */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hp-card p-6">
                        <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-2" style={{ borderColor: 'var(--hp-border)' }}>Job Status Overview</h3>
                        {jobStatusData().length === 0 ? (
                            <div className="h-[280px] flex items-center justify-center text-[var(--hp-muted)] italic">No jobs yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={jobStatusData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hp-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: 'var(--hp-surface-alt)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="var(--hp-accent2)" radius={[6, 6, 0, 0]} name="Jobs" barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </div>
            )}

            {/* ── ADMIN VIEW ── */}
            {user?.role === 'ADMIN' && adminStats && (
                <div className="space-y-8">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { label: 'Users', value: adminStats.totalUsers },
                            { label: 'Seekers', value: adminStats.totalJobSeekers },
                            { label: 'Employers', value: adminStats.totalEmployers },
                            { label: 'Jobs', value: adminStats.totalJobs },
                            { label: 'Active', value: adminStats.activeJobs },
                            { label: 'Apps', value: adminStats.totalApplications },
                        ].map(stat => (
                            <div key={stat.label} className="hp-card p-4 text-center">
                                <p className="text-2xl font-black text-[var(--hp-accent)]">{stat.value}</p>
                                <p className="text-[9px] font-bold text-[var(--hp-muted)] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-4" style={{ borderColor: 'var(--hp-border)' }}>Platform Footprint</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={[
                                    { name: 'Users', val: adminStats.totalUsers },
                                    { name: 'Jobs', val: adminStats.totalJobs },
                                    { name: 'Apps', val: adminStats.totalApplications }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hp-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--hp-muted)', fontSize: 11 }} />
                                    <Tooltip cursor={{ fill: 'var(--hp-surface-alt)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="val" fill="var(--hp-accent2)" radius={[6, 6, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="hp-card p-6">
                            <h3 className="font-bold text-[var(--hp-text)] text-lg border-b pb-4 mb-4" style={{ borderColor: 'var(--hp-border)' }}>User Split</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={[
                                        { name: 'Job Seekers', value: adminStats.totalJobSeekers },
                                        { name: 'Employers', value: adminStats.totalEmployers }
                                    ]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value">
                                        <Cell fill="var(--hp-accent)" stroke="none" />
                                        <Cell fill="var(--hp-accent2)" stroke="none" />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}