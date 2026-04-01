import { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';
import QuizCreator from './QuizCreator';

export default function ManageJobs() {
    const { user } = useAuthStore();

    const [jobs, setJobs]           = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [editingJob, setEditingJob] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [saving, setSaving]         = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showQuizFor, setShowQuizFor] = useState(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 10;

    const emptyForm = {
        title:              '',
        description:        '',
        requirements:       '',
        location:           '',
        jobType:            'FULL_TIME',
        salaryMin:          '',
        salaryMax:          '',
        experienceRequired: '',
        positionsAvailable: 1,
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async (page = 0) => {
        setLoading(true);
        setError('');
        try {
            const res = await jobAPI.getJobsByEmployer(user.id, page, PAGE_SIZE);
            const data = res.data?.content ?? [];
            setJobs(data);
            setTotalPages(res.data?.totalPages ?? 0);
            setTotalElements(res.data?.totalElements ?? 0);
            setCurrentPage(res.data?.page ?? 0);
        } catch (err) {
            console.error(err);
            setError('Failed to load jobs.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 0 || newPage >= totalPages) return;
        fetchMyJobs(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title:              job.title              || '',
            description:        job.description        || '',
            requirements:       job.requirements       || '',
            location:           job.location           || '',
            jobType:            job.jobType            || 'FULL_TIME',
            salaryMin:          job.salaryMin          || '',
            salaryMax:          job.salaryMax          || '',
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

    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (formData.salaryMin && formData.salaryMax && Number(formData.salaryMin) > Number(formData.salaryMax)) {
            newErrors.salaryMax = 'Max must be greater than min';
        }
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFormErrors({ ...formErrors, [e.target.name]: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = {
                ...formData,
                salaryMin:          formData.salaryMin          ? Number(formData.salaryMin)          : null,
                salaryMax:          formData.salaryMax          ? Number(formData.salaryMax)          : null,
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

    const isFormValid =
        formData.title.trim() &&
        formData.description.trim() &&
        formData.location.trim() &&
        (!formData.salaryMin || !formData.salaryMax || Number(formData.salaryMin) <= Number(formData.salaryMax));

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This cannot be undone.')) return;
        setDeletingId(jobId);
        try {
            await jobAPI.delete(jobId, user.id);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            if (editingJob?.id === jobId) {
                setEditingJob(null);
                setFormData(emptyForm);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete job.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleClose = async (jobId) => {
        if (!window.confirm('Close this job? It will stop accepting applications.')) return;
        try {
            await jobAPI.close(jobId, user.id);
            setJobs(prev =>
                prev.map(j => j.id === jobId ? { ...j, status: 'CLOSED' } : j)
            );
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to close job.');
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold";

    if (showQuizFor) {
        return (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
                <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <QuizCreator 
                        jobId={showQuizFor} 
                        onSave={() => {
                            setShowQuizFor(null);
                            setSuccessMsg('✅ Assessment saved successfully!');
                            setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        onCancel={() => setShowQuizFor(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">⚙️ Manage My Jobs</h2>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 font-bold uppercase tracking-widest">Edit, close or delete your job postings</p>
            </div>

            {/* ── Edit Form ─────────────────────────────────────────── */}
            {editingJob && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">
                            ✏️ Editing: <span className="text-orange-600 dark:text-orange-400">{editingJob.title}</span>
                        </h3>
                        <button
                            onClick={handleCancelEdit}
                            className="w-10 h-10 border-[3px] border-stone-900 dark:border-stone-700 bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-black text-xl hover:bg-rose-500 hover:text-white transition-colors shadow-[3px_3px_0_#1c1917] hover:shadow-none"
                        >
                            ✕
                        </button>
                    </div>

                    {successMsg && (
                        <div className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                            {successMsg}
                        </div>
                    )}
                    {error && (
                        <div className="bg-rose-500 border-[3px] border-stone-900 text-white px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-5" noValidate>
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                Job Title <span className="text-rose-500">*</span>
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={handleFormChange} className={`${inputClasses} ${formErrors.title ? 'border-rose-500' : ''}`} />
                            {formErrors.title && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{formErrors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                    Location <span className="text-rose-500">*</span>
                                </label>
                                <input type="text" name="location" value={formData.location} onChange={handleFormChange} className={`${inputClasses} ${formErrors.location ? 'border-rose-500' : ''}`} />
                                {formErrors.location && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{formErrors.location}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Job Type</label>
                                <select name="jobType" value={formData.jobType} onChange={handleFormChange} className={inputClasses + ' bg-white dark:bg-stone-900'}>
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="REMOTE">Remote</option>
                                    <option value="FREELANCE">Freelance</option>
                                    <option value="TEMPORARY">Temporary</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Min Salary (₹)</label>
                                <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleFormChange} className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Max Salary (₹)</label>
                                <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleFormChange} className={`${inputClasses} ${formErrors.salaryMax ? 'border-rose-500' : ''}`} />
                                {formErrors.salaryMax && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{formErrors.salaryMax}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Experience Required</label>
                                <input type="text" name="experienceRequired" value={formData.experienceRequired} onChange={handleFormChange} placeholder="e.g. 2+ years" className={inputClasses + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Positions Available</label>
                                <input type="number" name="positionsAvailable" value={formData.positionsAvailable} onChange={handleFormChange} min="1" className={inputClasses} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                Description <span className="text-rose-500">*</span>
                            </label>
                            <textarea name="description" value={formData.description} onChange={handleFormChange} rows={5} className={`${inputClasses} ${formErrors.description ? 'border-rose-500' : ''} resize-none`} />
                            {formErrors.description && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{formErrors.description}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Requirements</label>
                            <textarea name="requirements" value={formData.requirements} onChange={handleFormChange} rows={4} className={inputClasses + ' resize-none'} />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white font-black uppercase tracking-widest py-3 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !isFormValid}
                                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Jobs List ─────────────────────────────────────────── */}
            {loading && <Loader text="Loading jobs..." />}

            {!loading && error && !editingJob && (
                <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-bold">{error}</div>
            )}

            {!loading && jobs.length === 0 && (
                <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight mb-2">No Jobs Posted Yet</h3>
                    <p className="text-stone-500 dark:text-stone-400 font-bold uppercase text-sm">Go to <strong>➕ Post a Job</strong> to create your first listing.</p>
                </div>
            )}

            <div className="space-y-4">
                {!loading && jobs.map((job) => (
                    <div
                        key={job.id}
                        className={`bg-white dark:bg-stone-800 p-5 border-[3px] transition-all
                            ${editingJob?.id === job.id
                                ? 'border-orange-500 shadow-[6px_6px_0_#ea580c] bg-orange-50 dark:bg-stone-700'
                                : 'border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase tracking-tight">{job.title}</h3>
                                    <span className={`text-xs font-black px-2 py-0.5 border-[2px] border-stone-900 dark:border-stone-700 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] uppercase tracking-wide
                                        ${job.status === 'ACTIVE'
                                            ? 'bg-green-300 text-green-900 dark:bg-green-900/40 dark:text-green-400'
                                            : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400'}`}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="flex gap-4 mt-2 text-sm text-stone-600 dark:text-stone-400 font-bold uppercase">
                                    <span>📍 {job.location}</span>
                                    <span>💼 {job.jobType?.replace('_', ' ')}</span>
                                    {job.salaryMin && (
                                        <span>💰 ₹{Number(job.salaryMin).toLocaleString()} - ₹{Number(job.salaryMax).toLocaleString()}</span>
                                    )}
                                </div>
                                <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 line-clamp-2 font-medium">{job.description}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 flex-wrap">
                            <button
                                onClick={() => handleEdit(job)}
                                disabled={editingJob?.id === job.id}
                                className="bg-orange-100 dark:bg-orange-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-orange-400 text-sm font-bold uppercase px-4 py-2 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917] transition-all disabled:opacity-50"
                            >
                                ✏️ Edit
                            </button>
                            {job.status === 'ACTIVE' && (
                                <button
                                    onClick={() => handleClose(job.id)}
                                    className="bg-yellow-200 dark:bg-yellow-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-yellow-400 text-sm font-bold uppercase px-4 py-2 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917] transition-all"
                                >
                                    🔒 Close Job
                                </button>
                            )}
                            <button
                                onClick={() => setShowQuizFor(job.id)}
                                className="bg-emerald-100 dark:bg-emerald-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-emerald-700 dark:text-emerald-400 text-sm font-bold uppercase px-4 py-2 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917] transition-all"
                            >
                                🎯 Assessment
                            </button>
                            <button
                                onClick={() => handleDelete(job.id)}
                                disabled={deletingId === job.id}
                                className="bg-rose-100 dark:bg-rose-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-rose-700 dark:text-rose-400 text-sm font-bold uppercase px-4 py-2 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1c1917] transition-all disabled:opacity-50"
                            >
                                {deletingId === job.id ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                        </div>
                    </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4 border-t-[3px] border-stone-200 dark:border-stone-700 mt-4">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}
                            className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5">
                            ← Prev
                        </button>
                        <span className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase">
                            Page {currentPage + 1} of {totalPages} ({totalElements} total)
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                            className="neo-btn px-4 py-2 bg-white dark:bg-stone-800 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-gray-100 font-bold text-sm uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5">
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}