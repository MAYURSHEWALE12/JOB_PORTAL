import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeGenerator from './ResumeGenerator';
import ResumeManager from './ResumeManager';
import ATSCheck from './ATSCheck';

export default function ResumeHub() {
    const [view, setView] = useState('manager');

    const tabs = [
        { key: 'manager',    label: 'My Resumes',    icon: '📁' },
        { key: 'generator', label: 'Create New',  icon: '✨' },
        { key: 'atscheck',  label: 'ATS Check',   icon: '🎯' },
    ];

    return (
        <div>
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-text-main)]">My Resumes</h2>
                <p className="text-[var(--color-text-muted)] mt-1 sm:mt-2 text-sm sm:text-base">Manage and create professional resumes that stand out</p>
            </div>

            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.key}
                        onClick={() => setView(tab.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                            ${view === tab.key
                                ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[#0f2620] shadow-lg shadow-[var(--color-primary)]/30'
                                : 'border-2 border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] bg-[var(--color-surface)]'}`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </motion.button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                    {view === 'manager'   && <ResumeManager onResumeSaved={() => {}} />}
                    {view === 'generator' && <ResumeGenerator onResumeSaved={() => setView('manager')} />}
                    {view === 'atscheck'  && <ATSCheck />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
