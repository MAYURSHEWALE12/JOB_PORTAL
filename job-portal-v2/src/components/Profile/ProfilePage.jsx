import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { userAPI, authAPI, resumeAPI } from '../../services/api';
import Loader from '../Loader';

export default function ProfilePage() {
    const { user, setUser, token } = useAuthStore();

    // ─── Profile Edit State ───────────────────────────────────────────────────
    const [editMode, setEditMode]         = useState(false);
    const [profileData, setProfileData]   = useState({
        firstName: user?.firstName || '',
        lastName:  user?.lastName  || '',
        phone:     user?.phone     || '',
    });
    const [savingProfile, setSavingProfile]   = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError]     = useState('');

    // ─── Password Change State ────────────────────────────────────────────────
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData]         = useState({
        currentPassword: '',
        newPassword:     '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword]   = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError]     = useState('');

    // ─── Resume State ─────────────────────────────────────────────────────────
    const [hasResume, setHasResume]         = useState(false);
    const [resumeId, setResumeId]           = useState(null);
    const [uploading, setUploading]         = useState(false);
    const [downloading, setDownloading]     = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const [resumeSuccess, setResumeSuccess] = useState('');
    const [resumeError, setResumeError]     = useState('');
    const [dragOver, setDragOver]           = useState(false);
    const fileInputRef                      = useRef(null);

    useEffect(() => {
        checkResume();
    }, []);

    const checkResume = async () => {
        if (!user?.id) return;
        try {
            if (typeof resumeAPI?.check !== 'function') {
                console.error('DEBUG Error: resumeAPI.check is not a function in this scope');
                return;
            }
            const res = await resumeAPI.check(user.id);
            setHasResume(res.data.hasResume);
            setResumeId(res.data.resumeId || null);
        } catch (err) {
            console.error('Failed to check resume:', err);
        }
    };

    // ─── Profile Handlers ─────────────────────────────────────────────────────
    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setProfileError('');
        setProfileSuccess('');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profileData.firstName.trim()) { setProfileError('First name is required.'); return; }
        if (!profileData.lastName.trim())  { setProfileError('Last name is required.');  return; }

        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            await userAPI.update(user.id, profileData);
            const updatedUser = { ...user, ...profileData };
            setUser(updatedUser, token);
            setProfileSuccess('✅ Profile updated successfully!');
            setEditMode(false);
        } catch (err) {
            setProfileError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    // ─── Password Handlers ────────────────────────────────────────────────────
    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword)       { setPasswordError('Current password is required.');        return; }
        if (passwordData.newPassword.length < 6) { setPasswordError('New password must be at least 6 characters.'); return; }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setSavingPassword(true);
        setPasswordError('');
        setPasswordSuccess('');

        try {
            await authAPI.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
            setPasswordSuccess('✅ Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setShowPasswordForm(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (err) {
            setPasswordError(err.response?.data?.error || 'Failed to change password. Check your current password.');
        } finally {
            setSavingPassword(false);
        }
    };

    // ─── Resume Handlers ──────────────────────────────────────────────────────
    const handleFileUpload = async (file) => {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setResumeError('Only PDF files are allowed.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setResumeError('File size must be less than 10MB.');
            return;
        }

        setUploading(true);
        setResumeError('');
        setResumeSuccess('');

        try {
            await resumeAPI.upload(user.id, file, file.name);
            await checkResume(); // Refresh state and get ID
            setResumeSuccess('✅ Resume uploaded successfully!');
            setTimeout(() => setResumeSuccess(''), 3000);
        } catch (err) {
            setResumeError(err.response?.data?.error || 'Failed to upload resume.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleDownload = async () => {
        if (!resumeId) {
            setResumeError('No resume ID found. Please try refreshing.');
            return;
        }
        setDownloading(true);
        setResumeError('');
        try {
            const res = await resumeAPI.download(resumeId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user.firstName}_${user.lastName}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setResumeError('Failed to download resume.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDeleteResume = async () => {
        if (!resumeId) {
            setResumeError('No resume ID found to delete.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete your resume?')) return;
        setDeleting(true);
        setResumeError('');
        try {
            await resumeAPI.delete(resumeId);
            setHasResume(false);
            setResumeId(null);
            setResumeSuccess('✅ Resume deleted successfully!');
            setTimeout(() => setResumeSuccess(''), 3000);
        } catch (err) {
            setResumeError(err.response?.data?.error || 'Failed to delete resume.');
        } finally {
            setDeleting(false);
        }
    };

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">

            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-8">
                <h2 className="text-3xl font-black uppercase tracking-tight text-stone-900 dark:text-gray-100">👤 My Profile</h2>
                <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 uppercase tracking-wider text-xs">Manage your account details and resume</p>
            </div>

            {/* ── Profile Card ──────────────────────────────────────── */}
            <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8 md:p-10 rounded-none">

                {/* Avatar + Name */}
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-24 h-24 bg-rose-400 border-[4px] border-stone-900 dark:border-black rounded-none flex items-center justify-center text-4xl font-black text-stone-900 shadow-[4px_4px_0_#1c1917] flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">
                            {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-stone-600 dark:text-stone-400 font-bold text-sm uppercase mb-2">{user?.email}</p>
                        <span className="bg-orange-300 border-[3px] border-stone-900 text-stone-900 text-xs font-black uppercase tracking-widest px-3 py-1 shadow-[2px_2px_0_#1c1917]">
                            {user?.role}
                        </span>
                    </div>
                </div>

                {profileSuccess && (
                    <div className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {profileSuccess}
                    </div>
                )}
                {profileError && (
                    <div className="bg-rose-500 border-[3px] border-stone-900 text-white px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {profileError}
                    </div>
                )}

                {/* View Mode */}
                {!editMode ? (
                    <div>
                        <div className="flex flex-col gap-6 bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 p-6 shadow-[inset_4px_4px_0_rgba(0,0,0,0.05)] dark:shadow-none mb-8">
                            {[
                                { label: 'First Name', value: user?.firstName    },
                                { label: 'Last Name',  value: user?.lastName     },
                                { label: 'Email',      value: user?.email        },
                                { label: 'Phone',      value: user?.phone || '—' },
                                { label: 'Role',       value: user?.role         },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center border-b-[2px] border-stone-200 dark:border-stone-800 border-dashed pb-3 last:border-0 last:pb-0">
                                    <span className="text-stone-500 dark:text-stone-400 text-xs font-black uppercase tracking-widest">{label}</span>
                                    <span className="text-stone-900 dark:text-gray-100 font-bold uppercase">{value}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setEditMode(true); setProfileSuccess(''); setProfileError(''); }}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-stone-900 border-[4px] border-stone-900 dark:border-stone-700 px-6 py-4 font-black uppercase tracking-widest text-lg transition-all shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] hover:shadow-[8px_8px_0_#1c1917] dark:hover:shadow-[8px_8px_0_#000] hover:-translate-y-1"
                        >
                            ✏️ Edit Profile
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                    First Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={profileData.firstName}
                                    onChange={handleProfileChange}
                                    className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                    Last Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={profileData.lastName}
                                    onChange={handleProfileChange}
                                    className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold uppercase"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                placeholder="9876543210"
                                className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold uppercase placeholder:text-stone-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                Email <span className="text-stone-400 font-bold">(CANNOT BE CHANGED)</span>
                            </label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full px-5 py-4 border-[3px] border-stone-300 dark:border-stone-600 rounded-none bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold uppercase cursor-not-allowed"
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false);
                                    setProfileError('');
                                    setProfileData({
                                        firstName: user?.firstName || '',
                                        lastName:  user?.lastName  || '',
                                        phone:     user?.phone     || '',
                                    });
                                }}
                                className="flex-1 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-white border-[4px] border-stone-900 dark:border-stone-700 py-4 font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="flex-1 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white border-[4px] border-stone-900 dark:border-black py-4 font-black uppercase tracking-widest transition-all shadow-[6px_6px_0_#ea580c] hover:shadow-[8px_8px_0_#ea580c] hover:-translate-y-1"
                            >
                                {savingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ── Resume Card (Only for Jobseekers) ─────────────────── */}
            {user?.role === 'JOBSEEKER' && (
                <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8 md:p-10 rounded-none">
                    <div className="mb-8">
                        <h3 className="font-black text-stone-900 dark:text-gray-100 text-2xl uppercase tracking-tight">📄 Resume Vault</h3>
                        <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 text-xs uppercase tracking-widest">Upload your resume in PDF format (max 10MB)</p>
                    </div>

                {/* Success / Error */}
                {resumeSuccess && (
                    <div className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {resumeSuccess}
                    </div>
                )}
                {resumeError && (
                    <div className="bg-rose-500 border-[3px] border-stone-900 text-white px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {resumeError}
                    </div>
                )}

                {/* Has Resume */}
                {hasResume ? (
                    <div>
                        {/* Resume exists UI */}
                        <div className="bg-orange-100 dark:bg-stone-700 border-[4px] border-stone-900 dark:border-stone-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 shadow-[inset_4px_4px_0_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">📄</div>
                                <div>
                                    <p className="font-black text-stone-900 dark:text-gray-100 text-lg uppercase truncate max-w-xs md:max-w-md">
                                        {user?.firstName}_{user?.lastName}_Resume.pdf
                                    </p>
                                    <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">PDF Document</p>
                                </div>
                            </div>
                            <span className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 text-xs font-black px-4 py-2 uppercase tracking-widest shadow-[2px_2px_0_#1c1917]">
                                ✓ Uploaded
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex-[2] bg-emerald-400 hover:bg-emerald-300 disabled:bg-emerald-200 text-stone-900 border-[4px] border-stone-900 py-4 font-black uppercase tracking-widest transition-all shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] hover:shadow-[8px_8px_0_#1c1917] hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                {downloading ? 'Downloading...' : '⬇️ Download'}
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-900 dark:text-white border-[4px] border-stone-900 dark:border-stone-900 py-4 font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_#1c1917] hover:-translate-y-1"
                            >
                                🔄 Replace
                            </button>
                            <button
                                onClick={handleDeleteResume}
                                disabled={deleting}
                                className="flex-1 bg-rose-500 hover:bg-rose-400 text-stone-900 border-[4px] border-stone-900 py-4 font-black uppercase transition-all shadow-[4px_4px_0_#1c1917] hover:-translate-y-1 disabled:opacity-50"
                            >
                                {deleting ? '...' : '🗑️ Delete'}
                            </button>
                        </div>

                        {/* Hidden file input for replace */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>
                ) : (
                    /* No Resume — Upload Zone */
                    <div>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-[4px] border-dashed border-stone-900 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-12 text-center cursor-pointer transition-all shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]
                                ${dragOver
                                    ? 'border-orange-500 bg-orange-100 dark:bg-stone-700'
                                    : 'hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-stone-800 hover:-translate-y-1 hover:shadow-[8px_8px_0_#ea580c] dark:hover:shadow-[8px_8px_0_#ea580c]'}`}
                        >
                            {uploading ? (
                                <Loader text="Uploading..." />
                            ) : (
                                <div>
                                    <div className="text-6xl mb-6">📤</div>
                                    <p className="font-black text-stone-900 dark:text-white text-xl uppercase tracking-widest mb-2">
                                        {dragOver ? 'Drop it like it\'s hot!' : 'Drop PDF Here'}
                                    </p>
                                    <p className="text-stone-500 dark:text-stone-400 font-bold uppercase text-xs">or click to browse files (Max 10MB)</p>
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>
                )}
            </div>
            )}

            {/* ── Change Password Card ──────────────────────────────── */}
            <div className="bg-white dark:bg-stone-800 border-[4px] border-stone-900 dark:border-stone-700 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000] p-8 md:p-10 rounded-none">
                <div className="flex justify-between items-start mb-8 border-b-[4px] border-stone-900 dark:border-stone-700 pb-6">
                    <div>
                        <h3 className="font-black text-stone-900 dark:text-gray-100 text-2xl uppercase tracking-tight">🔒 Password</h3>
                        <p className="text-stone-600 dark:text-stone-400 font-bold mt-1 text-xs uppercase tracking-widest">Refresh your security</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowPasswordForm(!showPasswordForm);
                            setPasswordError('');
                            setPasswordSuccess('');
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="bg-stone-900 hover:bg-stone-700 border-[3px] border-stone-900 text-white text-xs font-black uppercase tracking-widest px-4 py-3 shadow-[4px_4px_0_#ea580c] transition-all hover:translate-y-1 hover:shadow-none"
                    >
                        {showPasswordForm ? 'Close' : 'Change'}
                    </button>
                </div>

                {passwordSuccess && (
                    <div className="bg-emerald-400 border-[3px] border-stone-900 text-stone-900 px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {passwordSuccess}
                    </div>
                )}
                {passwordError && (
                    <div className="bg-rose-500 border-[3px] border-stone-900 text-white px-5 py-4 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917]">
                        {passwordError}
                    </div>
                )}

                {showPasswordForm && (
                    <form onSubmit={handleSavePassword} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 font-bold placeholder:text-stone-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Min 6 characters"
                                className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 font-bold placeholder:text-stone-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Repeat new password"
                                className="w-full px-5 py-4 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[4px_4px_0_#ea580c] transition-all bg-white dark:bg-stone-900 font-bold placeholder:text-stone-300"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 border-[4px] border-stone-900 dark:border-black py-4 font-black uppercase tracking-widest text-lg transition-all shadow-[6px_6px_0_#1c1917] hover:shadow-[8px_8px_0_#1c1917] hover:-translate-y-1 mt-4"
                        >
                            {savingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}