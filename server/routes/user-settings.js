import express from 'express';
import pool from '../apis/db.js';

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
        
        const updateQuery = `
            UPDATE accounts 
            SET currency = ?, preferred_shipping_address = ?, preferred_payment_method = ?
            WHERE id = ?
        `;

        await connection.execute(updateQuery, [currency, preferred_shipping_address, preferred_payment_method, userId]);

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

        await connection.commit();
        
        res.json({
            message: 'Preferences updated successfully',
            settings: rows[0]
        });
        
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        connection.release();
    }
});

export default router;