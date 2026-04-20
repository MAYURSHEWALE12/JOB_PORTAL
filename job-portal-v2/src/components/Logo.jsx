import { useState, useEffect } from "react";

const style = `
@keyframes spin-ring {
  from { stroke-dashoffset: 220; }
  to   { stroke-dashoffset: 0; }
}
@keyframes fill-icon {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes slide-in {
  0%   { opacity: 0; transform: translateX(-12px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes slide-hire {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slide-hub {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes fade-tagline {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes shimmer {
  0%   { stroke-dashoffset: 300; opacity: 1; }
  80%  { stroke-dashoffset: 0;   opacity: 1; }
  100% { stroke-dashoffset: 0;   opacity: 0; }
}
@keyframes pulse-ring {
  0%,100% { opacity: 0.3; transform: scale(1);   }
  50%      { opacity: 0.7; transform: scale(1.08); }
}
.spin-ring   { animation: spin-ring 1.1s cubic-bezier(.6,.05,.4,.95) forwards; }
.shimmer-ring{ animation: shimmer  1.1s cubic-bezier(.6,.05,.4,.95) forwards; }
.pulse-ring  { animation: pulse-ring 0.9s ease-in-out infinite; }
.fill-icon   { animation: fill-icon  0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
.slide-in    { animation: slide-in   0.5s cubic-bezier(.34,1.2,.64,1) forwards; }
.slide-hire  { animation: slide-hire 0.4s cubic-bezier(.34,1.3,.64,1) forwards; }
.slide-hub   { animation: slide-hub  0.4s cubic-bezier(.34,1.3,.64,1) 0.1s forwards; opacity:0; }
.fade-tag    { animation: fade-tagline 0.5s ease forwards; opacity:0; }
`;

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

const BriefcaseIcon = ({ visible }) => (
  <svg
    width="100%" height="100%"
    viewBox="0 0 40 40" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "scale(1)" : "scale(0.6)",
      transition: "opacity 0.45s cubic-bezier(.34,1.56,.64,1), transform 0.45s cubic-bezier(.34,1.56,.64,1)",
    }}
  >
    <rect x="3" y="14" width="34" height="22" rx="4" fill="#2dd4bf" />
    <rect x="14" y="9" width="12" height="8" rx="2.5" stroke="#2dd4bf" strokeWidth="2.5" fill="none" />
    <line x1="3" y1="24" x2="37" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <rect x="17" y="22" width="6" height="4" rx="1" fill="white" />
  </svg>
);

