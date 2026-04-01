import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { resumeAPI } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const PDF_RENDER_SCALE = 1.35;
const PDF_IMAGE_QUALITY = 0.82;
const MAX_RESUME_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_RESUME_UPLOAD_LABEL = '20MB';

function buildInitialFormData(user) {
    return {
        fullName:    `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email:       user?.email    || '',
        phone:       user?.phone    || '',
        location:    '',
        linkedin:    '',
        portfolio:   '',
        resumeName:  'My Resume',
        summary: '',
        experiences: [
            { company: '', role: '', duration: '', description: '' }
        ],
        education: [
            { institution: '', degree: '', year: '', grade: '' }
        ],
        skills: '',
        projects: [
            { name: '', description: '', tech: '' }
        ],
        certifications: '',
    };
}

export function useResumeForm(guestMode = false) {
    const auth = (() => { try { return useAuthStore(); } catch { return null; } })();
    const user = auth?.user;
    const [formData, setFormData] = useState(() => buildInitialFormData(user));
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayChange = (arrayKey, index, field, value) => {
        const updated = [...formData[arrayKey]];
        updated[index][field] = value;
        setFormData({ ...formData, [arrayKey]: updated });
    };

    const addArrayItem = (arrayKey, template) => {
        setFormData({ ...formData, [arrayKey]: [...formData[arrayKey], { ...template }] });
    };

    const removeArrayItem = (arrayKey, index) => {
        const updated = formData[arrayKey].filter((_, i) => i !== index);
        setFormData({ ...formData, [arrayKey]: updated });
    };

    const waitForPreviewReady = async (pdfRef) => {
        if (document.fonts?.ready) {
            try { await document.fonts.ready; } catch { /* fonts failed, continue anyway */ }
        }
        await new Promise((resolve) => {
            window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
        });
        const exportNode = pdfRef.current;
        if (!exportNode) throw new Error('Resume preview is still loading. Please try again.');
        const { width, height } = exportNode.getBoundingClientRect();
        if (!width || !height) throw new Error('Resume preview is not ready yet. Please try again.');
        return exportNode;
    };

    const generatePdf = async (pdfRef) => {
        const exportNode = await waitForPreviewReady(pdfRef);
        const canvas = await html2canvas(exportNode, {
            scale: PDF_RENDER_SCALE,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });
        const imgData    = canvas.toDataURL('image/jpeg', PDF_IMAGE_QUALITY);
        const pdf        = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
        const pdfWidth   = pdf.internal.pageSize.getWidth();
        const pdfHeight  = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft   = pdfHeight;
        let position     = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        return pdf.output('blob');
    };

    const handleGenerate = async (saveToDb, onResumeSaved, resumeRef, pdfRef) => {
        if (!formData.fullName.trim()) {
            setError('Full name is required.');
            return;
        }
        setGenerating(true);
        setError('');
        setSuccess('');
        try {
            const pdfBlob = await generatePdf(pdfRef);
            pdf.save(`${formData.resumeName || 'Resume'}.pdf`);
            setSuccess('Resume downloaded successfully!');

            if (saveToDb && !guestMode) {
                if (!user?.id) {
                    setError('Resume downloaded, but you need to sign in again before saving it to your profile.');
                    return;
                }
                setSaving(true);
                if (pdfBlob.size > MAX_RESUME_UPLOAD_BYTES) {
                    const sizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(1);
                    setError(`Resume downloaded, but the PDF is ${sizeMB} MB and the upload limit is ${MAX_RESUME_UPLOAD_LABEL}.`);
                    return;
                }
                const file = new File([pdfBlob], `${formData.resumeName}.pdf`, { type: 'application/pdf' });
                try {
                    await resumeAPI.upload(user.id, file, formData.resumeName);
                    setSuccess('Resume downloaded and saved to your profile!');
                    if (onResumeSaved) onResumeSaved();
                } catch (uploadError) {
                    const backendMsg = uploadError?.response?.data?.error;
                    if (backendMsg) {
                        setError(`Resume downloaded, but saving it failed: ${backendMsg}`);
                    } else if (uploadError?.response?.status === 413) {
                        const sizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(1);
                        setError(`Resume downloaded, but the PDF is ${sizeMB} MB and the upload limit is ${MAX_RESUME_UPLOAD_LABEL}.`);
                    } else {
                        setError('Resume downloaded, but saving it to your profile failed. Please try saving again.');
                    }
                }
            }
        } catch (err) {
            console.error(err);
            if (err instanceof Error && err.message.includes('Resume preview')) {
                setError(err.message);
            } else {
                setError('Failed to generate resume. Please try again.');
            }
        } finally {
            setGenerating(false);
            setSaving(false);
        }
    };

    return {
        formData, setFormData, success, error, setError, setSuccess,
        generating, saving, handleChange,
        handleExperienceChange: (i, f, v) => handleArrayChange('experiences', i, f, v),
        handleEducationChange:  (i, f, v) => handleArrayChange('education', i, f, v),
        handleProjectChange:    (i, f, v) => handleArrayChange('projects', i, f, v),
        addExperience:    () => addArrayItem('experiences', { company: '', role: '', duration: '', description: '' }),
        removeExperience: (i) => removeArrayItem('experiences', i),
        addEducation:     () => addArrayItem('education', { institution: '', degree: '', year: '', grade: '' }),
        removeEducation:  (i) => removeArrayItem('education', i),
        addProject:       () => addArrayItem('projects', { name: '', description: '', tech: '' }),
        removeProject:    (i) => removeArrayItem('projects', i),
        handleGenerate,
    };
}

export function usePreviewState() {
    const [previewState, setPreviewState] = useState({
        isFloating: false,
        isMinimized: false,
        position: { x: 0, y: 0 },
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    });

    useEffect(() => {
        if (!previewState.isDragging) return;
        const handleMouseMove = (e) => {
            setPreviewState(prev => ({
                ...prev,
                position: {
                    x: e.clientX - prev.dragStart.x,
                    y: e.clientY - prev.dragStart.y
                }
            }));
        };
        const handleMouseUp = () => {
            setPreviewState(prev => ({ ...prev, isDragging: false }));
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [previewState.isDragging]);

    const handleDragStart = (e) => {
        if (previewState.isMinimized) return;
        setPreviewState(prev => ({
            ...prev,
            isFloating: true,
            isDragging: true,
            dragStart: {
                x: e.clientX - prev.position.x,
                y: e.clientY - prev.position.y
            }
        }));
    };

    return { previewState, setPreviewState, handleDragStart };
}

export const SECTIONS = [
    { key: 'personal',        label: '👤 Personal'      },
    { key: 'summary',         label: '📝 Summary'        },
    { key: 'experience',      label: '💼 Experience'     },
    { key: 'education',       label: '🎓 Education'      },
    { key: 'skills',          label: '🛠️ Skills'         },
    { key: 'projects',        label: '🚀 Projects'       },
    { key: 'certifications',  label: '🏆 Certifications' },
];

export const INPUT_CLASSES = "w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold";
