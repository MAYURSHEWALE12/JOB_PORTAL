import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

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

    return (
        <div className="min-h-screen gradient-warm flex flex-col">
            <nav className="navbar-glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-[#EAD9C4]">
                <Link to="/" className="text-2xl font-serif font-semibold" style={{ color: '#C2651A' }}>
                    Job Portal
                </Link>
            </nav>

            <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="warm-card w-full max-w-md p-8"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-serif font-semibold mb-2">Welcome Back</h1>
                        <p className="text-[#8B7355]">Sign in to your account</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="warm-toast mb-6 text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#4A3728]">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                className="warm-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#4A3728]">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                                className="warm-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="warm-btn w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#8B7355] mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#C2651A] hover:underline font-medium">
                            Register here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
