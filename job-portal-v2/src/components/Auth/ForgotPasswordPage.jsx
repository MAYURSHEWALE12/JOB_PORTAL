import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setStep(2);
            toast.success('Verification code sent to your email!');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to send code';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp) { toast.error('Please enter the verification code'); return; }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

        setLoading(true);
        try {
            await authAPI.resetPassword(email, otp, newPassword);
            toast.success('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Reset failed';
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="hp-card p-8 sm:p-10 backdrop-blur-2xl bg-[rgba(var(--hp-surface-rgb),0.7)] border border-[rgba(255,255,255,0.08)]">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-[var(--hp-accent)] to-[var(--hp-accent2)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--hp-accent)]/20 rotate-12">
                            <svg className="w-10 h-10 text-white -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-[var(--hp-text)] tracking-tight mb-3">
                            {step === 1 ? "Forgot Password?" : "Verify & Reset"}
                        </h1>
                        <p className="text-[var(--hp-muted)] font-medium leading-relaxed">
                            {step === 1 
                                ? "Enter your registered email below and we'll send you a verification code." 
                                : `Enter the 6-digit code sent to ${email} to reset your password.`}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form 
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSendOTP} 
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--hp-muted)] group-focus-within:text-[var(--hp-accent)] transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="hp-input pl-12 h-14 bg-[rgba(var(--hp-surface-alt-rgb),0.5)] border-[rgba(255,255,255,0.05)] focus:bg-[var(--hp-surface-alt)]"
                                            required
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="hp-btn-primary w-full h-14 text-base font-bold shadow-xl shadow-[var(--hp-accent)]/20 active:scale-[0.98] transition-transform"
                                >
                                    {loading ? "Sending Code..." : "Send Verification Code"}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword} 
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">6-Digit Code</label>
                                    <input 
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="hp-input h-14 text-center text-2xl font-black tracking-[0.5em] bg-[rgba(var(--hp-surface-alt-rgb),0.5)]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">New Password</label>
                                    <input 
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="hp-input h-14 bg-[rgba(var(--hp-surface-alt-rgb),0.5)]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[var(--hp-muted)] ml-1">Confirm New Password</label>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="hp-input h-14 bg-[rgba(var(--hp-surface-alt-rgb),0.5)]"
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="hp-btn-primary w-full h-14 text-base font-bold shadow-xl shadow-[var(--hp-accent)]/20 active:scale-[0.98] transition-transform"
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-xs font-bold text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors uppercase tracking-widest"
                                >
                                    Use a different email
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] text-center">
                        <Link 
                            to="/login" 
                            className="text-sm font-bold text-[var(--hp-muted)] hover:text-[var(--hp-accent)] transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
