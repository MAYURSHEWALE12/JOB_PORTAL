import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { quizAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function QuizCreatePage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [submitting, setSubmitting] = useState(false);

    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        passingScore: 70,
        timeLimit: null,
    });

    const [questions, setQuestions] = useState([
        {
            id: 1,
            text: '',
            score: 1,
            options: [
                { id: 1, text: '', isCorrect: true },
                { id: 2, text: '', isCorrect: false },
                { id: 3, text: '', isCorrect: false },
                { id: 4, text: '', isCorrect: false },
            ],
        },
    ]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: Date.now(),
                text: '',
                score: 1,
                options: [
                    { id: 1, text: '', isCorrect: true },
                    { id: 2, text: '', isCorrect: false },
                    { id: 3, text: '', isCorrect: false },
                    { id: 4, text: '', isCorrect: false },
                ],
            },
        ]);
    };

    const removeQuestion = (questionId) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== questionId));
    };

    const updateQuestion = (questionId, field, value) => {
        setQuestions(questions.map(q =>
            q.id === questionId ? { ...q, [field]: value } : q
        ));
    };

    const updateOption = (questionId, optionId, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId) return q;
            const options = q.options.map(o => {
                if (o.id === optionId) {
                    return { ...o, [field]: value };
                }
                if (field === 'isCorrect' && value) {
                    return { ...o, isCorrect: false };
                }
                return o;
            });
            return { ...q, options };
        }));
    };

    const addOption = (questionId) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId) return q;
            return {
                ...q,
                options: [...q.options, { id: Date.now(), text: '', isCorrect: false }],
            };
        }));
    };

    const removeOption = (questionId, optionId) => {
        setQuestions(questions.map(q => {
            if (q.id !== questionId) return q;
            if (q.options.length <= 2) return q;
            return { ...q, options: q.options.filter(o => o.id !== optionId) };
        }));
    };

    const validateForm = () => {
        if (!quiz.title.trim()) {
            alert('Please enter a quiz title');
            return false;
        }
        if (!quiz.description.trim()) {
            alert('Please enter a quiz description');
            return false;
        }
        for (const q of questions) {
            if (!q.text.trim()) {
                alert('Please fill in all question texts');
                return false;
            }
            const filledOptions = q.options.filter(o => o.text.trim());
            if (filledOptions.length < 2) {
                alert('Each question must have at least 2 options');
                return false;
            }
            if (!q.options.some(o => o.isCorrect)) {
                alert('Each question must have a correct answer selected');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const quizData = {
                title: quiz.title,
                description: quiz.description,
                passingScore: quiz.passingScore,
                timeLimit: quiz.timeLimit,
                questions: questions.map((q, qIndex) => ({
                    id: null,
                    text: q.text,
                    score: q.score,
                    options: q.options
                        .filter(o => o.text.trim())
                        .map((o, oIndex) => ({
                            id: null,
                            text: o.text,
                            isCorrect: o.isCorrect || oIndex === 0,
                        })),
                })),
            };

            await quizAPI.create({ ...quizData, jobId });
            alert('Quiz created successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to create quiz:', err);
            alert(err.response?.data?.message || 'Failed to create quiz');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
                        Create Quiz Assessment
                    </h2>
                    <p className="text-[var(--color-text-muted)]">
                        Create a skill assessment for job applicants
                    </p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="warm-btn-outline">
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="warm-card p-6">
                    <h3 className="font-serif font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>
                        Quiz Details
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                Quiz Title *
                            </label>
                            <input
                                type="text"
                                value={quiz.title}
                                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                placeholder="e.g., JavaScript Fundamentals Assessment"
                                className="warm-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                Description *
                            </label>
                            <textarea
                                value={quiz.description}
                                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                                placeholder="Describe what this assessment tests..."
                                className="warm-input w-full h-24 resize-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    value={quiz.passingScore}
                                    onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    max="100"
                                    className="warm-input w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                                    Time Limit (minutes)
                                </label>
                                <input
                                    type="number"
                                    value={quiz.timeLimit || ''}
                                    onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="No limit"
                                    min="1"
                                    className="warm-input w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {questions.map((question, qIndex) => (
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qIndex * 0.1 }}
                        className="warm-card p-6"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="font-serif font-semibold" style={{ color: 'var(--color-text-main)' }}>
                                Question {qIndex + 1}
                            </h4>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={question.score}
                                    onChange={(e) => updateQuestion(question.id, 'score', parseInt(e.target.value) || 1)}
                                    min="1"
                                    className="warm-input w-16 text-center"
                                    title="Points"
                                />
                                <span className="text-sm text-[var(--color-text-muted)]">pts</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(question.id)}
                                        className="text-rose-500 hover:text-rose-600 p-2"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                            placeholder="Enter your question here..."
                            className="warm-input w-full h-20 resize-none mb-4"
                            required
                        />

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-[var(--color-text-main)]">
                                Options (select correct answer)
                            </label>
                            {question.options.map((option, oIndex) => (
                                <div key={option.id} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name={`correct-${question.id}`}
                                        checked={option.isCorrect}
                                        onChange={() => {
                                            question.options.forEach((_, i) => {
                                                if (i !== oIndex) {
                                                    updateOption(question.id, question.options[i].id, 'isCorrect', false);
                                                }
                                            });
                                            updateOption(question.id, option.id, 'isCorrect', true);
                                        }}
                                        className="w-5 h-5 accent-[var(--color-terracotta)]"
                                    />
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                        className="warm-input flex-1"
                                        required
                                    />
                                    {question.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(question.id, option.id)}
                                            className="text-rose-500 hover:text-rose-600 p-2"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            {question.options.length < 6 && (
                                <button
                                    type="button"
                                    onClick={() => addOption(question.id)}
                                    className="text-sm text-[var(--color-terracotta)] hover:text-[var(--color-terracotta)]/80 font-medium"
                                >
                                    + Add Option
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}

                <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full warm-card p-4 text-center text-[var(--color-terracotta)] hover:bg-[var(--color-canvas)] font-medium transition-colors"
                >
                    + Add Another Question
                </button>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="warm-btn-outline px-8 py-3"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="warm-btn px-8 py-3 disabled:opacity-50"
                    >
                        {submitting ? 'Creating...' : 'Create Quiz'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
