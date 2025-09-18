import express from 'express';
import pool from '../apis/db.js';
import { AuditLogger } from '../utils/audit-trail.js';
import { requireAdmin } from '../middleware/auth.js'; // Only needed for admin routes

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const query = `
            SELECT currency, preferred_shipping_address, preferred_payment_method
            FROM accounts 
            WHERE id = ?
        `;
        
        const [rows] = await pool.execute(query, [userId]);
        
        if (rows.length === 0) {
            const defaultSettings = {
                currency: 'PHP',
                preferred_shipping_address: 'home',
                preferred_payment_method: 'cash_on_delivery'
            };
            return res.json(defaultSettings);
        }
        
        const settings = rows[0];
        res.json(settings);
        
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Regular user route - NO requireAdmin middleware
router.put('/:userId', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId } = req.params;
        const { currency, preferred_shipping_address, preferred_payment_method } = req.body;
        
        if (!currency || !preferred_shipping_address || !preferred_payment_method) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body,
                required: ['currency', 'preferred_shipping_address', 'preferred_payment_method']
            });
        }
        
        // Check if user exists and get old preferences
        const checkQuery = `
            SELECT id, currency, preferred_shipping_address, preferred_payment_method 
            FROM accounts 
            WHERE id = ?
        `;
        const [existingUser] = await connection.execute(checkQuery, [userId]);
        
        if (existingUser.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        // Store old values for audit logging
        const oldValues = {
            currency: existingUser[0].currency,
            preferred_shipping_address: existingUser[0].preferred_shipping_address,
            preferred_payment_method: existingUser[0].preferred_payment_method
        };

        // New values for comparison
        const newValues = {
            currency,
            preferred_shipping_address,
            preferred_payment_method
        };
        
        const updateQuery = `
            UPDATE accounts 
            SET currency = ?, preferred_shipping_address = ?, preferred_payment_method = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const [updateResult] = await connection.execute(updateQuery, [
            currency, 
            preferred_shipping_address, 
            preferred_payment_method, 
            userId
        ]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Failed to update user settings' });
        }
        
        await connection.commit();

        // Log preferences update in audit trail (customer action)
        try {
            await AuditLogger.log({
                user_id: userId,
                action_type: 'profile_preferences_update',
                resource_type: 'user_settings',
                resource_id: userId,
                old_values: oldValues,
                new_values: newValues,
                details: 'User preferences updated',
                req
            });
        } catch (auditError) {
            console.error('Error logging audit trail:', auditError);
            // Don't fail the request if audit logging fails
        }

        // Get updated settings to return
        const selectQuery = `
            SELECT currency, preferred_shipping_address, preferred_payment_method
            FROM accounts 
            WHERE id = ?
        `;
        
        const [rows] = await connection.execute(selectQuery, [userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found after update' });
        }
        
        res.json({
            message: 'Preferences updated successfully',
            settings: rows[0]
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error updating user settings:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        connection.release();
    }
});

router.put('/:userId/admin-update', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId } = req.params;
        const { currency, preferred_shipping_address, preferred_payment_method } = req.body;
        const admin_id = req.user?.id;

        if (!admin_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'Admin ID is required' });
        }
        
        if (!currency || !preferred_shipping_address || !preferred_payment_method) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body,
                required: ['currency', 'preferred_shipping_address', 'preferred_payment_method']
            });
        }
        
        // Check if user exists and get old preferences
        const checkQuery = `
            SELECT id, currency, preferred_shipping_address, preferred_payment_method 
            FROM accounts 
            WHERE id = ?
        `;
        const [existingUser] = await connection.execute(checkQuery, [userId]);
        
        if (existingUser.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        // Store old values for audit logging
        const oldValues = {
            currency: existingUser[0].currency,
            preferred_shipping_address: existingUser[0].preferred_shipping_address,
            preferred_payment_method: existingUser[0].preferred_payment_method
        };

        // New values for comparison
        const newValues = {
            currency,
            preferred_shipping_address,
            preferred_payment_method
        };
        
        const updateQuery = `
            UPDATE accounts 
            SET currency = ?, preferred_shipping_address = ?, preferred_payment_method = ?, updated_at = NOW()
            WHERE id = ?
        `;

        const [updateResult] = await connection.execute(updateQuery, [
            currency, 
            preferred_shipping_address, 
            preferred_payment_method, 
            userId
        ]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Failed to update user settings' });
        }
        
        await connection.commit();

        // Log admin update in audit trail
        try {
            await AuditLogger.logPreferencesUpdate(
                userId,
                oldValues,
                newValues,
                req
            );
        } catch (auditError) {
            console.error('Error logging audit trail:', auditError);
            // Don't fail the request if audit logging fails
        }

        // Get updated settings to return
        const selectQuery = `
            SELECT currency, preferred_shipping_address, preferred_payment_method
            FROM accounts 
            WHERE id = ?
        `;
        
        const [rows] = await connection.execute(selectQuery, [userId]);
        
        res.json({
            message: 'User preferences updated successfully by admin',
            settings: rows[0]
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error updating user settings (admin):', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        connection.release();
    }
});

export default router;