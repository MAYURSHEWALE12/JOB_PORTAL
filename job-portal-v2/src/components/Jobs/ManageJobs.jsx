import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobAPI, quizAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { SkeletonJobCard } from '../Skeleton';

export default function ManageJobs() {
    const { user } = useAuthStore();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingJob, setEditingJob] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [showQuizModal, setShowQuizModal] = useState(false);
    const [selectedJobForQuiz, setSelectedJobForQuiz] = useState(null);
    const [existingQuiz, setExistingQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);

    // New states for inline quiz notifications
    const [quizError, setQuizError] = useState('');
    const [quizSuccess, setQuizSuccess] = useState('');

    const [quizForm, setQuizForm] = useState({
        title: '',
        passingScore: 70,
        timeLimit: 30,
        questions: [{ question: '', options: ['', ''], correctAnswer: 0 }],
    });
    const [savingQuiz, setSavingQuiz] = useState(false);

    const emptyForm = {
        title: '', description: '', requirements: '', location: '',
        jobType: 'FULL_TIME', salaryMin: '', salaryMax: '',
        experienceRequired: '', positionsAvailable: 1,
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (user?.id) {
            fetchMyJobs();
        }
    }, [user]);

    const fetchMyJobs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await jobAPI.getByEmployer(user.id);
            let jobsData = res.data;
            if (!Array.isArray(jobsData)) {
                jobsData = jobsData?.content || jobsData?.jobs || [];
            }
            setJobs(jobsData.reverse());
        } catch (err) {
            console.error(err);
            setError('Failed to load jobs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            description: job.description || '',
            requirements: job.requirements || '',
            location: job.location || '',
            jobType: job.jobType || 'FULL_TIME',
            salaryMin: job.salaryMin || '',
            salaryMax: job.salaryMax || '',
            experienceRequired: job.experienceRequired || '',
            positionsAvailable: job.positionsAvailable || 1,
        });
        setSuccessMsg('');
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingJob(null);
        setFormData(emptyForm);
        setError('');
        setSuccessMsg('');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) { setError('Title is required.'); return; }
        if (!formData.description.trim()) { setError('Description is required.'); return; }
        if (!formData.location.trim()) { setError('Location is required.'); return; }

        setSaving(true);
        setError('');
        try {
            const payload = {
                ...formData,
                salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
                salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
                positionsAvailable: formData.positionsAvailable ? Number(formData.positionsAvailable) : 1,
            };
            await jobAPI.update(editingJob.id, payload, user.id);
            setSuccessMsg('Job updated successfully!');
            fetchMyJobs();
            setTimeout(() => {
                setEditingJob(null);
                setFormData(emptyForm);
                setSuccessMsg('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update job.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job posting permanently?')) return;
        setDeletingId(jobId);
        setError('');
        try {
            await jobAPI.delete(jobId, user.id);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            if (editingJob?.id === jobId) {
                setEditingJob(null);
                setFormData(emptyForm);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete job.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleClose = async (jobId) => {
        if (!window.confirm('Are you sure you want to close this job? Candidates will no longer be able to apply.')) return;
        setError('');
        try {
            await jobAPI.close(jobId, user.id);
            setJobs(prev =>
                prev.map(j => j.id === jobId ? { ...j, status: 'CLOSED' } : j)
            );
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to close job.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const openQuizModal = async (job) => {
        setSelectedJobForQuiz(job);
        setShowQuizModal(true);
        setQuizLoading(true);
        setQuizError('');
        setQuizSuccess('');
        try {
            const res = await quizAPI.getFull(job.id);
            if (res.data) {
                setExistingQuiz(res.data);
                setQuizForm({
                    title: res.data.title || '',
                    passingScore: res.data.passingScore || 70,
                    timeLimit: res.data.timeLimit || 30,
                    questions: res.data.questions?.length > 0
                        ? res.data.questions.map(q => ({
                            question: q.text || '',
                            options: q.options?.map(o => o.text) || ['', ''],
                            correctAnswer: Math.max(0, q.options?.findIndex(o => o.isCorrect))
                        }))
                        : [{ question: '', options: ['', ''], correctAnswer: 0 }]
                });
            } else {
                setExistingQuiz(null);
                setQuizForm({
                    title: '', passingScore: 70, timeLimit: 30,
                    questions: [{ question: '', options: ['', ''], correctAnswer: 0 }],
                });
            }
        } catch (err) {
            console.error('Failed to load quiz:', err);
            setQuizForm({
                title: '', passingScore: 70, timeLimit: 30,
                questions: [{ question: '', options: ['', ''], correctAnswer: 0 }],
            });
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAddQuestion = () => {
        setQuizForm(prev => ({
            ...prev,
            questions: [...prev.questions, { question: '', options: ['', ''], correctAnswer: 0 }]
        }));
    };

    const handleRemoveQuestion = (index) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
        }));
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex
                    ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
                    : q
            )
        }));
    };

    const handleAddOption = (questionIndex) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex && q.options.length < 6
                    ? { ...q, options: [...q.options, ''] }
                    : q
            )
        }));
    };

    const handleRemoveOption = (questionIndex, optionIndex) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i !== questionIndex || q.options.length <= 2) return q;
                const newOptions = q.options.filter((_, idx) => idx !== optionIndex);
                let newCorrect = q.correctAnswer;
                if (q.correctAnswer === optionIndex) newCorrect = 0;
                else if (q.correctAnswer > optionIndex) newCorrect--;
                return { ...q, options: newOptions, correctAnswer: newCorrect };
            })
        }));
    };

    const handleSaveQuiz = async () => {
        setQuizError('');
        setQuizSuccess('');

        if (!quizForm.title.trim()) {
            setQuizError('Please enter an assessment title');
            return;
        }

        const validQuestions = quizForm.questions.filter(q => q.question.trim());

        if (validQuestions.length === 0) {
            setQuizError('Please add at least one valid question');
            return;
        }

        setSavingQuiz(true);
        try {
            const payload = {
                title: quizForm.title,
                passingScore: Number(quizForm.passingScore),
                timeLimit: Number(quizForm.timeLimit),
                questions: validQuestions.map(q => ({
                    text: q.question,
                    options: q.options.map((opt, idx) => ({
                        text: opt,
                        correct: idx === q.correctAnswer
                    })),
                    score: 1
                }))
            };
            await quizAPI.create({ ...payload, jobId: selectedJobForQuiz.id });
            setQuizSuccess('Assessment saved successfully!');
            fetchMyJobs();

            // Auto close modal after showing success message
            setTimeout(() => {
                setShowQuizModal(false);
                setQuizSuccess('');
            }, 1500);

        } catch (err) {
            setQuizError(err.response?.data?.error || 'Failed to save assessment');
        } finally {
            setSavingQuiz(false);
        }
    };

    const closeQuizModal = () => {
        setShowQuizModal(false);
        setSelectedJobForQuiz(null);
        setExistingQuiz(null);
        setQuizError('');
        setQuizSuccess('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 relative z-10">

            <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight">
                    Manage Postings
                </h2>
                <p className="text-[var(--hp-muted)] font-medium mt-1">Oversee, edit, and configure assessments for your active roles.</p>
            </div>

            {error && !editingJob && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 rounded-xl text-sm font-bold flex items-center gap-2"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </motion.div>
            )}

            <AnimatePresence>
                {editingJob && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className="hp-card p-6 sm:p-8 mb-10 border-[var(--hp-accent)] shadow-[0_8px_30px_rgba(var(--hp-accent-rgb),0.15)] overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(var(--hp-accent-rgb),0.08) 0%, transparent 70%)' }} />

                        <div className="flex justify-between items-center mb-6 border-b pb-4 relative z-10" style={{ borderColor: 'var(--hp-border)' }}>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight">
                                    Edit Listing
                                </h3>
                                <p className="text-[var(--hp-accent)] font-medium text-sm">{editingJob.title}</p>
                            </div>
                            <button onClick={handleCancelEdit} className="hp-btn-ghost px-4 py-2 text-sm">
                                Cancel Edit
                            </button>
                        </div>

                        {successMsg && (
                            <div className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                {successMsg}
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-5 relative z-10">
                            <div>
                                <label className="hp-label">Job Title *</label>
                                <div className="hp-input-group">
                                    <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="hp-input" />
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="hp-label">Location *</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="hp-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="hp-label">Job Type</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <select name="jobType" value={formData.jobType} onChange={handleChange} className="hp-input appearance-none">
                                            <option value="FULL_TIME" style={{ background: 'var(--hp-card)' }}>Full Time</option>
                                            <option value="PART_TIME" style={{ background: 'var(--hp-card)' }}>Part Time</option>
                                            <option value="CONTRACT" style={{ background: 'var(--hp-card)' }}>Contract</option>
                                            <option value="REMOTE" style={{ background: 'var(--hp-card)' }}>Remote</option>
                                            <option value="FREELANCE" style={{ background: 'var(--hp-card)' }}>Freelance</option>
                                        </select>
                                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="hp-label">Min Salary (₹)</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} className="hp-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="hp-label">Max Salary (₹)</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} className="hp-input" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="hp-label">Experience Required</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                                        <input type="text" name="experienceRequired" value={formData.experienceRequired} onChange={handleChange} placeholder="e.g. 2+ years" className="hp-input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="hp-label">Positions Available</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        <input type="number" name="positionsAvailable" value={formData.positionsAvailable} onChange={handleChange} min="1" className="hp-input" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="hp-label flex justify-between">
                                    <span>Description *</span>
                                    <span className="text-[10px] text-[var(--hp-muted)]">Supports Markdown</span>
                                </label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="hp-input resize-none" />
                            </div>

                            <div>
                                <label className="hp-label flex justify-between">
                                    <span>Requirements</span>
                                    <span className="text-[10px] text-[var(--hp-muted)]">Supports Markdown</span>
                                </label>
                                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4} className="hp-input resize-none" />
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={saving} className="hp-btn-primary w-full py-4 text-base">
                                    {saving ? 'Updating Listing...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading && jobs.length === 0 && (
                    <><SkeletonJobCard /><SkeletonJobCard /><SkeletonJobCard /></>
                )}

                {!loading && jobs.length === 0 && (
                    <div className="col-span-full hp-card p-16 text-center shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                            <svg className="w-10 h-10" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight">No Active Postings</h3>
                        <p className="text-[var(--hp-muted)] mt-2">Publish your first job to start building your team.</p>
                    </div>
                )}

                <AnimatePresence>
                    {jobs.map((job) => (
                        <motion.div
                            key={job.id} layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="hp-card hp-card-hover p-6 flex flex-col h-full relative overflow-hidden"
                        >
                            {job.status === 'CLOSED' && (
                                <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl font-bold text-[10px] tracking-widest uppercase border-l border-b"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                                    Closed
                                </div>
                            )}

                            <div className="mb-4 pr-16">
                                <h3 className="text-lg font-bold text-[var(--hp-text)] leading-snug line-clamp-2 mb-1.5">
                                    {job.title}
                                </h3>
                                <p className="text-[var(--hp-muted)] text-sm flex items-center gap-1.5 font-medium">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {job.location}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-auto pb-6">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-muted)', borderColor: 'var(--hp-border)' }}>
                                    {job.jobType?.replace('_', ' ')}
                                </span>
                                {job.salaryMax && (
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}>
                                        ₹{job.salaryMin ? `${job.salaryMin / 1000}k` : '0'} - {job.salaryMax / 1000}k
                                    </span>
                                )}
                                {job.experienceRequired && (
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border" style={{ background: 'var(--hp-surface-alt)', color: 'var(--hp-text-sub)', borderColor: 'var(--hp-border)' }}>
                                        {job.experienceRequired}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-4 border-t" style={{ borderColor: 'var(--hp-border)' }}>
                                <button onClick={() => handleEdit(job)} className="action-btn edit" title="Edit Job">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    <span className="text-[10px] font-bold tracking-wider">Edit</span>
                                </button>

                                <button onClick={() => openQuizModal(job)} className="action-btn quiz" title="Assessment">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="text-[10px] font-bold tracking-wider">Quiz</span>
                                </button>

                                {job.status !== 'CLOSED' ? (
                                    <button onClick={() => handleClose(job.id)} className="action-btn close" title="Close Applications">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        <span className="text-[10px] font-bold tracking-wider">Close</span>
                                    </button>
                                ) : (
                                    <div className="action-btn opacity-50 cursor-not-allowed">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        <span className="text-[10px] font-bold tracking-wider">Closed</span>
                                    </div>
                                )}

                                <button onClick={() => handleDelete(job.id)} disabled={deletingId === job.id} className="action-btn delete" title="Delete Post">
                                    {deletingId === job.id ? (
                                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    )}
                                    <span className="text-[10px] font-bold tracking-wider">Delete</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Quiz Modal Portal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showQuizModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 hp-modal-overlay"
                            onClick={closeQuizModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                                className="hp-card w-full max-w-3xl max-h-[90vh] flex flex-col relative border-none shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="sticky top-0 p-6 border-b flex justify-between items-center z-[20] shadow-sm" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-[var(--hp-accent2)] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                                                Recruitment Quiz
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight">
                                            {existingQuiz ? 'Refine Assessment' : 'New Candidate Assessment'}
                                        </h3>
                                        <p className="text-[var(--hp-muted)] text-[11px] font-bold uppercase tracking-wider mt-1">{selectedJobForQuiz?.title}</p>
                                    </div>
                                    <button onClick={closeQuizModal} className="p-2 rounded-full hover:bg-black/5 transition-colors text-[var(--hp-muted)]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {quizLoading ? (
                                    <div className="text-center py-20 flex-1 bg-[var(--hp-card)]">
                                        <div className="w-10 h-10 border-2 border-[var(--hp-accent2)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-[var(--hp-muted)] font-bold text-xs uppercase tracking-widest">Compiling Quiz Schema...</p>
                                    </div>
                                ) : (
                                    <div className="p-6 pb-24 space-y-8 flex-1 bg-[var(--hp-card)] overflow-y-auto">
                                        <AnimatePresence mode="wait">
                                            {quizError && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {quizError}
                                                </motion.div>
                                            )}
                                            {quizSuccess && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    {quizSuccess}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* SECTION: Global Quiz Config */}
                                        <div className="p-5 rounded-2xl border bg-[var(--hp-surface-alt)]/30 border-[var(--hp-border)]">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-5 text-[var(--hp-muted)]">Assessment Configuration</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="hp-label">Quiz Title *</label>
                                                    <input type="text" value={quizForm.title} onChange={(e) => { setQuizForm(prev => ({ ...prev, title: e.target.value })); setQuizError(''); }} placeholder="e.g., Core React Principles & Architecture" className="hp-input" style={{ background: 'var(--hp-card)' }} />
                                                </div>
                                                <div>
                                                    <label className="hp-label">Passing Score (%)</label>
                                                    <input type="number" value={quizForm.passingScore} onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: e.target.value }))} className="hp-input" min="0" max="100" style={{ background: 'var(--hp-card)' }} />
                                                </div>
                                                <div>
                                                    <label className="hp-label">Time Limit (Minutes)</label>
                                                    <input type="number" value={quizForm.timeLimit} onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: e.target.value }))} className="hp-input" min="1" style={{ background: 'var(--hp-card)' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION: Question Bank */}
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center px-1">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-muted)]">Question Set ({quizForm.questions.length})</h4>
                                                <button type="button" onClick={handleAddQuestion} className="text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition-all border border-[var(--hp-border)] bg-[var(--hp-surface-alt)] hover:border-[var(--hp-accent2)] hover:text-[var(--hp-accent2)] shadow-sm">
                                                    + Add Question
                                                </button>
                                            </div>

                                            <div className="space-y-5">
                                                <AnimatePresence>
                                                    {quizForm.questions.map((q, qIndex) => (
                                                        <motion.div
                                                            key={qIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                                                            className="p-5 rounded-2xl border bg-[var(--hp-surface-alt)]/10 border-[var(--hp-border)] relative group"
                                                        >
                                                            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--hp-border)]">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-8 h-8 rounded-lg bg-[var(--hp-accent2)]/10 text-[var(--hp-accent2)] flex items-center justify-center font-black text-sm">
                                                                        {qIndex + 1}
                                                                    </span>
                                                                    <span className="hp-label mb-0 text-[var(--hp-text)]">Question Prompt</span>
                                                                </div>
                                                                {quizForm.questions.length > 1 && (
                                                                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="p-2 rounded-lg text-[var(--hp-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <input type="text" value={q.question} onChange={(e) => { handleQuestionChange(qIndex, 'question', e.target.value); setQuizError(''); }} placeholder="e.g., What is the difference between useMemo and useCallback?" className="hp-input mb-6" style={{ background: 'var(--hp-card)' }} />

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {q.options.map((opt, oIndex) => (
                                                                    <div key={oIndex} className={`flex items-center gap-2 p-1 rounded-xl border transition-all ${q.correctAnswer === oIndex ? 'border-[var(--hp-accent2)] bg-[var(--hp-accent2)]/5 shadow-sm' : 'border-transparent bg-[var(--hp-card)]'}`}>
                                                                        <div className="relative pl-2">
                                                                            <input
                                                                                type="radio" name={`correct-${qIndex}`} checked={q.correctAnswer === oIndex}
                                                                                onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                                                                className="w-5 h-5 cursor-pointer opacity-0 absolute inset-0 z-10"
                                                                            />
                                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${q.correctAnswer === oIndex ? 'border-[var(--hp-accent2)] bg-[var(--hp-accent2)]' : 'border-[var(--hp-border)]'}`}>
                                                                                {q.correctAnswer === oIndex && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                            </div>
                                                                        </div>
                                                                        <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} className="hp-input bg-transparent border-none text-xs py-2 shadow-none focus:ring-0 flex-1" />
                                                                        
                                                                        {q.options.length > 2 && (
                                                                            <button type="button" onClick={() => handleRemoveOption(qIndex, oIndex)} className="p-1.5 mr-1 rounded-lg text-[var(--hp-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                
                                                                {q.options.length < 6 && (
                                                                    <button type="button" onClick={() => handleAddOption(qIndex)} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--hp-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--hp-muted)] hover:border-[var(--hp-accent2)] hover:text-[var(--hp-accent2)] transition-all">
                                                                        + Option
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                 {/* Sticky Modal Footer */}
                                <div className="p-6 border-t flex flex-col sm:flex-row gap-3 z-[30] shadow-[0_-8px_32px_rgba(0,0,0,0.1)] relative" style={{ background: 'var(--hp-surface-alt)', borderColor: 'var(--hp-border)' }}>
                                    <button type="button" onClick={closeQuizModal} className="hp-btn-ghost flex-1 py-4 text-sm font-bold uppercase tracking-widest">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleSaveQuiz} disabled={savingQuiz} className="hp-btn-primary flex-1 py-4 text-sm font-bold uppercase tracking-widest" style={{ background: 'linear-gradient(135deg, var(--hp-accent2), #8b5cf6)' }}>
                                        {savingQuiz ? 'Synchronizing...' : 'Finalize & Publish'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
}