import { motion } from 'framer-motion';

export default function ApplicationFilter({ statusFilter, setStatusFilter, searchQuery, setSearchQuery }) {
    const statuses = [
        { key: 'ALL',         label: 'Omni',        icon: '🔗' },
        { key: 'PENDING',     label: 'Queue',       icon: '⏳' },
        { key: 'INTERVIEWING',label: 'Live',        icon: '⚡' },
        { key: 'OFFERED',     label: 'Contracts',    icon: '📜' },
        { key: 'ACCEPTED',    label: 'Secured',     icon: '💎' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 mb-12"
        >
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                {/* Minimalist Search */}
                <div className="relative w-full lg:w-[400px] group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search Intelligence..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--color-card)] border border-[var(--color-border-subtle)] rounded-2xl pl-12 pr-4 h-14 text-sm font-medium focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all outline-none text-[var(--color-text)]"
                    />
                </div>

                {/* Industrial Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-[var(--color-input)]/40 rounded-2xl border border-[var(--color-border-subtle)] overflow-x-auto hide-scrollbar w-full lg:w-auto">
                    {statuses.map((status) => (
                        <button
                            key={status.key}
                            onClick={() => setStatusFilter(status.key)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap
                                ${statusFilter === status.key
                                    ? 'bg-[var(--color-primary)] text-black shadow-lg shadow-[var(--color-primary)]/20'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card)]'}
                            `}
                        >
                            <span>{status.icon}</span>
                            <span>{status.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
