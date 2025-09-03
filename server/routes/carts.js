import pool from "../apis/db.js";
import express from 'express';

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
        res.status(500).json({ error: err.message });
    }

});

router.post('/', async (req, res) => {

    try {

        const { account_id, product_id, quantity = 1 } = req.body;
        const [ existCheck ] = await pool.query(
            `
                SELECT EXISTS (
                    SELECT 1 FROM carts
                    WHERE account_id = ? AND product_id = ?
                ) as item_exists FROM DUAL
            `,
            [ account_id, product_id ]
        );

        const itemExists = existCheck[0]['item_exists'];

        if (itemExists) {
            res.status(409).json({ message: 'Product already in cart' });
        } else {
            await pool.query(
                `
                    INSERT INTO carts (account_id, product_id, quantity)
                    VALUES (?, ?, ?)
                `,
                [ account_id, product_id, quantity ]
            );
            res.status(201).json({ message: 'Product added to cart successfully!' });
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

router.put('/:account_id/:product_id', async (req, res) => {
    
    try {

        const { account_id, product_id } = req.params;
        const { quantity } = req.body;

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

        res.json({ message: 'Cart updated successfully' })
    } catch (err) {
        res.status(500).json({ error: err.message });
    };
});

router.delete('/:account_id/:product_id', async (req, res) => {
    try {
        const { account_id, product_id } = req.params;

        await pool.query(
            `
                DELETE FROM carts
                WHERE account_id = ? AND product_id = ?
            `,
            [ account_id, product_id ]
        );

        res.status(200).json({ success: true });
        
    } catch (err) {
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
        res.status(500).json({ error: err.message });
    }
});

export default router;
