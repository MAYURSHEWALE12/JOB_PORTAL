import { useState, useEffect, useRef } from 'react';
import { quizAPI } from '../../services/api';
import Loader from '../Loader';
import { Timer, Send, CheckCircle2, XCircle, AlertCircle, Bookmark } from 'lucide-react';

export default function TakeQuiz({ jobId, applicationId, onComplete }) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timer, setTimer] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState('');

    const intervalRef = useRef(null);

    useEffect(() => {
        fetchQuiz();
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        if (timer > 0 && !result && !submitting) {
            intervalRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [timer, result, submitting]);

    const fetchQuiz = async () => {
        try {
            const res = await quizAPI.getForCandidate(jobId);
            setQuiz(res.data);
            if (res.data.timeLimit) {
                setTimer(res.data.timeLimit * 60);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('No assessment is available for this application.');
            } else {
                setError('Failed to load assessment. Please refresh.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (questionId, optionId) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
                questionId: parseInt(qId),
                selectedOptionId: oId
            }));
            const res = await quizAPI.submit({ applicationId, answers: formattedAnswers });
            setResult(res.data);
        } catch (err) {
            setError('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <Loader text="Unlocking Assessment..." />;

    if (error && !quiz) {
        return (
            <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-12 shadow-[12px_12px_0_#000] text-center animate-neo-thump">
                <div className="w-24 h-24 mx-auto border-[4px] border-stone-900 flex items-center justify-center mb-8 rotate-3 shadow-[6px_6px_0_#000] bg-stone-200 text-stone-500">
                    <AlertCircle size={48}/>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">No Assessment Available</h2>
                <p className="text-stone-400 font-black uppercase text-xs tracking-[0.2em] mb-10">{error}</p>
                <button 
                    onClick={onComplete}
                    className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-widest border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                    RETURN TO DASHBOARD
                </button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-12 shadow-[12px_12px_0_#000] text-center animate-neo-thump">
                <div className={`w-24 h-24 mx-auto border-[4px] border-stone-900 flex items-center justify-center mb-8 rotate-3 shadow-[6px_6px_0_#000]
                    ${result.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {result.passed ? <CheckCircle2 size={48}/> : <XCircle size={48}/>}
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                    {result.passed ? 'Assessment Passed' : 'Assessment Failed'}
                </h2>
                <p className="text-stone-400 font-black uppercase text-xs tracking-[0.2em] mb-10">
                    Recruitment Phase Screening Result
                </p>

                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div className="p-6 bg-stone-50 border-[3px] border-stone-900 shadow-[4px_4px_0_#000]">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Your Score</p>
                        <p className={`text-4xl font-black ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{result.score}%</p>
                    </div>
                    <div className="p-6 bg-stone-50 border-[3px] border-stone-900 shadow-[4px_4px_0_#000]">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Accuracy</p>
                        <p className="text-4xl font-black text-stone-900">{result.correctAnswers}/{result.totalQuestions}</p>
                    </div>
                </div>

                <button 
                    onClick={onComplete}
                    className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-widest border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                    RETURN TO DASHBOARD
                </button>
            </div>
        );
    }

    if (!quiz) return null;

    const currentQuestion = quiz.questions[currentStep];

    return (
        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 shadow-[12px_12px_0_#000] flex flex-col h-[600px] overflow-hidden relative">
            {/* HUD */}
            <div className="bg-stone-900 text-white p-6 border-b-[4px] border-stone-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-white text-stone-900 font-black text-xs border-[2px] border-stone-900 shadow-[2px_2px_0_#ea580c]">
                        {currentStep + 1} / {quiz.questions.length}
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-tighter text-sm truncate max-w-[200px]">{quiz.title}</h3>
                        <div className="w-full bg-stone-700 h-1 mt-1 border border-stone-800">
                            <div 
                                className="bg-orange-500 h-full transition-all duration-300" 
                                style={{ width: `${((currentStep + 1) / quiz.questions.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {quiz.timeLimit && (
                    <div className={`p-4 border-[3px] border-stone-900 flex items-center gap-3 font-black text-xl shadow-[4px_4px_0_#000]
                        ${timer < 60 ? 'bg-rose-500 text-white animate-pulse' : 'bg-orange-500 text-stone-900'}`}>
                        <Timer size={24}/>
                        <span>{formatTime(timer)}</span>
                    </div>
                )}
            </div>

            {/* Question Body */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-stone-50 dark:bg-stone-900/10">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-start gap-6 mb-12">
                        <Bookmark size={32} className="text-orange-500 shrink-0 mt-1" />
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight text-stone-900 dark:text-white">
                            {currentQuestion.text}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {currentQuestion.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelect(currentQuestion.id, opt.id)}
                                className={`w-full p-6 border-[3px] border-stone-900 text-left font-black uppercase text-sm flex items-center justify-between transition-all group
                                    ${answers[currentQuestion.id] === opt.id 
                                        ? 'bg-orange-500 text-stone-900 shadow-none translate-x-1 translate-y-1' 
                                        : 'bg-white dark:bg-stone-800 hover:bg-stone-100 shadow-[4px_4px_0_#000]'}`}
                            >
                                <span>{opt.text}</span>
                                {answers[currentQuestion.id] === opt.id && <CheckCircle2 size={24}/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navbar */}
            <div className="p-6 border-t-[4px] border-stone-900 bg-white dark:bg-stone-800 flex justify-between items-center shrink-0">
                <button 
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 border-[3px] border-stone-900 font-black uppercase text-xs hover:bg-stone-100 disabled:opacity-20"
                >
                    PREVIOUS
                </button>

                {currentStep === quiz.questions.length - 1 ? (
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting || !answers[currentQuestion.id]}
                        className="px-10 py-4 bg-emerald-500 text-white font-black uppercase text-xs border-[3px] border-stone-900 shadow-[6px_6px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3"
                    >
                        {submitting ? 'PROCESSING...' : <><Send size={18}/> SUBMIT ASSESSMENT</>}
                    </button>
                ) : (
                    <button 
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={!answers[currentQuestion.id]}
                        className="px-10 py-4 bg-stone-900 text-white font-black uppercase text-xs border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        NEXT QUESTION
                    </button>
                )}
            </div>

            {error && (
                <div className="absolute bottom-24 left-6 right-6 p-4 bg-rose-500 text-white font-black uppercase text-[10px] border-[3px] border-stone-900 flex items-center gap-3 shadow-[4px_4px_0_#000]">
                    <AlertCircle size={18}/> {error}
                </div>
            )}
        </div>
    );
}
