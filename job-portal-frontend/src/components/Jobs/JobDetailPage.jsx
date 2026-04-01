import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI, quizAPI, getImageUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import PublicNavbar from '../PublicNavbar';
import Loader from '../Loader';
import ApplyResumePicker from '../Resume/ApplyResumePicker';
import TakeQuiz from '../Applications/TakeQuiz';
import { MapPin, Briefcase, Calendar, DollarSign, Building2, ChevronLeft, Share2, ShieldCheck, Tag, Zap } from 'lucide-react';

export default function JobDetailPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuthStore();
    
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Apply modal state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applySuccess, setApplySuccess] = useState('');
    const [applyError, setApplyError] = useState('');

    // Assessment integration
    const [showAssessmentPrompt, setShowAssessmentPrompt] = useState(false);
    const [assessmentJobId, setAssessmentJobId] = useState(null);
    const [assessmentAppId, setAssessmentAppId] = useState(null);
    const [takingQuiz, setTakingQuiz] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId || Number.isNaN(Number(jobId))) {
                setError('Invalid job link.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await jobAPI.getById(jobId);
                setJob(res.data);
            } catch (err) {
                console.error('Failed to load job details:', err);
                setError('Failed to load this job.');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    const handleApply = async () => {
        if (!user) return;
        setApplying(true);
        setApplyError('');
        setApplySuccess('');
        try {
            const res = await applicationAPI.apply(job.id, user.id, coverLetter, selectedResumeId);
            const newApp = res.data;
            
            // Check if job has assessment
            try {
                const qRes = await quizAPI.getForCandidate(job.id);
                if (qRes.data) {
                    setAssessmentJobId(job.id);
                    setAssessmentAppId(newApp.id);
                    setShowAssessmentPrompt(true);
                    setApplySuccess('🎉 Application Dispatched! Phase 2: Assessment Required.');
                } else {
                    setApplySuccess('🎉 Your application has been dispatched successfully!');
                    setTimeout(() => {
                        setShowApplyModal(false);
                        setApplySuccess('');
                    }, 2000);
                }
            } catch (qErr) {
                // No quiz for this job
                setApplySuccess('🎉 Your application has been dispatched successfully!');
                setTimeout(() => {
                    setShowApplyModal(false);
                    setApplySuccess('');
                }, 2000);
            }
        } catch (err) {
            setApplyError(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <Loader text="Analyzing job data..." />;

    if (error || !job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-stone-950 p-6">
                <div className="max-w-md w-full bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-10 shadow-[10px_10px_0_#1c1917] text-center">
                    <div className="text-6xl mb-6 grayscale opacity-30">🚫</div>
                    <h1 className="text-3xl font-black uppercase text-stone-900 dark:text-white mb-4">Job Expired</h1>
                    <p className="text-stone-500 dark:text-stone-400 font-bold mb-8 uppercase tracking-widest text-xs">{error || 'This opportunity is no longer available.'}</p>
                    <Link to="/" className="w-full block bg-stone-900 text-white py-4 px-6 uppercase font-black text-xs tracking-widest border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c]">
                        Return to Base
                    </Link>
                </div>
            </div>
        );
    }

    const companyName = job.employer?.companyProfile?.companyName || `${job.employer?.firstName || ''} ${job.employer?.lastName || ''}`.trim();
    const companyId = job.employer?.id;

    return (
        <div className="min-h-screen bg-orange-50/50 dark:bg-stone-950 transition-colors duration-500 pb-24">
            <PublicNavbar />

            <div className="max-w-6xl mx-auto px-6 mt-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-4 mb-10 overflow-x-auto whitespace-nowrap pb-2">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-500 hover:text-orange-500 transition-colors">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <div className="h-4 w-[2px] bg-stone-300 dark:bg-stone-800" />
                    <Link to="/companies" className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 dark:hover:text-white">Directory</Link>
                    <span className="text-stone-300">/</span>
                    <Link to={`/company/${companyId}`} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 dark:hover:text-white">{companyName}</Link>
                    <span className="text-stone-300">/</span>
                    <span className="text-[10px] font-black uppercase text-orange-500 underline decoration-2 underline-offset-4">{job.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left: Main Specs */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 shadow-[10px_10px_0_#1c1917] dark:shadow-[10px_10px_0_#000] overflow-hidden">
                            <div className="p-8 md:p-12 border-b-[4px] border-stone-900 dark:border-stone-700 bg-stone-900 dark:bg-stone-800 text-white relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 -mr-8 -mt-8 rotate-45 border-[2px] border-dashed border-orange-500/30" />
                                
                                {/* Company Logo Top Left */}
                                <div className="mb-8 relative z-10">
                                    <div className="w-20 h-20 bg-white dark:bg-stone-900 border-[3px] border-orange-500 shadow-[4px_4px_0_#000] flex items-center justify-center overflow-hidden p-2">
                                        {job.employer?.companyProfile?.logoUrl ? (
                                            <img src={getImageUrl(`/companies/image/${job.employer.companyProfile.logoUrl}`)} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
                                        ) : (
                                            <span className="font-black text-3xl text-orange-500">{companyName.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
                                    <div className="px-3 py-1 bg-emerald-500 text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] border-[2px] border-stone-900 shadow-[2px_2px_0_#000]">
                                        Verified Role ✨
                                    </div>
                                    <div className="px-3 py-1 bg-orange-500 text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] border-[2px] border-stone-900 shadow-[2px_2px_0_#000]">
                                        {job.jobType?.replace('_', ' ')}
                                    </div>
                                    {job.salaryMin && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] border-[2px] border-stone-900 shadow-[2px_2px_0_#000]">
                                            <Tag size={12} className="text-orange-600" />
                                            ₹{(job.salaryMin/100000).toFixed(1)}L - {(job.salaryMax/100000).toFixed(1)}L
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 relative z-10">
                                    {job.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-sm font-bold uppercase text-stone-400 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} className="text-rose-500" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 size={18} className="text-blue-500" />
                                        <span>{companyName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-emerald-500" />
                                        <span>Post Date: {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                                <div className="space-y-12">
                                    <div>
                                        <h2 className="text-2xl font-black uppercase text-stone-900 dark:text-white mb-6 flex items-center gap-3">
                                            <div className="w-2 h-8 bg-orange-500" />
                                            Objective & Mission
                                        </h2>
                                        <div className="text-lg text-stone-600 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-wrap selection:bg-orange-200">
                                            {job.description}
                                        </div>
                                    </div>

                                    {/* Compensation Details Section */}
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-[3px] border-emerald-900 dark:border-emerald-700 p-8 shadow-[6px_6px_0_#065f46]">
                                        <h2 className="text-xl font-black uppercase text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                            <DollarSign size={20} /> Compensation & Growth
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-emerald-700/50 mb-1">Annual Rewards</p>
                                                <p className="text-2xl font-black text-emerald-900 dark:text-white">
                                                  ₹{(job.salaryMin/100000).toFixed(1)}L - {(job.salaryMax/100000).toFixed(1)}L
                                                </p>
                                                <p className="text-xs text-emerald-700/70 font-bold uppercase mt-1">Negotiable based on expertise</p>
                                            </div>
                                            <div className="border-l-[2px] border-emerald-200 dark:border-emerald-800 pl-8">
                                                <p className="text-[10px] font-black uppercase text-emerald-700/50 mb-1">Impact Level</p>
                                                <p className="text-xl font-black text-emerald-900 dark:text-white uppercase tracking-tighter">
                                                  {job.experienceRequired || 'All Tiers'}
                                                </p>
                                                <p className="text-xs text-emerald-700/70 font-bold uppercase mt-1">Experience Preferred</p>
                                            </div>
                                        </div>
                                    </div>

                                    {job.requirements && (
                                        <div>
                                            <h2 className="text-2xl font-black uppercase text-stone-900 dark:text-white mb-6 flex items-center gap-3">
                                                <div className="w-2 h-8 bg-rose-500" />
                                                Core Requirements
                                            </h2>
                                            <div className="bg-stone-50 dark:bg-stone-800/50 border-[3px] border-stone-900 dark:border-stone-700 p-8 text-stone-600 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-wrap">
                                                {job.requirements}
                                            </div>
                                        </div>
                                    )}
                                </div>
                        </section>
                    </div>

                    {/* Right: Actions & Stats */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-8 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] sticky top-28">
                            <div className="space-y-6 mb-10">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900 dark:text-white border-b-[3px] border-stone-900 dark:border-stone-700 pb-2">Compensation</h3>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 border-[2px] border-stone-900 dark:border-stone-700 group-hover:bg-emerald-200 transition-colors">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-stone-400">Annual Package (INR)</p>
                                        <p className="text-xl font-black text-stone-900 dark:text-white">
                                            {job.salaryMin ? `${(job.salaryMin/100000).toFixed(1)}L - ${(job.salaryMax/100000).toFixed(1)}L` : 'Confidential'}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900 dark:text-white border-b-[3px] border-stone-900 dark:border-stone-700 pb-2 mt-10">Candidate Fit</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 border-[2px] border-stone-900 dark:border-stone-700">
                                            <Briefcase className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-stone-400 leading-none">Experience</p>
                                            <p className="text-xs font-bold text-stone-700 dark:text-gray-300 uppercase">
                                                {job.experienceRequired || 'All levels welcome'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-rose-100 dark:bg-rose-900/30 border-[2px] border-stone-900 dark:border-stone-700">
                                            <ShieldCheck className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-stone-400 leading-none">Openings</p>
                                            <p className="text-xs font-bold text-stone-700 dark:text-gray-300 uppercase">
                                                {job.positionsAvailable || '1'} Positions
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isLoggedIn ? (
                                user?.role === 'JOBSEEKER' ? (
                                    <button 
                                        onClick={() => setShowApplyModal(true)}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-stone-900 border-[3px] border-stone-900 shadow-[6px_6px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all py-5 font-black uppercase tracking-[0.2em] text-sm"
                                    >
                                        Deploy Application
                                    </button>
                                ) : (
                                    <div className="p-4 bg-stone-100 dark:bg-stone-800 border-[2px] border-dashed border-stone-900 dark:border-stone-700 text-center">
                                        <p className="text-[10px] font-black uppercase text-stone-500">Employers cannot apply to roles.</p>
                                    </div>
                                )
                            ) : (
                                <Link 
                                    to="/login"
                                    className="w-full block bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-[3px] border-stone-900 shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all py-5 font-black uppercase tracking-[0.2em] text-sm text-center"
                                >
                                    Login to Apply
                                </Link>
                            )}

                            <button className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors py-2">
                                <Share2 size={14} /> Share this opportunity
                            </button>
                        </div>
                        
                        {/* Company Card Mini */}
                        <Link to={`/company/${companyId}`} className="group block bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-6 shadow-[6px_6px_0_#000] hover:-translate-y-1 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 border-[3px] border-stone-900 flex items-center justify-center overflow-hidden">
                                     {job.employer?.companyProfile?.logoUrl ? (
                                         <img src={getImageUrl(`/companies/image/${job.employer.companyProfile.logoUrl}`)} alt="Logo" className="w-full h-full object-contain p-1" loading="lazy" />
                                     ) : (
                                        <span className="font-black text-2xl text-orange-500">{companyName.charAt(0)}</span>
                                     )}
                                </div>
                                <div>
                                    <h4 className="font-black uppercase text-stone-900 dark:text-white tracking-tighter leading-none mb-1 group-hover:text-orange-500 transition-colors">{companyName}</h4>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Industry Leader</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 shadow-[16px_16px_0_#1c1917] dark:shadow-[16px_16px_0_#000] w-full max-w-xl p-8 md:p-12 relative animate-neo-thump">
                        <button onClick={() => setShowApplyModal(false)} className="absolute top-6 right-6 w-10 h-10 flex border-[3px] border-stone-900 dark:border-stone-700 items-center justify-center bg-white dark:bg-stone-800 hover:bg-rose-500 hover:text-white hover:border-rose-700 transition-colors shadow-[4px_4px_0_#000] hover:shadow-none font-black text-xl">✕</button>
                        
                        <div className="mb-10">
                            <h2 className="text-3xl font-black uppercase text-stone-900 dark:text-white tracking-tighter leading-none mb-2">Deploying Profile</h2>
                            <p className="text-orange-600 dark:text-orange-400 font-bold uppercase text-[10px] tracking-[0.2em]">{job.title}</p>
                        </div>

                        {applySuccess ? (
                            <div className="bg-emerald-500 border-[4px] border-stone-900 p-8 text-white text-center">
                                <p className="text-4xl mb-4">🚀</p>
                                <p className="text-xl font-black uppercase tracking-widest leading-tight">{applySuccess}</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <ApplyResumePicker
                                    userId={user?.id}
                                    selectedResumeId={selectedResumeId}
                                    onSelect={setSelectedResumeId}
                                />

                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-stone-600 dark:text-stone-400">
                                        <Tag size={14} className="text-orange-500" />
                                        Cover Message (Optional)
                                    </label>
                                    <textarea 
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        rows={4}
                                        placeholder="Articulate your value proposition to the employer..."
                                        className="w-full bg-stone-50 dark:bg-stone-950 p-4 border-[3px] border-stone-900 dark:border-stone-700 outline-none font-medium text-stone-600 dark:text-gray-400 focus:shadow-[4px_4px_0_#000] focus:border-orange-500 transition-all resize-none"
                                    />
                                </div>

                                {applyError && (
                                    <div className="bg-rose-500/10 border-[3px] border-rose-500 p-4 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">
                                        {applyError}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button 
                                        onClick={() => setShowApplyModal(false)}
                                        className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 px-6 py-4 font-black uppercase text-xs tracking-widest hover:bg-stone-100 transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={handleApply}
                                        disabled={applying || !selectedResumeId}
                                        className="flex-1 bg-orange-500 hover:bg-orange-600 border-[3px] border-stone-900 text-stone-900 px-6 py-4 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {applying ? 'Transmitting...' : '🚀 Finalize Deployment'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Assessment Prompt Overlay within Modal */}
                        {showAssessmentPrompt && (
                            <div className="absolute inset-0 bg-stone-900 text-white p-12 flex flex-col items-center justify-center text-center z-50">
                                <div className="w-20 h-20 bg-orange-500 border-[4px] border-white flex items-center justify-center mb-8 rotate-12 shadow-[6px_6px_0_#000]">
                                    <Zap size={40} className="text-stone-900" />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Assessment Required</h3>
                                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-10 max-w-xs">
                                    The employer has requested a mandatory screening quiz for this role. Complete it now to finalize your candidacy.
                                </p>
                                <button 
                                    onClick={() => {
                                        setTakingQuiz(true);
                                        setShowAssessmentPrompt(false);
                                    }}
                                    className="w-full py-4 bg-white text-stone-900 font-black uppercase tracking-widest border-[3px] border-white shadow-[6px_6px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                >
                                    START ASSESSMENT NOW
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowApplyModal(false);
                                        setShowAssessmentPrompt(false);
                                    }}
                                    className="mt-6 text-[10px] font-black uppercase text-stone-500 hover:text-white transition-colors"
                                >
                                    I'll do it later from my dashboard
                                </button>
                            </div>
                        )}

                        {/* Take Quiz Modal Overlay */}
                        {takingQuiz && (
                            <div className="fixed inset-0 z-[200] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-4">
                                <div className="w-full max-w-3xl">
                                    <TakeQuiz 
                                        jobId={assessmentJobId}
                                        applicationId={assessmentAppId}
                                        onComplete={() => {
                                            setTakingQuiz(false);
                                            setShowApplyModal(false);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
