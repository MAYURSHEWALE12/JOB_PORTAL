import { getImageUrl } from '../services/api';

export default function UserAvatar({ user, size = 'md', className = '' }) {
    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
    const avatarUrl = user?.profileImageUrl ? getImageUrl(user.profileImageUrl) : null;

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-lg',
        xl: 'w-24 h-24 text-3xl',
    };

    return (
        <div className={`${sizeClasses[size]} bg-stone-100 border-[2px] border-stone-900 dark:border-stone-700 flex items-center justify-center font-black text-stone-900 dark:text-white overflow-hidden flex-shrink-0 shadow-[2px_2px_0_#000] ${className}`}>
            {avatarUrl ? (
                <img src={avatarUrl} alt={`${user?.firstName} ${user?.lastName}`} className="w-full h-full object-cover" loading="lazy" />
            ) : (
                initials
            )}
        </div>
    );
}
