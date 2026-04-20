import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkActionsToolbar({ selectedCount, onBulkUpdate, onCancel, isUpdating }) {
    if (selectedCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] border px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-[92%] sm:w-auto sm:min-w-[400px]"
                style={{
                    background: 'rgba(var(--hp-nav-bg), 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderColor: 'var(--hp-border)',
                    color: 'var(--hp-text)'
                }}
            >
                <div className="flex items-center gap-3 border-r pr-6" style={{ borderColor: 'var(--hp-border)' }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg" style={{ background: 'var(--hp-accent)' }}>
                        {selectedCount}
                    </span>
                    <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--hp-muted)' }}>Selected</span>
                </div>
                <div className="flex gap-3">
                    <button
                        disabled={isUpdating}
                        onClick={() => onBulkUpdate('SHORTLISTED')}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
                        style={{ background: 'var(--hp-accent)', color: '#fff', boxShadow: '0 4px 15px rgba(var(--hp-accent-rgb), 0.3)' }}
                    >
                        Shortlist
                    </button>
                    <button
                        disabled={isUpdating}
                        onClick={() => onBulkUpdate('REJECTED')}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-transform hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        Reject
                    </button>
                    <button
                        disabled={isUpdating}
                        onClick={onCancel}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        style={{ color: 'var(--hp-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hp-surface-alt)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        Cancel
                    </button>
                </div>
                {isUpdating && (
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-sm font-bold tracking-widest uppercase z-10" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#fff' }}>
                        <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Updating...
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
