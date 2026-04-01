import { useState } from 'react';
import ResumeGenerator from './ResumeGenerator';
import ResumeManager from './ResumeManager';

export default function ResumeHub() {
    const [view, setView] = useState('manager');

    return (
        <div>
            {/* Tab switcher */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setView('manager')}
                    className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-all border-[3px]
                        ${view === 'manager'
                            ? 'bg-orange-500 text-stone-900 border-stone-900 shadow-[4px_4px_0_#1c1917]'
                            : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-900 dark:border-stone-700 hover:bg-stone-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#ea580c]'}`}
                >
                    📁 My Resumes
                </button>
                <button
                    onClick={() => setView('generator')}
                    className={`px-6 py-3 font-black uppercase tracking-widest text-sm transition-all border-[3px]
                        ${view === 'generator'
                            ? 'bg-orange-500 text-stone-900 border-stone-900 shadow-[4px_4px_0_#1c1917]'
                            : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-900 dark:border-stone-700 hover:bg-stone-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_#ea580c]'}`}
                >
                    📄 Create Resume
                </button>
            </div>

            {view === 'manager'   && <ResumeManager onResumeSaved={() => {}} />}
            {view === 'generator' && <ResumeGenerator onResumeSaved={() => setView('manager')} />}
        </div>
    );
}