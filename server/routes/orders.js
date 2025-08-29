import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/:account_id', async (req, res) => {
    try {
        const { account_id } = req.params;
        
        // Validate account_id
        if (!account_id) {
            return res.status(400).json({ error: 'Account ID is required' });
        }

        // Get orders with error handling
        const [orders] = await pool.query(
            `
                SELECT * FROM orders 
                WHERE account_id = ? 
                ORDER BY created_at DESC
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
                            SELECT oi.*, p.label, p.image_url, p.category, p.subcategory
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
                            category: item.category,
                            subcategory: item.subcategory
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

router.post('/', async (req, res) => {

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { 
            order_number, 
            account_id, 
            items, 
            payment_method, 
            shipping_address, 
            billing_address, 
            notes, 
            subtotal, 
            shipping_fee = 0, 
            tax = 0, 
            discount = 0,
            total_amount 
        } = req.body;

        const finalTotalAmount = total_amount || (subtotal + shipping_fee + tax - discount);

        const [orderResult] = await connection.query(
            `
                INSERT INTO orders (
                    order_number, account_id, payment_method, subtotal, 
                    shipping_fee, tax, discount, total_amount, 
                    shipping_address, billing_address, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                order_number, 
                account_id, 
                payment_method, 
                subtotal, 
                shipping_fee, 
                tax, 
                discount, 
                finalTotalAmount, 
                shipping_address,
                billing_address, 
                notes
            ]
        );
        
        const orderId = orderResult.insertId;
        
        for (const item of items) {

            if (!item.product_id || !item.quantity || !item.price) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Invalid item data: missing product_id, quantity, or price`
                });
            }

            const [stockCheck] = await connection.query(
                `
                    SELECT stock_quantity
                    FROM products
                    WHERE id = ?
                `,
                [item.product_id]
            );
            
            if (!stockCheck.length || stockCheck[0].stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    error: `Insufficient stock for product ID ${item.product_id}`
                });
            }
            
            const itemTotal = item.total || (item.price * item.quantity);
            
            await connection.query(
                `
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?)
                `,
                [orderId, item.product_id, item.quantity, item.price, itemTotal]
            );
            
            const previousQuantity = stockCheck[0].stock_quantity;
            const newQuantity = previousQuantity - item.quantity;
            
            await connection.query(
                `
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ?, modified_at = NOW()
                    WHERE id = ?
                `,
                [item.quantity, item.product_id]
            );

            await connection.query(
                `
                    INSERT INTO stocks_history (
                        product_id, stock_history_type, quantity_change,
                        previous_quantity, new_quantity, notes, admin_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    item.product_id, 
                    'order', 
                    -item.quantity, 
                    previousQuantity, 
                    newQuantity, 
                    `Order #${order_number}`, 
                    account_id
                ]
            );
        }
        
        await connection.query(
            `
                INSERT INTO order_tracking (order_id, status, notes, updated_by)
                VALUES (?, 'pending', 'Order created', ?)
            `,
            [orderId, account_id]
        );
        
        await connection.commit();

        res.status(201).json({
            success: true,
            order_id: orderId,
            order_number
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

router.put('/:order_id/cancel', async (req, res) => {

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { order_id } = req.params;
        const { account_id } = req.body;
        
        const [order] = await connection.query(
            `
                SELECT *
                FROM orders
                WHERE id = ? AND account_id = ?
            `,
            [order_id, account_id]
        );
        
        if (!order.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order[0].status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Only pending orders can be cancelled' 
            });
        }

        const [orderItems] = await connection.query(
            `
                SELECT *
                FROM order_items
                WHERE order_id = ?
            `,
            [order_id]
        );

        for (const item of orderItems) {
            await connection.query(
                `
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ?, modified_at = NOW()
                    WHERE id = ?
                `,
                [item.quantity, item.product_id]
            );

            const [currentStock] = await connection.query(
                `
                    SELECT stock_quantity
                    FROM products
                    WHERE id = ?
                `,
                [item.product_id]
            );
            
            await connection.query(
                `
                    INSERT INTO stocks_history (
                        product_id, stock_history_type, quantity_change,
                        previous_quantity, new_quantity, notes, admin_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    item.product_id, 
                    'return', 
                    item.quantity, 
                    currentStock[0].stock_quantity - item.quantity, 
                    currentStock[0].stock_quantity, 
                    `Cancelled order #${order[0].order_number}`, 
                    account_id
                ]
            );
        }
        
        await connection.query(
            `
                UPDATE orders
                SET status = 'cancelled', modified_at = NOW()
                WHERE id = ?
            `,
            [order_id]
        );
        
        await connection.query(
            `
                INSERT INTO order_tracking (order_id, status, notes, updated_by)
                VALUES (?, 'cancelled', 'Order cancelled by customer', ?)
            `,
            [order_id, account_id]
        );
        
        await connection.commit();


        res.json({ success: true });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

export default router;