import { useState, useEffect } from 'react';
import { User, FileText, Star, BarChart2, MessageCircle, Target, Sparkles, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { quizAPI, resumeAnalysisAPI } from '../../services/api';
import UserAvatar from '../UserAvatar';

export default function ApplicationCard({ application, onMove, onPreview }) {
    const { jobSeeker, job, status, rating, selectedResume } = application;
    const [quizResult, setQuizResult] = useState(null);
    const [matchData, setMatchData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showInsights, setShowInsights] = useState(false);

    useEffect(() => {
        fetchQuizResult();
        fetchMatchData();
    }, [application.id, selectedResume?.id]);

    const fetchQuizResult = async () => {
        try {
            const res = await quizAPI.getResult(application.id);
            setQuizResult(res.data);
        } catch (err) {
            // No result yet
        }
    };

    const fetchMatchData = async () => {
        if (!selectedResume?.id || !job?.id) return;
        try {
            const res = await resumeAnalysisAPI.getMatch(selectedResume.id, job.id);
            if (res.status === 200 && res.data) {
                setMatchData(res.data);
            }
        } catch (err) {
            console.error("Match fetch failed", err);
        }
    };

    const runAnalysis = async () => {
        if (!selectedResume?.id || !job?.id) return;
        setIsAnalyzing(true);
        try {
            const res = await resumeAnalysisAPI.analyzeMatch(selectedResume.id, job.id);
            setMatchData(res.data);
        } catch (err) {
            console.error("Analysis failed", err);
            alert("AI Analysis failed. Please try again later.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50';
        if (score >= 50) return 'text-orange-500 border-orange-500 bg-orange-50';
        return 'text-rose-500 border-rose-500 bg-rose-50';
    };

    const nextStages = {
        'PENDING': ['REVIEWED', 'REJECTED'],
        'REVIEWED': ['SHORTLISTED', 'REJECTED'],
        'SHORTLISTED': ['INTERVIEWING', 'REJECTED'],
        'INTERVIEWING': ['OFFERED', 'REJECTED'],
        'OFFERED': ['ACCEPTED', 'REJECTED'],
        'ACCEPTED': [],
        'REJECTED': [],
        'WITHDRAWN': []
    };

    return (
        <div className="group bg-white dark:bg-stone-800 border-[3px] border-stone-900 p-5 shadow-[4px_4px_0_#000] hover:shadow-[10px_10px_0_#ea580c] transition-all h-full flex flex-col min-h-[420px] relative overflow-hidden">
            
            {/* AI Insights Overlay */}
            {showInsights && matchData && (
                <div className="absolute inset-0 z-20 bg-stone-900 text-white p-5 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="font-black uppercase text-xs flex items-center gap-2">
                            <Sparkles size={14} className="text-orange-500" /> Match Insights
                        </h5>
                        <button onClick={() => setShowInsights(false)} className="text-[10px] font-black uppercase hover:text-orange-500">Close</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase text-emerald-400">Top Strengths:</p>
                            <div className="space-y-1">
                                {matchData.strengths?.slice(0, 3).map((s, i) => (
                                    <div key={i} className="flex gap-2 text-[10px] font-bold leading-tight bg-white/5 p-2 border border-white/10">
                                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase text-orange-400">Tailoring Suggestions:</p>
                            <div className="space-y-1">
                                {matchData.suggestions?.slice(0, 2).map((s, i) => (
                                    <div key={i} className="flex gap-2 text-[10px] font-bold leading-tight bg-white/5 p-2 border border-white/10">
                                        <AlertCircle size={12} className="text-orange-500 flex-shrink-0" />
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                        <span className="text-[10px] font-black text-stone-500 uppercase italic">Powered by Career AI</span>
                    </div>
                </div>
            )}

            {/* Header section */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center min-w-0">
                    <UserAvatar user={jobSeeker} size="md" />
                    <div className="min-w-0 overflow-hidden">
                        <h4 className="font-black uppercase text-sm text-stone-900 dark:text-white truncate">
                            {jobSeeker.firstName} {jobSeeker.lastName}
                        </h4>
                        <p className="text-[10px] font-bold text-stone-400 uppercase truncate">
                            {job.title}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 pt-1 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} fill={s <= (rating || 0) ? "currentColor" : "none"} className={s <= (rating || 0) ? "text-orange-500" : "text-stone-200"} />
                    ))}
                </div>
            </div>

            {/* Middle Section (Body) */}
            <div className="flex-1 flex flex-col gap-3">
                {/* AI Match Badge */}
                <div className="h-[52px]">
                    {matchData ? (
                        <button 
                            onClick={() => setShowInsights(true)}
                            className={`w-full p-2 border-[2px] border-stone-900 flex items-center justify-between shadow-[3px_3px_0_#000] h-full hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000] transition-all ${getScoreColor(matchData.matchScore)}`}
                        >
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] font-black uppercase opacity-60">Career AI Match</span>
                                <span className="text-[14px] font-black mt-1">{matchData.matchScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-[8px] font-black uppercase">Click for</p>
                                    <p className="text-[8px] font-black uppercase">Insights</p>
                                </div>
                                <ChevronRight size={14} />
                            </div>
                        </button>
                    ) : (
                        <button 
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className={`w-full h-full border-[2px] border-dashed border-stone-400 p-2 flex items-center justify-center gap-2 transition-all group/ai
                                ${isAnalyzing ? 'bg-stone-50 cursor-wait' : 'hover:bg-orange-50 hover:border-orange-500 hover:border-solid'}`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-stone-300 border-t-orange-500 rounded-full animate-spin" />
                                    <span className="text-[9px] font-black uppercase text-stone-400">Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} className="text-stone-300 group-hover/ai:text-orange-500 transition-colors" />
                                    <span className="text-[9px] font-black uppercase text-stone-400 group-hover/ai:text-orange-500">Verify AI Match</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Quiz Result Badge */}
                <div className="h-[52px]">
                    {quizResult ? (
                        <div className={`p-3 border-[2px] border-stone-900 flex items-center justify-between shadow-[3px_3px_0_#000] h-full
                            ${quizResult.passed ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <div className="flex items-center gap-2">
                                <BarChart2 size={12} className="text-stone-400"/>
                                <span className="text-[8px] font-black uppercase text-stone-600">Quiz:</span>
                            </div>
                            <span className={`text-[12px] font-black ${quizResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {quizResult.score}% {quizResult.passed ? '✓' : '✗'}
                            </span>
                        </div>
                    ) : (
                        <div className="p-3 border-[2px] border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-center h-full opacity-20 bg-stone-50/50 dark:bg-stone-900/50">
                            <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">No Assessment</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                    <button 
                        onClick={() => onPreview(selectedResume?.id, jobSeeker.firstName + ' ' + jobSeeker.lastName)}
                        className="flex-1 flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-900 border-[2px] border-stone-900 py-2.5 text-[10px] font-black uppercase hover:bg-stone-900 hover:text-white transition-colors shadow-[3px_3px_0_#000] active:shadow-none translate-y-0 active:translate-y-[2px]"
                    >
                        <FileText size={14} /> Resume
                    </button>
                    <button className="w-10 flex items-center justify-center bg-white dark:bg-stone-800 border-[2px] border-stone-900 py-2.5 hover:bg-orange-500 hover:text-white transition-colors shadow-[3px_3px_0_#000] active:shadow-none translate-y-0 active:translate-y-[2px]">
                        <MessageCircle size={16} />
                    </button>
                </div>
            </div>

            {/* Footer Section (Actions) */}
            <div className="pt-4 border-t-[2px] border-stone-100 dark:border-stone-700 mt-4 h-[80px] flex flex-col justify-center">
                {nextStages[status]?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {nextStages[status].map(next => (
                            <button
                                key={next}
                                onClick={() => onMove(application.id, next)}
                                className={`px-2.5 py-1.5 border-[2px] border-stone-900 font-black uppercase text-[8px] transition-all shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5
                                    ${next === 'REJECTED' ? 'bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white'}`}
                            >
                                {next}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-1 text-stone-300 dark:text-stone-600">
                        <span className="text-[8px] font-black uppercase tracking-widest">Process Finalized</span>
                    </div>
                )}
            </div>
        </div>
    );
}
