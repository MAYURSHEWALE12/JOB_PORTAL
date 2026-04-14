import { useState, useRef, forwardRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { resumeAPI } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export default function ResumeGenerator({ onResumeSaved, guestMode = false }) {
    let auth = null;
    try {
        auth = useAuthStore();
    } catch (e) {
        // useAuthStore might fail if used outside a provider or if we want to be extra safe
    }
    const user = auth?.user;

    const resumeRef = useRef(null);
    const pdfRef = useRef(null);

    const [formData, setFormData] = useState({
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
    });

    const [activeSection, setActiveSection] = useState('personal');
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [generating, setGenerating]       = useState(false);
    const [saving, setSaving]               = useState(false);
    const [success, setSuccess]             = useState('');
    const [error, setError]                 = useState('');
    const [preview, setPreview]             = useState(false);
    
    // --- Draggable & Minimizable Preview State ---
    const [previewState, setPreviewState] = useState({
        isFloating: false,
        isMinimized: false,
        position: { x: 0, y: 0 },
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    });

    // Cleanup dragging listeners
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
        if (previewState.isMinimized) return; // Optional: allow dragging minimized?
        
        // Only float if they start dragging or explicitly unpin
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleExperienceChange = (index, field, value) => {
        const updated = [...formData.experiences];
        updated[index][field] = value;
        setFormData({ ...formData, experiences: updated });
    };

    const addExperience = () => {
        setFormData({
            ...formData,
            experiences: [...formData.experiences, { company: '', role: '', duration: '', description: '' }]
        });
    };

    const removeExperience = (index) => {
        const updated = formData.experiences.filter((_, i) => i !== index);
        setFormData({ ...formData, experiences: updated });
    };

    const handleEducationChange = (index, field, value) => {
        const updated = [...formData.education];
        updated[index][field] = value;
        setFormData({ ...formData, education: updated });
    };

    const addEducation = () => {
        setFormData({
            ...formData,
            education: [...formData.education, { institution: '', degree: '', year: '', grade: '' }]
        });
    };

    const removeEducation = (index) => {
        const updated = formData.education.filter((_, i) => i !== index);
        setFormData({ ...formData, education: updated });
    };

    const handleProjectChange = (index, field, value) => {
        const updated = [...formData.projects];
        updated[index][field] = value;
        setFormData({ ...formData, projects: updated });
    };

    const addProject = () => {
        setFormData({
            ...formData,
            projects: [...formData.projects, { name: '', description: '', tech: '' }]
        });
    };

    const removeProject = (index) => {
        const updated = formData.projects.filter((_, i) => i !== index);
        setFormData({ ...formData, projects: updated });
    };

    const handleGenerate = async (saveToDb = false) => {
        if (!formData.fullName.trim()) {
            setError('Full name is required.');
            return;
        }

        setGenerating(true);
        setError('');
        setSuccess('');

        try {
            setPreview(true);
            await new Promise(r => setTimeout(r, 600));

            const canvas = await html2canvas(pdfRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData    = canvas.toDataURL('image/png');
            const pdf        = new jsPDF('p', 'mm', 'a4');
            const pdfWidth   = pdf.internal.pageSize.getWidth();
            const pdfHeight  = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft   = pdfHeight;
            let position     = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${formData.resumeName || 'Resume'}.pdf`);
            setSuccess('✅ Resume downloaded successfully!');

            if (saveToDb && !guestMode && user) {
                setSaving(true);
                const pdfBlob = pdf.output('blob');
                const file    = new File([pdfBlob], `${formData.resumeName}.pdf`, {
                    type: 'application/pdf'
                });
                await resumeAPI.upload(user.id, file, formData.resumeName);
                setSuccess('✅ Resume downloaded and saved to your profile!');
                if (onResumeSaved) onResumeSaved();
            }

        } catch (err) {
            console.error(err);
            setError('Failed to generate resume. Please try again.');
        } finally {
            setGenerating(false);
            setSaving(false);
        }
    };

    const sections = [
        { key: 'personal',        label: '👤 Personal'      },
        { key: 'summary',         label: '📝 Summary'        },
        { key: 'experience',      label: '💼 Experience'     },
        { key: 'education',       label: '🎓 Education'      },
        { key: 'skills',          label: '🛠️ Skills'         },
        { key: 'projects',        label: '🚀 Projects'       },
        { key: 'certifications',  label: '🏆 Certifications' },
    ];

    const inputClasses = "w-full px-4 py-2.5 border-[3px] border-stone-900 dark:border-stone-700 rounded-none focus:outline-none focus:border-orange-500 focus:shadow-[3px_3px_0_#ea580c] transition-all text-sm bg-white dark:bg-stone-900 dark:text-white shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] font-bold";

    const TemplatePreview = selectedTemplate === 'modern' ? ModernTemplate : ProfessionalTemplate;

    return (
        <div>
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="mb-6">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 uppercase tracking-tight">📄 Resume Generator</h2>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1 font-bold uppercase tracking-widest">
                    Pick a template, fill your details, generate a PDF
                </p>
            </div>

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

            {/* ── Template Selector ─────────────────────────────────── */}
            <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] p-5 mb-5">
                <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-widest mb-4">🎨 Choose Template</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Modern Template Card */}
                    <button
                        onClick={() => setSelectedTemplate('modern')}
                        className={`relative p-4 border-[3px] transition-all text-left
                            ${selectedTemplate === 'modern'
                                ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[6px_6px_0_#ea580c] -translate-y-1'
                                : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#ea580c]'}`}
                    >
                        {selectedTemplate === 'modern' && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-stone-900 text-xs font-black px-2 py-0.5 border-[2px] border-stone-900 shadow-[2px_2px_0_#1c1917]">
                                SELECTED
                            </div>
                        )}
                        {/* Mini preview */}
                        <div className="border-[2px] border-stone-300 dark:border-stone-600 p-3 mb-3 bg-white" style={{ height: '120px', overflow: 'hidden' }}>
                            <div style={{ borderBottom: '2px solid #ea580c', paddingBottom: '4px', marginBottom: '6px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1c1917' }}>John Doe</div>
                                <div style={{ fontSize: '6px', color: '#6b7280' }}>email@mail.com • 9876543210</div>
                            </div>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1px solid #fed7aa', paddingBottom: '2px', marginBottom: '3px' }}>SUMMARY</div>
                            <div style={{ fontSize: '5px', color: '#374151', lineHeight: '1.3' }}>Experienced developer with expertise in modern technologies...</div>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1px solid #fed7aa', paddingBottom: '2px', marginBottom: '3px', marginTop: '4px' }}>SKILLS</div>
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                {['React','Node','SQL'].map(s => (
                                    <span key={s} style={{ fontSize: '5px', background: '#fed7aa', color: '#c2410c', padding: '1px 4px', border: '1px solid #1c1917' }}>{s}</span>
                                ))}
                            </div>
                        </div>
                        <h4 className="font-black text-stone-900 dark:text-gray-100 text-sm uppercase tracking-tight">🔶 Modern</h4>
                        <p className="text-stone-500 dark:text-stone-400 text-xs font-bold mt-0.5">Orange accent, pill-style skills</p>
                    </button>

                    {/* Professional Template Card */}
                    <button
                        onClick={() => setSelectedTemplate('professional')}
                        className={`relative p-4 border-[3px] transition-all text-left
                            ${selectedTemplate === 'professional'
                                ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[6px_6px_0_#ea580c] -translate-y-1'
                                : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#ea580c]'}`}
                    >
                        {selectedTemplate === 'professional' && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-stone-900 text-xs font-black px-2 py-0.5 border-[2px] border-stone-900 shadow-[2px_2px_0_#1c1917]">
                                SELECTED
                            </div>
                        )}
                        {/* Mini preview */}
                        <div className="border-[2px] border-stone-300 dark:border-stone-600 p-3 mb-3 bg-white" style={{ height: '120px', overflow: 'hidden' }}>
                            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', letterSpacing: '2px' }}>John Doe</div>
                                <div style={{ fontSize: '7px', color: '#555', fontStyle: 'italic' }}>Data Analyst</div>
                                <div style={{ fontSize: '5px', color: '#555', marginTop: '2px' }}>📞 9876543210 &nbsp; ✉ email@mail.com &nbsp; 🔗 linkedin.com</div>
                            </div>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#000', borderBottom: '1.5px solid #000', paddingBottom: '1px', marginBottom: '3px' }}>Summary</div>
                            <div style={{ fontSize: '5px', color: '#3b3b3b', lineHeight: '1.3' }}>Data Analyst with a strong foundation in SQL, Python...</div>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#000', borderBottom: '1.5px solid #000', paddingBottom: '1px', marginBottom: '3px', marginTop: '4px' }}>Skills</div>
                            <div style={{ fontSize: '5px', color: '#3b3b3b' }}><strong>Languages:</strong> SQL, Python &nbsp; <strong>Tools:</strong> Power BI, Excel</div>
                        </div>
                        <h4 className="font-black text-stone-900 dark:text-gray-100 text-sm uppercase tracking-tight">⚫ Professional</h4>
                        <p className="text-stone-500 dark:text-stone-400 text-xs font-bold mt-0.5">Black & white, classic ATS-friendly</p>
                    </button>
                </div>
            </div>

            <div className="flex gap-6">

                {/* ── Form ──────────────────────────────────────────── */}
                <div className="flex-1">

                    {/* Resume Name */}
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] p-5 mb-4">
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-2">
                            Resume Name
                        </label>
                        <input
                            type="text"
                            name="resumeName"
                            value={formData.resumeName}
                            onChange={handleChange}
                            placeholder="e.g. Software Engineer Resume"
                            className={inputClasses + ' placeholder:font-normal'}
                        />
                    </div>

                    {/* Section Tabs */}
                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] overflow-hidden mb-4">
                        <div className="flex overflow-x-auto border-b-[3px] border-stone-900 dark:border-stone-700">
                            {sections.map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setActiveSection(s.key)}
                                    className={`px-4 py-3 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-[3px] -mb-[3px]
                                        ${activeSection === s.key
                                            ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-stone-900'
                                            : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">

                            {/* Personal Info */}
                            {activeSection === 'personal' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Full Name *</label>
                                            <input type="text" name="fullName" value={formData.fullName}
                                                onChange={handleChange} placeholder="John Doe"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Email *</label>
                                            <input type="email" name="email" value={formData.email}
                                                onChange={handleChange} placeholder="john@example.com"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Phone</label>
                                            <input type="tel" name="phone" value={formData.phone}
                                                onChange={handleChange} placeholder="9876543210"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Location</label>
                                            <input type="text" name="location" value={formData.location}
                                                onChange={handleChange} placeholder="Pune, Maharashtra"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">LinkedIn</label>
                                            <input type="text" name="linkedin" value={formData.linkedin}
                                                onChange={handleChange} placeholder="linkedin.com/in/yourprofile"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Portfolio / GitHub</label>
                                            <input type="text" name="portfolio" value={formData.portfolio}
                                                onChange={handleChange} placeholder="github.com/yourprofile"
                                                className={inputClasses + ' placeholder:font-normal'} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            {activeSection === 'summary' && (
                                <div>
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">
                                        Professional Summary
                                    </label>
                                    <textarea
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder="Write a brief summary about yourself..."
                                        className={inputClasses + ' resize-none placeholder:font-normal'}
                                    />
                                </div>
                            )}

                            {/* Experience */}
                            {activeSection === 'experience' && (
                                <div className="space-y-5">
                                    {formData.experiences.map((exp, i) => (
                                        <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">
                                                    Experience {i + 1}
                                                </h4>
                                                {formData.experiences.length > 1 && (
                                                    <button onClick={() => removeExperience(i)}
                                                        className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">
                                                        ✕ Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Company</label>
                                                    <input type="text" value={exp.company}
                                                        onChange={(e) => handleExperienceChange(i, 'company', e.target.value)}
                                                        placeholder="Google" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Role</label>
                                                    <input type="text" value={exp.role}
                                                        onChange={(e) => handleExperienceChange(i, 'role', e.target.value)}
                                                        placeholder="Software Engineer" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Duration</label>
                                                    <input type="text" value={exp.duration}
                                                        onChange={(e) => handleExperienceChange(i, 'duration', e.target.value)}
                                                        placeholder="Jan 2022 - Present" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Description</label>
                                                    <textarea value={exp.description}
                                                        onChange={(e) => handleExperienceChange(i, 'description', e.target.value)}
                                                        rows={2} placeholder="Key responsibilities..."
                                                        className={inputClasses + ' resize-none placeholder:font-normal'} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addExperience}
                                        className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                                        + Add Experience
                                    </button>
                                </div>
                            )}

                            {/* Education */}
                            {activeSection === 'education' && (
                                <div className="space-y-5">
                                    {formData.education.map((edu, i) => (
                                        <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">Education {i + 1}</h4>
                                                {formData.education.length > 1 && (
                                                    <button onClick={() => removeEducation(i)}
                                                        className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">
                                                        ✕ Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Institution</label>
                                                    <input type="text" value={edu.institution}
                                                        onChange={(e) => handleEducationChange(i, 'institution', e.target.value)}
                                                        placeholder="MIT" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Degree</label>
                                                    <input type="text" value={edu.degree}
                                                        onChange={(e) => handleEducationChange(i, 'degree', e.target.value)}
                                                        placeholder="B.Tech Computer Science" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Year</label>
                                                    <input type="text" value={edu.year}
                                                        onChange={(e) => handleEducationChange(i, 'year', e.target.value)}
                                                        placeholder="2020 - 2024" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Grade / CGPA</label>
                                                    <input type="text" value={edu.grade}
                                                        onChange={(e) => handleEducationChange(i, 'grade', e.target.value)}
                                                        placeholder="8.5 CGPA" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addEducation}
                                        className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                                        + Add Education
                                    </button>
                                </div>
                            )}

                            {/* Skills */}
                            {activeSection === 'skills' && (
                                <div>
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">
                                        Skills
                                        <span className="text-stone-400 font-bold ml-1">(comma separated)</span>
                                    </label>
                                    <textarea
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Java, Spring Boot, React, MySQL, Docker..."
                                        className={inputClasses + ' resize-none placeholder:font-normal'}
                                    />
                                </div>
                            )}

                            {/* Projects */}
                            {activeSection === 'projects' && (
                                <div className="space-y-5">
                                    {formData.projects.map((proj, i) => (
                                        <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">Project {i + 1}</h4>
                                                {formData.projects.length > 1 && (
                                                    <button onClick={() => removeProject(i)}
                                                        className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">
                                                        ✕ Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Project Name</label>
                                                    <input type="text" value={proj.name}
                                                        onChange={(e) => handleProjectChange(i, 'name', e.target.value)}
                                                        placeholder="Job Portal" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Description</label>
                                                    <textarea value={proj.description}
                                                        onChange={(e) => handleProjectChange(i, 'description', e.target.value)}
                                                        rows={2} placeholder="Brief description..."
                                                        className={inputClasses + ' resize-none placeholder:font-normal'} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Tech Stack</label>
                                                    <input type="text" value={proj.tech}
                                                        onChange={(e) => handleProjectChange(i, 'tech', e.target.value)}
                                                        placeholder="React, Spring Boot, MySQL" className={inputClasses + ' placeholder:font-normal'} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addProject}
                                        className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                                        + Add Project
                                    </button>
                                </div>
                            )}

                            {/* Certifications */}
                            {activeSection === 'certifications' && (
                                <div>
                                    <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">
                                        Certifications
                                    </label>
                                    <textarea
                                        name="certifications"
                                        value={formData.certifications}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder={"AWS Certified Developer - 2023\nGoogle Cloud Professional - 2022\n..."}
                                        className={inputClasses + ' resize-none placeholder:font-normal'}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleGenerate(false)}
                            disabled={generating}
                            className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1c1917] transition-all disabled:opacity-50"
                        >
                            {generating ? 'Generating...' : guestMode ? '⬇️ Download Resume PDF' : '⬇️ Download Only'}
                        </button>
                        {!guestMode && (
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={generating || saving}
                                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-1 transition-all"
                            >
                                {saving ? 'Saving...' : generating ? 'Generating...' : '💾 Download & Save'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Live Preview ───────────────────────────────────── */}
                <div className={`${previewState.isFloating ? '' : 'hidden lg:block w-96 flex-shrink-0'}`}>
                    <div 
                        className={`
                            ${previewState.isFloating 
                                ? 'fixed z-[100] shadow-[12px_12px_0_#000] transition-shadow duration-200' 
                                : 'sticky top-4 hidden lg:block'}
                            bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700
                        `}
                        style={previewState.isFloating ? {
                            left: `${previewState.position.x}px`,
                            top: `${previewState.position.y}px`,
                            width: '384px'
                        } : {}}
                    >
                        {/* Draggable Header */}
                        <div 
                            onMouseDown={handleDragStart}
                            className={`flex justify-between items-center px-4 py-2 border-b-[3px] border-stone-900 dark:border-stone-700 select-none
                                ${previewState.isDragging ? 'cursor-grabbing' : 'cursor-grab'} bg-stone-50 dark:bg-stone-900`}
                        >
                            <h3 className="font-black text-stone-900 dark:text-gray-100 text-xs uppercase tracking-widest flex items-center gap-2">
                                👁️ Live Preview
                                {previewState.isFloating && <span className="bg-orange-500 text-white text-[8px] px-1 py-0.5">FLOATING</span>}
                            </h3>
                            <div className="flex items-center gap-1">
                                {/* Reset Position */}
                                {previewState.isFloating && (
                                    <button 
                                        onClick={() => setPreviewState(prev => ({ ...prev, isFloating: false, position: { x: 0, y: 0 } }))}
                                        className="w-6 h-6 flex items-center justify-center border-[2px] border-stone-900 hover:bg-stone-200 dark:hover:bg-stone-700 text-[10px]"
                                        title="Pin to Sidebar"
                                    >
                                        📌
                                    </button>
                                )}
                                {/* Minimize/Maximize */}
                                <button 
                                    onClick={() => setPreviewState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))}
                                    className="w-6 h-6 flex items-center justify-center border-[2px] border-stone-900 hover:bg-stone-200 dark:hover:bg-stone-700 text-[10px]"
                                >
                                    {previewState.isMinimized ? '□' : '—'}
                                </button>
                            </div>
                        </div>

                        {/* Preview Body */}
                        {!previewState.isMinimized && (
                            <div className="bg-white overflow-hidden relative"
                                 style={{ width: '378px', height: '543px' }}>
                                <div style={{ transform: 'scale(0.476)', transformOrigin: 'top left', width: '794px', position: 'absolute', top: 0, left: 0 }}>
                                    <TemplatePreview formData={formData} ref={resumeRef} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden full-size preview for PDF generation */}
            {preview && (
                <div className="fixed -left-[9999px] -top-[9999px]">
                    <TemplatePreview formData={formData} ref={pdfRef} />
                </div>
            )}
        </div>
    );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TEMPLATE 1: MODERN (Orange Accent)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ModernTemplate = forwardRef(({ formData }, ref) => {
    const skills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const certs = formData.certifications
        ? formData.certifications.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

    return (
        <div ref={ref} style={{
            width: '794px',
            minHeight: '1123px',
            padding: '48px',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '13px',
            color: '#1a1a1a',
            backgroundColor: '#ffffff',
            lineHeight: '1.5',
        }}>
            {/* Header */}
            <div style={{ borderBottom: '3px solid #ea580c', paddingBottom: '16px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1c1917', margin: 0 }}>
                    {formData.fullName || 'Your Name'}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', color: '#4b5563', fontSize: '12px' }}>
                    {formData.email    && <span>✉ {formData.email}</span>}
                    {formData.phone    && <span>📞 {formData.phone}</span>}
                    {formData.location && <span>📍 {formData.location}</span>}
                    {formData.linkedin && <span>🔗 {formData.linkedin}</span>}
                    {formData.portfolio && <span>💻 {formData.portfolio}</span>}
                </div>
            </div>

            {formData.summary && (
                <ModernSection title="Professional Summary">
                    <p style={{ color: '#374151', margin: 0 }}>{formData.summary}</p>
                </ModernSection>
            )}

            {formData.experiences.some(e => e.company || e.role) && (
                <ModernSection title="Work Experience">
                    {formData.experiences.map((exp, i) => (
                        exp.company || exp.role ? (
                            <div key={i} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1c1917' }}>{exp.role}</div>
                                        <div style={{ color: '#ea580c', fontSize: '13px' }}>{exp.company}</div>
                                    </div>
                                    {exp.duration && <div style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{exp.duration}</div>}
                                </div>
                                {exp.description && <p style={{ color: '#374151', marginTop: '4px', marginBottom: 0 }}>{exp.description}</p>}
                            </div>
                        ) : null
                    ))}
                </ModernSection>
            )}

            {formData.education.some(e => e.institution || e.degree) && (
                <ModernSection title="Education">
                    {formData.education.map((edu, i) => (
                        edu.institution || edu.degree ? (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1c1917' }}>{edu.degree}</div>
                                        <div style={{ color: '#ea580c' }}>{edu.institution}</div>
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '12px', textAlign: 'right' }}>
                                        {edu.year && <div>{edu.year}</div>}
                                        {edu.grade && <div>{edu.grade}</div>}
                                    </div>
                                </div>
                            </div>
                        ) : null
                    ))}
                </ModernSection>
            )}

            {skills.length > 0 && (
                <ModernSection title="Skills">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {skills.map((skill, i) => (
                            <span key={i} style={{ background: '#fed7aa', color: '#c2410c', padding: '3px 10px', fontSize: '12px', fontWeight: '600', border: '2px solid #1c1917' }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </ModernSection>
            )}

            {formData.projects.some(p => p.name) && (
                <ModernSection title="Projects">
                    {formData.projects.map((proj, i) => (
                        proj.name ? (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1c1917' }}>
                                    {proj.name}
                                    {proj.tech && <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>({proj.tech})</span>}
                                </div>
                                {proj.description && <p style={{ color: '#374151', marginTop: '3px', marginBottom: 0 }}>{proj.description}</p>}
                            </div>
                        ) : null
                    ))}
                </ModernSection>
            )}

            {certs.length > 0 && (
                <ModernSection title="Certifications">
                    {certs.map((cert, i) => (
                        <div key={i} style={{ color: '#374151', marginBottom: '4px' }}>• {cert}</div>
                    ))}
                </ModernSection>
            )}
        </div>
    );
});

function ModernSection({ title, children }) {
    return (
        <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1.5px solid #fed7aa', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TEMPLATE 2: PROFESSIONAL (Pure Black & White – ATS-Friendly)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ProfessionalTemplate = forwardRef(({ formData }, ref) => {
    const skills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const certs = formData.certifications
        ? formData.certifications.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

    const BLACK = '#000000';
    const DARK  = '#1a1a1a';
    const GRAY  = '#3b3b3b';
    const MID   = '#555555';

    return (
        <div ref={ref} style={{
            width: '794px',
            minHeight: '1123px',
            padding: '44px 52px',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: '12.5px',
            color: DARK,
            backgroundColor: '#ffffff',
            lineHeight: '1.55',
        }}>
            {/* ── Header (centered) ─────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: `2px solid ${BLACK}` }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: BLACK, margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>
                    {formData.fullName || 'Your Name'}
                </h1>
                {formData.summary && (
                    <div style={{ color: GRAY, fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>
                        {formData.summary.split('.')[0]?.trim() || ''}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '8px', color: MID, fontSize: '11px' }}>
                    {formData.phone    && <span>📞 +91-{formData.phone}</span>}
                    {formData.email    && <span>✉ {formData.email}</span>}
                    {formData.linkedin && <span>🔗 {formData.linkedin}</span>}
                    {formData.portfolio && <span>💻 {formData.portfolio}</span>}
                    {formData.location && <span>📍 {formData.location}</span>}
                </div>
            </div>

            {/* ── Summary ────────────────────────────────────────────── */}
            {formData.summary && (
                <ProSection title="Summary">
                    <p style={{ color: GRAY, margin: 0, textAlign: 'justify' }}>{formData.summary}</p>
                </ProSection>
            )}

            {/* ── Skills ─────────────────────────────────────────────── */}
            {skills.length > 0 && (
                <ProSection title="Skills">
                    <div style={{ color: GRAY }}>
                        <div style={{ marginBottom: '3px' }}>
                            <span style={{ fontWeight: 'bold', color: BLACK }}>Technical Skills: </span>
                            {skills.join(', ')}
                        </div>
                    </div>
                </ProSection>
            )}

            {/* ── Experience ─────────────────────────────────────────── */}
            {formData.experiences.some(e => e.company || e.role) && (
                <ProSection title="Experience">
                    {formData.experiences.map((exp, i) => (
                        exp.company || exp.role ? (
                            <div key={i} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '13.5px', color: BLACK }}>{exp.role}</span>
                                    </div>
                                    {exp.duration && (
                                        <div style={{ color: DARK, fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                            {exp.duration}
                                        </div>
                                    )}
                                </div>
                                <div style={{ color: MID, fontSize: '12px', fontStyle: 'italic', marginBottom: '4px' }}>
                                    {exp.company}
                                </div>
                                {exp.description && (
                                    <div style={{ color: GRAY, paddingLeft: '12px' }}>
                                        {exp.description.split('\n').map((line, li) => (
                                            <div key={li} style={{ marginBottom: '2px' }}>
                                                {line.trim().startsWith('–') || line.trim().startsWith('-') ? line.trim() : `– ${line.trim()}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null
                    ))}
                </ProSection>
            )}

            {/* ── Projects ───────────────────────────────────────────── */}
            {formData.projects.some(p => p.name) && (
                <ProSection title="Projects">
                    {formData.projects.map((proj, i) => (
                        proj.name ? (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: BLACK }}>{proj.name}</span>
                                        {proj.tech && (
                                            <span style={{ color: MID, fontStyle: 'italic', marginLeft: '8px', fontSize: '12px' }}>
                                                | {proj.tech}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {proj.description && (
                                    <div style={{ color: GRAY, paddingLeft: '12px', marginTop: '2px' }}>
                                        {proj.description.split('\n').map((line, li) => (
                                            <div key={li} style={{ marginBottom: '2px' }}>
                                                {line.trim().startsWith('–') || line.trim().startsWith('-') ? line.trim() : `– ${line.trim()}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null
                    ))}
                </ProSection>
            )}

            {/* ── Certifications ─────────────────────────────────────── */}
            {certs.length > 0 && (
                <ProSection title="Awards & Certifications">
                    {certs.map((cert, i) => (
                        <div key={i} style={{ color: GRAY, marginBottom: '3px', paddingLeft: '12px' }}>
                            • <span style={{ fontWeight: '600', color: BLACK }}>{cert}</span>
                        </div>
                    ))}
                </ProSection>
            )}

            {/* ── Education ──────────────────────────────────────────── */}
            {formData.education.some(e => e.institution || e.degree) && (
                <ProSection title="Education">
                    {formData.education.map((edu, i) => (
                        edu.institution || edu.degree ? (
                            <div key={i} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: BLACK }}>{edu.degree}</span>
                                    </div>
                                    <div style={{ color: DARK, fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {edu.year && <span>{edu.year}</span>}
                                    </div>
                                </div>
                                <div style={{ color: MID, fontStyle: 'italic', fontSize: '12px' }}>
                                    {edu.institution}
                                    {edu.grade && <span style={{ color: GRAY, fontStyle: 'normal', marginLeft: '16px' }}>CGPA: {edu.grade}</span>}
                                </div>
                            </div>
                        ) : null
                    ))}
                </ProSection>
            )}
        </div>
    );
});

function ProSection({ title, children }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <h2 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000000',
                borderBottom: '2px solid #000000',
                paddingBottom: '3px',
                marginBottom: '8px',
                textTransform: 'capitalize',
            }}>
                {title}
            </h2>
            {children}
        </div>
    );
}
