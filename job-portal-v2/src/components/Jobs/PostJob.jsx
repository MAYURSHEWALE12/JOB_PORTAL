import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

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

    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState('');
    const [error, setError]       = useState('');

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

        // Basic validation
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
                salaryMin:          formData.salaryMin          ? Number(formData.salaryMin)         : null,
                salaryMax:          formData.salaryMax          ? Number(formData.salaryMax)         : null,
                positionsAvailable: formData.positionsAvailable ? Number(formData.positionsAvailable): 1,
            };

            await jobAPI.create(payload, user.id);  // passes ?employerId=user.id
            setSuccess('🎉 Job posted successfully!');
            // Reset form
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
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Only employers can post jobs
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

            {/* Header */}
            <h2 className="text-3xl font-black text-stone-900 dark:text-gray-100 mb-2 uppercase tracking-tight">📝 Post a New Job</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Fill in the details below to post your job listing.</p>

            {/* Success */}
            {success && (
                <div className="bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {success}
                </div>
            )}

            {/* Error/Success Messages with animation-reset via key */}
            {error && (
                <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {error}
                </div>
            )}
            {success && (
                <div key={success} className="bg-emerald-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Job Title */}
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
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000]"
                    />
                </div>

                {/* Location + Job Type */}
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000]"
                        />
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

                {/* Salary Range */}
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold"
                        />
                    </div>
                </div>

                {/* Experience + Positions */}
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
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold"
                        />
                    </div>
                </div>

                {/* Description */}
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
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:ring-0 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] resize-none"
                    />
                </div>

                {/* Requirements */}
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

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="neo-btn w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 px-6 text-xl mt-6"
                >
                    {loading ? 'Posting...' : '🚀 Post Job Now'}
                </button>
            </form>
        </div>
    );
}