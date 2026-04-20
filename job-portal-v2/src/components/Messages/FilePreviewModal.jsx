import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker via CDN to avoid Vite ?url bundle warnings and fake worker fallbacks
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function FilePreviewModal({ fileUrl, fileName, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const canvasRef = useRef(null);
    const renderingRef = useRef(false);
    const pdfRef = useRef(null);

    const isImage = fileName?.match(/\.(jpg|jpeg|png|gif)$/i) || fileUrl?.includes('/image/');
    const isPDF = fileName?.match(/\.pdf$/i) || fileUrl?.toLowerCase().includes('.pdf');

    useEffect(() => {
        if (isPDF) {
            loadPdf();
        } else {
            setLoading(false);
        }
    }, [fileUrl]);

    const loadPdf = async () => {
        if (!fileUrl) return;
        setLoading(true);
        setError('');

        try {
            const pdf = await pdfjsLib.getDocument(fileUrl).promise;
            pdfRef.current = pdf;
            setNumPages(pdf.numPages);
            setPageNum(1);
            await renderPage(pdf, 1);
            setLoading(false);
        } catch (err) {
            console.error('PDF load error:', err);
            setError('Failed to load PDF preview. The file might be corrupted or restricted.');
            setLoading(false);
        }
    };

    const renderPage = async (pdf, num) => {
        if (renderingRef.current || !pdf || !canvasRef.current) return;
        renderingRef.current = true;

        try {
            const page = await pdf.getPage(num);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
        } catch (err) {
            console.error('Render error:', err);
        } finally {
            renderingRef.current = false;
        }
    };

    useEffect(() => {
        // Re-render when scale changes
        if (isPDF && pdfRef.current && !loading) {
            renderPage(pdfRef.current, pageNum);
        }
    }, [scale]);

    const handlePrev = async () => {
        if (pageNum <= 1) return;
        setPageNum(prev => prev - 1);
        renderPage(pdfRef.current, pageNum - 1);
    };

    const handleNext = async () => {
        if (pageNum >= numPages) return;
        setPageNum(prev => prev + 1);
        renderPage(pdfRef.current, pageNum + 1);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 hp-modal-overlay"
                onClick={onClose}
            >
                <div
                    className="absolute top-6 right-6 p-2 rounded-xl text-white/50 hover:text-white bg-black/20 hover:bg-black/40 transition-all cursor-pointer backdrop-blur-sm z-10"
                    onClick={onClose}
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="hp-card hp-modal w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b z-10 relative" style={{ borderColor: 'var(--hp-border)', background: 'var(--hp-card)' }}>
                        <div className="min-w-0 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'rgba(var(--hp-accent-rgb), 0.1)' }}>
                                {isImage ? (
                                    <svg className="w-6 h-6" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                ) : isPDF ? (
                                    <svg className="w-6 h-6" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" style={{ color: 'var(--hp-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-[var(--hp-text)] truncate max-w-md tracking-tight">{fileName || 'File Preview'}</h3>
                                {isPDF && <p className="text-xs font-bold tracking-wider uppercase mt-1" style={{ color: 'var(--hp-muted)' }}>PDF Document • {numPages} Pages</p>}
                                {isImage && <p className="text-xs font-bold tracking-wider uppercase mt-1" style={{ color: 'var(--hp-muted)' }}>Image File</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.open(fileUrl, '_blank')}
                                className="hp-btn-ghost px-5 py-2.5 text-sm flex items-center gap-2"
                                title="Open in new tab"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Open Full
                            </button>
                            <button
                                onClick={onClose}
                                className="hp-btn-primary px-8 py-2.5 text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto flex items-center justify-center relative z-0" style={{ background: 'var(--hp-bg)' }}>
                        {/* Subtle background decoration */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(var(--hp-text) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                        {loading && (
                            <div className="flex flex-col items-center gap-4">
                                <svg className="w-10 h-10 animate-spin" style={{ color: 'var(--hp-accent)' }} fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="font-medium tracking-wide text-sm" style={{ color: 'var(--hp-muted)' }}>Preparing preview...</p>
                            </div>
                        )}

                        {error && (
                            <div className="hp-card p-12 text-center max-w-md shadow-2xl relative z-10">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-[var(--hp-text)] tracking-tight">Preview Unavailable</h4>
                                <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--hp-muted)' }}>{error}</p>
                                <button
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="hp-btn-primary w-full py-3.5"
                                >
                                    Open File Externally
                                </button>
                            </div>
                        )}

                        {!loading && !error && isImage && (
                            <div className="relative group max-w-full max-h-full p-8">
                                <img
                                    src={fileUrl}
                                    alt={fileName}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl relative z-10"
                                    style={{ border: '1px solid var(--hp-border)', backgroundColor: '#fff' }}
                                />
                            </div>
                        )}

                        {!loading && !error && isPDF && (
                            <div className="relative group flex flex-col items-center w-full h-full p-8 overflow-auto">
                                <canvas
                                    ref={canvasRef}
                                    className="shadow-2xl rounded-sm relative z-10"
                                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid var(--hp-border)', backgroundColor: '#fff' }}
                                />

                                {/* Floating Controls */}
                                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 border"
                                    style={{ background: 'var(--hp-nav-bg)', backdropFilter: 'blur(20px)', borderColor: 'var(--hp-border)', color: 'var(--hp-text)' }}>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handlePrev}
                                            disabled={pageNum <= 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--hp-surface-alt)] disabled:opacity-30 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <div className="flex flex-col items-center min-w-[80px]">
                                            <span className="text-sm font-bold">{pageNum} / {numPages}</span>
                                            <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5" style={{ color: 'var(--hp-muted)' }}>Pages</span>
                                        </div>
                                        <button
                                            onClick={handleNext}
                                            disabled={pageNum >= numPages}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--hp-surface-alt)] disabled:opacity-30 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>

                                    <div className="w-px h-8" style={{ background: 'var(--hp-border)' }} />

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--hp-surface-alt)] transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        </button>
                                        <div className="flex flex-col items-center min-w-[70px]">
                                            <span className="text-sm font-bold">{Math.round(scale * 100)}%</span>
                                            <span className="text-[9px] font-bold tracking-wider uppercase mt-0.5" style={{ color: 'var(--hp-muted)' }}>Zoom</span>
                                        </div>
                                        <button
                                            onClick={() => setScale(s => Math.min(s + 0.2, 2.5))}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--hp-surface-alt)] transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && !isImage && !isPDF && (
                            <div className="hp-card p-12 text-center max-w-md shadow-2xl relative z-10">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--hp-accent2-rgb), 0.1)' }}>
                                    <svg className="w-12 h-12" style={{ color: 'var(--hp-accent2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-xl mb-3 text-[var(--hp-text)] tracking-tight truncate px-4">{fileName}</h4>
                                <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--hp-muted)' }}>
                                    Direct preview is not supported for this file type.<br />
                                    Please download it to view the contents.
                                </p>
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.download = fileName;
                                        link.click();
                                    }}
                                    className="hp-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download File
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}