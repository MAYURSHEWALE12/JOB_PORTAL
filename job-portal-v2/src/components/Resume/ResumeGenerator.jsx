import { useState, useRef, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { resumeAPI } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function ResumeGenerator({ onResumeSaved, guestMode = false }) {
    let auth = null;
    try { auth = useAuthStore(); } catch (e) {}
    const user = auth?.user;

    const resumeRef = useRef(null);
    const pdfRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        phone: user?.phone || '',
        location: '', linkedin: '', portfolio: '',
        resumeName: 'My Resume',
        summary: '',
        experiences: [{ company: '', role: '', duration: '', description: '' }],
        education: [{ institution: '', degree: '', year: '', grade: '' }],
        skills: '',
        projects: [{ name: '', description: '', tech: '' }],
        certifications: '',
    });

    const [activeSection, setActiveSection] = useState('personal');
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleListChange = (listName, index, field, value) => {
        const updated = [...formData[listName]];
        updated[index][field] = value;
        setFormData({ ...formData, [listName]: updated });
    };

    const addItem = (listName, template) => {
        setFormData({ ...formData, [listName]: [...formData[listName], template] });
    };

    const removeItem = (listName, index) => {
        if (formData[listName].length > 1) {
            const updated = formData[listName].filter((_, i) => i !== index);
            setFormData({ ...formData, [listName]: updated });
        }
    };

    const handleGenerate = async (saveToDb = false) => {
        if (!formData.fullName.trim()) { setError('Full name is required to generate a profile.'); return; }
        setGenerating(true);
        setError('');
        setSuccess('');

        try {
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${formData.resumeName || 'HireHub_Resume'}.pdf`);
            setSuccess('Resume downloaded!');
        } catch (err) {
            setError('System error during export. Please check your data.');
        } finally {
            setGenerating(false);
            setSaving(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleSaveToVault = async () => {
        if (!formData.fullName.trim()) { setError('Full name is required.'); return; }
        if (!user?.id) { setError('Please login to save resume.'); return; }
        
        setGenerating(true);
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${formData.resumeName || 'HireHub_Resume'}.pdf`);
            
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], `${formData.resumeName}.pdf`, { type: 'application/pdf' });
            await resumeAPI.uploadWithUserId(user.id, file, formData.resumeName);
            setSuccess('Resume saved to vault!');
            if (onResumeSaved) onResumeSaved();
        } catch (err) {
            setError('Failed to save resume. Try downloading instead.');
        } finally {
            setGenerating(false);
            setSaving(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const sections = [
        { key: 'personal', label: 'Identity', icon: '👤' },
        { key: 'summary', label: 'Summary', icon: '📝' },
        { key: 'experience', label: 'Experience', icon: '💼' },
        { key: 'education', label: 'Education', icon: '🎓' },
        { key: 'skills', label: 'Skills', icon: '🛠️' },
        { key: 'projects', label: 'Projects', icon: '🚀' },
        { key: 'certifications', label: 'Awards', icon: '🏆' },
    ];

    const TemplatePreview = selectedTemplate === 'modern' ? ModernTemplate : ProfessionalTemplate;

    return (
        <div className="relative z-10">
            <style>{`
                .hp-input { width: 100%; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 12px; padding: 12px 16px; font-size: 0.9rem; outline: none; transition: all 0.2s; }
                .hp-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1); }
                .section-btn { width: 100%; text-align: left; padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 12px; transition: all 0.2s; border: 1px solid transparent; }
                .section-btn.active { background: rgba(45, 212, 191, 0.1); color: var(--color-primary); border-color: rgba(45, 212, 191, 0.2); }
                .section-btn:not(.active) { color: var(--color-text-muted); }
                .section-btn:not(.active):hover { background: var(--color-surface); color: var(--color-text); }
                .template-card { cursor: pointer; border: 2px solid var(--color-border); border-radius: 16px; overflow: hidden; transition: all 0.3s; position: relative; }
                .template-card.active { border-color: var(--color-primary); box-shadow: 0 0 20px rgba(45, 212, 191, 0.2); }
                .resume-sheet { width: 100%; aspect-ratio: 1 / 1.414; background: white; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transform-origin: top left; }
                .hp-btn-primary { display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 8px 25px rgba(45, 212, 191, .35); }
                .hp-btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); font-weight: 600; border-radius: 12px; cursor: pointer; transition: all .2s; }
                .hp-btn-ghost:hover { background: rgba(45, 212, 191, .1); border-color: rgba(45, 212, 191, .3); color: var(--color-primary); }
            `}</style>

            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-emerald-500 text-white font-bold text-sm shadow-xl flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        {success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Template Selection */}
            <div className="mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-6 ml-1">Select Visual Blueprint</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {['modern', 'professional'].map(t => (
                        <div key={t} onClick={() => setSelectedTemplate(t)} className={`template-card p-4 flex gap-4 items-center ${selectedTemplate === t ? 'active' : ''}`}>
                            <div className={`w-12 h-16 rounded-md border-2 border-dashed flex items-center justify-center text-xl ${selectedTemplate === t ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                                📄
                            </div>
                            <div>
                                <h4 className="font-bold text-sm capitalize">{t} Layout</h4>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">{t === 'modern' ? 'HireHub Accent • Clean' : 'Recruiter Optimized • Traditional'}</p>
                            </div>
                            {selectedTemplate === t && <div className="ml-auto w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center"><svg className="w-4 h-4 text-[#0f2620]" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg></div>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-6 ml-1">Forge Sections</h3>
                    <div className="border border-[var(--color-border)] rounded-2xl p-2 space-y-1" style={{ background: 'var(--color-card)' }}>
                        {sections.map(s => (
                            <button key={s.key} onClick={() => setActiveSection(s.key)} className={`section-btn ${activeSection === s.key ? 'active' : ''}`}>
                                <span className="text-base">{s.icon}</span> {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-9">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <motion.div key={activeSection} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="border border-[var(--color-border)] rounded-2xl p-6 sm:p-8" style={{ background: 'var(--color-card)' }}>
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-lg">{sections.find(s => s.key === activeSection).icon}</div>
                                    <h4 className="text-xl font-bold tracking-tight">{sections.find(s => s.key === activeSection).label} Details</h4>
                                </div>

                                {activeSection === 'personal' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {['fullName', 'email', 'phone', 'location', 'linkedin', 'portfolio'].map(field => (
                                            <div key={field} className="space-y-2">
                                                <label className="text-[10px] uppercase font-black text-[var(--color-text-muted)] ml-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                                <input type="text" name={field} value={formData[field]} onChange={handleChange} className="hp-input" placeholder={field} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeSection === 'summary' && (
                                    <textarea name="summary" value={formData.summary} onChange={handleChange} rows={10} className="hp-input resize-none" placeholder="Craft your professional narrative..." />
                                )}

                                {activeSection === 'experience' && (
                                    <div className="space-y-6">
                                        {formData.experiences.map((exp, i) => (
                                            <div key={i} className="p-5 rounded-2xl border border-[var(--color-border)] space-y-4 relative group" style={{ background: 'var(--color-surface)' }}>
                                                <button onClick={() => removeItem('experiences', i)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={exp.company} onChange={(e) => handleListChange('experiences', i, 'company', e.target.value)} className="hp-input" placeholder="Company" />
                                                    <input type="text" value={exp.role} onChange={(e) => handleListChange('experiences', i, 'role', e.target.value)} className="hp-input" placeholder="Role" />
                                                </div>
                                                <input type="text" value={exp.duration} onChange={(e) => handleListChange('experiences', i, 'duration', e.target.value)} className="hp-input" placeholder="Duration (e.g. Jan 2022 - Present)" />
                                                <textarea value={exp.description} onChange={(e) => handleListChange('experiences', i, 'description', e.target.value)} className="hp-input" placeholder="Key achievements..." rows={3} />
                                            </div>
                                        ))}
                                        <button onClick={() => addItem('experiences', { company: '', role: '', duration: '', description: '' })} className="hp-btn-ghost w-full py-3 border-dashed">+ Add Experience</button>
                                    </div>
                                )}

                                {activeSection === 'education' && (
                                    <div className="space-y-6">
                                        {formData.education.map((edu, i) => (
                                            <div key={i} className="p-5 rounded-2xl border border-[var(--color-border)] space-y-4 relative group" style={{ background: 'var(--color-surface)' }}>
                                                <button onClick={() => removeItem('education', i)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                <input type="text" value={edu.institution} onChange={(e) => handleListChange('education', i, 'institution', e.target.value)} className="hp-input" placeholder="Institution" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={edu.degree} onChange={(e) => handleListChange('education', i, 'degree', e.target.value)} className="hp-input" placeholder="Degree" />
                                                    <input type="text" value={edu.year} onChange={(e) => handleListChange('education', i, 'year', e.target.value)} className="hp-input" placeholder="Year" />
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={() => addItem('education', { institution: '', degree: '', year: '', grade: '' })} className="hp-btn-ghost w-full py-3 border-dashed">+ Add Education</button>
                                    </div>
                                )}

                                {activeSection === 'skills' && (
                                    <textarea name="skills" value={formData.skills} onChange={handleChange} rows={6} className="hp-input resize-none" placeholder="Java, React, SQL..." />
                                )}

                                {activeSection === 'projects' && (
                                    <div className="space-y-6">
                                        {formData.projects.map((proj, i) => (
                                            <div key={i} className="p-5 rounded-2xl border border-[var(--color-border)] space-y-4 relative group" style={{ background: 'var(--color-surface)' }}>
                                                <button onClick={() => removeItem('projects', i)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                                <input type="text" value={proj.name} onChange={(e) => handleListChange('projects', i, 'name', e.target.value)} className="hp-input" placeholder="Project Name" />
                                                <input type="text" value={proj.tech} onChange={(e) => handleListChange('projects', i, 'tech', e.target.value)} className="hp-input" placeholder="Tech Stack" />
                                                <textarea value={proj.description} onChange={(e) => handleListChange('projects', i, 'description', e.target.value)} className="hp-input" placeholder="Description..." rows={2} />
                                            </div>
                                        ))}
                                        <button onClick={() => addItem('projects', { name: '', description: '', tech: '' })} className="hp-btn-ghost w-full py-3 border-dashed">+ Add Project</button>
                                    </div>
                                )}

                                {activeSection === 'certifications' && (
                                    <textarea name="certifications" value={formData.certifications} onChange={handleChange} rows={10} className="hp-input resize-none" placeholder="Award Name - Year (One per line)" />
                                )}
                            </motion.div>

                            <button onClick={() => handleGenerate(false)} disabled={generating} className="hp-btn-primary w-full py-4 uppercase tracking-widest text-[10px] font-black">
                                {generating ? 'Generating...' : '⬇️ Download PDF'}
                            </button>
                        </div>

                        <div className="hidden xl:block">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-6 ml-1">Live Manifestation</h3>
                            <div className="border border-[var(--color-border)] rounded-2xl p-8 sticky top-32 overflow-hidden shadow-2xl" style={{ background: 'var(--color-card)' }}>
                                <div className="resume-sheet overflow-hidden bg-white">
                                    <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '794px' }}>
                                        <TemplatePreview formData={formData} ref={resumeRef} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed -left-[9999px] -top-[9999px]">
                <TemplatePreview formData={formData} ref={pdfRef} />
            </div>
        </div>
    );
}

const ModernTemplate = forwardRef(({ formData }, ref) => {
    const skills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certs = formData.certifications ? formData.certifications.split('\n').map(s => s.trim()).filter(Boolean) : [];

    return (
        <div ref={ref} style={{ width: '794px', minHeight: '1123px', padding: '60px', fontFamily: "'Helvetica', 'Arial', sans-serif", fontSize: '13px', color: '#111', backgroundColor: '#ffffff', lineHeight: '1.6' }}>
            <div style={{ borderBottom: '4px solid #2dd4bf', paddingBottom: '24px', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.02em', color: '#07090f', margin: 0 }}>{formData.fullName || 'YOUR NAME'}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '12px', color: '#6b7799', fontSize: '12px', fontWeight: '600' }}>
                    {formData.email && <span>✉ {formData.email}</span>}
                    {formData.phone && <span>📞 {formData.phone}</span>}
                    {formData.location && <span>📍 {formData.location}</span>}
                    {formData.linkedin && <span>🔗 {formData.linkedin}</span>}
                </div>
            </div>

            {formData.summary && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#2dd4bf', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '12px' }}>Profile</h2>
                    <p style={{ margin: 0, color: '#333' }}>{formData.summary}</p>
                </div>
            )}

            {formData.experiences.some(e => e.company) && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#2dd4bf', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '15px' }}>Experience</h2>
                    {formData.experiences.map((exp, i) => exp.company && (
                        <div key={i} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <div style={{ fontWeight: '800', fontSize: '15px' }}>{exp.role}</div>
                                <div style={{ fontSize: '12px', color: '#6b7799', fontWeight: '700' }}>{exp.duration}</div>
                            </div>
                            <div style={{ color: '#2dd4bf', fontWeight: '700', fontSize: '13px' }}>{exp.company}</div>
                            <p style={{ color: '#444', marginTop: '6px' }}>{exp.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {formData.education.some(e => e.institution) && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#2dd4bf', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '15px' }}>Education</h2>
                    {formData.education.map((edu, i) => edu.institution && (
                        <div key={i} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: '700' }}>{edu.degree}</div>
                                <div style={{ color: '#6b7799', fontSize: '12px' }}>{edu.year}</div>
                            </div>
                            <div style={{ fontSize: '12px' }}>{edu.institution}</div>
                        </div>
                    ))}
                </div>
            )}

            {skills.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#2dd4bf', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '12px' }}>Skills</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {skills.map((s, i) => <span key={i} style={{ background: '#f0fdfa', color: '#0d9488', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', border: '1px solid #ccfbf1' }}>{s}</span>)}
                    </div>
                </div>
            )}
            
            {certs.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#2dd4bf', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '12px' }}>Certifications</h2>
                    {certs.map((c, i) => <div key={i} style={{ color: '#333', fontSize: '12px' }}>• {c}</div>)}
                </div>
            )}
        </div>
    );
});

const ProfessionalTemplate = forwardRef(({ formData }, ref) => {
    const skills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    return (
        <div ref={ref} style={{ width: '794px', minHeight: '1123px', padding: '60px', fontFamily: "'Georgia', serif", fontSize: '12px', color: '#333', backgroundColor: '#ffffff', lineHeight: '1.5' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '2px' }}>{formData.fullName || 'YOUR NAME'}</h1>
                <div style={{ marginTop: '10px', color: '#666', fontSize: '11px' }}>{formData.email} • {formData.phone} • {formData.location}</div>
                <div style={{ marginTop: '4px', color: '#222', fontSize: '10px' }}>{formData.linkedin} {formData.portfolio && `| ${formData.portfolio}`}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ borderBottom: '1px solid #333', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', fontSize: '13px' }}>Professional Summary</div>
                <p style={{ margin: 0 }}>{formData.summary}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ borderBottom: '1px solid #333', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px', fontSize: '13px' }}>Core Experience</div>
                {formData.experiences.map((exp, i) => exp.company && (
                    <div key={i} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>{exp.role}</span>
                            <span>{exp.duration}</span>
                        </div>
                        <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>{exp.company}</div>
                        <p style={{ margin: 0, fontSize: '11.5px' }}>{exp.description}</p>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ borderBottom: '1px solid #333', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', fontSize: '13px' }}>Education</div>
                {formData.education.map((edu, i) => edu.institution && (
                    <div key={i} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>{edu.institution}</span>
                            <span>{edu.year}</span>
                        </div>
                        <div>{edu.degree} {edu.grade && `— ${edu.grade}`}</div>
                    </div>
                ))}
            </div>

            {skills.length > 0 && (
                <div>
                    <div style={{ borderBottom: '1px solid #333', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', fontSize: '13px' }}>Technical Proficiencies</div>
                    <p style={{ margin: 0 }}>{skills.join(' • ')}</p>
                </div>
            )}
        </div>
    );
});