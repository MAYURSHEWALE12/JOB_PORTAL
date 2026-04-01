import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userAPI, authAPI, resumeAPI, getImageUrl } from '../../services/api';
import Loader from '../Loader';
import { 
    User, FileText, Lock, Settings, LogOut, 
    Camera, Bell, Shield, ChevronRight, Upload, 
    Trash2, Download, RefreshCw, X, Check, Info,
    CloudUpload
} from 'lucide-react';

const TABS = {
    GENERAL: 'GENERAL',
    RESUME: 'RESUME',
    SECURITY: 'SECURITY',
    PREFERENCES: 'PREFERENCES'
};

export default function ProfilePage() {
    const { user, setUser, token, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState(TABS.GENERAL);

    // ─── Profile/General State ───────────────────────────────────────────────
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName:  user?.lastName  || '',
        phone:     user?.phone     || '',
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileStatus, setProfileStatus] = useState({ type: '', msg: '' });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef(null);

    // ─── Password State ──────────────────────────────────────────────────────
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordStatus, setPasswordStatus] = useState({ type: '', msg: '' });

    // ─── Resume State (Jobseekers) ────────────────────────────────────────────
    const [hasResume, setHasResume] = useState(false);
    const [resumeId, setResumeId] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [downloadingResume, setDownloadingResume] = useState(false);
    const [resumeStatus, setResumeStatus] = useState({ type: '', msg: '' });
    const resumeInputRef = useRef(null);

    useEffect(() => {
        if (user?.role === 'JOBSEEKER') checkResume();
    }, [user?.role]);

    const checkResume = async () => {
        try {
            const res = await resumeAPI.check(user.id);
            setHasResume(res.data.hasResume);
            setResumeId(res.data.resumeId || null);
        } catch (err) {
            console.error('Resume check failed');
        }
    };

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleAvatarClick = () => avatarInputRef.current?.click();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setProfileStatus({ type: 'error', msg: 'Please upload an image file.' });
            return;
        }

        setUploadingAvatar(true);
        try {
            const res = await userAPI.uploadAvatar(user.id, file);
            setUser(res.data, token);
            setProfileStatus({ type: 'success', msg: 'Avatar updated!' });
        } catch (err) {
            setProfileStatus({ type: 'error', msg: 'Failed to upload avatar.' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const [profileErrors, setProfileErrors] = useState({});

    const validateProfile = () => {
        const newErrors = {};
        if (!profileData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!profileData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (profileData.phone && !/^[+]?[\d\s\-().]{7,20}$/.test(profileData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        setProfileErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileFieldChange = (key, value) => {
        setProfileData({...profileData, [key]: value});
        setProfileErrors({...profileErrors, [key]: ''});
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileStatus({ type: '', msg: '' });
        if (!validateProfile()) return;
        setSavingProfile(true);
        try {
            const res = await userAPI.update(user.id, profileData);
            setUser(res.data, token);
            setProfileStatus({ type: 'success', msg: 'Profile updated successfully!' });
            setProfileErrors({});
        } catch (err) {
            setProfileStatus({ type: 'error', msg: err.response?.data?.error || 'Update failed.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const [passwordErrors, setPasswordErrors] = useState({});

    const validatePassword = () => {
        const newErrors = {};
        if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'Must be at least 8 characters';
        }
        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = (key, value) => {
        setPasswordData({...passwordData, [key]: value});
        setPasswordErrors({...passwordErrors, [key]: ''});
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setPasswordStatus({ type: '', msg: '' });
        if (!validatePassword()) return;
        setSavingPassword(true);
        try {
            await authAPI.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
            setPasswordStatus({ type: 'success', msg: 'Password changed!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordErrors({});
        } catch (err) {
            setPasswordStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to change password.' });
        } finally {
            setSavingPassword(false);
        }
    };

    const isPasswordValid = passwordData.currentPassword && passwordData.newPassword.length >= 8 && passwordData.newPassword === passwordData.confirmPassword;

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            setResumeStatus({ type: 'error', msg: 'Only PDF files are accepted.' });
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setResumeStatus({ type: 'error', msg: 'File size must be under 20MB.' });
            return;
        }

        setUploadingResume(true);
        try {
            await resumeAPI.upload(user.id, file, file.name);
            await checkResume();
            setResumeStatus({ type: 'success', msg: 'Resume updated successfully!' });
        } catch (err) {
            setResumeStatus({ type: 'error', msg: err.response?.data?.error || 'Upload failed.' });
        } finally {
            setUploadingResume(false);
        }
    };

    const handleDownloadResume = async () => {
        setDownloadingResume(true);
        try {
            const res = await resumeAPI.download(resumeId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user.firstName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setResumeStatus({ type: 'error', msg: 'Download failed.' });
        } finally {
            setDownloadingResume(false);
        }
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const getInitials = () => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
    const avatarUrl = user?.profileImageUrl ? getImageUrl(user.profileImageUrl) : null;

    // ─── Render Parts ────────────────────────────────────────────────────────
    const SidebarItem = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center justify-between p-4 font-black uppercase tracking-widest text-xs transition-all border-b-[3px] border-stone-900 
                ${activeTab === id ? 'bg-orange-500 text-stone-900' : 'bg-white dark:bg-stone-800 text-stone-500 hover:bg-stone-50 hover:pl-6'}`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{label}</span>
            </div>
            {activeTab === id && <ChevronRight size={18} />}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header Area */}
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-stone-900 border-[4px] border-stone-900 shadow-[4px_4px_0_#ea580c] flex items-center justify-center -rotate-3 overflow-hidden">
                        <Settings className="text-white" size={32} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-stone-900 dark:text-gray-100">User Settings</h2>
                        <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px]">Manage your profile and account</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => window.location.href = '/dashboard'} className="bg-stone-900 text-white px-6 py-2 font-black uppercase text-[10px] border-[3px] border-stone-900 shadow-[4px_4px_0_#000] hover:shadow-none transition-all">Back to Dashboard</button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-0 border-[4px] border-stone-900 bg-white dark:bg-stone-800 shadow-[16px_16px_0_#000] min-h-[600px] overflow-hidden">
                
                {/* ── Sidebar ────────────────────────────────────────── */}
                <div className="lg:w-80 w-full flex-shrink-0 border-r-[4px] border-stone-900 bg-stone-50 dark:bg-stone-900/40">
                    <div className="p-8 border-b-[4px] border-stone-900 flex flex-col items-center gap-4 bg-white dark:bg-stone-800">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-24 h-24 bg-rose-400 border-[4px] border-stone-900 shadow-[6px_6px_0_#000] flex items-center justify-center text-3xl font-black text-stone-900 overflow-hidden relative transition-transform group-hover:scale-105">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    getInitials()
                                )}
                                <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="text-white" size={24} />
                                </div>
                                {uploadingAvatar && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader text="" /></div>}
                            </div>
                            <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-lg">{user?.firstName} {user?.lastName}</h3>
                            <span className="text-[10px] font-black bg-emerald-400 border-[2px] border-stone-900 px-2 py-0.5 uppercase">{user?.role}</span>
                        </div>
                    </div>

                    <div className="py-0 flex flex-col h-full">
                        <SidebarItem id={TABS.GENERAL} label="General Settings" icon={User} />
                        {user?.role === 'JOBSEEKER' && <SidebarItem id={TABS.RESUME} label="Resume Management" icon={FileText} />}
                        <SidebarItem id={TABS.SECURITY} label="Security" icon={Shield} />
                        <SidebarItem id={TABS.PREFERENCES} label="Preferences" icon={Settings} />
                        
                        <div className="mt-auto p-4 lg:p-8 bg-stone-900 text-white">
                            <button onClick={logout} className="w-full flex items-center gap-3 font-black uppercase text-xs text-rose-400 hover:text-rose-300 transition-colors">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Main Content Area ──────────────────────────────── */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                    
                    {/* ──── Tab: General ───────────────────────────── */}
                    {activeTab === TABS.GENERAL && (
                        <div className="animate-neo-thump">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-8 border-b-[6px] border-orange-500 inline-block">Profile Settings</h3>
                            
                            {profileStatus.msg && (
                                <div className={`mb-8 p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000] font-black uppercase text-xs flex items-center gap-3 ${profileStatus.type === 'success' ? 'bg-emerald-400' : 'bg-rose-500 text-white'}`}>
                                    {profileStatus.type === 'success' ? <Check size={18} /> : <Info size={18} />}
                                    {profileStatus.msg}
                                </div>
                            )}

                            <form onSubmit={handleSaveProfile} className="space-y-8 max-w-2xl" noValidate>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-stone-400">First Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => handleProfileFieldChange('firstName', e.target.value)}
                                            className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black uppercase focus:outline-none focus:shadow-[4px_4px_0_#000] transition-all ${
                                                profileErrors.firstName ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                            }`}
                                        />
                                        {profileErrors.firstName && <p className="text-rose-500 text-xs font-bold uppercase">{profileErrors.firstName}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-stone-400">Last Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => handleProfileFieldChange('lastName', e.target.value)}
                                            className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black uppercase focus:outline-none focus:shadow-[4px_4px_0_#000] transition-all ${
                                                profileErrors.lastName ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                            }`}
                                        />
                                        {profileErrors.lastName && <p className="text-rose-500 text-xs font-bold uppercase">{profileErrors.lastName}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-stone-400">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                                        placeholder="+1 234 567 890"
                                        className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black uppercase focus:outline-none focus:shadow-[4px_4px_0_#000] transition-all ${
                                            profileErrors.phone ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                        }`}
                                    />
                                    {profileErrors.phone && <p className="text-rose-500 text-xs font-bold uppercase">{profileErrors.phone}</p>}
                                </div>
                                <div className="space-y-2 opacity-50">
                                    <label className="text-xs font-black uppercase tracking-widest text-stone-400">Email Address (LOCKED)</label>
                                    <div className="w-full p-4 border-[3px] border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-400 font-bold uppercase truncate">{user?.email}</div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="w-full md:w-auto bg-stone-900 text-white px-10 py-5 font-black uppercase tracking-[0.2em] text-sm border-[4px] border-stone-900 shadow-[8px_8px_0_#ea580c] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                                >
                                    {savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ──── Tab: Resume ────────────────────────────── */}
                    {activeTab === TABS.RESUME && (
                        <div className="animate-neo-thump">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-2 underline decoration-orange-500 decoration-[6px] underline-offset-8">Resume Management</h3>
                            <p className="text-stone-400 font-bold uppercase text-[10px] mb-12 tracking-widest">Store and manage your professional credentials</p>

                            {resumeStatus.msg && (
                                <div className={`mb-8 p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000] font-black uppercase text-xs ${resumeStatus.type === 'success' ? 'bg-emerald-400' : 'bg-rose-500 text-white'}`}>
                                    {resumeStatus.msg}
                                </div>
                            )}

                            {hasResume ? (
                                <div className="space-y-8">
                                    <div className="bg-stone-50 dark:bg-stone-900 border-[4px] border-stone-900 p-8 flex items-center justify-between shadow-[8px_8px_0_#000]">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white border-[3px] border-stone-900 flex items-center justify-center rotate-3 shadow-[4px_4px_0_#ea580c]">
                                                <FileText className="text-stone-900" size={32} />
                                            </div>
                                            <div>
                                                <p className="font-black text-xl text-stone-900 dark:text-white uppercase truncate max-w-sm">Active_Resume_v1.pdf</p>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
                                                    <Check size={14} /> Encrypted and Verified
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={handleDownloadResume} className="bg-stone-900 text-white p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000] hover:shadow-none transition-all">
                                                <Download size={20} />
                                            </button>
                                            <button onClick={() => resumeInputRef.current?.click()} className="bg-white text-stone-900 p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#ea580c] hover:shadow-none transition-all">
                                                <RefreshCw size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 border-[3px] border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 text-stone-400 text-[10px] font-bold uppercase leading-loose">
                                        Uploading a new resume will automatically replace your current active document. Make sure your latest achievements are reflected in the PDF payload.
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => resumeInputRef.current?.click()}
                                    className="border-[4px] border-dashed border-stone-300 dark:border-stone-700 p-20 text-center cursor-pointer group hover:bg-stone-50 dark:hover:bg-stone-900/50 hover:border-orange-500 transition-all rounded-none"
                                >
                                    <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 mx-auto border-[3px] border-stone-900 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform shadow-[8px_8px_0_#000] group-hover:shadow-[8px_8px_0_#ea580c]">
                                        <CloudUpload size={48} className="text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white" />
                                    </div>
                                    <h4 className="text-2xl font-black uppercase text-stone-900 dark:text-white mb-2">Initialize Upload</h4>
                                    <p className="text-stone-400 font-bold uppercase text-xs">Drop PDF payload or click to scan filesystem</p>
                                </div>
                            )}
                            <input ref={resumeInputRef} type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
                        </div>
                    )}

                    {/* ──── Tab: Security ───────────────────────────── */}
                    {activeTab === TABS.SECURITY && (
                        <div className="animate-neo-thump">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-8 border-b-[6px] border-rose-500 inline-block">Security Settings</h3>
                            
                            {passwordStatus.msg && (
                                <div className={`mb-8 p-4 border-[3px] border-stone-900 shadow-[4px_4px_0_#000] font-black uppercase text-xs ${passwordStatus.type === 'success' ? 'bg-emerald-400' : 'bg-rose-500 text-white'}`}>
                                    {passwordStatus.msg}
                                </div>
                            )}

                            <form onSubmit={handleSavePassword} className="space-y-8 max-w-xl" noValidate>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black bg-stone-900 text-white px-2 py-0.5 uppercase tracking-widest">Current Password *</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                            className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black focus:outline-none transition-all placeholder:text-stone-200 ${
                                                passwordErrors.currentPassword ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-rose-500'
                                            }`}
                                            placeholder="••••••••••••"
                                        />
                                        {passwordErrors.currentPassword && <p className="text-rose-500 text-xs font-bold uppercase">{passwordErrors.currentPassword}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black bg-stone-900 text-white px-2 py-0.5 uppercase tracking-widest">New Access Token *</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                            className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black focus:outline-none transition-all placeholder:text-stone-200 ${
                                                passwordErrors.newPassword ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-rose-500'
                                            }`}
                                            placeholder="••••••••••••"
                                        />
                                        {passwordErrors.newPassword && <p className="text-rose-500 text-xs font-bold uppercase">{passwordErrors.newPassword}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black bg-stone-900 text-white px-2 py-0.5 uppercase tracking-widest">Confirm Payload *</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                            className={`w-full p-4 border-[3px] bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-black focus:outline-none transition-all placeholder:text-stone-200 ${
                                                passwordErrors.confirmPassword ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-rose-500'
                                            }`}
                                            placeholder="••••••••••••"
                                        />
                                        {passwordErrors.confirmPassword && <p className="text-rose-500 text-xs font-bold uppercase">{passwordErrors.confirmPassword}</p>}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingPassword || !isPasswordValid}
                                    className="w-full bg-rose-500 text-stone-900 px-10 py-5 font-black uppercase tracking-[0.2em] text-sm border-[4px] border-stone-900 shadow-[8px_8px_0_#1c1917] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingPassword ? 'Applying...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ──── Tab: Preferences ───────────────────────── */}
                    {activeTab === TABS.PREFERENCES && (
                        <div className="animate-neo-thump">
                            <h3 className="text-3xl font-black uppercase tracking-tighter text-stone-900 dark:text-white mb-12">User Preferences</h3>
                            
                            <div className="space-y-12">
                                <div className="flex items-center justify-between p-8 bg-stone-900 border-[4px] border-stone-900 shadow-[8px_8px_0_#000]">
                                    <div>
                                        <p className="font-black text-rose-500 uppercase tracking-widest text-xs mb-1">Danger Zone</p>
                                        <h4 className="text-white font-black uppercase text-lg">Terminate Account</h4>
                                        <p className="text-stone-500 text-[10px] font-bold uppercase mt-1">This action is irreversible and will delete all your history.</p>
                                    </div>
                                    <button className="bg-rose-500 text-stone-900 px-6 py-3 font-black uppercase text-xs border-[3px] border-stone-900 hover:bg-rose-400 transition-colors">Terminate</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 border-[4px] border-stone-900 bg-white dark:bg-stone-800">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Bell className="text-orange-500" />
                                            <h4 className="font-black uppercase text-sm">Notifications</h4>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase">Incoming Messages</span>
                                            <div className="w-12 h-6 bg-emerald-400 border-[3px] border-stone-900 cursor-not-allowed opacity-50" />
                                        </div>
                                    </div>
                                    <div className="p-8 border-[4px] border-stone-900 bg-white dark:bg-stone-800">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Shield className="text-emerald-500" />
                                            <h4 className="font-black uppercase text-sm">Privacy HQ</h4>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-stone-400 uppercase">Public Profile</span>
                                            <div className="w-12 h-6 bg-stone-200 border-[3px] border-stone-900 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}