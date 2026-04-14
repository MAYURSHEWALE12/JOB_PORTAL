import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import Dashboard from './components/Dashboard/Dashboard';
import HomePage from './components/Home/HomePage';
import ResumeBuilderPage from './components/Resume/ResumeBuilderPage';

const pageVariants = {
    initial: { opacity: 0, scale: 0.99 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.99 }
};

const pageTransition = {
    duration: 0.38,
    ease: [0.16, 1, 0.3, 1]
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
    return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
                <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
                <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
                <Route path="/resume-builder" element={<AnimatedPage><ResumeBuilderPage /></AnimatedPage>} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <AnimatedPage><Dashboard /></AnimatedPage>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const restoreUser = useAuthStore((state) => state.restoreUser);
    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        restoreUser();
        setIsHydrating(false);
    }, [restoreUser]);

    if (isHydrating) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F2' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;
