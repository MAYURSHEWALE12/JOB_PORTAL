import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { companyAPI, API_BASE_URL } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';



const companyTabs = [
    {
        key: 'profile', label: 'Company Profile', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        )
    },
    {
        key: 'jobs', label: 'Manage Postings', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        )
    },
    {
        key: 'applicants', label: 'Applicant Pipeline', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        )
    },
];

export default function CompanyBranding() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(null);
    const [previewMarkdown, setPreviewMarkdown] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [formData, setFormData] = useState({
        companyName: '', website: '', location: '', industry: '',
        employeeCount: '', description: '', foundedYear: '',
        specialties: '', linkedin: '', twitter: '', github: '',
    });

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user || user.role !== 'EMPLOYER') return;
        setLoading(true);
        try {
            const res = await companyAPI.getMy();
            if (res.data) {
                setProfile(res.data);
                setFormData({
                    companyName: res.data.companyName || '',
                    website: res.data.website || '',
                    location: res.data.location || '',
                    industry: res.data.industry || '',
                    employeeCount: res.data.employeeCount || '',
                    description: res.data.description || '',
                    foundedYear: res.data.foundedYear || '',
                    specialties: res.data.specialties || '',
                    linkedin: res.data.linkedin || '',
                    twitter: res.data.twitter || '',
                    github: res.data.github || '',
                });
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Failed to fetch company profile:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSuccessMsg('');
        setErrorMsg('');
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const showError = (msg) => {
        setErrorMsg(msg);
        setSuccessMsg('');
        setTimeout(() => setErrorMsg(''), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await companyAPI.update(formData);
            setProfile(res.data);
            showSuccess('Company profile saved successfully!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Failed to save profile:', err);
            showError(err.response?.data?.message || 'Failed to save profile. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage('logo');
        try {
            const res = await companyAPI.uploadLogo(file);
            setProfile(res.data);
            showSuccess('Logo updated successfully!');
        } catch (err) {
            showError('Failed to upload logo. Ensure it is a valid image file.');
        } finally {
            setUploadingImage(null);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage('banner');
        try {
            const res = await companyAPI.uploadBanner(file);
            setProfile(res.data);
            showSuccess('Banner updated successfully!');
        } catch (err) {
            showError('Failed to upload banner. Ensure it is a valid image file.');
        } finally {
            setUploadingImage(null);
        }
    };

    const handleTabClick = (key) => {
        if (key === 'jobs') {
            navigate('/manage-jobs'); // Redirects to actual job management
        } else if (key === 'applicants') {
            navigate('/view-applications'); // Redirects to actual ATS pipeline
        } else {
            setActiveTab(key);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="w-10 h-10 animate-spin" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-medium tracking-wide text-sm" style={{ color: 'var(--hp-muted)' }}>Loading Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 relative z-10">
            <style>{`
                .hp-card { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 16px; box-shadow: var(--hp-shadow-card, 0 4px 24px rgba(0,0,0,0.08)); transition: all 0.25s ease; }
                .hp-input { width: 100%; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); border-radius: 12px; padding: 12px 16px; font-size: 0.9rem; transition: all 0.2s; outline: none; }
                .hp-input:focus { border-color: rgba(var(--hp-accent-rgb), 0.5); background: var(--hp-surface); box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1); }
                
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; box-shadow: 0 4px 20px rgba(var(--hp-accent-rgb), .35); }
                .hp-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(var(--hp-accent-rgb), .45); }
                .hp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--hp-surface-alt); border: 1px solid var(--hp-border); color: var(--hp-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover:not(:disabled) { background: rgba(var(--hp-accent-rgb), .1); border-color: rgba(var(--hp-accent-rgb), .3); color: var(--hp-accent); }

                .form-section-title { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hp-muted); margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--hp-border); }
            `}</style>

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight mb-2">
                        Company Workspace
                    </h2>
                    <p className="text-[var(--hp-muted)] font-medium text-sm">
                        Manage your employer brand and attract top talent
                    </p>
                </div>
                {user?.id && (
                    <Link to={`/company/${user.id}`} target="_blank" className="hp-btn-ghost px-5 py-2.5 text-sm flex items-center gap-2 w-fit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        View Public Profile
                    </Link>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="hp-card p-4 sticky top-24">
                        <nav className="space-y-1.5">
                            {companyTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all border"
                                    style={activeTab === tab.key ? {
                                        backgroundColor: 'rgba(var(--hp-accent-rgb), 0.1)',
                                        borderColor: 'rgba(var(--hp-accent-rgb), 0.2)',
                                        color: 'var(--hp-accent)'
                                    } : {
                                        backgroundColor: 'transparent',
                                        borderColor: 'transparent',
                                        color: 'var(--hp-text-sub)'
                                    }}
                                    onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'var(--hp-surface-alt)'; }}
                                    onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="opacity-90">{tab.icon}</span>
                                        <span className="text-[.9rem] font-bold">{tab.label}</span>
                                    </div>
                                    {tab.key !== 'profile' && (
                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 overflow-hidden"
                                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {successMsg}
                            </motion.div>
                        )}
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-3 overflow-hidden"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Banner & Logo Section */}
                                <div className="hp-card overflow-hidden">
                                    <div
                                        className="h-40 sm:h-48 relative cursor-pointer group"
                                        style={{ background: profile?.bannerUrl ? 'transparent' : 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        {profile?.bannerUrl && (
                                            <img
                                                src={`${API_BASE_URL}/companies/image/${profile.bannerUrl}`}
                                                alt="Company Banner"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.4)' }}>
                                            <span className="text-white font-bold tracking-wider text-sm flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {uploadingImage === 'banner' ? 'Uploading...' : 'Update Cover Image'}
                                            </span>
                                        </div>
                                        <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                                    </div>

                                    <div className="px-6 sm:px-8 pb-8">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 sm:-mt-16">
                                            <div
                                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden relative cursor-pointer group shadow-xl flex-shrink-0"
                                                style={{ border: '4px solid var(--hp-card)', background: 'var(--hp-surface-alt)' }}
                                                onClick={() => logoInputRef.current?.click()}
                                            >
                                                {profile?.logoUrl ? (
                                                    <img
                                                        src={`${API_BASE_URL}/companies/image/${profile.logoUrl}`}
                                                        alt="Company Logo"
                                                        className="w-full h-full object-cover bg-white"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-black text-4xl text-white" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                                                        {(formData.companyName || 'C').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                                    <span className="text-white text-xs font-bold tracking-wider uppercase">
                                                        {uploadingImage === 'logo' ? '...' : 'Upload'}
                                                    </span>
                                                </div>
                                                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                            </div>
                                            <div className="mb-2 flex-1 min-w-0">
                                                <h3 className="font-bold text-2xl sm:text-3xl text-[var(--hp-text)] truncate tracking-tight">
                                                    {formData.companyName || 'Your Company Name'}
                                                </h3>
                                                <p className="text-[var(--hp-accent)] font-medium text-sm mt-1">{formData.industry || 'Specify your industry below'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Sections */}
                                <div className="hp-card p-6 sm:p-8">
                                    <h3 className="form-section-title">Company Identity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">
                                                Company Name <span className="text-red-400">*</span>
                                            </label>
                                            <input type="text" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className="hp-input" required />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Industry</label>
                                            <div className="relative">
                                                <select value={formData.industry} onChange={(e) => handleChange('industry', e.target.value)} className="hp-input appearance-none">
                                                    <option value="" style={{ background: 'var(--hp-card)' }}>Select Industry</option>
                                                    <option value="Technology" style={{ background: 'var(--hp-card)' }}>Technology</option>
                                                    <option value="Healthcare" style={{ background: 'var(--hp-card)' }}>Healthcare</option>
                                                    <option value="Finance" style={{ background: 'var(--hp-card)' }}>Finance</option>
                                                    <option value="Education" style={{ background: 'var(--hp-card)' }}>Education</option>
                                                    <option value="Retail" style={{ background: 'var(--hp-card)' }}>Retail</option>
                                                    <option value="Manufacturing" style={{ background: 'var(--hp-card)' }}>Manufacturing</option>
                                                    <option value="Media" style={{ background: 'var(--hp-card)' }}>Media</option>
                                                    <option value="Other" style={{ background: 'var(--hp-card)' }}>Other</option>
                                                </select>
                                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Company Size</label>
                                            <div className="relative">
                                                <select value={formData.employeeCount} onChange={(e) => handleChange('employeeCount', e.target.value)} className="hp-input appearance-none">
                                                    <option value="" style={{ background: 'var(--hp-card)' }}>Select Size</option>
                                                    <option value="1-10" style={{ background: 'var(--hp-card)' }}>1-10 Employees</option>
                                                    <option value="11-50" style={{ background: 'var(--hp-card)' }}>11-50 Employees</option>
                                                    <option value="51-200" style={{ background: 'var(--hp-card)' }}>51-200 Employees</option>
                                                    <option value="201-500" style={{ background: 'var(--hp-card)' }}>201-500 Employees</option>
                                                    <option value="501-1000" style={{ background: 'var(--hp-card)' }}>501-1000 Employees</option>
                                                    <option value="1000+" style={{ background: 'var(--hp-card)' }}>1000+ Employees</option>
                                                </select>
                                                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--hp-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Location</label>
                                            <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="e.g., Mumbai, India" className="hp-input" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Founded Year</label>
                                            <input type="text" value={formData.foundedYear} onChange={(e) => handleChange('foundedYear', e.target.value)} placeholder="e.g., 2020" className="hp-input" />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Specialties / Key Skills</label>
                                            <input type="text" value={formData.specialties} onChange={(e) => handleChange('specialties', e.target.value)} placeholder="e.g., Web Development, AI/ML, Cloud Architecture" className="hp-input" />
                                        </div>
                                    </div>
                                </div>

                                <div className="hp-card p-6 sm:p-8">
                                    <h3 className="form-section-title">About Company</h3>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-xs font-bold text-[var(--hp-text)] uppercase tracking-wide">
                                            Description & Culture
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--hp-surface-alt)] border border-[var(--hp-border)] text-[var(--hp-muted)] hidden sm:block">Supports Markdown</span>
                                            <button type="button" onClick={() => setPreviewMarkdown(!previewMarkdown)} className="text-xs font-bold tracking-wider uppercase text-[var(--hp-accent)] hover:text-[var(--hp-accent2)] transition-colors">
                                                {previewMarkdown ? '✎ Edit Text' : '👁 Preview Render'}
                                            </button>
                                        </div>
                                    </div>

                                    {previewMarkdown ? (
                                        <div className="hp-input w-full min-h-[160px] overflow-y-auto prose prose-sm max-w-none border-2 border-dashed" style={{ color: 'var(--hp-text-sub)' }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {formData.description || "*No description provided yet.*"}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange('description', e.target.value)}
                                            placeholder="Tell candidates about your mission, values, and why they should join you..."
                                            className="hp-input resize-y min-h-[160px]"
                                        />
                                    )}
                                </div>

                                <div className="hp-card p-6 sm:p-8">
                                    <h3 className="form-section-title">Social Presence</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Official Website</label>
                                            <input type="url" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://example.com" className="hp-input" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">LinkedIn</label>
                                            <input type="url" value={formData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} placeholder="linkedin.com/company/..." className="hp-input" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">Twitter / X</label>
                                            <input type="url" value={formData.twitter} onChange={(e) => handleChange('twitter', e.target.value)} placeholder="twitter.com/..." className="hp-input" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--hp-text)] mb-2 uppercase tracking-wide">GitHub</label>
                                            <input type="url" value={formData.github} onChange={(e) => handleChange('github', e.target.value)} placeholder="github.com/..." className="hp-input" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                                    <button type="button" onClick={fetchProfile} className="hp-btn-ghost px-8 py-3.5 text-sm">
                                        Discard Changes
                                    </button>
                                    <button type="submit" disabled={saving} className="hp-btn-primary px-10 py-3.5 text-base">
                                        {saving ? 'Saving Profile...' : 'Save Workspace'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}