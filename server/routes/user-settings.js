import express from 'express';
import db from '../apis/db.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const query = `
            SELECT currency, preferred_shipping_address, preferred_payment_method
            FROM accounts 
            WHERE id = ?
        `;
        
        const [rows] = await db.execute(query, [userId]);
        
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
    try {
        
        const { userId } = req.params;
        const { currency, preferred_shipping_address, preferred_payment_method } = req.body;
        
        if (!currency || !preferred_shipping_address || !preferred_payment_method) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body,
                required: ['currency', 'preferred_shipping_address', 'preferred_payment_method']
            });
        }
        
        const checkQuery = 'SELECT id FROM accounts WHERE id = ?';
        const [existingUser] = await db.execute(checkQuery, [userId]);
        
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updateQuery = `
            UPDATE accounts 
            SET currency = ?, preferred_shipping_address = ?, preferred_payment_method = ?
            WHERE id = ?
        `;

        await db.execute(updateQuery, [currency, preferred_shipping_address, preferred_payment_method, userId]);
        
        const selectQuery = `
            SELECT currency, preferred_shipping_address, preferred_payment_method
            FROM accounts 
            WHERE id = ?
        `;
        
        const [rows] = await db.execute(selectQuery, [userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found after update' });
        }
        
        res.json(rows[0]);
        
    } catch (error) {
        console.error('❌ Error updating user settings:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;