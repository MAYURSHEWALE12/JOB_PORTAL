import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setSubmitted(true);
            toast.success('Reset link sent to your email!');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to send reset link';
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
                        <h1 className="text-3xl font-black text-[var(--hp-text)] tracking-tight mb-3">Forgot Password?</h1>
                        <p className="text-[var(--hp-muted)] font-medium leading-relaxed">
                            {submitted 
                                ? "Check your inbox for the reset link we just sent." 
                                : "Enter your registered email below and we'll send you a link to reset your password."}
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Sending Link...
                                    </span>
                                ) : "Send Reset Link"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center text-sm font-bold flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Request processed successfully
                            </div>
                            <button 
                                onClick={() => setSubmitted(false)}
                                className="hp-btn-ghost w-full h-14 text-sm font-bold"
                            >
                                Didn't receive an email? Try again
                            </button>
                        </div>
                    )}

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
