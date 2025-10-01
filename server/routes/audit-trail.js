import express from 'express';
import db from '../apis/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            user_id,
            action_type,
            resource_type,
            start_date,
            end_date,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        // Build WHERE conditions
        if (user_id) {
            whereConditions.push('at.user_id = ?');
            params.push(user_id);
        }

        if (action_type) {
            whereConditions.push('at.action_type = ?');
            params.push(action_type);
        }

        if (resource_type) {
            whereConditions.push('at.resource_type = ?');
            params.push(resource_type);
        }

        if (start_date) {
            whereConditions.push('DATE(at.created_at) >= ?');
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push('DATE(at.created_at) <= ?');
            params.push(end_date);
        }

        if (search) {
            whereConditions.push('(a.email LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ? OR at.details LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM audit_trail at
            LEFT JOIN accounts a ON at.user_id = a.id
            ${whereClause}
        `;

        const [countResult] = await db.query(countQuery, params);
        const totalItems = countResult[0].total;

        // Get audit trail data
        const dataQuery = `
            SELECT 
                at.*,
                a.email,
                a.first_name,
                a.last_name,
                a.role
            FROM audit_trail at
            LEFT JOIN accounts a ON at.user_id = a.id
            ${whereClause}
            ORDER BY at.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, parseInt(limit), parseInt(offset)];
        const [auditLogs] = await db.query(dataQuery, dataParams);

        res.json({
            logs: auditLogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching audit trail:', error);
        res.status(500).json({ error: 'Failed to fetch audit trail' });
    }
});

// Create audit log entry
router.post('/log', async (req, res) => {
    try {
        const {
            user_id,
            action_type,
            resource_type,
            resource_id,
            old_values,
            new_values,
            details
        } = req.body;

        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.get('User-Agent');
        const session_id = req.session?.id;

        const query = `
            INSERT INTO audit_trail (
                user_id, action_type, resource_type, resource_id,
                old_values, new_values, ip_address, user_agent,
                session_id, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            user_id || null,
            action_type,
            resource_type || null,
            resource_id || null,
            old_values ? JSON.stringify(old_values) : null,
            new_values ? JSON.stringify(new_values) : null,
            ip_address,
            user_agent,
            session_id || null,
            details || null
        ];

        await db.query(query, params);
        res.json({ success: true });

    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ error: 'Failed to create audit log' });
    }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                action_type,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM audit_trail 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY action_type, DATE(created_at)
            ORDER BY date DESC, count DESC
        `;

        const [stats] = await db.query(statsQuery);
        
        // Get recent activities count
        const recentQuery = `
            SELECT COUNT(*) as count
            FROM audit_trail 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;

        const [recentCount] = await db.query(recentQuery);

        res.json({
            stats,
            recentActivityCount: recentCount[0].count
        });

    } catch (error) {
        console.error('Error fetching audit statistics:', error);
        res.status(500).json({ error: 'Failed to fetch audit statistics' });
    }
});

export default router;