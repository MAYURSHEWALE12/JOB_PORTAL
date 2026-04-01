import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { jobAPI } from '../../services/api';

export default function PostJob() {
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        title:               '',
        description:         '',
        requirements:        '',
        location:            '',
        jobType:             'FULL_TIME',
        salaryMin:           '',
        salaryMax:           '',
        experienceRequired:  '',
        positionsAvailable:  1,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState('');
    const [error, setError]       = useState('');

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Job title is required';
        if (!formData.description.trim()) newErrors.description = 'Job description is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (formData.salaryMin && formData.salaryMax && Number(formData.salaryMin) > Number(formData.salaryMax)) {
            newErrors.salaryMax = 'Max salary must be greater than min salary';
        }
        if (formData.positionsAvailable && Number(formData.positionsAvailable) < 1) {
            newErrors.positionsAvailable = 'Must be at least 1';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setSuccess('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setLoading(true);

        try {
            const payload = {
                ...formData,
                salaryMin:          formData.salaryMin          ? Number(formData.salaryMin)         : null,
                salaryMax:          formData.salaryMax          ? Number(formData.salaryMax)         : null,
                positionsAvailable: formData.positionsAvailable ? Number(formData.positionsAvailable): 1,
            };

            await jobAPI.create(payload, user.id);
            setSuccess('Job posted successfully!');
            setFormData({
                title:              '',
                description:        '',
                requirements:       '',
                location:           '',
                jobType:            'FULL_TIME',
                salaryMin:          '',
                salaryMax:          '',
                experienceRequired: '',
                positionsAvailable: 1,
            });
            setErrors({});
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        formData.title.trim() &&
        formData.description.trim() &&
        formData.location.trim() &&
        (!formData.salaryMin || !formData.salaryMax || Number(formData.salaryMin) <= Number(formData.salaryMax)) &&
        (!formData.positionsAvailable || Number(formData.positionsAvailable) >= 1);

    if (user?.role !== 'EMPLOYER') {
        return (
            <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-8 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h2 className="text-xl font-black text-stone-900 dark:text-gray-100 mb-2 uppercase">Employers Only</h2>
                <p className="text-stone-500 dark:text-stone-400 font-bold uppercase">Only employer accounts can post jobs.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-stone-800 rounded-xl border-[3px] border-stone-900 dark:border-stone-700 p-5 sm:p-8 max-w-2xl mx-auto relative z-10 transition-all duration-300 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">

            <h2 className="text-3xl font-black text-stone-900 dark:text-gray-100 mb-2 uppercase tracking-tight">Post a New Job</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Fill in the details below to post your job listing.</p>

            {success && (
                <div className="bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {success}
                </div>
            )}

            {error && (
                <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                <div>
                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                        Job Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Java Developer"
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] ${
                            errors.title ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                        }`}
                    />
                    {errors.title && <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Location <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Pune, Mumbai, Remote"
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] ${
                                errors.location ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                            }`}
                        />
                        {errors.location && <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Job Type</label>
                        <select
                            name="jobType"
                            value={formData.jobType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold uppercase"
                        >
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
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Min Salary (₹)
                        </label>
                        <input
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            placeholder="e.g. 500000"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Max Salary (₹)
                        </label>
                        <input
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            placeholder="e.g. 900000"
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold ${
                                errors.salaryMax ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                            }`}
                        />
                        {errors.salaryMax && <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase">{errors.salaryMax}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Experience Required
                        </label>
                        <input
                            type="text"
                            name="experienceRequired"
                            value={formData.experienceRequired}
                            onChange={handleChange}
                            placeholder="e.g. 2+ years"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Positions Available
                        </label>
                        <input
                            type="number"
                            name="positionsAvailable"
                            value={formData.positionsAvailable}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold ${
                                errors.positionsAvailable ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                            }`}
                        />
                        {errors.positionsAvailable && <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase">{errors.positionsAvailable}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                        Job Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Describe the role, responsibilities, company culture..."
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] resize-none ${
                            errors.description ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                        }`}
                    />
                    {errors.description && <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase">{errors.description}</p>}
                </div>

                <div>
                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                        Requirements
                    </label>
                    <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows={4}
                        placeholder="List required skills, qualifications, tools..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="neo-btn w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 px-6 text-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Posting...' : 'Post Job Now'}
                </button>
            </form>
        </div>
    );
}
