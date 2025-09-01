import { useAuth } from "@contexts";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

const ProtectedRoute = ({ children, requiresAdmin = false }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        
        if (loading) return;
        
        const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';
        const isAdminRoute = location.pathname.startsWith('/admin');
        const isCustomerRoute = ['/profile', '/cart', '/checkout', '/orders'].includes(location.pathname);
        const isPublicRoute = ['/', '/about-us', '/collections'].includes(location.pathname) || location.pathname.startsWith('/collections/') || isAdminRoute;

        if (location.pathname === '/profile' && new URLSearchParams(location.search).get('redirect') === 'yes')
            return;

        if (!user) {
            if (isAdminRoute) {
                navigate('/admin');
            } else {
                navigate('/sign-in');
            }
            return;
        }

        if (user && isAuthPage) {
            user.role === 'admin'
                ? navigate('/admin/dashobard')
                : navigate('/')
            return;
        }

        if (user && location.pathname === '/admin' && user.role === 'admin') {
            navigate('/admin/dashboard');
            return;
        }

        if (user && isAdminRoute && user.role !== 'admin') {
            navigate('/');
            return;
        }

        if (user && user.role === 'admin' && !isAdminRoute) {
            navigate('/admin/dashboard');
            return;
        }

    }, [user, loading, navigate, location.pathname]);

    if (loading) return null;

    if (location.pathname === '/profile' && new URLSearchParams(location.search).get('redirect') === 'yes')
        return children;

    const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up';
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isCustomerRoute = ['/profile', '/cart', '/checkout', '/orders'].includes(location.pathname);
    const isPublicRoute = ['/', '/about-us', '/collections'].includes(location.pathname) || location.pathname.startsWith('/collections/') || isAdminRoute;

    if (!user && !isAuthPage && !isPublicRoute) return null;
    if (user && isAuthPage) return null;
    if (user && isAdminRoute && user.role !== 'admin') return null;
    
    if (user && user.role === 'admin' && !isAdminRoute) {
        return null;
    }

    return children;
};

export default ProtectedRoute;
