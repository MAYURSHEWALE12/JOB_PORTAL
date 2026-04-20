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
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
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
                            options: q.options?.length >= 4
                                ? q.options.map(o => o.text)
                                : ['', '', '', ''],
                            correctAnswer: q.options?.findIndex(o => o.isCorrect) >= 0
                                ? q.options.findIndex(o => o.isCorrect)
                                : 0
                        }))
                        : [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
                });
            } else {
                setExistingQuiz(null);
                setQuizForm({
                    title: '', passingScore: 70, timeLimit: 30,
                    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
                });
            }
        } catch (err) {
            console.error('Failed to load quiz:', err);
            setQuizForm({
                title: '', passingScore: 70, timeLimit: 30,
                questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
            });
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAddQuestion = () => {
        setQuizForm(prev => ({
            ...prev,
            questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
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
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all 0.25s ease; }
                .hp-card-hover:hover { border-color: rgba(var(--hp-accent-rgb), 0.35); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.15); }
                
                .hp-input { width: 100%; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); border-radius: 12px; padding: 12px 16px; font-size: 0.9rem; transition: all 0.2s; outline: none; }
                .hp-input:focus { border-color: rgba(var(--hp-accent-rgb), 0.5); background: var(--hp-surface); box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1); }
                
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(var(--hp-accent-rgb), .35); }
                .hp-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), .45); }
                .hp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover:not(:disabled) { background: rgba(var(--hp-accent-rgb), .1); border-color: rgba(var(--hp-accent-rgb), .3); color: var(--hp-accent); }

                .hp-modal-overlay { background: var(--hp-modal-overlay, rgba(0,0,0,0.6)); backdrop-filter: blur(12px); }
                
                .action-btn { display: flex; flex-direction: column; items-center: center; justify-content: center; gap: 4px; padding: 10px; border-radius: 10px; background: transparent; border: 1px solid transparent; transition: all 0.2s; color: var(--hp-muted); cursor: pointer; }
                .action-btn:hover { background: var(--hp-surface-alt); border-color: var(--hp-border); color: var(--hp-text); }
                
                .action-btn.edit:hover { color: var(--hp-accent); background: rgba(var(--hp-accent-rgb), 0.1); border-color: rgba(var(--hp-accent-rgb), 0.2); }
                .action-btn.quiz:hover { color: var(--hp-accent2); background: rgba(var(--hp-accent2-rgb), 0.1); border-color: rgba(var(--hp-accent2-rgb), 0.2); }
                .action-btn.close:hover { color: #fbbf24; background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.2); }
                .action-btn.delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }
            `}</style>

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
                                <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Job Title *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className="hp-input" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Location *</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="hp-input" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Job Type</label>
                                    <div className="relative">
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
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Min Salary (₹)</label>
                                    <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} className="hp-input" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Max Salary (₹)</label>
                                    <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} className="hp-input" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Experience Required</label>
                                    <input type="text" name="experienceRequired" value={formData.experienceRequired} onChange={handleChange} placeholder="e.g. 2+ years" className="hp-input" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Positions Available</label>
                                    <input type="number" name="positionsAvailable" value={formData.positionsAvailable} onChange={handleChange} min="1" className="hp-input" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide flex justify-between">
                                    <span>Description *</span>
                                    <span className="text-[10px] text-[var(--hp-muted)]">Supports Markdown</span>
                                </label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="hp-input resize-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide flex justify-between">
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
                                className="hp-card hp-modal w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="sticky top-0 p-6 border-b flex justify-between items-center z-10" style={{ background: 'var(--hp-card)', borderColor: 'var(--hp-border)' }}>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--hp-text)] tracking-tight">
                                            {existingQuiz ? 'Edit Assessment' : 'Create Assessment'}
                                        </h3>
                                        <p className="text-[var(--hp-accent2)] text-sm font-medium mt-0.5">{selectedJobForQuiz?.title}</p>
                                    </div>
                                    <button onClick={closeQuizModal} className="p-2 rounded-lg hover:bg-[var(--hp-surface-alt)] transition-colors" style={{ color: 'var(--hp-muted)' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {quizLoading ? (
                                    <div className="text-center py-20 flex-1">
                                        <div className="w-10 h-10 border-2 border-[var(--hp-accent2)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-[var(--hp-muted)] font-medium tracking-wide">Loading quiz configuration...</p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ background: 'var(--hp-bg)' }}>

                                        <AnimatePresence mode="wait">
                                            {quizError && (
                                                <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 overflow-hidden"
                                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {quizError}
                                                </motion.div>
                                            )}
                                            {quizSuccess && (
                                                <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                                                    className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 overflow-hidden"
                                                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    {quizSuccess}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Settings Block */}
                                        <div className="hp-card p-5 border shadow-none" style={{ borderColor: 'var(--hp-border)' }}>
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--hp-muted)' }}>Configuration</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Assessment Title *</label>
                                                    <input type="text" value={quizForm.title} onChange={(e) => { setQuizForm(prev => ({ ...prev, title: e.target.value })); setQuizError(''); }} placeholder="e.g., Technical Screening" className="hp-input" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Passing %</label>
                                                        <input type="number" value={quizForm.passingScore} onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: e.target.value }))} className="hp-input" min="0" max="100" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Minutes</label>
                                                        <input type="number" value={quizForm.timeLimit} onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: e.target.value }))} className="hp-input" min="1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Questions Block */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4 px-1">
                                                <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--hp-muted)' }}>Questions Bank ({quizForm.questions.length})</h4>
                                                <button type="button" onClick={handleAddQuestion} className="text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg transition-colors border" style={{ background: 'rgba(var(--hp-accent2-rgb), 0.1)', color: 'var(--hp-accent2)', borderColor: 'rgba(var(--hp-accent2-rgb), 0.2)' }}>
                                                    + Add Question
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <AnimatePresence>
                                                    {quizForm.questions.map((q, qIndex) => (
                                                        <motion.div
                                                            key={qIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                                            className="hp-card p-5 border shadow-none relative" style={{ borderColor: 'var(--hp-border)' }}
                                                        >
                                                            <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: 'var(--hp-border)' }}>
                                                                <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--hp-accent2)' }}>
                                                                    <span className="w-6 h-6 rounded bg-[var(--hp-surface-alt)] flex items-center justify-center text-xs">{qIndex + 1}</span>
                                                                    Question Text *
                                                                </span>
                                                                {quizForm.questions.length > 1 && (
                                                                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="p-1 rounded-md text-[var(--hp-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <input type="text" value={q.question} onChange={(e) => { handleQuestionChange(qIndex, 'question', e.target.value); setQuizError(''); }} placeholder="Enter the question prompt here..." className="hp-input mb-5" />

                                                            <div className="space-y-3">
                                                                <label className="block text-[10px] font-bold text-[var(--hp-muted)] uppercase tracking-wider mb-2">Answers (Select Correct)</label>
                                                                {q.options.map((opt, oIndex) => (
                                                                    <div key={oIndex} className="flex items-center gap-3 p-2 rounded-xl border transition-colors" style={{ background: 'var(--hp-surface-alt)', borderColor: q.correctAnswer === oIndex ? 'var(--hp-accent2)' : 'transparent' }}>
                                                                        <input
                                                                            type="radio" name={`correct-${qIndex}`} checked={q.correctAnswer === oIndex}
                                                                            onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                                                            className="w-5 h-5 ml-2 cursor-pointer"
                                                                            style={{ accentColor: 'var(--hp-accent2)' }}
                                                                        />
                                                                        <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} className="hp-input flex-1 py-2 border-none bg-transparent shadow-none px-0 focus:ring-0 focus:shadow-none" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sticky Footer */}
                                <div className="p-6 border-t flex flex-col sm:flex-row gap-3 z-10" style={{ background: 'var(--hp-card)', borderColor: 'var(--hp-border)' }}>
                                    <button type="button" onClick={closeQuizModal} className="hp-btn-ghost flex-1 py-3 text-sm">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleSaveQuiz} disabled={savingQuiz} className="hp-btn-primary flex-1 py-3 text-sm" style={{ background: 'linear-gradient(135deg, var(--hp-accent2), #8b5cf6)' }}>
                                        {savingQuiz ? 'Saving Configuration...' : 'Publish Assessment'}
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