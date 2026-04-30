import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { userAPI, authAPI, resumeAPI, API_BASE_URL, resolvePublicUrl } from '../../services/api';



export default function ProfilePage() {
    const { user, setUser, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    const profileTabs = [
        {
            key: 'profile', label: 'Identity & Info', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )
        },
        ...(user?.role === 'JOBSEEKER' ? [{
            key: 'resume', label: 'Resume / CV', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            )
        }] : []),
        {
            key: 'password', label: 'Security', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            )
        },
    ];

    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
    });

    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [hasResume, setHasResume] = useState(false);
    const [resumeId, setResumeId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [resumeSuccess, setResumeSuccess] = useState('');
    const [resumeError, setResumeError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef(null);
    const avatarInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // FIX: Clear all success/error messages and reset sensitive data when switching tabs
    useEffect(() => {
        setProfileError('');
        setProfileSuccess('');
        setResumeError('');
        setResumeSuccess('');
        setPasswordError('');
        setPasswordSuccess('');

        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setEditMode(false);
    }, [activeTab]);

    useEffect(() => {
        if (user?.role === 'JOBSEEKER') checkResume();
    }, []);

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const checkResume = async () => {
        if (!user?.id) return;
        try {
            const res = await resumeAPI.check(user.id);
            setHasResume(res.data.hasResume);
            setResumeId(res.data.resumeId || null);
        } catch (err) {
            console.error('Failed to check resume:', err);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setProfileError('Please select an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { setProfileError('Image must be less than 5MB'); return; }

        setUploadingAvatar(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const res = await userAPI.uploadAvatar(user.id, file);
            const updatedUser = { ...user, profileImageUrl: res.data.profileImageUrl };
            setUser(updatedUser, token);
            setProfileSuccess('Profile photo updated successfully!');
            setTimeout(() => setProfileSuccess(''), 3000);
        } catch (err) {
            setProfileError(err.response?.data?.error || 'Failed to upload photo');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const getAvatarUrl = () => {
        return resolvePublicUrl(user?.profileImageUrl);
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setProfileError('');
        setProfileSuccess('');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
            setProfileError('Full name is required.');
            return;
        }

        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            await userAPI.update(user.id, profileData);
            const updatedUser = { ...user, ...profileData };
            setUser(updatedUser, token);
            setProfileSuccess('Profile updated successfully!');
            setEditMode(false);
            setTimeout(() => setProfileSuccess(''), 3000);
        } catch (err) {
            setProfileError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword) { setPasswordError('Current password is required.'); return; }
        if (passwordData.newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('New passwords do not match.'); return; }

        setSavingPassword(true);
        try {
            await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setPasswordSuccess('Security credentials updated!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Authentication failed. Check your current password.');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) { setResumeError('Only PDF format is supported.'); return; }
        if (file.size > 10 * 1024 * 1024) { setResumeError('File is too large (Max 10MB).'); return; }

        setUploading(true);
        setResumeError('');
        setResumeSuccess('');

        try {
            await resumeAPI.uploadWithUserId(user.id, file, file.name);
            await checkResume();
            setResumeSuccess('Resume uploaded to your profile!');
            setTimeout(() => setResumeSuccess(''), 3000);
        } catch (err) {
            setResumeError(err.response?.data?.error || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDownload = async () => {
        if (!resumeId) return;
        setDownloading(true);
        try {
            const res = await resumeAPI.download(resumeId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user.firstName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setResumeError('Download failed.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDeleteResume = async () => {
        if (!resumeId || !window.confirm('Delete your resume permanently?')) return;
        setDeleting(true);
        try {
            await resumeAPI.delete(resumeId);
            setHasResume(false);
            setResumeId(null);
            setResumeSuccess('Resume removed.');
            setTimeout(() => setResumeSuccess(''), 3000);
        } catch (err) {
            setResumeError('Delete failed.');
        } finally {
            setDeleting(false);
        }
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { setResumeError('Please select a PDF file'); return; }
        if (file.size > 10 * 1024 * 1024) { setResumeError('File must be less than 10MB'); return; }

        setUploading(true);
        setResumeError('');

        try {
            const res = await resumeAPI.uploadWithUserId(user.id, file, file.name);
            setHasResume(true);
            setResumeId(res.data.id);
            setResumeSuccess('Resume uploaded successfully!');
            setTimeout(() => setResumeSuccess(''), 3000);
        } catch (err) {
            setResumeError(err.response?.data?.error || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hp-card p-6 sm:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.05]" style={{ background: 'radial-gradient(circle, var(--hp-accent) 0%, transparent 70%)' }} />

                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 border-b pb-8" style={{ borderColor: 'var(--hp-border)' }}>
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-xl" style={{ borderColor: 'var(--hp-card)' }}>
                                    {getAvatarUrl() ? (
                                        <img src={getAvatarUrl()} alt="Profile" className="w-full h-full object-cover bg-white" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border-2 border-dashed border-white/50"
                                >
                                    {uploadingAvatar ? <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                </button>
                                <input type="file" ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">{user?.firstName} {user?.lastName}</h3>
                                <p className="text-[var(--hp-muted)] font-medium">{user?.email}</p>
                                <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)', color: 'var(--hp-accent)', borderColor: 'rgba(var(--hp-accent-rgb), 0.2)' }}>{user?.role}</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {profileSuccess && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{profileSuccess}</motion.div>}
                            {profileError && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{profileError}</motion.div>}
                        </AnimatePresence>

                        {!editMode ? (
                            <div className="space-y-1">
                                {[
                                    { label: 'First Name', value: user?.firstName },
                                    { label: 'Last Name', value: user?.lastName },
                                    { label: 'Phone Number', value: user?.phone || 'Not provided' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center p-4 rounded-xl hover:bg-[var(--hp-surface-alt)] transition-colors">
                                        <span className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-wider">{label}</span>
                                        <span className="text-[var(--hp-text)] font-bold">{value}</span>
                                    </div>
                                ))}
                                <button onClick={() => setEditMode(true)} className="hp-btn-primary w-full mt-8 py-4 text-base">Edit Account Info</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">First Name</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <input type="text" name="firstName" value={profileData.firstName} onChange={handleProfileChange} className="hp-input" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">Last Name</label>
                                        <div className="hp-input-group">
                                            <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            <input type="text" name="lastName" value={profileData.lastName} onChange={handleProfileChange} className="hp-input" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        <input type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="e.g. 9876543210" className="hp-input" />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setEditMode(false)} className="hp-btn-ghost flex-1 py-3.5">Cancel</button>
                                    <button type="submit" disabled={savingProfile} className="hp-btn-primary flex-1 py-3.5">{savingProfile ? 'Saving...' : 'Update Identity'}</button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                );

            case 'resume':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hp-card p-6 sm:p-10">
                        <div className="mb-8 border-b pb-6" style={{ borderColor: 'var(--hp-border)' }}>
                            <h3 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">Professional Resume</h3>
                            <p className="text-[var(--hp-muted)] font-medium text-sm mt-1">Upload your latest CV in PDF format to apply for jobs instantly.</p>
                        </div>

                        <AnimatePresence>
                            {resumeSuccess && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>{resumeSuccess}</motion.div>}
                            {resumeError && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{resumeError}</motion.div>}
                        </AnimatePresence>

                        {hasResume ? (
                            <div className="hp-card p-6 border-2 flex items-center justify-between gap-4 mb-8" style={{ background: 'var(--hp-surface-alt)', borderColor: 'rgba(var(--hp-accent-rgb), 0.3)' }}>
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}>
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--hp-text)]">{user?.firstName}_Resume.pdf</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-400">Securely Synced</p>
                                    </div>
                                </div>
                                <span className="hidden sm:block px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-white/10 border border-white/20">PDF Document</span>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-8 group"
                                style={{
                                    borderColor: dragOver ? 'var(--hp-accent)' : 'var(--hp-border)',
                                    background: dragOver ? 'rgba(var(--hp-accent-rgb), 0.05)' : 'transparent'
                                }}
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <svg className="w-10 h-10 animate-spin" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <p className="font-bold text-[var(--hp-muted)]">Uploading documents...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner" style={{ background: 'var(--hp-surface-alt)' }}>
                                            <svg className="w-8 h-8 text-[var(--hp-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-[var(--hp-text)]">{dragOver ? 'Drop it now!' : 'Drop CV or Click to Browse'}</p>
                                            <p className="text-sm text-[var(--hp-muted)] font-medium">Only PDF files up to 10MB are accepted</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleFileInput} className="hidden" />

                        {hasResume && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleDownload} disabled={downloading} className="hp-btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                                    {downloading ? <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                    Download CV
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="hp-btn-ghost flex-1 py-3.5">Replace File</button>
                                <button onClick={handleDeleteResume} disabled={deleting} className="p-3.5 rounded-xl transition-colors hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/20">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        )}
                    </motion.div>
                );

            case 'password':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hp-card p-6 sm:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.05]" style={{ background: 'radial-gradient(circle, var(--hp-accent2) 0%, transparent 70%)' }} />

                        <div className="mb-10 border-b pb-6" style={{ borderColor: 'var(--hp-border)' }}>
                            <h3 className="text-2xl font-bold text-[var(--hp-text)] tracking-tight">Security Credentials</h3>
                            <p className="text-[var(--hp-muted)] font-medium text-sm mt-1">Keep your account safe by using a strong, unique password.</p>
                        </div>

                        <AnimatePresence>
                            {passwordSuccess && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{passwordSuccess}</motion.div>}
                            {passwordError && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{passwordError}</motion.div>}
                        </AnimatePresence>

                        <form onSubmit={handleSavePassword} className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">Current Password</label>
                                <div className="hp-input-group">
                                    <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" className="hp-input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">New Password</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Min 6 chars" className="hp-input" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--hp-muted)] uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <div className="hp-input-group">
                                        <svg className="hp-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Repeat new" className="hp-input" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={savingPassword} className="hp-btn-primary w-full py-4 text-base mt-4 shadow-xl shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, var(--hp-accent2), #8b5cf6)' }}>
                                {savingPassword ? 'Updating Vault...' : 'Secure My Account'}
                            </button>
                        </form>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 relative z-10">

            <div className="mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--hp-text)] tracking-tight">Account Settings</h2>
                <p className="text-[var(--hp-muted)] font-medium mt-1">Manage your identity, professional documents, and security.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="hp-card p-3 sticky top-24">
                        <nav className="space-y-1.5">
                            {profileTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
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
                                    <svg className={`w-4 h-4 transition-transform ${activeTab === tab.key ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Tab Content */}
                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </div>
        </motion.div>
    );
}