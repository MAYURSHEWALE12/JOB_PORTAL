export default function UploadProgress({ progress, fileName, onCancel }) {
    const isIndeterminate = progress === null || progress === undefined;
    const percent = isIndeterminate ? 0 : Math.min(Math.round(progress), 100);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 shrink-0 text-[var(--color-primary)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-semibold text-[var(--color-text-mid)] truncate">
                        {fileName || 'Uploading...'}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!isIndeterminate && (
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] tabular-nums">
                            {percent}%
                        </span>
                    )}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-0.5 rounded hover:bg-[var(--color-hover-bg)] transition-colors"
                            aria-label="Cancel upload"
                        >
                            <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                <div
                    className="h-full rounded-full"
                    style={{
                        width: isIndeterminate ? '40%' : `${percent}%`,
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary, #a78bfa))',
                        animation: isIndeterminate ? 'upload-indeterminate 1.4s ease-in-out infinite' : 'none',
                        transition: isIndeterminate ? 'none' : 'width 0.3s ease-out',
                    }}
                />
            </div>

            {isIndeterminate && (
                <style>{`
                    @keyframes upload-indeterminate {
                        0%   { transform: translateX(-100%); }
                        50%  { transform: translateX(260%); }
                        100% { transform: translateX(260%); }
                    }
                `}</style>
            )}
        </div>
    );
}
