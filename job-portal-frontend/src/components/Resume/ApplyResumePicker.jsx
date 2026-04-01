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
        <div className="bg-yellow-300 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 px-4 py-3 mb-4 text-sm font-bold uppercase shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
            💡 No resumes saved. Go to <strong>📁 My Resumes</strong> to create or upload one.
        </div>
    );

    return (
        <div className="mb-4">
            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                Select Resume <span className="text-stone-400 font-bold">(optional)</span>
            </label>
            <div className="space-y-3">
                {/* Option to apply without a resume */}
                <div
                    onClick={() => onSelect(null)}
                    className={`flex items-center gap-3 p-4 border-[3px] cursor-pointer transition-all
                        ${!selectedResumeId
                            ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[4px_4px_0_#ea580c] -translate-y-0.5'
                            : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-orange-400 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]'}`}
                >
                    <div className={`w-5 h-5 border-[3px] flex items-center justify-center flex-shrink-0
                        ${!selectedResumeId ? 'border-orange-600 bg-orange-500' : 'border-stone-400 dark:border-stone-600'}`}>
                        {!selectedResumeId && <div className="w-2 h-2 bg-white" />}
                    </div>
                    <span className="text-sm text-stone-700 dark:text-stone-300 font-bold uppercase">No resume (apply without resume)</span>
                </div>

                {/* Map through saved resumes */}
                {resumes.map(resume => (
                    <div
                        key={resume.id}
                        onClick={() => onSelect(resume.id)}
                        className={`flex items-center gap-3 p-4 border-[3px] cursor-pointer transition-all
                            ${selectedResumeId === resume.id
                                ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[4px_4px_0_#ea580c] -translate-y-0.5'
                                : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-orange-400 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]'}`}
                    >
                        <div className={`w-5 h-5 border-[3px] flex items-center justify-center flex-shrink-0
                            ${selectedResumeId === resume.id ? 'border-orange-600 bg-orange-500' : 'border-stone-400 dark:border-stone-600'}`}>
                            {selectedResumeId === resume.id && <div className="w-2 h-2 bg-white" />}
                        </div>
                        <span className="text-2xl">📄</span>
                        <span className="text-sm font-black text-stone-900 dark:text-stone-100 uppercase">{resume.name || 'Untitled Resume'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}