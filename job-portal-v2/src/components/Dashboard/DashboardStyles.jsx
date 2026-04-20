import React from 'react';

export default function DashboardStyles() {
    return (
        <style>{`
            :root, html.dark {
                --hp-bg:           #07090f;
                --hp-surface:      #0d1117;
                --hp-surface-alt:  rgba(255,255,255,.06);
                --hp-card:         #111520;
                --hp-card-hover:   #151b2a;
                --hp-border:       rgba(255,255,255,.07);
                --hp-border-hover: rgba(45,212,191,.3);
                --hp-accent:       #2dd4bf;
                --hp-accent-rgb:   45,212,191;
                --hp-accent2:      #a78bfa;
                --hp-accent2-rgb:  167,139,250;
                --hp-text:         #eef2ff;
                --hp-text-sub:     #c7d0e8;
                --hp-muted:        #6b7799;
                --hp-subtle:       #2e3650;
                --hp-nav-bg:       rgba(7,9,15,.88);
                --hp-orb1:         rgba(45,212,191,.10);
                --hp-orb2:         rgba(167,139,250,.07);
                --hp-shadow-card:  0 8px 40px rgba(0,0,0,.55);
                --hp-tab-active-bg:linear-gradient(135deg, rgba(45,212,191,.18), rgba(167,139,250,.12));
                --hp-tab-active-border: rgba(45,212,191,.45);
            }
            html.light {
                --hp-bg:           #f0f4fa;
                --hp-surface:      #ffffff;
                --hp-surface-alt:  rgba(0,0,0,.05);
                --hp-card:         #ffffff;
                --hp-card-hover:   #f7faff;
                --hp-border:       rgba(0,0,0,.09);
                --hp-border-hover: rgba(13,148,136,.35);
                --hp-accent:       #0d9488;
                --hp-accent-rgb:   13,148,136;
                --hp-accent2:      #7c3aed;
                --hp-accent2-rgb:  124,58,237;
                --hp-text:         #0c1220;
                --hp-text-sub:     #374151;
                --hp-muted:        #64748b;
                --hp-subtle:       #cbd5e1;
                --hp-nav-bg:       rgba(240,244,250,.92);
                --hp-orb1:         rgba(13,148,136,.07);
                --hp-orb2:         rgba(124,58,237,.05);
                --hp-shadow-card:  0 4px 24px rgba(0,0,0,.08);
                --hp-tab-active-bg:linear-gradient(135deg, rgba(13,148,136,.12), rgba(124,58,237,.08));
                --hp-tab-active-border: rgba(13,148,136,.4);
            }

            * { box-sizing: border-box; }

            .db-nav {
                background: var(--hp-nav-bg);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-bottom: 1px solid var(--hp-border);
            }

            @media (max-width: 768px) {
                .db-nav {
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }
                .db-particles { display: none !important; }
                .db-orb { filter: blur(60px); opacity: 0.5; }
            }

            .db-tabbar {
                background: var(--hp-nav-bg);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-bottom: 1px solid var(--hp-border);
            }

            @media (max-width: 768px) {
                .db-tabbar {
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                }
            }

            .db-tab {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 13px;
                border-radius: 10px;
                font-size: .78rem;
                font-weight: 600;
                white-space: nowrap;
                cursor: pointer;
                border: 1px solid transparent;
                transition: all .2s ease;
                color: var(--hp-muted);
                background: transparent;
                letter-spacing: .01em;
                position: relative;
                flex-shrink: 0;
            }
            .db-tab:hover {
                color: var(--hp-text);
                background: var(--hp-surface-alt);
                border-color: var(--hp-border);
            }
            .db-tab.active {
                color: var(--hp-accent);
                background: var(--hp-tab-active-bg);
                border-color: var(--hp-tab-active-border);
            }

            .db-tab.active::before {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 50%;
                transform: translateX(-50%);
                width: 18px;
                height: 2px;
                border-radius: 2px;
                background: linear-gradient(90deg, var(--hp-accent), var(--hp-accent2));
            }

            .db-badge {
                background: #ef4444;
                color: #fff;
                font-size: .6rem;
                font-weight: 700;
                padding: 1px 5px;
                border-radius: 999px;
                font-family: 'DM Mono', monospace;
                letter-spacing: 0;
                line-height: 1.4;
            }

            .db-avatar {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                object-fit: cover;
                border: 1.5px solid var(--hp-border);
                flex-shrink: 0;
                transition: border-color .2s;
            }
            .db-avatar:hover { border-color: rgba(var(--hp-accent-rgb), .5); }

            .db-avatar-placeholder {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: .7rem;
                color: #fff;
                flex-shrink: 0;
                cursor: pointer;
                transition: opacity .2s, box-shadow .2s;
                box-shadow: 0 2px 12px rgba(var(--hp-accent-rgb),.3);
            }
            .db-avatar-placeholder:hover { opacity: .85; }

            .db-icon-btn {
                width: 34px;
                height: 34px;
                border-radius: 10px;
                background: var(--hp-surface-alt);
                border: 1px solid var(--hp-border);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--hp-muted);
                transition: color .2s, border-color .2s, background .2s;
                flex-shrink: 0;
            }
            .db-icon-btn:hover {
                color: var(--hp-accent);
                border-color: rgba(var(--hp-accent-rgb), .35);
                background: rgba(var(--hp-accent-rgb), .08);
            }

            .db-role-badge {
                font-size: .62rem;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 6px;
                letter-spacing: .05em;
                border: 1px solid;
                text-transform: uppercase;
                font-family: 'DM Mono', monospace;
            }

            .db-logout-btn {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 5px 10px;
                border-radius: 8px;
                font-size: .72rem;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid rgba(239,68,68,.25);
                color: #f87171;
                background: rgba(239,68,68,.08);
                transition: all .2s;
            }
            .db-logout-btn:hover {
                background: rgba(239,68,68,.16);
                border-color: rgba(239,68,68,.45);
            }

            .db-btn-primary {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                color: #fff;
                font-weight: 700;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: opacity .2s, transform .2s, box-shadow .2s;
                box-shadow: 0 4px 18px rgba(var(--hp-accent-rgb), .35);
            }
            .db-btn-primary:hover { opacity: .88; transform: translateY(-1px); }

            .db-dropdown {
                background: var(--hp-card);
                border: 1px solid var(--hp-border);
                border-radius: 14px;
                box-shadow: 0 16px 60px rgba(0,0,0,.55);
                overflow: hidden;
            }
            .db-dropdown-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 14px;
                font-size: .8rem;
                font-weight: 500;
                color: var(--hp-muted);
                cursor: pointer;
                border: none;
                background: transparent;
                transition: background .15s, color .15s;
                text-align: left;
            }
            .db-dropdown-item:hover {
                background: var(--hp-surface-alt);
                color: var(--hp-text);
            }
            .db-dropdown-item.active {
                color: var(--hp-accent);
                background: rgba(var(--hp-accent-rgb), .08);
            }
            .db-dropdown-divider {
                height: 1px;
                background: var(--hp-border);
                margin: 4px 0;
            }

            .db-orb {
                position: fixed;
                border-radius: 50%;
                filter: blur(100px);
                pointer-events: none;
                z-index: 0;
            }

            .db-particles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
            .db-particle {
                position: absolute;
                border-radius: 50%;
                animation: db-float-up linear infinite;
                opacity: 0;
            }
            @keyframes db-float-up {
                0%   { transform: translateY(100vh) scale(0); opacity: 0; }
                10%  { opacity: 1; }
                90%  { opacity: .25; }
                100% { transform: translateY(-10vh) scale(1); opacity: 0; }
            }

            .db-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                margin-top: 110px;
                padding: 28px 20px 32px;
                scroll-margin-top: 120px;
            }

            @media (max-width: 640px) {
                .db-content { margin-top: 104px; padding: 16px 12px 24px; }
                .db-tab { padding: 5px 10px; font-size: .72rem; }
            }

            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

            .db-gradient-text {
                background: linear-gradient(135deg, var(--hp-accent) 20%, var(--hp-accent2) 80%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            /* Shared Vertex Design System Components */
            .hp-card {
                background: var(--hp-card);
                border: 1px solid var(--hp-border);
                border-radius: 20px;
                box-shadow: var(--hp-shadow-card);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                            border-color 0.25s ease, 
                            box-shadow 0.25s ease, 
                            background-color 0.25s ease;
                overflow: hidden;
            }
            .hp-card:hover {
                transform: translateY(-4px);
                border-color: var(--hp-border-hover);
                box-shadow: 0 12px 48px rgba(0,0,0,0.15);
                background: var(--hp-card-hover);
            }

            .hp-btn-primary {
                background: linear-gradient(135deg, var(--hp-accent), var(--hp-accent2));
                color: #fff;
                border: none;
                border-radius: 12px;
                padding: 10px 24px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 4px 15px rgba(var(--hp-accent-rgb), 0.3);
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .hp-btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(var(--hp-accent-rgb), 0.4);
                opacity: 0.95;
            }
            .hp-btn-primary:active { transform: translateY(0); }

            .hp-btn-ghost {
                background: transparent;
                color: var(--hp-text-sub);
                border: 1px solid var(--hp-border);
                border-radius: 12px;
                padding: 10px 24px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.20s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .hp-btn-ghost:hover {
                background: var(--hp-surface-alt);
                border-color: var(--hp-accent);
                color: var(--hp-accent);
            }

            .hp-badge, .tag-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4px 12px;
                border-radius: 30px;
                font-size: 0.65rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border: 1px solid transparent;
                white-space: nowrap;
            }

            /* Sizing Utilities for Avatars/Icons/Symbols */
            .w-4 { width: 1rem; } .h-4 { height: 1rem; }
            .w-5 { width: 1.25rem; } .h-5 { height: 1.25rem; }
            .w-6 { width: 1.5rem; } .h-6 { height: 1.5rem; }
            .w-8 { width: 2rem; } .h-8 { height: 2rem; }
            .w-11 { width: 2.75rem; } .h-11 { height: 2.75rem; }
            .w-12 { width: 3rem; } .h-12 { height: 3rem; }
            .w-14 { width: 3.5rem; } .h-14 { height: 3.5rem; }
            .w-16 { width: 4rem; } .h-16 { height: 4rem; }
            
            .opacity-0 { opacity: 0; }
            .opacity-50 { opacity: 0.5; }
            .opacity-70 { opacity: 0.7; }

            .hp-particles-bg { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: -1; }

            /* Job Search Specific Inputs & Icons */
            .js-input {
                width: 100%;
                background: var(--hp-surface-alt);
                border: 1px solid var(--hp-border);
                color: var(--hp-text);
                border-radius: 12px;
                padding: 12px 16px 12px 56px;
                font-size: 0.88rem;
                transition: all 0.2s;
                outline: none;
                height: 48px;
            }
            .js-input:focus {
                border-color: rgba(var(--hp-accent-rgb), 0.5);
                box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1);
            }
            .js-input-icon {
                position: absolute;
                left: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--hp-muted);
                width: 32px;
                height: 32px;
                pointer-events: none;
                opacity: 0.8;
            }
            .js-select { padding-left: 20px !important; }

            .hp-input {
                width: 100%;
                background: var(--hp-surface-alt);
                border: 1px solid var(--hp-border);
                color: var(--hp-text);
                border-radius: 12px;
                padding: 10px 16px;
                font-size: 0.88rem;
                transition: all 0.2s;
                outline: none;
            }
            .hp-input:focus {
                border-color: rgba(var(--hp-accent-rgb), 0.5);
                background: var(--hp-card);
                box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1);
            }

            .hp-input::placeholder { color: var(--hp-muted); opacity: 0.6; }

            .hp-input-group {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }

            .hp-input-group .hp-input {
                padding-left: 48px;
            }

            .hp-input-icon {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--hp-muted);
                width: 18px;
                height: 18px;
                pointer-events: none;
                transition: color 0.2s;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hp-input-group:focus-within .hp-input-icon { color: var(--hp-accent); }

            .hp-label {
                display: block;
                font-size: 0.65rem;
                font-weight: 800;
                color: var(--hp-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 0.5rem;
            }

            .hero-search-row {
                display: grid;
                grid-template-columns: repeat(3, 1fr) auto;
                align-items: center;
                gap: 12px;
                width: 100%;
            }
            @media (max-width: 1024px) {
                .hero-search-row { 
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
            }

            .hp-textarea {
                width: 100%;
                background: var(--hp-surface-alt);
                border: 1px solid var(--hp-border);
                color: var(--hp-text);
                border-radius: 12px;
                padding: 16px;
                font-size: 0.9rem;
                transition: all 0.2s;
                outline: none;
                resize: vertical;
                min-height: 120px;
            }
            .hp-textarea:focus {
                border-color: rgba(var(--hp-accent-rgb), 0.5);
                background: var(--hp-card);
                box-shadow: 0 0 0 3px rgba(var(--hp-accent-rgb), 0.1);
            }

            .hp-modal-overlay {
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }

            .action-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: 10px;
                border-radius: 12px;
                background: transparent;
                border: 1px solid transparent;
                transition: all 0.2s;
                color: var(--hp-muted);
                cursor: pointer;
            }
            .action-btn:hover {
                background: var(--hp-surface-alt);
                border-color: var(--hp-border);
                color: var(--hp-text);
            }
            
            .action-btn.edit:hover { color: var(--hp-accent); background: rgba(var(--hp-accent-rgb), 0.1); border-color: rgba(var(--hp-accent-rgb), 0.2); }
            .action-btn.quiz:hover { color: var(--hp-accent2); background: rgba(var(--hp-accent2-rgb), 0.1); border-color: rgba(var(--hp-accent2-rgb), 0.2); }
            .action-btn.close:hover { color: #fbbf24; background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.2); }
            .action-btn.delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }

            section, footer { transition: background-color .3s; }
            .db-card, .hp-card, .db-tab, .db-btn-primary { transition: background-color .25s, border-color .25s, box-shadow .25s, transform .25s; }
        `}</style>
    );
}
