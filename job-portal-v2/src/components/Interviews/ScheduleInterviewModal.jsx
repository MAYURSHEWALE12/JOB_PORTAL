import { useState } from 'react';
import { motion } from 'framer-motion';
import { interviewAPI } from '../../services/api';

export default function ScheduleInterviewModal({ application, onClose, onScheduled }) {
    const [formData, setFormData] = useState({
        title: `${application?.jobTitle || 'Job'} Interview`,
        scheduledAt: '',
        durationMinutes: 30,
        location: '',
        meetingLink: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await interviewAPI.schedule(application.id, formData);
            onScheduled?.();
            onClose();
        } catch (err) {
            console.error('Failed to schedule interview:', err);
            setError(err.response?.data?.message || 'Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="warm-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-semibold text-xl">
                        Schedule Interview
                    </h3>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                        ✕
                    </button>
                </div>

                <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
                    <p className="text-sm text-[var(--color-text-muted)]">Scheduling interview for:</p>
                    <p className="font-medium text-[var(--color-text-main)]">
                        {application?.candidateName || application?.jobSeeker?.firstName + ' ' + application?.jobSeeker?.lastName}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">{application?.jobTitle || application?.job?.title}</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 rounded-xl text-sm font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                            Interview Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="warm-input w-full"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                className="warm-input w-full"
                                min={new Date().toISOString().slice(0, 16)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                Duration (minutes) *
                            </label>
                            <select
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                className="warm-input w-full"
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Room 101, Building A"
                            className="warm-input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                            Meeting Link
                        </label>
                        <input
                            type="text"
                            value={formData.meetingLink}
                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                            placeholder="e.g., https://meet.google.com/..."
                            className="warm-input w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                            Notes / Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add any notes or instructions for the candidate..."
                            className="warm-input w-full h-24 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 warm-btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 warm-btn disabled:opacity-50"
                        >
                            {submitting ? 'Scheduling...' : 'Schedule Interview'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
