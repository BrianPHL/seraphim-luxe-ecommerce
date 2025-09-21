import pool from "../apis/db.js";
import express from 'express';
import { createCartActivity } from '../utils/inbox.js';
import { AuditLogger } from '../utils/audit-trail.js';

const router = express.Router();

router.get('/:account_id', async (req, res) => {
    
    try {

        const { account_id } = req.params;

        const [ rows ] = await pool.query(
          `
            SELECT 
                cart.*, 
                product.label, 
                product.price, 
                product.category_id, 
                product.subcategory_id, 
                product.image_url, 
                product.stock_quantity,
                pc.name as category,
                ps.name as subcategory
            FROM carts cart
            JOIN products product ON cart.product_id = product.id
            LEFT JOIN product_categories pc ON product.category_id = pc.id
            LEFT JOIN product_subcategories ps ON product.subcategory_id = ps.id
            WHERE cart.account_id = ?
          `,
          [ account_id ]  
        );
        
        res.json(rows);
    
    } catch (err) {
        console.error('carts route GET /:account_id endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }

});

router.post('/', async (req, res) => {
    try {
        const { account_id, product_id, quantity = 1 } = req.body;

        const [existCheck] = await pool.query(
            `SELECT EXISTS (
                SELECT 1 FROM carts WHERE account_id = ? AND product_id = ?
            ) as item_exists`,
            [account_id, product_id]
        );

        const itemExists = existCheck[0].item_exists || existCheck[0].item_exists === 1;

        if (itemExists) {
            return res.status(409).json({ message: 'Product already in cart' });
        }

        const [result] = await pool.query(
            'INSERT INTO carts (account_id, product_id, quantity) VALUES (?, ?, ?)',
            [account_id, product_id, quantity]
        );

        if (result.insertId) {
            const [productRows] = await pool.query('SELECT label FROM products WHERE id = ?', [product_id]);
            const productLabel = productRows?.[0]?.label || 'Product';

            await createCartActivity(account_id, productLabel, 'added');
            await AuditLogger.logCartAdd(account_id, product_id, quantity, req);

            return res.status(201).json({ success: true, insertId: result.insertId, message: 'Product added to cart successfully!' });
        } else {
            return res.status(500).json({ error: 'Failed to insert cart item' });
        }
    } catch (err) {
        console.error('carts route POST / endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/:product_id', async (req, res) => {
    
    try {

        const { account_id, product_id } = req.params;
        const { quantity } = req.body;

        // Get old quantity first
        const [oldData] = await pool.query(
            'SELECT quantity FROM carts WHERE account_id = ? AND product_id = ?',
            [account_id, product_id]
        );

        const old_quantity = oldData[0]?.quantity;

        const [ result ] = await pool.query(
            `
                UPDATE carts 
                SET quantity = ?
                WHERE account_id = ? AND product_id = ?
            `,
            [ quantity, account_id, product_id ]
        );

        if (quantity <= 0) {
            await pool.query(
                `
                    DELETE FROM carts
                    WHERE account_id = ? AND product_id = ?
                `,
                [ account_id, product_id ]
            );
        } else {
            await pool.query(
                `
                    UPDATE carts SET quantity = ?
                    WHERE account_id = ? AND product_id = ?
                `,
                [ quantity, account_id, product_id ]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found!' });
        }

        // Log cart update
        await AuditLogger.logCartUpdate(account_id, product_id, old_quantity, quantity, req);

        res.json({ message: 'Cart updated successfully' })
    } catch (err) {
        console.error('carts route PUT /:account_id/:product_id endpoint error: ', err);
        res.status(500).json({ error: err.message });
    };
});

router.delete('/:account_id/:product_id', async (req, res) => {
    try {
        const { account_id, product_id } = req.params;

        const [ result ] = await pool.query(
            `
                DELETE FROM carts
                WHERE account_id = ? AND product_id = ?
            `,
            [ account_id, product_id ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found!' });
        }

        // Log cart removal
        await AuditLogger.logCartRemove(account_id, product_id, req);

        res.status(200).json({ success: true });
        
    } catch (err) {
        console.error('carts route DELETE /:account_id/:product_id endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/clear/:account_id', async (req, res) => {
    try {
        const { account_id } = req.params;

        await pool.query(
            `
                DELETE FROM carts
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        res.json({ message: 'Cart Cleared' })
    } catch (err) {
        console.error('carts route DELETE /clear/:account_id/ endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
