import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
}

router.get('/recent', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT o.*, a.first_name, a.last_name, a.email, a.phone_number
            FROM orders o
            JOIN accounts a ON o.account_id = a.id
            ORDER BY o.created_at DESC
        `);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching recent orders:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/details/:order_id', async (req, res) => {
    try {
        const [orders] = await pool.query(`
            SELECT 
                o.*,
                a.phone_number,
                a.name as customer_name
            FROM orders o
            JOIN accounts a ON o.account_id = a.id
            WHERE o.id = ?
        `, [req.params.order_id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(orders[0]);
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:account_id', async (req, res) => {
    try {
        const { account_id } = req.params;

        const [orders] = await pool.query(
            `
                SELECT o.*, a.first_name, a.last_name, a.email, a.phone_number
                FROM orders o 
                JOIN accounts a ON o.account_id = a.id
                WHERE o.account_id = ?
                ORDER BY o.created_at DESC
            `,
            [account_id]
        ).catch(err => {
            console.error('Database error fetching orders:', err);
            throw new Error('Failed to fetch orders');
        });

        if (!orders || !Array.isArray(orders)) {
            return res.status(404).json({ error: 'No orders found' });
        }

        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                try {
                    const [orderItems] = await pool.query(
                        `
                            SELECT oi.*, p.label, p.image_url, p.category_id, p.subcategory_id
                            FROM order_items oi
                            LEFT JOIN products p ON oi.product_id = p.id
                            WHERE oi.order_id = ?
                        `,
                        [order.id]
                    );

                    return {
                        ...order,
                        item_count: orderItems.length,
                        items: orderItems.map(item => ({
                            product_id: item.product_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total_price: item.total_price,
                            label: item.label,
                            image_url: item.image_url,
                            category_id: item.category_id,
                            subcategory_id: item.subcategory_id
                        }))
                    };
                } catch (itemError) {
                    console.error(`Error fetching items for order ${order.id}:`, itemError);
                    return {
                        ...order,
                        item_count: 0,
                        items: [],
                        error: 'Failed to fetch order items'
                    };
                }
            })
        );

        res.json(ordersWithItems);

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch orders',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/:order_id/items', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT oi.*, p.label, p.price, p.category_id, p.subcategory_id, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [req.params.order_id]);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching order items:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:order_id/status', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { status, admin_id, notes } = req.body;
        const orderId = req.params.order_id;

        const [currentOrder] = await connection.query(
            `SELECT id, status FROM orders WHERE id = ?`,
            [orderId]
        );

        if (currentOrder.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        await connection.query(`
            UPDATE orders
            SET status = ?, 
                admin_notes = CASE 
                    WHEN ? IS NOT NULL AND ? != '' 
                    THEN CONCAT(COALESCE(admin_notes, ''), '\n', ?) 
                    ELSE admin_notes 
                END,
                modified_by = ?, 
                modified_at = NOW()
            WHERE id = ?
        `, [status, notes, notes, notes, admin_id, orderId]);

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating order status:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { account_id, items, total_amount, shipping_address_id, billing_address_id, payment_method, notes } = req.body;

        console.log(shipping_address_id, billing_address_id);

        const [userResult] = await connection.query(
            'SELECT first_name, last_name, email FROM accounts WHERE id = ?',
            [account_id]
        );

        if (userResult.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult[0];

        const orderNumber = generateOrderNumber();

        const [result] = await connection.query(`
            INSERT INTO orders (
                order_number, account_id, first_name, last_name, email, 
                total_amount, shipping_address_id, billing_address_id, payment_method, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [ orderNumber, account_id, user.first_name, user.last_name, user.email, total_amount, shipping_address_id, billing_address_id, payment_method, notes, account_id ]);

        const orderId = result.insertId;

        if (items && items.length > 0) {
            for (const item of items) {
                await connection.query(`
                    INSERT INTO order_items (
                        order_id, product_id, quantity, price, total_amount, image_url
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    orderId, item.product_id, item.quantity, 
                    item.price, item.quantity * item.price, item.image_url
                ]);

                await connection.query(
                    `
                        UPDATE products
                        SET stock_quantity = stock_quantity - ?
                        WHERE id = ?
                    `,
                    [ item.quantity, item.product_id ]
                )

            }
        }

        await connection.commit();
        res.status(201).json({ 
            order_id: orderId,
            order_number: orderNumber,
            success: true
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error creating order:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/:order_id/refund', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { amount, reason, admin_id, notes } = req.body;
        const orderId = req.params.order_id;

        const [currentOrder] = await connection.query(
            `SELECT id, total_amount, payment_method FROM orders WHERE id = ?`,
            [orderId]
        );

        if (currentOrder.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        await connection.query(`
            INSERT INTO order_refunds 
            (order_id, refund_amount, reason, reason_description, refund_method, notes, processed_by, processed_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'completed')
        `, [
            orderId, 
            amount, 
            reason, 
            notes,  
            currentOrder[0].payment_method,
            notes, 
            admin_id 
        ]);

        await connection.query(`
            UPDATE orders 
            SET status = 'refunded', 
                admin_notes = CONCAT(IFNULL(admin_notes, ''), '\nRefund processed: ₱', ?, ' - Reason: ', ?),
                modified_by = ?, 
                modified_at = NOW()
            WHERE id = ?
        `, [amount, reason, admin_id, orderId]);

        await connection.commit();
        res.json({ 
            success: true, 
            message: 'Refund processed successfully' 
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error processing refund:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.delete('/:order_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { order_id } = req.params;

        const [orderCheck] = await connection.query(
            `SELECT id FROM orders WHERE id = ?`,
            [order_id]
        );

        if (orderCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        await connection.query(
            `DELETE FROM order_items WHERE order_id = ?`,
            [order_id]
        );

        await connection.query(
            `DELETE FROM orders WHERE id = ?`,
            [order_id]
        );

        await connection.commit();
        res.json({ message: 'Order deleted successfully' });

    } catch (err) {
        await connection.rollback();
        console.error('Error deleting order:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

export default router;