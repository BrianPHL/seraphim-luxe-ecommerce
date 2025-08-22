import { useAuth } from "@contexts";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const AdminRoute = ({ children }) => {

    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {

        if (loading) return;

        if (!user) {
            navigate('/sign-in');
            return;
        }

        if (user.role !== 'admin') {
            navigate('/');
            return;
        }

    }, [ user, loading, navigate ]);

    if (loading)
        return null;
    
    if (!user || user.role !== 'admin')
        return null;

    return children;

};

export default AdminRoute;
