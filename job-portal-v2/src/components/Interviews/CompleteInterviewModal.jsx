import { useState } from 'react';
import { motion } from 'framer-motion';
import { interviewAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CompleteInterviewModal({ interview, onClose, onCompleted }) {
    const [formData, setFormData] = useState({
        feedback: '',
        rating: 5,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await interviewAPI.complete(interview.id, formData.feedback, formData.rating);
            toast.success('Interview marked as completed! 🎉');
            onCompleted?.();
            onClose();
        } catch (err) {
            console.error('Failed to complete interview:', err);
            setError(err.response?.data?.message || 'Failed to complete interview');
            toast.error('Failed to save feedback.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--hp-card)] border border-[var(--hp-border)] p-8 max-w-lg w-full rounded-[24px] shadow-2xl relative overflow-hidden"
            >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--hp-accent)]/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-2xl text-[var(--hp-text)] tracking-tight">
                            Complete Interview
                        </h3>
                        <p className="text-[var(--hp-muted)] text-xs mt-1 font-medium uppercase tracking-widest">Share your internal remarks</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--hp-surface-alt)] text-[var(--hp-muted)] hover:text-[var(--hp-text)] transition-colors">
                        ✕
                    </button>
                </div>

                <div className="bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--hp-accent)] to-[var(--hp-accent2)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {(interview.candidateName || 'C')[0]}
                    </div>
                    <div>
                        <p className="text-[10px] text-[var(--hp-muted)] uppercase font-black tracking-tighter">Candidate</p>
                        <p className="font-bold text-[var(--hp-text)] leading-none mt-0.5">
                            {interview.candidateName || interview.candidate?.firstName + ' ' + interview.candidate?.lastName}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-[var(--hp-muted)] uppercase tracking-widest mb-3">
                            Recruiter Rating
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="p-1 transition-transform active:scale-90"
                                >
                                    <svg 
                                        className={`w-8 h-8 transition-colors ${formData.rating >= star ? 'text-amber-400' : 'text-[var(--hp-border)]'}`}
                                        fill={formData.rating >= star ? "currentColor" : "none"} 
                                        stroke="currentColor" 
                                        strokeWidth={1.5}
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-[var(--hp-muted)] uppercase tracking-widest mb-3">
                            Internal Remarks & Feedback
                        </label>
                        <textarea
                            value={formData.feedback}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                            placeholder="How was the technical knowledge? Cultural fit? Soft skills?"
                            className="bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] w-full h-32 px-4 py-3 rounded-2xl text-sm focus:border-[var(--hp-accent)] transition-all outline-none resize-none"
                            required
                        />
                        <p className="text-[10px] text-[var(--hp-muted)] mt-2 italic px-1">
                            * This remark will be shared with the candidate.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border border-[var(--hp-border)] text-[var(--hp-muted)] font-bold text-sm rounded-2xl hover:bg-[var(--hp-surface-alt)] transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 bg-gradient-to-r from-[var(--hp-accent)] to-[var(--hp-accent2)] text-white font-bold text-sm rounded-2xl shadow-xl shadow-[var(--hp-accent)]/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    🏁 Finish & Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