const LoadingRing = ({ phase }) => {
  const r = 26;
  const circ = 2 * Math.PI * r;

  return (
    <svg
      width="80" height="80" viewBox="0 0 80 80" fill="none"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <circle cx="40" cy="40" r={r} stroke="#2dd4bf" strokeWidth="2" opacity="0.12" />

      {phase === "spinning" && (
        <circle
          cx="40" cy="40" r={r}
          stroke="#2dd4bf" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          style={{
            transformOrigin: "40px 40px",
            animation: "spin-ring 1s linear infinite",
          }}
          transform="rotate(-90 40 40)"
        />
      )}

      {phase === "completing" && (
        <circle
          cx="40" cy="40" r={r}
          stroke="#2dd4bf" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          style={{
            transformOrigin: "40px 40px",
            animation: "spin-ring 0.6s cubic-bezier(.6,.05,.4,.95) forwards",
          }}
          transform="rotate(-90 40 40)"
        />
      )}

      {phase === "done" && (
        <g style={{ animation: "fill-icon 0.4s ease forwards" }}>
          <circle cx="40" cy="40" r={r} stroke="#2dd4bf" strokeWidth="2.5" opacity="0.4" />
          <polyline
            points="28,40 36,48 52,32"
            stroke="#2dd4bf" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
};

// Animated Logo with auto dark/light mode detection
const AnimatedLogo = ({ size = "md", showTagline = false, replay = 0, onClick }) => {
  const isDark = useDarkMode();
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    setPhase("loading");
    
    const t1 = setTimeout(() => setPhase("completing"), 1600);
    const t2 = setTimeout(() => setPhase("icon"), 2200);
    const t3 = setTimeout(() => setPhase("text"), 2700);
    const t4 = setTimeout(() => setPhase("tagline"), 3100);
    const t5 = setTimeout(() => setPhase("done"), 3700);
    
    return () => clearTimeout(t1, t2, t3, t4, t5);
  }, [replay]);

  const iconVisible    = ["icon","text","tagline","done"].includes(phase);
  const textVisible    = ["text","tagline","done"].includes(phase);
  const taglineVisible = ["tagline","done"].includes(phase);
  const ringPhase      = phase === "loading"    ? "spinning"
                       : phase === "completing" ? "completing"
                       : phase === "icon"       ? "done"
                       : null;

  const sizeMap = {
    sm: { icon: 56, text: "1.25rem", gap: 8, tagline: "0.5rem" },
    md: { icon: 40, text: "1.25rem", gap: 6, tagline: "0.5rem" },
    lg: { icon: 56, text: "1.5rem", gap: 8, tagline: "0.625rem" },
  };
  const s = sizeMap[size];

  // Auto-detect theme colors based on dark mode
  const colors = isDark 
    ? { hire: "#ffffff", hub: "#2dd4bf", tag: "rgba(255,255,255,0.4)" }
    : { hire: "#0f0f0f", hub: "#2dd4bf", tag: "rgba(0,0,0,0.4)" };

  return (
    <div 
      onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: s.gap, cursor: onClick ? 'pointer' : 'default' }}
      className="logo-container"
    >
      <style>{style}</style>
      <div style={{ position: "relative", width: s.icon, height: s.icon, flexShrink: 0 }}>
        {(phase === "loading" || phase === "completing") && (
          <div className="pulse-ring" style={{
            position: "absolute", inset: "14%",
            borderRadius: "30%",
            background: "rgba(45,212,191,0.12)",
          }} />
        )}

        <div style={{ position: "absolute", inset: "18%" }}>
          <BriefcaseIcon visible={iconVisible} />
        </div>

        {ringPhase && (
          <div style={{
            position: "absolute", inset: 0,
            width: s.icon, height: s.icon,
            transform: `scale(${s.icon / 80})`,
            transformOrigin: "top left",
          }}>
            <LoadingRing phase={ringPhase} />
          </div>
        )}
      </div>

      {textVisible && (
        <div className="slide-in" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1, display: "flex" }}>
            <span className="slide-hire" style={{
              fontSize: s.text, fontWeight: 900, color: colors.hire,
              fontFamily: "inherit",
            }}>Hire</span>
            <span className="slide-hub" style={{
              fontSize: s.text, fontWeight: 900, color: colors.hub,
              fontFamily: "inherit",
            }}>Hub</span>
          </div>
          {showTagline && taglineVisible && (
            <span className="fade-tag" style={{
              fontSize: s.tagline,
              color: colors.tag,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: 3,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              Find your next role
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Static Briefcase Icon
const StaticBriefcaseIcon = ({ className = "" }) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="14" width="34" height="22" rx="4" fill="currentColor" />
    <rect x="14" y="9" width="12" height="8" rx="2.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
    <line x1="3" y1="24" x2="37" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <rect x="17" y="22" width="6" height="4" rx="1" fill="white" />
  </svg>
);

const sizes = {
  sm: { icon: "w-6 h-6", text: "text-lg", gap: "gap-1.5" },
  md: { icon: "w-8 h-8", text: "text-xl", gap: "gap-2" },
  lg: { icon: "w-10 h-10", text: "text-2xl", gap: "gap-2.5" },
};

// Static Logo with auto dark/light mode
const StaticLogo = ({ size = "md", onClick, className = "" }) => {
  const isDark = useDarkMode();
  const s = sizes[size];

  return (
    <div onClick={onClick} className={`inline-flex items-center ${s.gap} cursor-pointer ${className}`}>
      <div className={`${s.icon} flex-shrink-0 text-[var(--color-primary)]`}>
        <StaticBriefcaseIcon />
      </div>
      <span className={`${s.text} font-black leading-none tracking-tight font-sans`} style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <span className={isDark ? "text-white" : "text-[#0f0f0f]"}>Hire</span>
        <span className="text-[var(--color-primary)]">Hub</span>
      </span>
    </div>
  );
};

// Default export - AnimatedLogo with auto dark/light mode
export default AnimatedLogo;
export { StaticLogo, AnimatedLogo };
