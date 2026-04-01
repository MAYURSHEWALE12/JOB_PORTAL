import { useState, useRef, useEffect } from 'react';
import { 
    X, Minimize2, Maximize2, GripHorizontal, FileText, Download 
} from 'lucide-react';

/**
 * A draggable, professional Resume Preview Window.
 * 
 * @param {Object} previewData - { id, name, url }
 * @param {Function} onClose - Callback to close the preview
 * @param {Function} onDownload - Callback to download the resume
 */
export default function ResumePreviewWindow({ previewData, onClose, onDownload }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [pos, setPos] = useState({ 
        x: window.innerWidth - 850, 
        y: 100 
    });
    
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Handle initial position and resizing
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => ({
                x: Math.min(prev.x, window.innerWidth - 100),
                y: Math.min(prev.y, window.innerHeight - 100)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startDrag = (e) => {
        if (isMinimized) return;
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
    };

    const onDrag = (e) => {
        if (!isDragging.current) return;
        setPos({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };

    const endDrag = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
    };

    if (!previewData) return null;

    return (
        <div 
            className={`fixed z-[9999] bg-white dark:bg-stone-900 border-[4px] border-stone-900 shadow-[24px_24px_0_rgba(0,0,0,0.4)] flex flex-col transition-all duration-300
                ${isMinimized ? 'w-72 h-14 rounded-full overflow-hidden' : 'w-[800px] h-[85vh]'}`}
            style={{ 
                left: isMinimized ? '32px' : `${pos.x}px`, 
                top: isMinimized ? 'auto' : `${pos.y}px`,
                bottom: isMinimized ? '32px' : 'auto'
            }}
        >
            {/* Draggable Header */}
            <div 
                onMouseDown={startDrag}
                className="bg-stone-900 text-white h-14 flex items-center justify-between px-4 cursor-move select-none shrink-0 border-b-[4px] border-stone-900"
            >
                <div className="flex items-center gap-3">
                    <GripHorizontal size={20} className="text-stone-500" />
                    <div className="w-8 h-8 bg-orange-500 border-[2px] border-stone-900 flex items-center justify-center rotate-3">
                        <FileText size={16} className="text-stone-900" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[11px] truncate max-w-[200px] text-orange-400">
                        {previewData.name}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    {/* Action Bar */}
                    <button 
                        onClick={() => onDownload(previewData.id, previewData.name)}
                        className="p-2 mr-2 bg-emerald-500 text-stone-900 hover:bg-emerald-400 transition-colors rounded-none border-[2px] border-white/20"
                        title="Download Document"
                    >
                        <Download size={18} />
                    </button>
                    
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-2 hover:bg-stone-700 transition-colors rounded-none"
                        title={isMinimized ? 'Restore' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                    </button>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-rose-500 transition-colors rounded-none"
                        title="Close Board"
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Window Content (IFrame) */}
            {!isMinimized ? (
                <div className="flex-grow bg-stone-100 dark:bg-stone-800 p-2 overflow-hidden relative group">
                    <iframe 
                        src={`${previewData.url}#toolbar=0&navpanes=0`} 
                        className="w-full h-full border-0 bg-white shadow-inner"
                        title="Resume Doc Preview"
                    />
                    {/* Premium Decoration */}
                    <div className="absolute bottom-6 right-6 bg-stone-900 text-orange-500 px-4 py-2 font-black uppercase text-[10px] border-[2px] border-orange-500 -rotate-2 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[4px_4px_0_#000]">
                        Premium ATS Preview ✨
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500" />
                </div>
            ) : (
                /* Minimized State Bar */
                 <div className="flex items-center px-4 h-full bg-white dark:bg-stone-800">
                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-stone-900 mr-3" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Document Minimized</span>
                 </div>
            )}
        </div>
    );
}
