import { resolvePublicUrl } from '../services/api';

export default function CompanyAvatar({ job, name: fallbackName, logoUrl: fallbackLogoUrl, size = 'md', className = '' }) {
    const rawUrl = job?.companyLogo || job?.employer?.companyProfile?.logoUrl || job?.employer?.profileImageUrl || fallbackLogoUrl;
    const url = resolvePublicUrl(rawUrl);
    const name = job?.companyName || job?.employer?.companyProfile?.companyName || job?.employer?.firstName || fallbackName || 'J';
    
    const dim = size === 'lg'
        ? 'w-14 h-14 text-xl rounded-2xl'
        : size === 'sm'
        ? 'w-9 h-9 text-sm rounded-lg'
        : 'w-11 h-11 text-base rounded-xl';

    return url ? (
        <img
            src={url} alt={name}
            className={`${dim} object-cover flex-shrink-0 border border-white/10 ${className}`}
            onError={e => { e.target.style.display = 'none'; }}
        />
    ) : (
        <div
            className={`${dim} flex-shrink-0 flex items-center justify-center font-bold text-white ${className}`}
            style={{ background: 'linear-gradient(135deg, var(--hp-accent), var(--hp-accent2))' }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}
