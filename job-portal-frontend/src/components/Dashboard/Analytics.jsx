import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { applicationAPI, jobAPI, savedJobAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';
import Loader from '../Loader';

// Vibrant Neobrutalist colors: Orange, Emerald, Gold, Rose, Indigo, Cyan
const COLORS = ['#ea580c', '#10b981', '#f59e0b', '#e11d48', '#6366f1', '#06b6d4'];

export default function Analytics() {
    const { user } = useAuthStore();

    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    // Jobseeker data
    const [myApplications, setMyApplications] = useState([]);
    const [savedJobs, setSavedJobs]           = useState([]);

    // Employer data
    const [myJobs, setMyJobs]               = useState([]);
    const [allApplications, setAllApplications] = useState([]);

    // Admin data
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
                const jobsRes = await jobAPI.getJobsByEmployer(user.id);
                const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
                setMyJobs(jobs);

                // Get applications for each job
                const appsPromises = jobs.map(job =>
                    applicationAPI.getJobApplications(job.id, user.id)
                        .then(res => res.data)
                        .catch(() => [])
                );
                const appsArrays = await Promise.all(appsPromises);
                setAllApplications(appsArrays.flat());
            }

            if (user?.role === 'ADMIN') {
                const res = await apiClient.get('/admin/stats');
                setAdminStats(res.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Jobseeker Charts Data ─────────────────────────────────────────────────
    const applicationStatusData = () => {
        const counts = {};
        myApplications.forEach(app => {
            counts[app.status] = (counts[app.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const applicationTimelineData = () => {
        const counts = {};
        myApplications.forEach(app => {
            const date = new Date(app.appliedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
            });
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.entries(counts).map(([date, count]) => ({ date, count }));
    };

    // ─── Employer Charts Data ──────────────────────────────────────────────────
    const jobStatusData = () => {
        const counts = {};
        myJobs.forEach(job => {
            counts[job.status] = (counts[job.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const applicationsPerJobData = () => {
        return myJobs.map(job => ({
            name: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
            applications: allApplications.filter(a => a.job?.id === job.id).length,
        }));
    };

    const applicationStatusEmployerData = () => {
        const counts = {};
        allApplications.forEach(app => {
            counts[app.status] = (counts[app.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    // ─── Admin Charts Data ─────────────────────────────────────────────────────
    const adminChartData = () => {
        if (!adminStats) return [];
        return [
            { name: 'Job Seekers', value: adminStats.totalJobSeekers },
            { name: 'Employers',   value: adminStats.totalEmployers  },
        ];
    };

    const adminOverviewData = () => {
        if (!adminStats) return [];
        return [
            { name: 'Users',        value: adminStats.totalUsers        },
            { name: 'Jobs',         value: adminStats.totalJobs         },
            { name: 'Active Jobs',  value: adminStats.activeJobs        },
            { name: 'Applications', value: adminStats.totalApplications },
        ];
    };

    if (loading) {
        return <Loader text="Loading analytics..." />;
    }

    if (error) {
        return (
            <div className="text-center py-16 text-rose-600 dark:text-rose-500 font-bold uppercase">{error}</div>
        );
    }

    return (
        <div className="pb-12">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">📊 Analytics</h2>
                <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 uppercase tracking-wider text-xs">
                    Your activity overview and insights
                </p>
            </div>

            {/* ════════════════════════════════════════════════════════
                JOBSEEKER ANALYTICS
            ════════════════════════════════════════════════════════ */}
            {user?.role === 'JOBSEEKER' && (
                <div className="space-y-8">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Applied',  value: myApplications.length,                                          color: 'bg-orange-300' },
                            { label: 'Pending',        value: myApplications.filter(a => a.status === 'PENDING').length,      color: 'bg-yellow-300' },
                            { label: 'Shortlisted',    value: myApplications.filter(a => a.status === 'SHORTLISTED').length,  color: 'bg-emerald-300'},
                            { label: 'Saved Jobs',     value: savedJobs.length,                                               color: 'bg-blue-300'   },
                        ].map(stat => (
                            <div key={stat.label} className={`${stat.color} text-stone-900 border-[4px] border-stone-900 shadow-[6px_6px_0_#1c1917] p-6 text-center transform hover:-translate-y-1 transition-transform`}>
                                <p className="text-5xl font-black">{stat.value}</p>
                                <p className="text-xs font-black mt-2 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Status Breakdown</h3>
                            {applicationStatusData().length === 0 ? (
                                <div className="text-center py-12 text-stone-500 font-bold uppercase">No applications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={applicationStatusData()}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                            stroke="#1c1917"
                                            strokeWidth={3}
                                        >
                                            {applicationStatusData().map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Applications by Status</h3>
                            {applicationStatusData().length === 0 ? (
                                <div className="text-center py-12 text-stone-500 font-bold uppercase">No applications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={applicationStatusData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="currentColor" />
                                        <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} cursor={{fill: 'rgba(0,0,0,0.1)'}} />
                                        <Bar dataKey="value" fill="#ea580c" stroke="#1c1917" strokeWidth={3} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                        <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Application Timeline</h3>
                        {applicationTimelineData().length === 0 ? (
                            <div className="text-center py-12 text-stone-500 font-bold uppercase">No applications yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={applicationTimelineData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="currentColor" />
                                    <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ fontWeight: 'bold' }} />
                                    <Line
                                        type="step"
                                        dataKey="count"
                                        stroke="#1c1917"
                                        strokeWidth={4}
                                        dot={{ fill: '#ea580c', r: 6, strokeWidth: 3, stroke: '#1c1917' }}
                                        activeDot={{ r: 8, fill: '#10b981' }}
                                        name="Applications"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                EMPLOYER ANALYTICS
            ════════════════════════════════════════════════════════ */}
            {user?.role === 'EMPLOYER' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Jobs',      value: myJobs.length,                                                color: 'bg-orange-300' },
                            { label: 'Active Jobs',     value: myJobs.filter(j => j.status === 'ACTIVE').length,            color: 'bg-emerald-300' },
                            { label: 'Total Apps',      value: allApplications.length,                                      color: 'bg-blue-300'   },
                            { label: 'Shortlisted',     value: allApplications.filter(a => a.status === 'SHORTLISTED').length, color: 'bg-yellow-300' },
                        ].map(stat => (
                            <div key={stat.label} className={`${stat.color} text-stone-900 border-[4px] border-stone-900 shadow-[6px_6px_0_#1c1917] p-6 text-center transform hover:-translate-y-1 transition-transform`}>
                                <p className="text-5xl font-black">{stat.value}</p>
                                <p className="text-xs font-black mt-2 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Applications per Job</h3>
                            {applicationsPerJobData().length === 0 ? (
                                <div className="text-center py-12 text-stone-500 font-bold uppercase">No jobs posted yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={applicationsPerJobData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="currentColor" />
                                        <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} cursor={{fill: 'rgba(0,0,0,0.1)'}} />
                                        <Bar dataKey="applications" fill="#10b981" stroke="#1c1917" strokeWidth={3} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Applicant Status</h3>
                            {applicationStatusEmployerData().length === 0 ? (
                                <div className="text-center py-12 text-stone-500 font-bold uppercase">No applications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={applicationStatusEmployerData()}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                            stroke="#1c1917"
                                            strokeWidth={3}
                                        >
                                            {applicationStatusEmployerData().map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                        <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Job Status Overview</h3>
                        {jobStatusData().length === 0 ? (
                            <div className="text-center py-12 text-stone-500 font-bold uppercase">No jobs yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={jobStatusData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="name" stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                    <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} cursor={{fill: 'rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="value" fill="#ea580c" stroke="#1c1917" strokeWidth={3} name="Jobs" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                ADMIN ANALYTICS
            ════════════════════════════════════════════════════════ */}
            {user?.role === 'ADMIN' && adminStats && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            { label: 'Total Users',   value: adminStats.totalUsers,        color: 'bg-orange-300' },
                            { label: 'Job Seekers',   value: adminStats.totalJobSeekers,   color: 'bg-blue-300'   },
                            { label: 'Employers',     value: adminStats.totalEmployers,    color: 'bg-rose-300'   },
                            { label: 'Total Jobs',    value: adminStats.totalJobs,         color: 'bg-emerald-300'},
                            { label: 'Active Jobs',   value: adminStats.activeJobs,        color: 'bg-yellow-300' },
                            { label: 'Applications',  value: adminStats.totalApplications, color: 'bg-cyan-300'   },
                        ].map(stat => (
                            <div key={stat.label} className={`${stat.color} text-stone-900 border-[4px] border-stone-900 shadow-[6px_6px_0_#1c1917] p-4 text-center transform hover:-translate-y-1 transition-transform`}>
                                <p className="text-3xl font-black">{stat.value}</p>
                                <p className="text-[10px] font-black mt-2 uppercase tracking-widest leading-tight">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">Platform Overview</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={adminOverviewData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="currentColor" />
                                    <YAxis allowDecimals={false} stroke="currentColor" tick={{ fontWeight: 'bold' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} cursor={{fill: 'rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="value" fill="#6366f1" stroke="#1c1917" strokeWidth={3} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8">
                            <h3 className="font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-6 text-xl">User Distribution</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={adminChartData()}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        stroke="#1c1917"
                                        strokeWidth={3}
                                    >
                                        {adminChartData().map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', border: 'none', fontWeight: 'bold' }} />
                                    <Legend wrapperStyle={{ fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}