import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tabIcons } from './DashboardIcons';

export default function DashboardTabbar({ 
    activeTab, 
    handleTabChange, 
    primaryTabs, 
    secondaryTabs, 
    isMoreMenuOpen, 
    setIsMoreMenuOpen, 
    setProfileMenuOpen 
}) {
    return (
        <div className="db-tabbar fixed left-0 right-0 z-40"
            style={{ top: 52, height: 46 }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-3 sm:px-6 gap-2">

                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {primaryTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`db-tab${activeTab === tab.key ? ' active' : ''}`}
                        >
                            <span style={{ width: 14, height: 14, flexShrink: 0 }}>{tabIcons[tab.key]}</span>
                            <span>{tab.label}</span>
                            {tab.badge && <span className="db-badge">{tab.badge}</span>}
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
                    {secondaryTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`db-tab${activeTab === tab.key ? ' active' : ''}`}
                        >
                            <span style={{ width: 14, height: 14, flexShrink: 0 }}>{tabIcons[tab.key]}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {secondaryTabs.length > 0 && (
                    <div className="lg:hidden relative flex-shrink-0 ml-1">
                        <button
                            onClick={() => { setIsMoreMenuOpen(v => !v); setProfileMenuOpen(false); }}
                            className={`db-tab${isMoreMenuOpen ? ' active' : ''}`}
                        >
                            <span>More</span>
                            <svg style={{ width: 12, height: 12, transform: isMoreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {isMoreMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: .95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: .95 }}
                                    transition={{ duration: .18 }}
                                    className="db-dropdown"
                                    style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 210, zIndex: 200, padding: '6px 0' }}
                                >
                                    {secondaryTabs.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => handleTabChange(tab.key)}
                                            className={`db-dropdown-item${activeTab === tab.key ? ' active' : ''}`}
                                        >
                                            {tabIcons[tab.key]}
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
