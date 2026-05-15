import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
    Plus, 
    Trash2, 
    Save, 
    Clock, 
    Target, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    Info, 
    HelpCircle,
    GripVertical,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QuizCreatePage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        passingScore: 70,
        timeLimit: null,
    });

    const [questions, setQuestions] = useState([
        {
            id: 'initial-1',
            text: '',
            score: 1,
            options: [
                { id: 'opt-1', text: '', isCorrect: true },
                { id: 'opt-2', text: '', isCorrect: false },
                { id: 'opt-3', text: '', isCorrect: false },
                { id: 'opt-4', text: '', isCorrect: false },
            ],
        },
    ]);

    const stats = useMemo(() => {
        const totalScore = questions.reduce((acc, q) => acc + (parseInt(q.score) || 0), 0);
        return {
            questionCount: questions.length,
            totalScore,
            passingPoints: Math.ceil((totalScore * quiz.passingScore) / 100)
        };
    }, [questions, quiz.passingScore]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `q-${Date.now()}`,
                text: '',
                score: 1,
                options: [
                    { id: `o-${Date.now()}-1`, text: '', isCorrect: true },
                    { id: `o-${Date.now()}-2`, text: '', isCorrect: false },
                    { id: `o-${Date.now()}-3`, text: '', isCorrect: false },
                    { id: `o-${Date.now()}-4`, text: '', isCorrect: false },
                ],
            },
        ]);
        toast.success('Question added');
    };

    const removeQuestion = (questionId) => {
        if (questions.length === 1) {
            toast.error('Quiz must have at least one question');
            return;
        }
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
            if (q.options.length >= 6) return q;
            return {
                ...q,
                options: [...q.options, { id: `o-${Date.now()}`, text: '', isCorrect: false }],
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!quiz.title.trim()) return toast.error('Quiz title is required');
        if (questions.some(q => !q.text.trim())) return toast.error('All questions must have text');
        
        setSubmitting(true);
        try {
            const quizData = {
                title: quiz.title,
                description: quiz.description,
                passingScore: quiz.passingScore,
                timeLimit: quiz.timeLimit,
                questions: questions.map((q) => ({
                    text: q.text,
                    score: q.score,
                    options: q.options
                        .filter(o => o.text.trim())
                        .map((o) => ({
                            text: o.text,
                            isCorrect: o.isCorrect,
                        })),
                })),
            };

            await quizAPI.create({ ...quizData, jobId });
            toast.success('Assessment created successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to create quiz:', err);
            toast.error(err.response?.data?.message || 'Failed to create quiz');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-hover-bg rounded-full transition-colors text-text-mid"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-text-main flex items-center gap-3">
                            Create Assessment
                            <span className="text-xs font-mono font-normal px-2 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-widest">
                                Builder
                            </span>
                        </h1>
                        <p className="text-text-muted mt-1">Design a screening quiz to filter the best candidates.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="btn-ghost flex-1 md:flex-none"
                    >
                        Save Draft
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn-primary flex items-center justify-center gap-2 flex-1 md:flex-none shadow-lg shadow-primary/20"
                    >
                        {submitting ? (
                            <span className="spinner border-white/30 border-t-white" />
                        ) : (
                            <Save size={18} />
                        )}
                        {submitting ? 'Creating...' : 'Publish Quiz'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Quiz Metadata */}
                    <section className="glass-panel p-8 rounded-2xl shadow-xl space-y-6">
                        <div className="flex items-center gap-3 text-primary border-b border-divider pb-4">
                            <Info size={20} />
                            <h2 className="text-lg font-bold">Quiz Information</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-mid">Assessment Title</label>
                                <input 
                                    type="text"
                                    value={quiz.title}
                                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                                    placeholder="e.g., Senior Frontend Engineer - Technical Screen"
                                    className="input text-lg font-medium"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-mid">Instructions for Candidates</label>
                                <textarea 
                                    value={quiz.description}
                                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                                    placeholder="Tell candidates what to expect, duration, and topics covered..."
                                    className="input h-32 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-mid flex items-center gap-2">
                                        <Target size={14} className="text-primary" />
                                        Passing Score (%)
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={quiz.passingScore}
                                            onChange={(e) => setQuiz({ ...quiz, passingScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                            className="input pr-12"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">%</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-text-mid flex items-center gap-2">
                                        <Clock size={14} className="text-primary" />
                                        Time Limit
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={quiz.timeLimit || ''}
                                            onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
                                            placeholder="No limit"
                                            className="input pr-12"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-xs">min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Questions List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold text-text-main flex items-center gap-3">
                                Questions 
                                <span className="bg-primary text-page text-xs font-bold px-2 py-0.5 rounded-full">
                                    {questions.length}
                                </span>
                            </h2>
                            <button 
                                type="button"
                                onClick={addQuestion}
                                className="flex items-center gap-2 text-primary font-bold hover:underline"
                            >
                                <Plus size={18} />
                                Add Question
                            </button>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {questions.map((question, qIndex) => (
                                <motion.div
                                    key={question.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card p-6 md:p-8 bg-card border-divider hover:border-primary/40 group relative"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-hover-bg flex items-center justify-center font-mono font-bold text-primary border border-divider">
                                            {qIndex + 1}
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                type="text"
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                placeholder="Write your question here..."
                                                className="w-full bg-transparent border-none text-lg font-bold text-text-main placeholder:text-text-muted focus:ring-0 p-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-divider">
                                                <input 
                                                    type="number"
                                                    value={question.score}
                                                    onChange={(e) => updateQuestion(question.id, 'score', Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-8 bg-transparent text-center font-mono font-bold text-primary focus:outline-none"
                                                />
                                                <span className="text-[10px] uppercase tracking-tighter font-bold text-text-muted">PTS</span>
                                            </div>
                                            <button 
                                                onClick={() => removeQuestion(question.id)}
                                                className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Options Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {question.options.map((option, oIndex) => (
                                            <div 
                                                key={option.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                                                    option.isCorrect 
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                                        : 'border-divider bg-surface hover:border-text-muted'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        question.options.forEach((_, i) => {
                                                            updateOption(question.id, question.options[i].id, 'isCorrect', i === oIndex);
                                                        });
                                                    }}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                                        option.isCorrect ? 'bg-primary text-white' : 'bg-divider text-transparent'
                                                    }`}
                                                >
                                                    <CheckCircle2 size={14} />
                                                </button>
                                                <input 
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-0"
                                                />
                                                {question.options.length > 2 && (
                                                    <button 
                                                        onClick={() => removeOption(question.id, option.id)}
                                                        className="text-text-muted hover:text-error p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {question.options.length < 6 && (
                                            <button 
                                                onClick={() => addOption(question.id)}
                                                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-divider text-text-muted hover:border-primary hover:text-primary transition-all text-sm font-medium"
                                            >
                                                <Plus size={14} />
                                                Add Option
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button 
                            type="button"
                            onClick={addQuestion}
                            className="w-full py-8 border-2 border-dashed border-divider rounded-2xl flex flex-col items-center justify-center gap-3 text-text-muted hover:border-primary hover:text-primary transition-all bg-card hover:bg-hover-surface"
                        >
                            <div className="p-3 bg-divider rounded-full group-hover:bg-primary/10">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold">Add Question</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-4 sticky top-24 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <HelpCircle size={120} />
                        </div>
                        
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <MdRocketLaunch className="text-primary" />
                            Quiz Summary
                        </h3>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-divider">
                                <span className="text-sm font-medium text-text-mid">Total Questions</span>
                                <span className="font-mono font-bold text-primary">{stats.questionCount}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-divider">
                                <span className="text-sm font-medium text-text-mid">Maximum Points</span>
                                <span className="font-mono font-bold text-primary">{stats.totalScore}</span>
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-divider">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-text-mid">Required to Pass</span>
                                    <span className="text-[10px] text-text-muted uppercase">Based on {quiz.passingScore}% score</span>
                                </div>
                                <span className="font-mono font-bold text-primary">{stats.passingPoints} pts</span>
                            </div>

                            <div className="pt-4 border-t border-divider">
                                <div className="flex items-center gap-2 text-[10px] text-text-muted mb-4 bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-200/50 dark:border-amber-700/50">
                                    <AlertCircle size={12} className="text-amber-500" />
                                    <span>Applicants below {quiz.passingScore}% will be flagged.</span>
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full btn-primary flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Creating...' : 'Create Assessment'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-surface border border-divider rounded-2xl">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info size={14} />
                            Quick Tips
                        </h4>
                        <ul className="space-y-3">
                            <li className="text-xs text-text-mid flex gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                Keep questions concise and focused on core job skills.
                            </li>
                            <li className="text-xs text-text-mid flex gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                Use at least 4 options per question to reduce guessing.
                            </li>
                            <li className="text-xs text-text-mid flex gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                Ensure only one answer is marked as correct.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
