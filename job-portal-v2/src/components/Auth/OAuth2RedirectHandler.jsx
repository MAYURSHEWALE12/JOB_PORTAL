import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const setUser = useAuthStore((state) => state.setUser);
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (token) {
            const user = {
                id: params.get('userId'),
                email: decodeURIComponent(params.get('email') || ''),
                firstName: decodeURIComponent(params.get('firstName') || ''),
                lastName: decodeURIComponent(params.get('lastName') || ''),
                role: params.get('role'),
                profileImageUrl: params.get('profileImageUrl') ? decodeURIComponent(params.get('profileImageUrl')) : null,
            };

            setUser(user, token);
            toast.success('Successfully logged in with Google!');
            navigate('/dashboard', { replace: true });
        } else if (error) {
            toast.error(decodeURIComponent(error));
            navigate('/login', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [location, navigate, setUser]);


    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)]">
            <div className="flex flex-col items-center gap-4">
                <div className="spinner"></div>
                <p className="text-[var(--color-text-muted)] font-medium">Completing your login...</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;
