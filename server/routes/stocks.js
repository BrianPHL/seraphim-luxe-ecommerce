import express from 'express';
import pool from '../apis/db.js';
import { AuditLogger } from '../utils/audit-trail.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/history', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sh.*, 
                   p.label as product_name, 
                   p.category_id,
                   a.first_name, a.last_name
            FROM stocks_history sh
            JOIN products p ON sh.product_id = p.id
            JOIN accounts a ON sh.admin_id = a.id
            ORDER BY sh.created_at DESC
            LIMIT 100
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching stock history:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/low', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM products
            WHERE stock_quantity <= stock_threshold
            ORDER BY (stock_threshold - stock_quantity) DESC
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching low stock products:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/status-count', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                COUNT(CASE WHEN stock_status = 'in_stock' THEN 1 END) as in_stock_count,
                COUNT(CASE WHEN stock_status = 'low_stock' THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN stock_status = 'out_of_stock' THEN 1 END) as out_of_stock_count
            FROM products
        `);
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching stock status counts:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:product_id', requireAdmin, async (req, res) => {
    try {
        const { product_id } = req.params;
        const { stock_quantity, stock_threshold } = req.body;
        const admin_id = req.user?.id || req.body?.admin_id;

        // Get old stock values first
        const [oldData] = await pool.query(
            'SELECT stock_quantity, stock_threshold FROM products WHERE id = ?',
            [product_id]
        );

        if (oldData.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const [result] = await pool.query(
            'UPDATE products SET stock_quantity = ?, stock_threshold = ? WHERE id = ?',
            [stock_quantity, stock_threshold, product_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Log stock update
        await AuditLogger.logAdminStockUpdate(
            admin_id, 
            product_id, 
            oldData[0].stock_quantity, 
            stock_quantity, 
            req
        );

        res.json({ message: 'Stock updated successfully' });
    } catch (err) {
        console.error('Error updating stock:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:product_id/stock', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT stock_quantity FROM products WHERE id = ?',
            [req.params.product_id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error checking product stock:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/add', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { product_id, quantity_change, new_threshold, notes } = req.body;
        const admin_id = req.user?.id || req.body?.admin_id; // Get admin_id
        
        // Validate admin_id
        if (!admin_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'Admin ID is required' });
        }
        
        const [currentProduct] = await connection.query(
            'SELECT stock_quantity, stock_threshold, label FROM products WHERE id = ?',
            [product_id]
        );
        
        if (!currentProduct || currentProduct.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const previousQuantity = currentProduct[0].stock_quantity;
        const previousThreshold = currentProduct[0].stock_threshold;
        const newQuantity = previousQuantity + quantity_change;
        const finalThreshold = new_threshold || previousThreshold;
        
        const [productResult] = await connection.query(
            `
            UPDATE products 
            SET stock_quantity = ?, 
                stock_threshold = IFNULL(?, stock_threshold),
                stock_status = CASE
                    WHEN ? <= 0 THEN 'out_of_stock'
                    WHEN ? <= IFNULL(?, stock_threshold) THEN 'low_stock'
                    ELSE 'in_stock'
                END,
                modified_at = NOW()
            WHERE id = ?
            `,
            [
                newQuantity, 
                new_threshold, 
                newQuantity, 
                newQuantity, 
                new_threshold, 
                product_id
            ]
        );

        await connection.query(
            `
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
            `,
            [
                product_id, 
                'restock',
                quantity_change, 
                previousQuantity,
                newQuantity,
                notes,
                admin_id
            ]
        );
        
        await connection.commit();
        
        // Add audit logging here
        try {
            await AuditLogger.logAdminStockUpdate(
                admin_id,
                product_id,
                previousQuantity,
                newQuantity,
                req,
                {
                    action_type: 'admin_stock_restock',
                    details: `Stock restocked: ${quantity_change > 0 ? '+' : ''}${quantity_change} units. ${notes ? `Notes: ${notes}` : ''}`,
                    old_values: {
                        stock_quantity: previousQuantity,
                        stock_threshold: previousThreshold
                    },
                    new_values: {
                        stock_quantity: newQuantity,
                        stock_threshold: finalThreshold,
                        quantity_change: quantity_change
                    }
                }
            );
        } catch (auditError) {
            console.error('Error logging audit trail:', auditError);
            // Don't fail the request if audit logging fails
        }
        
        res.json({ 
            message: 'Stock updated successfully',
            product_id,
            previousQuantity,
            newQuantity
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating stock:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

export default router;
