import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, r.preferred_date, a.first_name, a.last_name, a.email
            FROM installments i
            JOIN reservations r ON i.reservation_id = r.reservation_id
            JOIN accounts a ON r.account_id = a.account_id
            WHERE i.status = 'pending'
            ORDER BY i.created_at DESC
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching pending installments:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/pending/count', async (req, res) => {
    try {
        const [result] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM installments 
            WHERE status = 'pending'
        `);
        
        res.json({ count: result[0].count });
    } catch (err) {
        console.error('Error counting pending installments:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:account_id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, r.preferred_date, r.status as reservation_status 
            FROM installments i
            JOIN reservations r ON i.reservation_id = r.reservation_id
            WHERE r.account_id = ?
            ORDER BY i.created_at DESC
        `, [req.params.account_id]);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching installments:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:installment_id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { installment_id } = req.params;
        const { status, admin_id, notes } = req.body;
        
        if (status !== 'completed' && status !== 'rejected') {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid status. Must be "completed" or "rejected"' });
        }
        
        const [installments] = await connection.query(
            `SELECT i.*, r.status as reservation_status, r.account_id 
             FROM installments i
             JOIN reservations r ON i.reservation_id = r.reservation_id
             WHERE i.id = ?`,
            [installment_id]
        );
        
        if (installments.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Installment not found' });
        }
        
        const installment = installments[0];
        
        if (installment.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: 'Can only process pending installments' });
        }
        
        await connection.query(
            `UPDATE installments 
             SET status = ?, admin_id = ?, notes = IFNULL(?, notes), processed_at = NOW() 
             WHERE id = ?`,
            [status, admin_id, notes, installment_id]
        );
        
        if (status === 'completed') {
            
            await connection.query(
                `UPDATE reservations SET status = 'pending' WHERE reservation_id = ?`,
                [installment.reservation_id]
            );
            
            const [products] = await connection.query(
                `SELECT rp.product_id, rp.quantity, p.stock_quantity
                 FROM reservation_products rp
                 JOIN products p ON rp.product_id = p.product_id
                 WHERE rp.reservation_id = ?`,
                [installment.reservation_id]
            );
            
            for (const product of products) {
                
                if (product.stock_quantity < product.quantity) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        error: `Not enough stock for product ID ${product.product_id}` 
                    });
                }
                
                const previousQuantity = product.stock_quantity;
                const newQuantity = previousQuantity - product.quantity;
                
                await connection.query(
                    `UPDATE products 
                     SET stock_quantity = stock_quantity - ?, modified_at = NOW()
                     WHERE product_id = ?`,
                    [product.quantity, product.product_id]
                );
                
                await connection.query(`
                    INSERT INTO stocks_history (
                        product_id,
                        stock_history_type,
                        quantity_change,
                        previous_quantity,
                        new_quantity,
                        notes,
                        admin_id,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    product.product_id,
                    'reservation',
                    -product.quantity,
                    previousQuantity,
                    newQuantity,
                    `Approved installment for reservation #${installment.reservation_id}`,
                    admin_id,
                    product.product_id
                ]);
            }
        } else if (status === 'rejected') {
            
            await connection.query(
                `UPDATE reservations SET status = 'rejected', modified_at = NOW() 
                 WHERE reservation_id = ?`,
                [installment.reservation_id]
            );

        }
        
        await connection.commit();
        res.json({ success: true, status });
        
    } catch (err) {
        await connection.rollback();
        console.error('Error processing installment:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

export default router;
