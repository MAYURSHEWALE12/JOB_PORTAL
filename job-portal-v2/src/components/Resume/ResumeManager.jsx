import { useState, useEffect, useRef } from 'react';
import { resumeAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
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
            const res = await resumeAPI.download(resume.id);
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
            await resumeAPI.upload(user.id, file, name);
            await fetchResumes();
            setUploadName('');
            setSuccess('✅ Resume uploaded!');
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
                    <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">📁 My Resumes</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 font-bold uppercase tracking-widest">
                        Manage all your resumes ({resumes.length}/5)
                    </p>
                </div>
            )}

            {success && (
                <div className="bg-emerald-400 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-rose-500 border-[3px] border-stone-900 dark:border-stone-700 text-white px-4 py-3 mb-4 font-black uppercase text-sm shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]">
                    {error}
                </div>
            )}

            {/* Upload Section */}
            {!selectionMode && resumes.length < 5 && (
                <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-5 mb-6">
                    <h3 className="font-black text-stone-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-widest">📤 Upload Existing Resume</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                            placeholder="Resume name (optional)"
                            className="flex-1 px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] text-sm bg-white dark:bg-stone-900 dark:text-white font-bold uppercase placeholder:normal-case placeholder:font-normal transition-all"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 px-5 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 text-sm font-black uppercase tracking-wider transition-all shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1c1917]"
                        >
                            {uploading ? 'Uploading...' : '📎 Upload PDF'}
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

            {/* Loading */}
            {loading && <Loader text="Loading resumes..." />}

            {/* Empty */}
            {!loading && resumes.length === 0 && (
                <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] p-10 text-center">
                    <div className="text-5xl mb-3">📄</div>
                    <h3 className="font-black text-stone-900 dark:text-gray-100 mb-1 uppercase tracking-tight">No Resumes Yet</h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase">
                        Use the Resume Generator or upload an existing PDF
                    </p>
                </div>
            )}

            {/* Resume List */}
            <div className="space-y-4">
                {resumes.map(resume => (
                    <div
                        key={resume.id}
                        onClick={() => handleSelect(resume)}
                        className={`bg-white dark:bg-stone-800 p-4 transition-all border-[3px]
                            ${selectionMode
                                ? 'cursor-pointer hover:-translate-y-1 ' +
                                  (selectedId === resume.id
                                    ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[6px_6px_0_#ea580c] -translate-y-1'
                                    : 'border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#ea580c]')
                                : 'border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000]'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Selected indicator */}
                                {selectionMode && (
                                    <div className={`w-5 h-5 border-[3px] flex items-center justify-center flex-shrink-0
                                        ${selectedId === resume.id
                                            ? 'border-orange-600 bg-orange-500'
                                            : 'border-stone-400 dark:border-stone-600'}`}>
                                        {selectedId === resume.id && (
                                            <div className="w-2 h-2 bg-white" />
                                        )}
                                    </div>
                                )}

                                <div className="w-10 h-10 bg-orange-100 dark:bg-stone-900 border-[2px] border-stone-900 dark:border-stone-700 flex items-center justify-center text-xl shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000]">📄</div>

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
                                                className="px-3 py-1 border-[2px] border-orange-500 text-sm focus:outline-none focus:shadow-[2px_2px_0_#ea580c] bg-white dark:bg-stone-900 dark:text-white font-bold"
                                            />
                                            <button onClick={() => handleRename(resume.id)}
                                                className="text-orange-600 text-xs font-black uppercase">Save</button>
                                            <button onClick={() => setRenaming(null)}
                                                className="text-stone-400 text-xs font-bold uppercase">Cancel</button>
                                        </div>
                                    ) : (
                                        <p className="font-black text-stone-900 dark:text-gray-100 text-sm uppercase tracking-tight">{resume.name}</p>
                                    )}
                                    <p className="text-stone-400 dark:text-stone-500 text-xs font-bold uppercase mt-0.5">
                                        📅 {formatDate(resume.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            {!selectionMode && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setRenaming(resume.id);
                                            setNewName(resume.name);
                                        }}
                                        className="text-xs bg-white dark:bg-stone-700 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold uppercase px-3 py-1.5 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1c1917] transition-all"
                                    >
                                        ✏️ Rename
                                    </button>
                                    <button
                                        onClick={() => handleDownload(resume)}
                                        disabled={downloading === resume.id}
                                        className="text-xs bg-orange-100 dark:bg-orange-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-orange-400 font-bold uppercase px-3 py-1.5 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1c1917] transition-all disabled:opacity-50"
                                    >
                                        {downloading === resume.id ? '...' : '⬇️ Download'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        disabled={deleting === resume.id}
                                        className="text-xs bg-rose-100 dark:bg-rose-900/30 border-[2px] border-stone-900 dark:border-stone-700 text-rose-700 dark:text-rose-400 font-bold uppercase px-3 py-1.5 shadow-[2px_2px_0_#1c1917] dark:shadow-[2px_2px_0_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1c1917] transition-all disabled:opacity-50"
                                    >
                                        {deleting === resume.id ? '...' : '🗑️'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}