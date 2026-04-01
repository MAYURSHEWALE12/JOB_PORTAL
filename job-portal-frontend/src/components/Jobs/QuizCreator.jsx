import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Save } from 'lucide-react';
import { quizAPI } from '../../services/api';

export default function QuizCreator({ jobId, onSave, onCancel }) {
    const [title, setTitle] = useState('Screening Assessment');
    const [description, setDescription] = useState('');
    const [passingScore, setPassingScore] = useState(60);
    const [timeLimit, setTimeLimit] = useState(15);
    const [questions, setQuestions] = useState([
        { text: '', score: 1, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addQuestion = () => {
        setQuestions([...questions, { text: '', score: 1, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);
    };

    const removeQuestion = (qIndex) => {
        setQuestions(questions.filter((_, i) => i !== qIndex));
    };

    const addOption = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.push({ text: '', isCorrect: false });
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
        setQuestions(newQuestions);
    };

    const updateQuestion = (qIndex, text) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].text = text;
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex, oIndex, text) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex].text = text;
        setQuestions(newQuestions);
    };

    const setCorrect = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.forEach((opt, i) => opt.isCorrect = (i === oIndex));
        setQuestions(newQuestions);
    };

    const validate = () => {
        if (!title.trim()) {
            setError('Quiz title is required');
            return false;
        }
        if (questions.length === 0) {
            setError('At least one question is required');
            return false;
        }
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].text.trim()) {
                setError(`Question ${i + 1} text is required`);
                return false;
            }
            if (questions[i].options.length < 2) {
                setError(`Question ${i + 1} needs at least 2 options`);
                return false;
            }
            for (let j = 0; j < questions[i].options.length; j++) {
                if (!questions[i].options[j].text.trim()) {
                    setError(`Question ${i + 1}, Option ${j + 1} text is required`);
                    return false;
                }
            }
            const hasCorrect = questions[i].options.some(o => o.isCorrect);
            if (!hasCorrect) {
                setError(`Question ${i + 1} must have a correct answer selected`);
                return false;
            }
        }
        if (passingScore < 0 || passingScore > 100) {
            setError('Passing score must be between 0 and 100');
            return false;
        }
        if (timeLimit < 0) {
            setError('Time limit must be a positive number');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        setError('');
        if (!validate()) return;

        setLoading(true);

        try {
            await quizAPI.create(jobId, { 
                title, 
                description, 
                passingScore: parseInt(passingScore) || 0, 
                timeLimit: parseInt(timeLimit) || 0, 
                questions 
            });
            onSave?.();
        } catch (err) {
            console.error('Quiz Save Error:', err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save assessment.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        title.trim() &&
        questions.length > 0 &&
        questions.every(q =>
            q.text.trim() &&
            q.options.length >= 2 &&
            q.options.every(o => o.text.trim()) &&
            q.options.some(o => o.isCorrect)
        ) &&
        passingScore >= 0 && passingScore <= 100 &&
        timeLimit >= 0;

    return (
        <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 p-8 shadow-[12px_12px_0_#000] animate-neo-thump overflow-y-auto max-h-[85vh] custom-scrollbar">
            <div className="flex justify-between items-start mb-10 pb-6 border-b-[4px] border-stone-900">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-white">Create Assessment</h2>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mt-1">Gating criteria for the recruitment pipeline</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="px-6 py-3 font-black uppercase text-xs border-[3px] border-stone-900 hover:bg-stone-100 transition-colors">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading || !isFormValid}
                        className="px-8 py-3 bg-stone-900 text-white font-black uppercase text-xs border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'SAVING...' : <><Save size={16}/> SAVE QUIZ</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-rose-500 text-white font-black uppercase text-[10px] border-[3px] border-stone-900 shadow-[4px_4px_0_#000] flex items-center gap-3">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="space-y-2">
                    <label className="font-black uppercase text-[10px] text-stone-400">Quiz Title *</label>
                    <input 
                        value={title} 
                        onChange={e => { setTitle(e.target.value); setError(''); }}
                        className="w-full p-4 border-[3px] border-stone-900 font-black uppercase text-xs focus:ring-0 focus:border-orange-500 bg-stone-50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="font-black uppercase text-[10px] text-stone-400">Passing Score (%)</label>
                    <input 
                        type="number" 
                        value={passingScore} 
                        onChange={e => setPassingScore(e.target.value)}
                        min="0"
                        max="100"
                        className="w-full p-4 border-[3px] border-stone-900 font-black text-xs focus:ring-0 focus:border-orange-500 bg-stone-50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="font-black uppercase text-[10px] text-stone-400">Time Limit (Mins)</label>
                    <input 
                        type="number" 
                        value={timeLimit} 
                        onChange={e => setTimeLimit(e.target.value)}
                        min="0"
                        className="w-full p-4 border-[3px] border-stone-900 font-black text-xs focus:ring-0 focus:border-orange-500 bg-stone-50"
                    />
                </div>
            </div>

            <div className="space-y-12">
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-stone-50 dark:bg-stone-900/40 border-[3px] border-stone-900 p-8 shadow-[6px_6px_0_#000] relative">
                        <button 
                            onClick={() => removeQuestion(qIdx)} 
                            className="absolute -top-4 -right-4 w-10 h-10 bg-white border-[3px] border-stone-900 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-[3px_3px_0_#000]"
                        >
                            <Trash2 size={18}/>
                        </button>

                        <div className="mb-8">
                            <label className="font-black uppercase text-[10px] text-orange-500 mb-2 block">Question {qIdx + 1} *</label>
                            <textarea 
                                value={q.text} 
                                onChange={e => { updateQuestion(qIdx, e.target.value); setError(''); }}
                                placeholder="TYPE THE QUESTION HERE..."
                                className="w-full p-5 border-[3px] border-stone-900 font-black uppercase text-sm focus:border-orange-500 resize-none h-24"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-4 group">
                                    <button 
                                        onClick={() => setCorrect(qIdx, oIdx)}
                                        className={`shrink-0 w-10 h-10 border-[3px] border-stone-900 flex items-center justify-center transition-all
                                            ${opt.isCorrect ? 'bg-emerald-500 text-white shadow-none' : 'bg-white hover:bg-emerald-100 shadow-[2px_2px_0_#000]'}`}
                                    >
                                        {opt.isCorrect ? <CheckCircle2 size={24}/> : <Circle size={24} className="opacity-20"/>}
                                    </button>
                                    <div className="flex-1 relative">
                                        <input 
                                            value={opt.text} 
                                            onChange={e => { updateOption(qIdx, oIdx, e.target.value); setError(''); }}
                                            placeholder={`OPTION ${oIdx + 1}...`}
                                            className="w-full p-4 border-[3px] border-stone-900 font-black uppercase text-xs focus:border-emerald-500"
                                        />
                                        {q.options.length > 2 && (
                                            <button 
                                                onClick={() => removeOption(qIdx, oIdx)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => addOption(qIdx)}
                                className="border-[3px] border-dashed border-stone-300 p-4 font-black uppercase text-[10px] text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16}/> Add Option
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={addQuestion}
                className="w-full mt-12 py-6 border-[4px] border-dashed border-stone-300 text-stone-400 font-black uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
            >
                <Plus size={24}/> ADD NEW QUESTION
            </button>
        </div>
    );
}
