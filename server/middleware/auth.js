import { auth } from '../apis/better-auth.js';

export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session?.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        req.user = session.user;
        req.session = session;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid session' });
    }
};

export const requireAdmin = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session || !session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = session.user
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        return res.status(401).json({ error: 'Invalid session' });
    }
};