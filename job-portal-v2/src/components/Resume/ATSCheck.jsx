import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { resumeAPI, resumeAnalysisAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';

export default function ATSCheck({ onSelectResume }) {
    const { user } = useAuthStore();

    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedResume, setSelectedResume] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchResumes();
        fetchHistory();
    }, []);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const res = await resumeAPI.list(user.id);
            setResumes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load resumes.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await resumeAnalysisAPI.getHistory(user.id);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
        }
    };

    const handleAnalyze = async () => {
        if (!selectedResume) return;
        setAnalyzing(true);
        setError('');
        setAnalysisResult(null);
        try {
            const res = await resumeAnalysisAPI.analyze(selectedResume.id);
            setAnalysisResult(res.data);
            await fetchHistory();
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed.');
        } finally {
            setAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
        if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-rose-500/20 border-rose-500/30';
    };

    return (
        <div>
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-main)]">ATS Resume Check</h2>
                <p className="text-[var(--color-text-muted)] mt-1 sm:mt-2 text-sm sm:text-base">
                    Analyze your resume against ATS (Applicant Tracking System) standards
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-xl text-sm font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                >
                    {error}
                </motion.div>
            )}

            {loading && <Loader text="Loading resumes..." />}

            {!loading && resumes.length === 0 && (
                <div className="warm-card p-6 sm:p-10 text-center">
                    <div className="text-4xl sm:text-5xl mb-3">📄</div>
                    <h4 className="font-serif font-semibold text-[var(--color-text-main)] text-lg mb-2">No Resumes Found</h4>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        Upload a resume first to run ATS analysis
                    </p>
                </div>
            )}

            {!loading && resumes.length > 0 && !analysisResult && (
                <div className="warm-card p-4 sm:p-6">
                    <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-4">Select a Resume to Analyze</h4>
                    <div className="space-y-2">
                        {resumes.map(resume => (
                            <motion.div
                                key={resume.id}
                                onClick={() => setSelectedResume(resume)}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3
                                    ${selectedResume?.id === resume.id
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${selectedResume?.id === resume.id
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                        : 'border-[var(--color-border)]'}`}>
                                    {selectedResume?.id === resume.id && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--color-text-main)] truncate">{resume.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString('en-IN') : 'Unknown date'}
                                    </p>
                                </div>
                                <div className="text-xl">📄</div>
                            </motion.div>
                        ))}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedResume || analyzing}
                        className="warm-btn w-full mt-4 sm:mt-6"
                    >
                        {analyzing ? 'Analyzing...' : 'Run ATS Analysis'}
                    </button>
                </div>
            )}

            {analyzing && <Loader text="Analyzing resume... This may take a moment." />}

            {analysisResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 sm:space-y-6"
                >
                    <div className={`p-6 rounded-2xl border-2 ${getScoreBg(analysisResult.score)}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">ATS Score</p>
                                <p className={`text-4xl sm:text-5xl font-black ${getScoreColor(analysisResult.score)}`}>
                                    {analysisResult.score}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                    out of 100
                                </p>
                            </div>
                            <div className="text-6xl sm:text-7xl">
                                {analysisResult.score >= 80 ? '🎉' : analysisResult.score >= 60 ? '💪' : '📝'}
                            </div>
                        </div>
                    </div>

                    {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                        <div className="warm-card p-4 sm:p-5">
                            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                <span>✅</span> Strengths
                            </h4>
                            <ul className="space-y-2">
                                {analysisResult.strengths.map((strength, i) => (
                                    <li key={i} className="text-sm text-[var(--color-text-main)] flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        <span>{strength}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                        <div className="warm-card p-4 sm:p-5">
                            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                <span>💡</span> Suggestions
                            </h4>
                            <ul className="space-y-2">
                                {analysisResult.suggestions.map((suggestion, i) => (
                                    <li key={i} className="text-sm text-[var(--color-text-main)] flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setAnalysisResult(null)}
                            className="warm-btn-outline flex-1"
                        >
                            Analyze Another
                        </button>
                        {onSelectResume && (
                            <button
                                onClick={() => onSelectResume(selectedResume)}
                                className="warm-btn flex-1"
                            >
                                View Resume
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {!loading && history.length > 0 && !analysisResult && (
                <div className="mt-8 sm:mt-10">
                    <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-4">Recent Analyses</h4>
                    <div className="space-y-2">
                        {history.slice(0, 5).map((item, i) => (
                            <div key={i} className="p-3 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-text-main)]">
                                        {item.resumeName || `Resume #${item.resumeId}`}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {item.analyzedAt ? new Date(item.analyzedAt).toLocaleDateString('en-IN') : ''}
                                    </p>
                                </div>
                                <div className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                                    {item.score}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}