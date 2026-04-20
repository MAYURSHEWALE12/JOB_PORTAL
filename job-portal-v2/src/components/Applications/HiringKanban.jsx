import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import KanbanCard from './KanbanCard';

const KANBAN_STAGES = [
    { key: 'PENDING', label: 'New', accent: '#fbbf24' },
    { key: 'REVIEWED', label: 'Reviewed', accent: '#60a5fa' },
    { key: 'SHORTLISTED', label: 'Shortlisted', accent: 'var(--hp-accent)' },
    { key: 'INTERVIEWING', label: 'Interviews', accent: 'var(--hp-accent2)' },
    { key: 'OFFERED', label: 'Offered', accent: '#f472b6' },
];

export default function HiringKanban({ applications, onStatusUpdate, onSelectApp }) {
    const [localApps, setLocalApps] = useState(applications);
    const containerRef = useRef(null);
    const colRefs = useRef({});

    useEffect(() => {
        setLocalApps(applications);
    }, [applications]);

    const handleDragEnd = (app, info) => {
        // Calculate which column the center of the card is over
        const x = info.point.x;
        const y = info.point.y;

        let targetStage = null;

        Object.entries(colRefs.current).forEach(([stage, ref]) => {
            if (!ref) return;
            const rect = ref.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right) {
                targetStage = stage;
            }
        });

        if (targetStage && targetStage !== app.status) {
            // Optimistically update or just trigger the parent
            onStatusUpdate(app.id, targetStage);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="kanban-board hide-scrollbar"
        >
            <LayoutGroup>
                {KANBAN_STAGES.map(stage => {
                    const stageApps = localApps.filter(a => a.status === stage.key);
                    
                    return (
                        <div 
                            key={stage.key}
                            ref={el => colRefs.current[stage.key] = el}
                            className="kanban-column kanban-column-glass relative p-3 sm:p-5"
                        >
                            <div className="kanban-header flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: stage.accent }}
                                    />
                                    <h3 className="font-bold text-sm sm:text-base tracking-tight">{stage.label}</h3>
                                </div>
                                <span className="kanban-count bg-[var(--hp-surface-alt)] px-2 py-0.5 rounded text-[10px] font-black opacity-70">
                                    {stageApps.length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 min-h-[300px]">
                                <AnimatePresence mode="popLayout">
                                    {stageApps.map(app => (
                                        <div key={app.id} className="relative">
                                            <KanbanCard 
                                                application={app} 
                                                onSelect={onSelectApp}
                                                onDragEnd={handleDragEnd}
                                            />
                                        </div>
                                    ))}
                                </AnimatePresence>
                                
                                {stageApps.length === 0 && (
                                    <div className="h-32 rounded-xl border border-dashed border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-muted)] text-[10px] uppercase tracking-widest">
                                        Empty
                                    </div>
                                )}
                            </div>

                            {/* Drop Zone Indicator (Visual only) */}
                            <div className="absolute inset-0 pointer-events-none border-2 border-transparent rounded-2xl transition-colors hover:border-[var(--hp-accent)]/20" />
                        </div>
                    )
                })}
            </LayoutGroup>
        </div>
    );
}
