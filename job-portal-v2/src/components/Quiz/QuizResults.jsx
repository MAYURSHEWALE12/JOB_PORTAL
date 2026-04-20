import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { quizAPI } from '../../services/api';

export default function QuizResults({ applicationId, onClose }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, [applicationId]);

    const fetchResults = async () => {
        if (!applicationId) return;
        setLoading(true);
        try {
            const res = await quizAPI.getResults(applicationId);
            setResult(res.data);
        } catch (err) {
            console.error('Failed to fetch quiz results:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="warm-card p-8 text-center">
                <p className="text-[var(--color-text-muted)]">Loading results...</p>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="warm-card p-8 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-serif font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
                    No Quiz Taken
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm">
                    This candidate hasn't completed a quiz assessment yet.
                </p>
            </div>
        );
    }

    const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="warm-card p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>
                    Quiz Assessment Results
                </h3>
                <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                    ✕
                </button>
            </div>

            <div className="text-center mb-6">
                <div
                    className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4
                        ${result.passed ? 'bg-[var(--color-sage)]/10' : 'bg-[var(--color-terracotta)]/10'}`}
                >
                    <span className={`text-4xl font-bold ${result.passed ? 'text-[var(--color-sage)]' : 'text-[var(--color-terracotta)]'}`}>
                        {percentage}%
                    </span>
                </div>

                <h4 className={`text-xl font-semibold mb-1 ${result.passed ? 'text-[var(--color-sage)]' : 'text-[var(--color-terracotta)]'}`}>
                    {result.passed ? 'Passed' : 'Not Passed'}
                </h4>
                <p className="text-[var(--color-text-muted)]">
                    {result.correctAnswers} out of {result.totalQuestions} correct answers
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold text-[var(--color-sage)]">{result.correctAnswers}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Correct</p>
                </div>
                <div className="bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-xl p-4 text-center">
                    <p className="text-2xl font-semibold text-[var(--color-terracotta)]">{result.totalQuestions - result.correctAnswers}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Incorrect</p>
                </div>
            </div>

            {result.completedAt && (
                <p className="text-center text-sm text-[var(--color-text-muted)] opacity-70 mt-4">
                    Completed on {new Date(result.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            )}
        </motion.div>
    );
}
