import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../ThemeToggle';
import Footer from '../Footer';

export default function LoginPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validate = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setLoading(true);

        try {
            const res = await authAPI.login(formData);
            const { token, ...user } = res.data;
            setUser(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = formData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.password.length >= 6;

    return (
        <div className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-rose-50 dark:from-stone-900 dark:via-stone-900 dark:to-orange-950/20 flex flex-col transition-colors duration-500">
            
            <nav className="sticky top-0 z-50 bg-white dark:bg-stone-900 px-6 py-4 flex justify-between items-center border-b-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                <Link to="/" className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">
                    Job Portal
                </Link>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                </div>
            </nav>

            <div className="flex-grow overflow-y-auto w-full relative">
                <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 relative">
                    <div className="absolute top-20 -left-20 w-72 h-72 bg-orange-300 dark:bg-orange-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
                    <div className="absolute top-40 -right-10 w-72 h-72 bg-rose-300 dark:bg-rose-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>

                    <div className="bg-white dark:bg-stone-800 rounded-xl border-[3px] border-stone-900 dark:border-stone-700 w-full max-w-md p-6 sm:p-8 relative z-10 transition-all duration-300 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent">Job Portal</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
                        </div>

                        {error && (
                            <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] ${
                                        errors.email
                                            ? 'border-rose-500 focus:border-rose-500'
                                            : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase tracking-wide">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-stone-900 border-[2px] rounded-none focus:outline-none focus:ring-0 transition-all duration-200 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] ${
                                        errors.password
                                            ? 'border-rose-500 focus:border-rose-500'
                                            : 'border-stone-900 dark:border-stone-700 focus:border-orange-500 dark:focus:border-orange-400'
                                    }`}
                                />
                                {errors.password && (
                                    <p className="text-rose-500 text-xs font-bold mt-1.5 uppercase tracking-wide">{errors.password}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="neo-btn w-full bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-3.5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                                Register here
                            </Link>
                        </p>
                    </div>

                    <div className="mt-12 w-full">
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
}
