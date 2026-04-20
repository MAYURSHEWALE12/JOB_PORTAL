import { useState, useEffect } from 'react';
import { resumeAPI } from '../../services/api';
import Loader from '../Loader';

export default function ApplyResumePicker({ userId, selectedResumeId, onSelect }) {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResumes = async () => {
            setLoading(true);
            try {
                const res = await resumeAPI.list(userId);
                setResumes(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Error fetching resumes:', err);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchResumes();
    }, [userId]);

    if (loading) return <div className="mb-4"><Loader text="Loading resumes..." /></div>;

    if (resumes.length === 0) return (
        <div className="warm-card p-4 mb-4 text-sm font-semibold text-[var(--color-text-main)] flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
                No resumes saved. Go to <strong>📁 My Resumes</strong> to create or upload one.
            </div>
        </div>
    );

    return (
        <div className="mb-4">
            <label className="block text-xs font-black text-[var(--color-text-main)] uppercase tracking-widest mb-3">
                Select Resume <span className="text-[var(--color-text-muted)] font-bold">(optional)</span>
            </label>
            <div className="space-y-3">
                {/* Option to apply without a resume */}
                <div
                    onClick={() => onSelect(null)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all
                        ${!selectedResumeId
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md -translate-y-0.5'
                            : 'border-[var(--color-border)] bg-[var(--color-canvas)] hover:border-[var(--color-primary-light)] shadow-sm hover:shadow-md'}`}
                >
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                        ${!selectedResumeId ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                        {!selectedResumeId && <div className="w-2 h-2 bg-[#0f2620] rounded-full" />}
                    </div>
                    <span className="text-sm text-[var(--color-text-main)] font-bold uppercase tracking-wide">No resume (apply without resume)</span>
                </div>

                {/* Map through saved resumes */}
                {resumes.map(resume => (
                    <div
                        key={resume.id}
                        onClick={() => onSelect(resume.id)}
                        className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all
                            ${selectedResumeId === resume.id
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md -translate-y-0.5'
                                : 'border-[var(--color-border)] bg-[var(--color-canvas)] hover:border-[var(--color-primary-light)] shadow-sm hover:shadow-md'}`}
                    >
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                            ${selectedResumeId === resume.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
                            {selectedResumeId === resume.id && <div className="w-2 h-2 bg-[#0f2620] rounded-full" />}
                        </div>
                        <span className="text-2xl">📄</span>
                        <span className="text-sm font-bold text-[var(--color-text-main)] uppercase tracking-wide">{resume.name || 'Untitled Resume'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}