import { useState, forwardRef } from 'react';

export const ModernTemplate = forwardRef(({ formData }, ref) => {
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

export function ModernSection({ title, children }) {
    return (
        <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1.5px solid #fed7aa', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

export const ProfessionalTemplate = forwardRef(({ formData }, ref) => {
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
            <div style={{ textAlign: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: `2px solid ${BLACK}` }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: BLACK, margin: 0, textTransform: 'uppercase', letterSpacing: '3px' }}>
                    {formData.fullName || 'Your Name'}
                </h1>
                {formData.summary && (
                    <div style={{ color: GRAY, fontSize: '13px', marginTop: '2px' }}>
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

            {formData.summary && (
                <ProSection title="Summary">
                    <p style={{ color: GRAY, margin: 0, textAlign: 'justify' }}>{formData.summary}</p>
                </ProSection>
            )}

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
                                <div style={{ color: MID, fontSize: '12px', marginBottom: '4px' }}>
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

            {formData.projects.some(p => p.name) && (
                <ProSection title="Projects">
                    {formData.projects.map((proj, i) => (
                        proj.name ? (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: BLACK }}>{proj.name}</span>
                                        {proj.tech && (
                                            <span style={{ color: MID, marginLeft: '8px', fontSize: '12px' }}>
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

            {certs.length > 0 && (
                <ProSection title="Awards & Certifications">
                    {certs.map((cert, i) => (
                        <div key={i} style={{ color: GRAY, marginBottom: '3px', paddingLeft: '12px' }}>
                            • <span style={{ fontWeight: '600', color: BLACK }}>{cert}</span>
                        </div>
                    ))}
                </ProSection>
            )}

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
                                <div style={{ color: MID, fontSize: '12px' }}>
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

export function ProSection({ title, children }) {
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
