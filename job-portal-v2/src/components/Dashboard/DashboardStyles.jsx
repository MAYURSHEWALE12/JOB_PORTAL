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
                backdrop-filter: blur(22px);
                -webkit-backdrop-filter: blur(22px);
                border-bottom: 1px solid var(--hp-border);
            }

            .db-tabbar {
                background: var(--hp-nav-bg);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                border-bottom: 1px solid var(--hp-border);
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
                margin-top: 88px;
                padding: 28px 20px 32px;
            }

            @media (max-width: 640px) {
                .db-content { margin-top: 82px; padding: 16px 12px 24px; }
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

            section, footer { transition: background .3s; }
            *, *::before, *::after { transition: background-color .25s, border-color .25s, color .25s; }
            .db-btn-primary { transition: opacity .2s, transform .2s, box-shadow .2s; }
        `}</style>
    );
}
