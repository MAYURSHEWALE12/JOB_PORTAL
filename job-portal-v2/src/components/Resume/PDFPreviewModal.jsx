import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import axios from 'axios';
import { resumeAPI } from '../../services/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function PDFPreviewModal({ resume, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.5); // Increased default scale for better base quality
    const canvasRef = useRef(null);
    const renderingRef = useRef(false);
    const pdfInstance = useRef(null);

    useEffect(() => {
        loadPdf();
    }, [resume?.id]);

    const loadPdf = async () => {
        if (!resume?.id) return;
        setLoading(true);
        setError('');

        try {
            // Step 1: Get the authorized cloud URL from our backend
            const urlRes = await resumeAPI.getUrl(resume.id);
            const cloudUrl = urlRes.data.url;

            // Step 2: Fetch the file from the cloud directly
            // We use a fresh axios instance or just axios.get to avoid sending our 
            // backend's Bearer token to Cloudinary (which causes CORS/Security issues)
            const res = await axios.get(cloudUrl, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const pdf = await pdfjsLib.getDocument(url).promise;
            pdfInstance.current = pdf;
            setNumPages(pdf.numPages);
            setPageNum(1);
            await renderPage(pdf, 1);
            setLoading(false);
        } catch (err) {
            setError('System Error: Unable to render document blueprint.');
            setLoading(false);
        }
    };

    const renderPage = async (pdf, num) => {
        if (!pdf || !canvasRef.current) return;
        if (renderingRef.current) return;
        renderingRef.current = true;

        try {
            const page = await pdf.getPage(num);

            // 🔥 HDPI PIXEL RATIO LOGIC
            const pixelRatio = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: disable alpha if possible

            // Set the internal drawing buffer size (The "HD" size)
            canvas.height = viewport.height * pixelRatio;
            canvas.width = viewport.width * pixelRatio;

            // Set the CSS display size (The "Standard" size)
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            // Scale the context so PDF.js draws at the high resolution
            const transform = [pixelRatio, 0, 0, pixelRatio, 0, 0];

            await page.render({
                canvasContext: ctx,
                viewport: viewport,
                transform: transform // Apply the HDPI transform
            }).promise;

        } catch (err) {
            console.error('Render error:', err);
        } finally {
            renderingRef.current = false;
        }
    };

    const handlePageChange = async (newNum) => {
        if (newNum < 1 || newNum > numPages || !pdfInstance.current) return;
        setLoading(true);
        setPageNum(newNum);
        await renderPage(pdfInstance.current, newNum);
        setLoading(false);
    };

    const handleZoom = async (newScale) => {
        setScale(newScale);
        if (pdfInstance.current) {
            setLoading(true);
            await renderPage(pdfInstance.current, pageNum);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
                style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(16px)' }}
                onClick={onClose}
            >
                <style>{`
                    .pdf-terminal { background: var(--hp-card); border: 1px solid var(--hp-border); border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; width: 100%; max-width: 1000px; height: 90vh; }
                    .pdf-header { background: var(--hp-surface-alt); border-bottom: 1px solid var(--hp-border); padding: 16px 24px; flex-shrink: 0; }
                    .canvas-viewport { background: #0a0c14; flex: 1; overflow: auto; padding: 40px 20px; display: flex; justify-content: center; align-items: flex-start; }
                    .pdf-footer { background: var(--hp-surface-alt); border-top: 1px solid var(--hp-border); padding: 20px 24px; flex-shrink: 0; }
                    .hp-canvas { box-shadow: 0 30px 60px rgba(0,0,0,0.6); background: white; image-rendering: -webkit-optimize-contrast; /* Extra sharpening */ }
                    .hp-btn-ghost { background: var(--hp-surface); border: 1px solid var(--hp-border); color: var(--hp-text); border-radius: 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 10px 20px; }
                    .hp-btn-primary { background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2)); color: #fff; font-weight: 800; border-radius: 10px; font-size: 11px; text-transform: uppercase; padding: 10px 24px; }
                `}</style>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="pdf-terminal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="pdf-header flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-center text-lg">📄</div>
                            <div>
                                <h3 className="font-black tracking-tighter text-[var(--hp-text)] uppercase text-xs">Blueprint Viewer</h3>
                                <p className="text-[9px] font-mono text-[var(--hp-muted)] uppercase tracking-widest truncate max-w-[150px]">{resume?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-[var(--hp-surface)] rounded-lg border border-[var(--hp-border)] p-1">
                                <button onClick={() => handleZoom(Math.max(scale - 0.2, 0.8))} className="p-1.5 hover:text-[var(--hp-accent)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 20l-4-4m-2-3a5 5 0 11-10 0 5 5 0 0110 0zM13 10H7" /></svg>
                                </button>
                                <span className="text-[9px] font-black w-12 text-center flex items-center justify-center border-x border-[var(--hp-border)] mx-1">
                                    {Math.round(scale * 100)}%
                                </span>
                                <button onClick={() => handleZoom(Math.min(scale + 0.2, 2.4))} className="p-1.5 hover:text-[var(--hp-accent)]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 20l-4-4m-2-3a5 5 0 11-10 0 5 5 0 0110 0zM10 7v6m3-3H7" /></svg>
                                </button>
                            </div>
                            <button onClick={onClose} className="hp-btn-ghost">Exit Forge</button>
                        </div>
                    </div>

                    <div className="canvas-viewport custom-scrollbar">
                        <AnimatePresence>
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 bg-[#0a0c14]/60 flex flex-col items-center justify-center backdrop-blur-md">
                                    <div className="w-8 h-8 border-4 border-[var(--hp-border)] border-t-[var(--hp-accent)] rounded-full animate-spin mb-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hp-accent)]">Enhancing Clarity...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error ? (
                            <div className="text-red-500 font-bold text-xs bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-xl">{error}</div>
                        ) : (
                            <canvas ref={canvasRef} className="hp-canvas" />
                        )}
                    </div>

                    <div className="pdf-footer flex items-center justify-between">
                        <button disabled={pageNum <= 1 || loading} onClick={() => handlePageChange(pageNum - 1)} className="hp-btn-ghost disabled:opacity-30">Prev</button>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-[var(--hp-accent)] bg-[var(--hp-accent)]/10 px-3 py-1 rounded-md">Page {pageNum}</span>
                            <span className="text-[10px] font-black text-[var(--hp-muted)]">/ {numPages}</span>
                        </div>
                        <button disabled={pageNum >= numPages || loading} onClick={() => handlePageChange(pageNum + 1)} className="hp-btn-primary disabled:opacity-30">Next</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}