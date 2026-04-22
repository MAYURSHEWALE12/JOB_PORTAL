import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { quizAPI, applicationAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Loader from '../Loader';

export default function QuizTakePage({ passedJobId, passedApplicationId, onClose }) {
    const params = useParams();
    const jobId = passedJobId || params.jobId;
    const applicationId = passedApplicationId || params.applicationId;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuiz();
    }, [jobId]);

    useEffect(() => {
        if (quiz?.timeLimit && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quiz, timeLeft]);

    const fetchQuiz = async () => {
        setLoading(true);
        try {
            const res = await quizAPI.getByJob(jobId);
            setQuiz(res.data);
            if (res.data?.timeLimit) {
                setTimeLeft(res.data.timeLimit * 60);
            }
        } catch (err) {
            console.error('Failed to fetch quiz:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmit = async () => {
        if (submitted) return;
        setSubmitting(true);

        const submission = {
            applicationId: parseInt(applicationId),
            answers: Object.entries(answers).map(([questionId, optionId]) => ({
                questionId: parseInt(questionId),
                selectedOptionId: parseInt(optionId),
            })),
        };

        try {
            const res = await quizAPI.submit(submission);
            setResult(res.data);
            setSubmitted(true);
        } catch (err) {
            console.error('Failed to submit quiz:', err);
            alert('Failed to submit quiz. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleClose = () => {
        if (onClose) onClose(submitted ? result : null);
        else navigate('/dashboard');
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader text="Loading assessment..." />
                </div>
            );
        }

        if (!quiz) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-serif font-bold text-[#2D1F14] mb-2">No Assessment Found</h2>
                    <p className="text-[#8B7355] mb-8">This job doesn't appear to have an active assessment.</p>
                    <button onClick={handleClose} className="bg-[#4A3728] text-white px-8 py-3 rounded-xl shadow hover:bg-[#2D1F14] transition font-medium">
                        Return
                    </button>
                </motion.div>
            );
        }

        if (submitted && result) {
            const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
            return (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl mx-auto py-8">
                    <div className="mb-6 flex justify-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl
                            ${result.passed ? 'bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] text-[#2E7D32]' : 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] text-[#C62828]'}`}>
                            {result.passed ? '🎉' : '📋'}
                        </div>
                    </div>
                    <h2 className={`text-3xl font-serif font-bold mb-3 ${result.passed ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                        {result.passed ? 'Assessment Passed!' : 'Assessment Completed'}
                    </h2>
                    <p className="text-[#8B7355] mb-8 text-lg">
                        {result.passed ? "Excellent work! Your application will now stand out." : "You've finished the assessment. Employers will review your attempt."}
                    </p>

                    <div className="bg-[#F5EDE3] border border-[#EAD9C4] rounded-2xl p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1" style={{ background: result.passed ? '#4A7C59' : '#C62828' }} />
                        <div className={`text-6xl font-serif font-bold mb-2 tracking-tight ${result.passed ? 'text-[#4A7C59]' : 'text-[#C62828]'}`}>
                            {percentage}%
                        </div>
                        <p className="text-[#4A3728] font-medium text-lg">
                            {result.correctAnswers} out of {result.totalQuestions} correct
                        </p>
                        <div className="mt-4 pt-4 border-t border-[#EAD9C4] flex justify-center gap-6 text-sm">
                            <span className="text-[#8B7355]">Required to pass: <strong className="text-[#2D1F14]">{quiz.passingScore}%</strong></span>
                            <span className="text-[#8B7355]">Time taken: <strong className="text-[#2D1F14]">{quiz.timeLimit ? `${quiz.timeLimit} mins` : 'Untimed'}</strong></span>
                        </div>
                    </div>

                    <button onClick={handleClose} className="bg-[#4A3728] text-white px-10 py-3.5 rounded-xl shadow-lg hover:bg-[#2D1F14] transition font-semibold text-lg w-full">
                        Continue to Dashboard
                    </button>
                </motion.div>
            );
        }

        const answeredCount = Object.keys(answers).length;
        const progress = (answeredCount / (quiz.questions?.length || 1)) * 100;

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32 sm:pb-24">
                <div className="bg-gradient-to-br from-[#F5EDE3] to-[#FAF6F0] rounded-2xl p-6 mb-8 border border-[#EAD9C4] shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-[#2D1F14] mb-1">{quiz.title}</h2>
                            <p className="text-[#8B7355] text-sm md:text-base">{quiz.description}</p>
                        </div>
                        {timeLeft !== null && (
                            <div className={`text-2xl font-mono font-bold px-6 py-3 rounded-xl shadow-inner border tracking-wider
                                ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-[#4A3728] border-[#EAD9C4]'}`}>
                                ⏱ {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#8B7355] mb-2">
                            <span>Progress: {answeredCount} / {quiz.questions?.length}</span>
                            <span>Target: {quiz.passingScore}%</span>
                        </div>
                        <div className="h-2.5 bg-white border border-[#EAD9C4] rounded-full overflow-hidden shadow-inner">
                            <div className="h-full rounded-full transition-all duration-500 ease-out bg-[#C2651A]" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {quiz.questions?.map((question, qIndex) => (
                        <motion.div key={question.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qIndex * 0.05 }} className="bg-white border border-[#EAD9C4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex gap-4 mb-6">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner transition-colors duration-300
                                    ${answers[question.id] ? 'bg-[#4A7C59]' : 'bg-[#D4C4B0]'}`}>
                                    {qIndex + 1}
                                </span>
                                <p className="text-[17px] font-medium text-[#2D1F14] mt-1 leading-relaxed">
                                    {question.text}
                                </p>
                            </div>

                            <div className="space-y-3 md:ml-12">
                                {question.options?.map(option => {
                                    const isSelected = answers[question.id] === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelectAnswer(question.id, option.id)}
                                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 group border-2
                                                ${isSelected 
                                                    ? 'border-[#C2651A] bg-[#FFF3E0] shadow-sm' 
                                                    : 'border-[#F0E6D8] hover:border-[#E8A66A] hover:bg-[#FAF6F0]'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                                    ${isSelected ? 'border-[#C2651A] bg-[#C2651A]' : 'border-[#D4C4B0] group-hover:border-[#E8A66A]'}`}>
                                                    {isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className={`text-[15px] ${isSelected ? 'font-semibold text-[#8C4A11]' : 'text-[#4A3728]'}`}>
                                                    {option.text}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none z-10 flex justify-center">
                    <div className="bg-white/95 backdrop-blur-md border border-[#EAD9C4] rounded-2xl p-3 sm:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] w-full max-w-4xl flex justify-between items-center gap-3 pointer-events-auto">
                        <p className="text-[#8B7355] font-medium text-xs sm:text-base">
                            <span className="text-[#2D1F14] font-bold">{answeredCount}</span>/{quiz.questions?.length}
                            <span className="hidden sm:inline"> answered</span>
                        </p>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || answeredCount === 0}
                            className={`px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-white shadow-lg transition-all text-sm sm:text-base
                                ${submitting || answeredCount === 0 
                                    ? 'bg-[#D4C4B0] cursor-not-allowed opacity-70' 
                                    : 'bg-[#C2651A] hover:bg-[#8C4A11] active:scale-[0.98]'}`}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (onClose) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="bg-[#FAFAFA] w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[96vh] sm:rounded-2xl shadow-2xl overflow-y-auto relative"
                    >
                        <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-[#EAD9C4]">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#8B7355]">Assessment</span>
                            <button 
                                onClick={handleClose} 
                                className="w-9 h-9 bg-white border border-[#EAD9C4] rounded-full flex items-center justify-center text-[#8B7355] hover:text-[#C62828] hover:bg-[#FFEBEE] transition-colors shadow-sm"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 sm:p-8 relative min-h-[400px]">
                            {renderContent()}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            {renderContent()}
        </div>
    );
}
