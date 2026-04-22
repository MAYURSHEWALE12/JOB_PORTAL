import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { resumeAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import PDFPreviewModal from './PDFPreviewModal';
import Loader from '../Loader';

export default function ResumeManager({ onSelect, selectionMode = false }) {
    const { user } = useAuthStore();

    const [resumes, setResumes]         = useState([]);
    const [loading, setLoading]         = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [deleting, setDeleting]       = useState(null);
    const [renaming, setRenaming]       = useState(null);
    const [newName, setNewName]         = useState('');
    const [uploading, setUploading]     = useState(false);
    const [uploadName, setUploadName]   = useState('');
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState('');
    const [selectedId, setSelectedId]   = useState(null);
    const [previewing, setPreviewing] = useState(null);
    const fileInputRef                  = useRef(null);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        setLoading(true);
        try {
            const res = await resumeAPI.list(user.id);
            setResumes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load resumes.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (resume) => {
        setDownloading(resume.id);
        try {
            // Step 1: Get authorized cloud URL
            const urlRes = await resumeAPI.getUrl(resume.id);
            const cloudUrl = urlRes.data.url;

            // Step 2: Fetch blob from cloud directly
            const res = await axios.get(cloudUrl, { responseType: 'blob' });
            const url = window.URL.createObjectURL(
                new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${resume.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download resume.');
        } finally {
            setDownloading(null);
        }
    };

    const handleDelete = async (resumeId) => {
        if (!window.confirm('Delete this resume?')) return;
        setDeleting(resumeId);
        try {
            await resumeAPI.delete(resumeId);
            setResumes(prev => prev.filter(r => r.id !== resumeId));
            if (selectedId === resumeId) setSelectedId(null);
            setSuccess('Resume deleted.');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete.');
        } finally {
            setDeleting(null);
        }
    };

    const handleRename = async (resumeId) => {
        if (!newName.trim()) return;
        try {
            await resumeAPI.rename(resumeId, newName.trim());
            setResumes(prev =>
                prev.map(r => r.id === resumeId ? { ...r, name: newName.trim() } : r)
            );
            setRenaming(null);
            setNewName('');
        } catch (err) {
            setError('Failed to rename.');
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files allowed.');
            return;
        }
        if (resumes.length >= 5) {
            setError('Maximum 5 resumes allowed. Delete one first.');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const name = uploadName.trim() || file.name.replace('.pdf', '');
            await resumeAPI.uploadWithUserId(user.id, file, name);
            await fetchResumes();
            setUploadName('');
            setSuccess('Resume uploaded!');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleSelect = (resume) => {
        if (!selectionMode) return;
        setSelectedId(resume.id);
        if (onSelect) onSelect(resume);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div>
            {!selectionMode && (
                <div className="mb-6">
                    <h3 className="text-lg font-serif font-semibold text-[var(--color-text-main)]">
                        Manage all your resumes ({resumes.length}/5)
                    </h3>
                </div>
            )}

            {success && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="warm-toast mb-4 text-sm font-medium"
                >
                    {success}
                </motion.div>
            )}
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-xl text-sm font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                >
                    {error}
                </motion.div>
            )}

            {!selectionMode && resumes.length < 5 && (
                <div className="warm-card p-4 sm:p-5 mb-4 sm:mb-6">
                    <h4 className="text-sm font-semibold text-[var(--color-text-main)] mb-3">Upload Existing Resume</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            placeholder="Resume name (optional)"
                            className="warm-input flex-1"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="warm-btn text-sm whitespace-nowrap"
                        >
                            {uploading ? 'Uploading...' : 'Upload PDF'}
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        onChange={(e) => handleUpload(e.target.files[0])}
                        className="hidden"
                    />
                </div>
            )}

            {loading && <Loader text="Loading resumes..." />}

            {!loading && resumes.length === 0 && (
                <div className="warm-card p-6 sm:p-10 text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:4">📄</div>
                    <h4 className="font-serif font-semibold text-[var(--color-text-main)] text-base sm:text-lg mb-2">No Resumes Yet</h4>
                    <p className="text-[var(--color-text-muted)] text-sm">
                        Use the Resume Generator or upload an existing PDF
                    </p>
                </div>
            )}

            <div className="space-y-3 sm:space-y-4">
                {resumes.map(resume => (
                    <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelect(resume)}
                        className={`warm-card p-3 sm:p-4 cursor-pointer
                            ${selectionMode && selectedId === resume.id ? 'border-[var(--color-primary)]' : ''}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {selectionMode && (
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                        ${selectedId === resume.id
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                            : 'border-[var(--color-border)]'}`}>
                                        {selectedId === resume.id && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                )}

                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-primary)]">
                                    📄
                                </div>

                                <div>
                                    {renaming === resume.id ? (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename(resume.id);
                                                    if (e.key === 'Escape') setRenaming(null);
                                                }}
                                                autoFocus
                                                className="warm-input py-1 px-3 text-sm w-48"
                                            />
                                            <button onClick={() => handleRename(resume.id)}
                                                className="text-[var(--color-primary)] text-xs font-medium">Save</button>
                                            <button onClick={() => setRenaming(null)}
                                                className="text-[var(--color-text-muted)] text-xs font-medium">Cancel</button>
                                        </div>
                                    ) : (
                                        <p className="font-medium text-[var(--color-text-main)]">{resume.name}</p>
                                    )}
                                    <p className="text-[var(--color-text-muted)] text-xs mt-0.5 opacity-70">
                                        📅 {formatDate(resume.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {!selectionMode && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRenaming(resume.id);
                                            setNewName(resume.name);
                                        }}
                                        className="warm-btn-outline text-xs py-2 px-3"
                                    >
                                        ✏️ Rename
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewing(resume);
                                        }}
                                        disabled={downloading === resume.id}
                                        className="warm-btn text-xs py-2 px-3"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(resume);
                                        }}
                                        disabled={downloading === resume.id}
                                        className="warm-btn-outline text-xs py-2 px-3"
                                    >
                                        {downloading === resume.id ? '...' : '⬇️'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(resume.id);
                                        }}
                                        disabled={deleting === resume.id}
                                        className="warm-btn-outline text-xs py-2 px-3 hover:border-red-500 hover:text-red-500"
                                    >
                                        {deleting === resume.id ? '...' : '🗑️'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {previewing && (
                <PDFPreviewModal
                    resume={previewing}
                    onClose={() => setPreviewing(null)}
                />
            )}
        </div>
    );
}
