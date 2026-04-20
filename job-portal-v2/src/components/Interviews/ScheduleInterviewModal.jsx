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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="hp-card w-full max-w-xl flex flex-col shadow-2xl border-[var(--hp-border)]"
                style={{ background: 'var(--hp-card)' }}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--hp-border)] flex justify-between items-center bg-[var(--hp-surface-alt)]">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-[var(--hp-accent2)] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                                Interview Scheduler
                            </span>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--hp-text)]">
                            Scheduling Technical Interview
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[var(--hp-muted)] hover:text-[var(--hp-text)]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Candidate Info Summary */}
                    <div className="p-4 rounded-xl bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--hp-accent)]/10 flex items-center justify-center text-lg font-bold text-[var(--hp-accent)]">
                            {application?.jobSeeker?.firstName?.[0]}{application?.jobSeeker?.lastName?.[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--hp-text)]">
                                {application?.jobSeeker?.firstName} {application?.jobSeeker?.lastName}
                            </p>
                            <p className="text-xs text-[var(--hp-muted)] font-medium uppercase tracking-wider">
                                {application?.job?.title || 'Applicant'}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-3">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="hp-label">Interview Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="hp-input"
                                    placeholder="e.g. Technical Round 1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="hp-label">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                    className="hp-input"
                                    min={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="hp-label">Duration *</label>
                                <select
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                    className="hp-input appearance-none"
                                    style={{ paddingRight: '2.5rem' }}
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="hp-label">Meeting Link (Virtual) or Physical Location</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.meetingLink || formData.location}
                                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value, location: e.target.value })}
                                        placeholder="e.g. Google Meet Link or Office Address"
                                        className="hp-input"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                                        🔗
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="hp-label">Internal Notes / Candidate Instructions</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Add any specific preparation notes for the candidate..."
                                    className="hp-input min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[var(--hp-surface-alt)] border-t border-[var(--hp-border)] flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="hp-btn-ghost flex-1 py-3"
                    >
                        Cancel
                    </button>
                    <button
                        form="schedule-form"
                        type="submit"
                        disabled={submitting}
                        className="hp-btn-primary flex-1 py-3"
                    >
                        {submitting ? 'Dispatching...' : 'Schedule & Invite'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
