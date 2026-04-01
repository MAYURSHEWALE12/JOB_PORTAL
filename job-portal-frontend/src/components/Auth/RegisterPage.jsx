import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../ThemeToggle';
import Footer from '../Footer';

export default function RegisterPage() {
    const navigate = useNavigate();
    const setUser  = useAuthStore((state) => state.setUser);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName:  '',
        email:     '',
        password:  '',
        confirmPassword: '',
        role:      'JOBSEEKER',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
        if (score <= 3) return { score, label: 'Medium', color: 'bg-orange-500' };
        return { score, label: 'Strong', color: 'bg-emerald-500' };
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
        if (name === 'confirmPassword' && formData.password === value) {
            setErrors({ ...errors, confirmPassword: '' });
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const res = await authAPI.register(registerData);
            const { token, ...user } = res.data;
            setUser(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);
    const isFormValid =
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.length >= 8 &&
        formData.password === formData.confirmPassword;

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

                    <div className="bg-white dark:bg-stone-800 rounded-xl border-[3px] border-stone-900 dark:border-stone-700 w-full max-w-lg p-6 sm:p-10 relative z-10 transition-all duration-300 shadow-[8px_8px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                        
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-500 bg-clip-text text-transparent">Join Us</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your account to get started</p>
                        </div>

                        {error && (
                            <div key={error} className="animate-neo-shake bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-6 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[8px_8px_0_#000]">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] focus:outline-none dark:text-white ${
                                            errors.firstName ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                        }`}
                                    />
                                    {errors.firstName && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] focus:outline-none dark:text-white ${
                                            errors.lastName ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                        }`}
                                    />
                                    {errors.lastName && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] focus:outline-none dark:text-white ${
                                        errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                    }`}
                                />
                                {errors.email && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] focus:outline-none dark:text-white ${
                                        errors.password ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                    }`}
                                />
                                {errors.password && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{errors.password}</p>}
                                {formData.password && !errors.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold uppercase text-stone-500">{passwordStrength.label}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] focus:outline-none dark:text-white ${
                                        errors.confirmPassword ? 'border-rose-500 focus:border-rose-500' : 'border-stone-900 dark:border-stone-700 focus:border-orange-500'
                                    }`}
                                />
                                {errors.confirmPassword && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">{errors.confirmPassword}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1.5">I am a...</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 focus:outline-none focus:border-orange-500 dark:text-white font-bold"
                                >
                                    <option value="JOBSEEKER">Job Seeker</option>
                                    <option value="EMPLOYER">Employer</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isFormValid}
                                className="neo-btn w-full bg-gradient-to-r from-orange-500 to-rose-500 py-3.5 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                                Sign in here
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
