import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import Dashboard from './components/Dashboard/Dashboard';
import HomePage from './components/Home/HomePage';
import ResumeBuilderPage from './components/Resume/ResumeBuilderPage';
import CompanyProfilePage from './components/Companies/CompanyProfilePage';
import BrowseCompaniesPage from './components/Companies/BrowseCompaniesPage';
import JobDetailPage from './components/Jobs/JobDetailPage';

function ProtectedRoute({ children }) {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
    const restoreUser = useAuthStore((state) => state.restoreUser);
    const initTheme = useThemeStore((state) => state.initTheme);
    const [isHydrating, setIsHydrating] = useState(true);

    useEffect(() => {
        restoreUser();
        initTheme();
        setIsHydrating(false);
    }, [restoreUser, initTheme]);

    if (isHydrating) {
        return (
            <div className="min-h-screen bg-orange-50/50 dark:bg-stone-950 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-stone-900 border-[4px] border-stone-900 dark:border-stone-700 p-8 sm:p-10 shadow-[10px_10px_0_#1c1917] dark:shadow-[10px_10px_0_#000] text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-[3px] border-stone-900 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-2xl font-black uppercase tracking-tighter text-stone-900 dark:text-white">
                        Loading Workspace
                    </p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-stone-400">
                        Restoring your session
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                <Route path="/company/:userId" element={<CompanyProfilePage />} />
                <Route path="/companies" element={<BrowseCompaniesPage />} />
                <Route path="/job/:jobId" element={<JobDetailPage />} />

                <Route
                    path="/dashboard"
                    element={(
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    )}
                />

                <Route path="/" element={<HomePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
