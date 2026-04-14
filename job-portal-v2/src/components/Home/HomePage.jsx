import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobAPI } from '../../services/api';
import Loader from '../Loader';
import Footer from '../Footer';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } }
};

export default function HomePage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await jobAPI.getAll();
                const jobsData = res.data || [];
                setJobs(jobsData.reverse());
            } catch (err) {
                console.error("Failed to fetch jobs public", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const recentJobs = jobs.slice(0, 3);

    return (
        <div className="min-h-screen gradient-warm">
            <nav className="navbar-glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-[#EAD9C4]">
                <h1 className="text-2xl font-serif font-semibold text-gradient cursor-pointer">
                    Job Portal
                </h1>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="hidden sm:inline-block font-medium text-[#4A3728] hover:text-[#C2651A] transition-colors">
                        Login
                    </Link>
                    <Link to="/register" className="warm-btn text-sm">
                        Sign Up
                    </Link>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16 md:mb-24"
                >
                    <h2 className="text-4xl md:text-6xl font-serif font-semibold leading-tight mb-6">
                        Find Your Next
                        <br />
                        <span className="text-gradient">Big Opportunity</span>
                    </h2>
                    <p className="text-lg md:text-xl text-[#8B7355] max-w-2xl mx-auto mb-10">
                        Connect with top companies and discover opportunities that match your skills and ambitions.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link to="/register" className="warm-btn text-lg px-10 py-4">
                            Get Started
                        </Link>
                        <a href="#jobs" className="warm-btn-outline text-lg px-10 py-4">
                            Browse Jobs
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
                >
                    <motion.div variants={itemVariants} className="warm-card p-8 text-center">
                        <div className="text-5xl font-serif font-semibold mb-2" style={{ color: '#C2651A' }}>
                            {jobs.length > 0 ? jobs.length : '100+'}
                        </div>
                        <div className="text-[#8B7355] font-medium uppercase tracking-widest text-sm">Active Jobs</div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="warm-card p-8 text-center">
                        <div className="text-5xl font-serif font-semibold mb-2" style={{ color: '#4A7C59' }}>
                            5.2k
                        </div>
                        <div className="text-[#8B7355] font-medium uppercase tracking-widest text-sm">Users Hired</div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="warm-card p-8 text-center">
                        <div className="text-5xl font-serif font-semibold mb-2" style={{ color: '#C2651A' }}>
                            350+
                        </div>
                        <div className="text-[#8B7355] font-medium uppercase tracking-widest text-sm">Partner Companies</div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-20 warm-card p-8 md:p-12"
                >
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block bg-[#F5EDE3] text-[#C2651A] font-medium text-xs px-3 py-1 rounded-full mb-6">
                                Free Feature
                            </div>
                            <h3 className="text-3xl md:text-4xl font-serif font-semibold mb-6 leading-tight">
                                No Profile? <span style={{ color: '#C2651A' }}>No Problem.</span>
                            </h3>
                            <p className="text-[#8B7355] mb-8">
                                Generate a professional, high-impact resume in seconds.
                                No account required. Just fill, choose a template, and download.
                            </p>
                            <button
                                onClick={() => navigate('/resume-builder')}
                                className="warm-btn"
                            >
                                Launch Resume Builder
                            </button>
                        </div>
                        <div className="flex-1 hidden md:block">
                            <div className="bg-white border border-[#EAD9C4] rounded-2xl p-6 shadow-lg">
                                <div className="skeleton h-4 w-1/2 mb-4"></div>
                                <div className="skeleton h-2 w-full mb-2"></div>
                                <div className="skeleton h-2 w-full mb-2"></div>
                                <div className="skeleton h-2 w-3/4 mb-6"></div>
                                <div className="skeleton h-3 w-1/3 mb-3"></div>
                                <div className="skeleton h-2 w-full mb-2"></div>
                                <div className="skeleton h-2 w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div id="jobs" className="scroll-mt-24">
                    <div className="flex justify-between items-end mb-8">
                        <h3 className="text-2xl md:text-4xl font-serif font-semibold text-[#2D1F14]">
                            Current Openings
                        </h3>
                    </div>

                    {loading ? (
                        <Loader text="Loading Jobs..." />
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {recentJobs.map(job => (
                                <motion.div
                                    key={job.id}
                                    variants={itemVariants}
                                    onClick={() => setSelectedJob(job)}
                                    className="warm-card p-6 cursor-pointer flex flex-col h-full"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-full skeleton-circle flex items-center justify-center text-xl" style={{ backgroundColor: '#F5EDE3', color: '#C2651A' }}>
                                            {job.employer?.firstName ? job.employer.firstName.charAt(0).toUpperCase() : 'J'}
                                        </div>
                                        <span className="warm-pill text-xs">
                                            {job.jobType?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h4 className="font-serif font-semibold text-lg text-[#2D1F14] mb-1 line-clamp-2">
                                        {job.title}
                                    </h4>
                                    <p className="text-[#8B7355] text-sm mb-4">
                                        {job.employer?.firstName} {job.employer?.lastName}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-[#EAD9C4] space-y-2 text-sm text-[#8B7355]">
                                        <div className="flex items-center gap-2">
                                            <span>📍</span> {job.location}
                                        </div>
                                        {job.salaryMin && (
                                            <div className="flex items-center gap-2">
                                                <span>💰</span> ₹{Number(job.salaryMin).toLocaleString()} - ₹{Number(job.salaryMax).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
                                        className="warm-btn-outline mt-4 w-full text-sm"
                                    >
                                        Apply Now
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {!loading && jobs.length === 0 && (
                        <div className="text-center py-12 warm-card">
                            <p className="text-[#8B7355] font-medium">No jobs available right now.</p>
                        </div>
                    )}
                </div>
            </main>

            {selectedJob && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    onClick={() => setSelectedJob(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-[#FFFBF5] w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedJob(null)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center warm-card hover:border-[#C2651A] transition-colors text-xl"
                        >
                            ✕
                        </button>
                        <div className="mb-6 flex items-start gap-4 pr-12">
                            <div className="w-16 h-16 rounded-full skeleton-circle flex items-center justify-center text-2xl" style={{ backgroundColor: '#F5EDE3', color: '#C2651A' }}>
                                {selectedJob.employer?.firstName ? selectedJob.employer.firstName.charAt(0).toUpperCase() : 'J'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-semibold text-[#2D1F14] leading-none mb-2">
                                    {selectedJob.title}
                                </h2>
                                <p className="text-[#8B7355]">
                                    {selectedJob.employer?.firstName} {selectedJob.employer?.lastName}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="warm-pill text-xs">
                                {selectedJob.jobType?.replace('_', ' ')}
                            </span>
                            <span className="warm-pill text-xs" style={{ borderColor: '#4A7C59', color: '#4A7C59' }}>
                                {selectedJob.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-[#F5EDE3] p-4 rounded-xl">
                            <div>
                                <span className="block text-xs text-[#8B7355] mb-1">Location</span>
                                <span className="font-medium text-[#4A3728]">{selectedJob.location}</span>
                            </div>
                            {selectedJob.salaryMin && (
                                <div>
                                    <span className="block text-xs text-[#8B7355] mb-1">Salary</span>
                                    <span className="font-medium text-[#4A3728]">₹{Number(selectedJob.salaryMin).toLocaleString()} - ₹{Number(selectedJob.salaryMax).toLocaleString()}</span>
                                </div>
                            )}
                            {selectedJob.experienceRequired && (
                                <div>
                                    <span className="block text-xs text-[#8B7355] mb-1">Experience</span>
                                    <span className="font-medium text-[#4A3728]">{selectedJob.experienceRequired}</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-serif font-semibold text-[#2D1F14] mb-4">
                                Job Description
                            </h3>
                            <p className="text-[#4A3728] whitespace-pre-line">
                                {selectedJob.description}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-[#EAD9C4] text-center">
                            <p className="text-sm text-[#8B7355] mb-4">
                                Want to apply for this job?
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="warm-btn px-10 py-4"
                            >
                                Login to Apply
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <Footer />
        </div>
    );
}
