import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useNotificationSound } from './hooks/useNotificationSound';

/* ─── Lazy-loaded Pages (only downloaded when visited) ──────────── */
const HomePage = lazy(() => import('./components/Home/HomePage'));
const LoginPage = lazy(() => import('./components/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/Auth/RegisterPage'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const JobsPage = lazy(() => import('./components/Jobs/JobsPage'));
const ResumeBuilderPage = lazy(() => import('./components/Resume/ResumeBuilderPage'));
const QuizTakePage = lazy(() => import('./components/Quiz/QuizTakePage'));
const QuizCreatePage = lazy(() => import('./components/Quiz/QuizCreatePage'));
const CompanyProfilePage = lazy(() => import('./components/Company/CompanyProfilePage'));
const ForgotPasswordPage = lazy(() => import('./components/Auth/ForgotPasswordPage'));
const OAuth2RedirectHandler = lazy(() => import('./components/Auth/OAuth2RedirectHandler'));

/* ─── Page Loading Spinner ──────────────────────────────────────── */
const PageLoader = () => (
    <div className="h-screen flex items-center justify-center bg-[var(--color-canvas)]">
        <div className="flex flex-col items-center gap-4">
            <div className="spinner"></div>
            <span className="text-xs font-semibold text-[var(--color-text-muted)] tracking-widest uppercase">Loading…</span>
        </div>
    </div>
);

/* ─── Simplified Page Transition (lighter for mobile) ───────────── */
const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

const pageTransition = {
    duration: 0.2,
    ease: 'easeOut'
};

const AnimatedPage = ({ children }) => (
    <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
    >
        {children}
    </motion.div>
);

function ProtectedRoute({ children }) {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
    const location = useLocation();

    return (
        <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
                    <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
                    <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
                    <Route path="/jobs" element={<AnimatedPage><JobsPage /></AnimatedPage>} />
                    <Route path="/resume-builder" element={<AnimatedPage><ResumeBuilderPage /></AnimatedPage>} />
                    <Route path="/company/:userId" element={<AnimatedPage><CompanyProfilePage /></AnimatedPage>} />
                    <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
                    <Route path="/oauth2/redirect" element={<AnimatedPage><OAuth2RedirectHandler /></AnimatedPage>} />
                    <Route path="/quiz/take/:jobId/:applicationId" element={
                        <ProtectedRoute>
                            <AnimatedPage><QuizTakePage /></AnimatedPage>
                        </ProtectedRoute>
                    } />
                    <Route path="/quiz/create/:jobId" element={
                        <ProtectedRoute>
                            <AnimatedPage><QuizCreatePage /></AnimatedPage>
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <AnimatedPage><Dashboard /></AnimatedPage>
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AnimatePresence>
        </Suspense>
    );
}

function NotificationHandler() {
    const navigate = useNavigate();
    const { playNotificationSound, playMessageSound } = useNotificationSound();

    useEffect(() => {
        const handleNewNotification = (e) => {
            const notification = e.detail;
            playNotificationSound();
            
            import('react-hot-toast').then(({ toast }) => {
                toast((t) => (
                    <div 
                        onClick={() => {
                            toast.dismiss(t.id);
                            // Smart Redirection to Dashboard Tabs
                            if (notification.type === 'JOB_ALERT') {
                                navigate(`/dashboard?tab=search&jobId=${notification.referenceId}`);
                            } else if (notification.type === 'MESSAGE' || notification.type === 'CHAT') {
                                navigate(`/dashboard?tab=messages&userId=${notification.referenceId}`);
                            } else {
                                navigate('/dashboard?tab=notifications');
                            }
                        }}
                        className="cursor-pointer flex flex-col gap-1 p-1"
                    >
                        <div className="flex items-center gap-2 font-bold text-[13px]">
                            <span>{notification.isBroadcast ? '📢' : '🔔'}</span>
                            <span>{notification.title}</span>
                        </div>
                        <div className="text-xs text-[var(--hp-text)] opacity-80 line-clamp-2">
                            {notification.message}
                        </div>
                        <div className="text-[10px] text-[var(--hp-accent)] font-bold uppercase tracking-wider mt-1">
                            Click to view details →
                        </div>
                    </div>
                ), {
                    style: {
                        borderRadius: '16px',
                        background: 'var(--hp-card)',
                        color: 'var(--hp-text)',
                        border: '1px solid var(--hp-border)',
                        padding: '12px',
                        maxWidth: '350px'
                    },
                    duration: 8000
                });
            });
        };

        const handleNewMessage = (e) => {
            playMessageSound();
        };
        
        window.addEventListener('newNotification', handleNewNotification);
        window.addEventListener('newMessage', handleNewMessage);
        
        return () => {
            window.removeEventListener('newNotification', handleNewNotification);
            window.removeEventListener('newMessage', handleNewMessage);
        };
    }, [navigate, playNotificationSound, playMessageSound]);

    return null;
}

import { useWebsocketStore } from './store/websocketStore';

function App() {
    const { user, isLoggedIn, restoreUser } = useAuthStore();
    const { connect, disconnect } = useWebsocketStore();
    const { initTheme } = useThemeStore();
    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        initTheme();
    }, [initTheme]);

    useEffect(() => {
        const init = async () => {
            await restoreUser();
            setIsHydrating(false);
        };
        init();
    }, [restoreUser]);

    useEffect(() => {
        if (isLoggedIn && user?.id) {
            connect(user.id);
        } else {
            disconnect();
        }
        return () => disconnect();
    }, [isLoggedIn, user?.id, connect, disconnect]);

    if (isHydrating) {
        return (
            <div className="h-screen flex items-center justify-center bg-[var(--color-canvas)]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Router>
            <NotificationHandler />
            <Toaster position="top-right" reverseOrder={false} />
            <AppRoutes />
        </Router>
    );
}

export default App;
