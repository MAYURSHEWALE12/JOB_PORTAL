import { motion } from 'framer-motion';

export default function ResumePreviewModal({ resumeUrl, resumeName, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 30, scale: 0.95, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 30, scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
                style={{ 
                    background: 'var(--hp-card)', 
                    borderColor: 'var(--hp-border)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 0 40px rgba(var(--hp-accent-rgb), 0.08)'
                }}
            >
                {/* Header */}
                <div 
                    className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                    style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-surface-alt)' }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="var(--hp-accent)" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold truncate" style={{ color: 'var(--hp-text)' }}>
                                {resumeName || 'Resume'}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--hp-muted)' }}>
                                PDF Preview
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all hover:scale-105 flex items-center gap-1.5"
                            style={{
                                color: 'var(--hp-accent)',
                                background: 'rgba(var(--hp-accent-rgb), 0.08)',
                                borderColor: 'rgba(var(--hp-accent-rgb), 0.2)'
                            }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open
                        </a>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
                            style={{ 
                                borderColor: 'var(--hp-border)', 
                                color: 'var(--hp-muted)',
                                background: 'var(--hp-card)'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 relative bg-neutral-900">
                    <iframe
                        src={resumeUrl}
                        title={resumeName || 'Resume Preview'}
                        className="w-full h-full border-0"
                        style={{ background: '#525659' }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
