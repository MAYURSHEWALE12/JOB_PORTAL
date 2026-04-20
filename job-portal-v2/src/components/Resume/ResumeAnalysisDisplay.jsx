import { useState } from 'react';
import { motion } from 'framer-motion';
import { resumeAnalysisAPI } from '../../services/api';

export default function ResumeAnalysisDisplay({ resumeId, jobId, onClose }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const res = jobId
                ? await resumeAnalysisAPI.getMatchAnalysis(resumeId, jobId)
                : await resumeAnalysisAPI.analyze(resumeId);
            setAnalysis(res.data);
        } catch (err) {
            console.error('Failed to fetch analysis:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const res = jobId
                ? await resumeAnalysisAPI.analyzeMatch(resumeId, jobId)
                : await resumeAnalysisAPI.analyze(resumeId);
            setAnalysis(res.data);
        } catch (err) {
            console.error('Failed to analyze:', err);
            alert('Analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4A7C59';
        if (score >= 60) return '#C2651A';
        if (score >= 40) return '#D97706';
        return '#DC2626';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    const renderScoreCircle = (score, label, subtitle) => (
        <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                         cx="48"
                         cy="48"
                         r="40"
                         stroke="var(--color-border)"
                         strokeWidth="8"
                         fill="none"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke={getScoreColor(score || 0)}
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(score || 0) * 2.51} 251`}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: getScoreColor(score || 0) }}>
                        {score || 0}
                    </span>
                </div>
            </div>
            <p className="font-semibold text-[var(--color-text-main)]">{label}</p>
            {subtitle && <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
    );

    if (loading) {
        return (
            <div className="warm-card p-8 text-center">
                <p className="text-[var(--color-text-muted)]">Loading analysis...</p>
            </div>
        );
    }

    if (!analysis) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="warm-card p-8 text-center"
            >
                <div className="text-5xl mb-4">📊</div>
                <h3 className="font-serif font-semibold text-xl mb-2" style={{ color: 'var(--color-text-main)' }}>
                    ATS Analysis
                </h3>
                <p className="text-[var(--color-text-muted)] mb-6">
                    {jobId
                        ? 'Analyze how well your resume matches this job requirements.'
                        : 'Get insights on how your resume performs with applicant tracking systems.'}
                </p>
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="warm-btn px-8 py-3 disabled:opacity-50"
                >
                    {analyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="warm-card p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>
                    ATS Analysis Results
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                    >
                        {analyzing ? 'Analyzing...' : 'Re-analyze'}
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {renderScoreCircle(analysis.overallScore, 'Overall Score', 'ATS Compatible')}
                {renderScoreCircle(analysis.keywordScore, 'Keywords', 'Job-specific terms')}
                {renderScoreCircle(analysis.formatScore, 'Format', 'Resume structure')}
                {renderScoreCircle(analysis.readabilityScore, 'Readability', 'Clear & concise')}
            </div>

            {analysis.matchScore !== undefined && analysis.matchScore !== null && (
                <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="text-4xl font-bold"
                            style={{ color: getScoreColor(analysis.matchScore) }}
                        >
                            {analysis.matchScore}%
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--color-text-main)]">Job Match Score</p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                How well your resume matches this position
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {analysis.skillsMatched && analysis.skillsMatched.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-[var(--color-text-main)] mb-3">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.skillsMatched.map((skill, index) => (
                            <span
                                key={index}
                                className="warm-pill bg-[var(--color-primary)]/20 text-[var(--color-primary-dark)]"
                            >
                                ✓ {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {analysis.skillsMissing && analysis.skillsMissing.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-[var(--color-text-main)] mb-3">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.skillsMissing.map((skill, index) => (
                            <span
                                key={index}
                                className="warm-pill bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            >
                                ✗ {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                    <h4 className="font-medium text-[var(--color-text-main)] mb-3">Improvement Suggestions</h4>
                    <ul className="space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-[#6B5B4F]">
                                <span className="text-[var(--color-primary)] mt-0.5">•</span>
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {analysis.summary && (
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                    <h4 className="font-medium text-[var(--color-text-main)] mb-2">Summary</h4>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{analysis.summary}</p>
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                >
                    {analyzing ? 'Updating...' : 'Update Analysis'}
                </button>
            </div>
        </motion.div>
    );
}
