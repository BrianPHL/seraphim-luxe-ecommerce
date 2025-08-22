import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/:account_id', async (req, res) => {
    
	try {

        const { account_id } = req.params;
        const [ rows ] = await pool.query(
          `
            SELECT cart.*, product.label, product.price, product.category, product.subcategory, product.image_url, product.stock_quantity
            FROM carts cart
            JOIN products product ON cart.product_id = product.product_id
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

        if (existCheck[0]['item_exists']) {
            await pool.query(
                `
                    UPDATE carts SET quantity = quantity + ?
                    WHERE account_id = ? AND product_id = ?
                `,
                [ quantity, account_id, product_id ]
            );
        } else {
            await pool.query(
                `
                    INSERT INTO carts (account_id, product_id, quantity)
                    VALUES (?, ?, ?)
                `,
                [ account_id, product_id, quantity ]
            );
        }

        res.status(201).json({ message: 'Item added to cart' });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }

});

router.put('/', async (req, res) => {
    try {
        const { account_id, product_id, quantity } = req.body;

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
