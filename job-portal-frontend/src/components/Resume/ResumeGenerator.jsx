import { useState, useRef } from 'react';
import { useResumeForm, usePreviewState, SECTIONS, INPUT_CLASSES } from './useResumeForm';
import { ModernTemplate, ProfessionalTemplate } from './ResumeTemplates';

export default function ResumeGenerator({ onResumeSaved, guestMode = false }) {
    const resumeRef = useRef(null);
    const pdfRef = useRef(null);
    const {
        formData, success, error, generating, saving, handleChange,
        handleExperienceChange, handleEducationChange, handleProjectChange,
        addExperience, removeExperience, addEducation, removeEducation,
        addProject, removeProject, handleGenerate,
    } = useResumeForm(guestMode);
    const { previewState, setPreviewState, handleDragStart } = usePreviewState();
    const [activeSection, setActiveSection] = useState('personal');
    const [selectedTemplate, setSelectedTemplate] = useState('modern');

    const TemplatePreview = selectedTemplate === 'modern' ? ModernTemplate : ProfessionalTemplate;

    return (
        <div>
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

            <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />

            <div className="flex gap-6">
                <div className="flex-1">
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
                            className={INPUT_CLASSES + ' placeholder:font-normal'}
                        />
                    </div>

                    <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[6px_6px_0_#1c1917] dark:shadow-[6px_6px_0_#000] overflow-hidden mb-4">
                        <div className="flex overflow-x-auto border-b-[3px] border-stone-900 dark:border-stone-700">
                            {SECTIONS.map(s => (
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
                            <FormSection
                                active={activeSection}
                                formData={formData}
                                handleChange={handleChange}
                                handleExperienceChange={handleExperienceChange}
                                handleEducationChange={handleEducationChange}
                                handleProjectChange={handleProjectChange}
                                addExperience={addExperience}
                                removeExperience={removeExperience}
                                addEducation={addEducation}
                                removeEducation={removeEducation}
                                addProject={addProject}
                                removeProject={removeProject}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleGenerate(false, onResumeSaved, resumeRef, pdfRef)}
                            disabled={generating}
                            className="flex-1 bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 text-stone-900 dark:text-white font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#1c1917] transition-all disabled:opacity-50"
                        >
                            {generating ? 'Generating...' : guestMode ? '⬇️ Download Resume PDF' : '⬇️ Download Only'}
                        </button>
                        {!guestMode && (
                            <button
                                onClick={() => handleGenerate(true, onResumeSaved, resumeRef, pdfRef)}
                                disabled={generating || saving}
                                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-stone-300 text-stone-900 border-[3px] border-stone-900 dark:border-stone-700 font-black uppercase tracking-widest py-3 shadow-[4px_4px_0_#1c1917] hover:shadow-[6px_6px_0_#1c1917] hover:-translate-y-1 transition-all"
                            >
                                {saving ? 'Saving...' : generating ? 'Generating...' : '💾 Download & Save'}
                            </button>
                        )}
                    </div>
                </div>

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
                                {previewState.isFloating && (
                                    <button
                                        onClick={() => setPreviewState(prev => ({ ...prev, isFloating: false, position: { x: 0, y: 0 } }))}
                                        className="w-6 h-6 flex items-center justify-center border-[2px] border-stone-900 hover:bg-stone-200 dark:hover:bg-stone-700 text-[10px]"
                                        title="Pin to Sidebar"
                                    >
                                        📌
                                    </button>
                                )}
                                <button
                                    onClick={() => setPreviewState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))}
                                    className="w-6 h-6 flex items-center justify-center border-[2px] border-stone-900 hover:bg-stone-200 dark:hover:bg-stone-700 text-[10px]"
                                >
                                    {previewState.isMinimized ? '□' : '—'}
                                </button>
                            </div>
                        </div>

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

            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    left: '-10000px',
                    top: '0',
                    pointerEvents: 'none',
                }}
            >
                <TemplatePreview formData={formData} ref={pdfRef} />
            </div>
        </div>
    );
}

function TemplateSelector({ selected, onSelect }) {
    return (
        <div className="bg-white dark:bg-stone-800 border-[3px] border-stone-900 dark:border-stone-700 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] p-5 mb-5">
            <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-widest mb-4">🎨 Choose Template</h3>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onSelect('modern')}
                    className={`relative p-4 border-[3px] transition-all text-left
                        ${selected === 'modern'
                            ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[6px_6px_0_#ea580c] -translate-y-1'
                            : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#ea580c]'}`}
                >
                    {selected === 'modern' && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-stone-900 text-xs font-black px-2 py-0.5 border-[2px] border-stone-900 shadow-[2px_2px_0_#1c1917]">
                            SELECTED
                        </div>
                    )}
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

                <button
                    onClick={() => onSelect('professional')}
                    className={`relative p-4 border-[3px] transition-all text-left
                        ${selected === 'professional'
                            ? 'border-orange-500 bg-orange-50 dark:bg-stone-700 shadow-[6px_6px_0_#ea580c] -translate-y-1'
                            : 'border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-[4px_4px_0_#1c1917] dark:shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#ea580c]'}`}
                >
                    {selected === 'professional' && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-stone-900 text-xs font-black px-2 py-0.5 border-[2px] border-stone-900 shadow-[2px_2px_0_#1c1917]">
                            SELECTED
                        </div>
                    )}
                    <div className="border-[2px] border-stone-300 dark:border-stone-600 p-3 mb-3 bg-white" style={{ height: '120px', overflow: 'hidden' }}>
                        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase', letterSpacing: '2px' }}>John Doe</div>
                            <div style={{ fontSize: '7px', color: '#555' }}>Data Analyst</div>
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
    );
}

