import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { jobAPI } from '../../services/api';

export default function PostJob() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        location: '',
        jobType: 'FULL_TIME',
        salaryMin: '',
        salaryMax: '',
        experienceRequired: '',
        positionsAvailable: 1,
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setSuccess('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!formData.title.trim()) {
            setError('Job title is required.');
            setLoading(false);
            return;
        }
        if (!formData.description.trim()) {
            setError('Job description is required.');
            setLoading(false);
            return;
        }
        if (!formData.location.trim()) {
            setError('Location is required.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
                positionsAvailable: formData.positionsAvailable ? Number(formData.positionsAvailable) : 1,
            };

            const res = await jobAPI.create(payload, user.id);
            const jobId = res.data?.id;

            setSuccess('Job posted successfully! Redirecting to add an assessment...');
            setFormData({
                title: '',
                description: '',
                requirements: '',
                location: '',
                jobType: 'FULL_TIME',
                salaryMin: '',
                salaryMax: '',
                experienceRequired: '',
                positionsAvailable: 1,
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (jobId) {
                setTimeout(() => {
                    navigate(`/quiz/create/${jobId}`);
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post job. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    // ── EMPLOYERS ONLY FALLBACK ──
    if (user?.role !== 'EMPLOYER') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="hp-card p-12 text-center max-w-md mx-auto mt-20 shadow-2xl relative z-10"
            >
                <style>{`
                    .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); }
                `}</style>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                    <svg className="w-10 h-10" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="font-bold text-2xl mb-3 text-[var(--hp-text)] tracking-tight">Employers Only</h2>
                <p className="text-[var(--hp-muted)] leading-relaxed">
                    You need an active employer account to access the job posting portal and recruit candidates.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="pb-20 relative z-10">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
            >
                <div className="mb-10 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight mb-3">
                        Post a New Role
                    </h2>
                    <p className="text-[var(--hp-muted)] text-sm font-medium">Reach thousands of job seekers and find your perfect candidate.</p>
                </div>

                <div className="hp-card p-6 sm:p-10 relative overflow-hidden">
                    {/* Subtle background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(var(--hp-accent-rgb),0.05) 0%, transparent 70%)' }} />

                    <AnimatePresence mode="wait">
                        {success && (
                            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                                className="mb-8 p-4 rounded-xl text-sm font-bold flex items-center gap-3 overflow-hidden"
                                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {success}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                                className="mb-8 p-4 rounded-xl text-sm font-bold flex items-center gap-3 overflow-hidden"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                        {/* SECTION: Basic Details */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[var(--hp-border)]">
                                <span className="w-8 h-8 rounded-lg bg-[var(--hp-accent)]/10 text-[var(--hp-accent)] flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </span>
                                <h3 className="db-gradient-text font-black text-xs uppercase tracking-widest">Basic Details</h3>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="hp-label">
                                        Job Title <span className="text-red-400">*</span>
                                    </label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <input
                                            type="text" name="title" value={formData.title} onChange={handleChange}
                                            placeholder="e.g. Senior Full Stack Engineer"
                                            className="hp-input pl-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="hp-label">
                                            Location <span className="text-red-400">*</span>
                                        </label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <input
                                                type="text" name="location" value={formData.location} onChange={handleChange}
                                                placeholder="e.g. Pune, Mumbai, Remote"
                                                className="hp-input pl-11"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="hp-label">Job Type</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <select
                                                name="jobType" value={formData.jobType} onChange={handleChange}
                                                className="hp-input pl-11 appearance-none"
                                            >
                                                <option value="FULL_TIME">Full Time</option>
                                                <option value="PART_TIME">Part Time</option>
                                                <option value="CONTRACT">Contract</option>
                                                <option value="REMOTE">Remote</option>
                                                <option value="FREELANCE">Freelance</option>
                                                <option value="TEMPORARY">Temporary</option>
                                            </select>
                                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: Compensation & Logistics */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 mt-8 pb-2 border-b border-[var(--hp-border)]">
                                <span className="w-8 h-8 rounded-lg bg-[var(--hp-accent2)]/10 text-[var(--hp-accent2)] flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.67-1M12 16v1m4-12V3c0-1.105-1.343-2-3-2s-3 .895-3 2v2M9 5H1m14 0h8" /></svg>
                                </span>
                                <h3 className="db-gradient-text font-black text-xs uppercase tracking-widest">Compensation & Logistics</h3>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="hp-label">Min Salary (₹)</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <input
                                                type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange}
                                                placeholder="e.g. 500000"
                                                className="hp-input pl-11"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="hp-label">Max Salary (₹)</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <input
                                                type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange}
                                                placeholder="e.g. 1200000"
                                                className="hp-input pl-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="hp-label">Experience Required</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            <input
                                                type="text" name="experienceRequired" value={formData.experienceRequired} onChange={handleChange}
                                                placeholder="e.g. 2-4 years"
                                                className="hp-input pl-11"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="hp-label">Positions Available</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            <input
                                                type="number" name="positionsAvailable" value={formData.positionsAvailable} onChange={handleChange} min="1"
                                                className="hp-input pl-11"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: Detailed Descriptions */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 mt-8 pb-2 border-b border-[var(--hp-border)]">
                                <span className="w-8 h-8 rounded-lg bg-[var(--hp-accent)]/10 text-[var(--hp-accent)] flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </span>
                                <h3 className="db-gradient-text font-black text-xs uppercase tracking-widest">Job Content</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="hp-label mb-0">
                                            Job Description <span className="text-red-400">*</span>
                                        </label>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] text-[var(--hp-muted)]">M↓ Markdown</span>
                                    </div>
                                    <textarea
                                        name="description" value={formData.description} onChange={handleChange} rows={6}
                                        placeholder="Describe the role... Use # for headings, * for bullets, **bold** for emphasis."
                                        className="hp-textarea"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="hp-label mb-0">
                                            Requirements
                                        </label>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] text-[var(--hp-muted)]">M↓ Markdown</span>
                                    </div>
                                    <textarea
                                        name="requirements" value={formData.requirements} onChange={handleChange} rows={5}
                                        placeholder="List specific skills or qualifications... (Markdown supported)"
                                        className="hp-textarea"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t mt-8" style={{ borderColor: 'var(--hp-border)' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="hp-btn-primary w-full py-4 text-base"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Posting Role...
                                    </span>
                                ) : 'Publish Job Listing'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}