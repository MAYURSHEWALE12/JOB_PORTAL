import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { applicationAPI, jobAPI, savedJobAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api';
import Loader from '../Loader';

const COLORS = ['#C2651A', '#4A7C59', '#D4A574', '#8B7355', '#6B9B7A', '#E8A66A'];

export default function Analytics() {
    const { user } = useAuthStore();

    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const [myApplications, setMyApplications] = useState([]);
    const [savedJobs, setSavedJobs]           = useState([]);
    const [myJobs, setMyJobs]               = useState([]);
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
                const jobsRes = await jobAPI.getAll();
                const jobs = (Array.isArray(jobsRes.data) ? jobsRes.data : [])
                    .filter(j => j.employer?.id === user.id);
                setMyJobs(jobs);

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
            <div className="text-center py-16 text-[#C2651A] font-medium">{error}</div>
        );
    }

    return (
        <div className="pb-12">
            <div className="mb-8">
                <h2 className="text-2xl font-serif font-semibold text-[#2D1F14]">📊 Analytics</h2>
                <p className="text-[#8B7355] mt-1">Your activity overview and insights</p>
            </div>

            {user?.role === 'JOBSEEKER' && (
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Total Applied',  value: myApplications.length, color: '#F5EDE3' },
                            { label: 'Pending',        value: myApplications.filter(a => a.status === 'PENDING').length,      color: '#FFF3E0' },
                            { label: 'Shortlisted',    value: myApplications.filter(a => a.status === 'SHORTLISTED').length,  color: '#E8F5E9' },
                            { label: 'Saved Jobs',     value: savedJobs.length,                                               color: '#E3F2FD' },
                        ].map(stat => (
                            <div key={stat.label} className="warm-card p-6 text-center">
                                <p className="text-4xl font-serif font-semibold mb-2" style={{ color: '#C2651A' }}>{stat.value}</p>
                                <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Status Breakdown</h3>
                            {applicationStatusData().length === 0 ? (
                                <div className="text-center py-12 text-[#8B7355]">No applications yet</div>
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
                                        >
                                            {applicationStatusData().map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Applications by Status</h3>
                            {applicationStatusData().length === 0 ? (
                                <div className="text-center py-12 text-[#8B7355]">No applications yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={applicationStatusData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#EAD9C4" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#8B7355" />
                                        <YAxis allowDecimals={false} stroke="#8B7355" />
                                        <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                        <Bar dataKey="value" fill="#C2651A" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="warm-card p-6"
                    >
                        <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Application Timeline</h3>
                        {applicationTimelineData().length === 0 ? (
                            <div className="text-center py-12 text-[#8B7355]">No applications yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={applicationTimelineData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EAD9C4" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8B7355" />
                                    <YAxis allowDecimals={false} stroke="#8B7355" />
                                    <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#C2651A"
                                        strokeWidth={3}
                                        dot={{ fill: '#C2651A', r: 5 }}
                                        activeDot={{ r: 7, fill: '#4A7C59' }}
                                        name="Applications"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </div>
            )}

            {user?.role === 'EMPLOYER' && (
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Total Jobs',      value: myJobs.length,                                                color: '#F5EDE3' },
                            { label: 'Active Jobs',     value: myJobs.filter(j => j.status === 'ACTIVE').length,            color: '#E8F5E9' },
                            { label: 'Total Apps',      value: allApplications.length,                                      color: '#E3F2FD' },
                            { label: 'Shortlisted',     value: allApplications.filter(a => a.status === 'SHORTLISTED').length, color: '#FFF3E0' },
                        ].map(stat => (
                            <div key={stat.label} className="warm-card p-6 text-center">
                                <p className="text-4xl font-serif font-semibold mb-2" style={{ color: '#4A7C59' }}>{stat.value}</p>
                                <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Applications per Job</h3>
                            {applicationsPerJobData().length === 0 ? (
                                <div className="text-center py-12 text-[#8B7355]">No jobs posted yet</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={applicationsPerJobData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#EAD9C4" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#8B7355" />
                                        <YAxis allowDecimals={false} stroke="#8B7355" />
                                        <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                        <Bar dataKey="applications" fill="#4A7C59" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Applicant Status</h3>
                            {applicationStatusEmployerData().length === 0 ? (
                                <div className="text-center py-12 text-[#8B7355]">No applications yet</div>
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
                                        >
                                            {applicationStatusEmployerData().map((_, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="warm-card p-6"
                    >
                        <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Job Status Overview</h3>
                        {jobStatusData().length === 0 ? (
                            <div className="text-center py-12 text-[#8B7355]">No jobs yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={jobStatusData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EAD9C4" vertical={false} />
                                    <XAxis dataKey="name" stroke="#8B7355" />
                                    <YAxis allowDecimals={false} stroke="#8B7355" />
                                    <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    <Bar dataKey="value" fill="#C2651A" radius={[8, 8, 0, 0]} name="Jobs" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>
                </div>
            )}

            {user?.role === 'ADMIN' && adminStats && (
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                    >
                        {[
                            { label: 'Total Users',   value: adminStats.totalUsers,        color: '#F5EDE3' },
                            { label: 'Job Seekers',   value: adminStats.totalJobSeekers,   color: '#E3F2FD' },
                            { label: 'Employers',     value: adminStats.totalEmployers,    color: '#FCE4EC' },
                            { label: 'Total Jobs',    value: adminStats.totalJobs,         color: '#E8F5E9' },
                            { label: 'Active Jobs',   value: adminStats.activeJobs,        color: '#FFF3E0' },
                            { label: 'Applications',  value: adminStats.totalApplications, color: '#F3E5F5' },
                        ].map(stat => (
                            <div key={stat.label} className="warm-card p-4 text-center">
                                <p className="text-2xl font-serif font-semibold mb-1" style={{ color: '#C2651A' }}>{stat.value}</p>
                                <p className="text-[10px] font-medium text-[#8B7355] uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">Platform Overview</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={adminOverviewData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#EAD9C4" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#8B7355" />
                                    <YAxis allowDecimals={false} stroke="#8B7355" />
                                    <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    <Bar dataKey="value" fill="#C2651A" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="warm-card p-6"
                        >
                            <h3 className="font-serif font-semibold text-[#2D1F14] mb-6">User Distribution</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={adminChartData()}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {adminChartData().map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', border: '1px solid #EAD9C4', borderRadius: '12px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
}