function FormSection({ active, formData, handleChange, handleExperienceChange, handleEducationChange, handleProjectChange, addExperience, removeExperience, addEducation, removeEducation, addProject, removeProject }) {
    const ic = INPUT_CLASSES;

    if (active === 'personal') {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Full Name *</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" className={ic + ' placeholder:font-normal'} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className={ic + ' placeholder:font-normal'} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" className={ic + ' placeholder:font-normal'} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Pune, Maharashtra" className={ic + ' placeholder:font-normal'} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">LinkedIn</label>
                        <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="linkedin.com/in/yourprofile" className={ic + ' placeholder:font-normal'} />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Portfolio / GitHub</label>
                        <input type="text" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="github.com/yourprofile" className={ic + ' placeholder:font-normal'} />
                    </div>
                </div>
            </div>
        );
    }

    if (active === 'summary') {
        return (
            <div>
                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Professional Summary</label>
                <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5} placeholder="Write a brief summary about yourself..." className={ic + ' resize-none placeholder:font-normal'} />
            </div>
        );
    }

    if (active === 'experience') {
        return (
            <div className="space-y-5">
                {formData.experiences.map((exp, i) => (
                    <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">Experience {i + 1}</h4>
                            {formData.experiences.length > 1 && (
                                <button onClick={() => removeExperience(i)} className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">✕ Remove</button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Company</label>
                                <input type="text" value={exp.company} onChange={(e) => handleExperienceChange(i, 'company', e.target.value)} placeholder="Google" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Role</label>
                                <input type="text" value={exp.role} onChange={(e) => handleExperienceChange(i, 'role', e.target.value)} placeholder="Software Engineer" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Duration</label>
                                <input type="text" value={exp.duration} onChange={(e) => handleExperienceChange(i, 'duration', e.target.value)} placeholder="Jan 2022 - Present" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Description</label>
                                <textarea value={exp.description} onChange={(e) => handleExperienceChange(i, 'description', e.target.value)} rows={2} placeholder="Key responsibilities..." className={ic + ' resize-none placeholder:font-normal'} />
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addExperience} className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                    + Add Experience
                </button>
            </div>
        );
    }

    if (active === 'education') {
        return (
            <div className="space-y-5">
                {formData.education.map((edu, i) => (
                    <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">Education {i + 1}</h4>
                            {formData.education.length > 1 && (
                                <button onClick={() => removeEducation(i)} className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">✕ Remove</button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Institution</label>
                                <input type="text" value={edu.institution} onChange={(e) => handleEducationChange(i, 'institution', e.target.value)} placeholder="MIT" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Degree</label>
                                <input type="text" value={edu.degree} onChange={(e) => handleEducationChange(i, 'degree', e.target.value)} placeholder="B.Tech Computer Science" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Year</label>
                                <input type="text" value={edu.year} onChange={(e) => handleEducationChange(i, 'year', e.target.value)} placeholder="2020 - 2024" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Grade / CGPA</label>
                                <input type="text" value={edu.grade} onChange={(e) => handleEducationChange(i, 'grade', e.target.value)} placeholder="8.5 CGPA" className={ic + ' placeholder:font-normal'} />
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addEducation} className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                    + Add Education
                </button>
            </div>
        );
    }

    if (active === 'skills') {
        return (
            <div>
                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">
                    Skills <span className="text-stone-400 font-bold ml-1">(comma separated)</span>
                </label>
                <textarea name="skills" value={formData.skills} onChange={handleChange} rows={4} placeholder="Java, Spring Boot, React, MySQL, Docker..." className={ic + ' resize-none placeholder:font-normal'} />
            </div>
        );
    }

    if (active === 'projects') {
        return (
            <div className="space-y-5">
                {formData.projects.map((proj, i) => (
                    <div key={i} className="bg-stone-50 dark:bg-stone-900 border-[3px] border-stone-900 dark:border-stone-700 shadow-[3px_3px_0_#1c1917] dark:shadow-[3px_3px_0_#000] p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm uppercase tracking-tight">Project {i + 1}</h4>
                            {formData.projects.length > 1 && (
                                <button onClick={() => removeProject(i)} className="text-rose-500 hover:text-rose-600 text-xs font-black uppercase">✕ Remove</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Project Name</label>
                                <input type="text" value={proj.name} onChange={(e) => handleProjectChange(i, 'name', e.target.value)} placeholder="Job Portal" className={ic + ' placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Description</label>
                                <textarea value={proj.description} onChange={(e) => handleProjectChange(i, 'description', e.target.value)} rows={2} placeholder="Brief description..." className={ic + ' resize-none placeholder:font-normal'} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">Tech Stack</label>
                                <input type="text" value={proj.tech} onChange={(e) => handleProjectChange(i, 'tech', e.target.value)} placeholder="React, Spring Boot, MySQL" className={ic + ' placeholder:font-normal'} />
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addProject} className="w-full py-2.5 border-[3px] border-dashed border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-black uppercase tracking-wider transition">
                    + Add Project
                </button>
            </div>
        );
    }

    if (active === 'certifications') {
        return (
            <div>
                <label className="block text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest mb-1">Certifications</label>
                <textarea name="certifications" value={formData.certifications} onChange={handleChange} rows={5} placeholder={"AWS Certified Developer - 2023\nGoogle Cloud Professional - 2022\n..."} className={ic + ' resize-none placeholder:font-normal'} />
            </div>
        );
    }

    return null;
}
