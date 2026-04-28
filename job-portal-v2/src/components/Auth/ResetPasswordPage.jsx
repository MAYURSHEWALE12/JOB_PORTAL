import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            toast.error('Invalid reset link. Missing token.');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error('Invalid reset link. Token missing.');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(token, password);
            toast.success('Password reset successful! Please login with your new password.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to reset password';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[var(--hp-accent)] opacity-10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--hp-accent2)] opacity-10 blur-[100px] rounded-full"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="hp-card p-8 sm:p-10 backdrop-blur-2xl bg-[rgba(var(--hp-surface-rgb),0.7)] border border-[rgba(255,255,255,0.08)] shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-[var(--hp-accent)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 -rotate-6">
                            <svg className="w-10 h-10 text-white rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-[var(--hp-text)] tracking-tight mb-3">Reset Password</h1>
                        <p className="text-[var(--hp-muted)] font-medium leading-relaxed">
                            Establish your new credentials below to regain access to your account.
                        </p>
                    </div>

                    {!token ? (
                        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center space-y-4">
                            <p className="font-bold text-sm">Invalid or Expired Reset Token</p>
                            <Link to="/forgot-password" title="Request new link" className="hp-btn-ghost w-full py-2">
                                Request New Link
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--hp-muted)] group-focus-within:text-[var(--hp-accent)] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <input 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="hp-input pl-12 h-14 bg-[rgba(var(--hp-surface-alt-rgb),0.5)] border-[rgba(255,255,255,0.05)] focus:bg-[var(--hp-surface-alt)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Confirm New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--hp-muted)] group-focus-within:text-[var(--hp-accent)] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-type password"
                                        className="hp-input pl-12 h-14 bg-[rgba(var(--hp-surface-alt-rgb),0.5)] border-[rgba(255,255,255,0.05)] focus:bg-[var(--hp-surface-alt)]"
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="hp-btn-primary w-full h-14 text-base font-bold shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Updating Security...
                                    </span>
                                ) : "Update Password"}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] text-center">
                        <Link 
                            to="/login" 
                            className="text-sm font-bold text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors"
                        >
                            Remember your password? Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
