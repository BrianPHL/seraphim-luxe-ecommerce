import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT 
                w.id,
                w.product_id,
                p.label,
                p.price,
                p.image_url,
                p.description,
                p.stock_quantity,
                pc.name as category,
                ps.name as subcategory,
                w.created_at
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_subcategories ps ON p.subcategory_id = ps.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;

        const [wishlistItems] = await pool.execute(query, [userId]);

        res.status(200).json(wishlistItems);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ 
            error: 'Failed to fetch wishlist',
            details: error.message 
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ 
                error: 'User ID and Product ID are required' 
            });
        }

        const checkQuery = `
            SELECT id FROM wishlist 
            WHERE user_id = ? AND product_id = ?
        `;
        const [existingItem] = await pool.execute(checkQuery, [userId, productId]);

        if (existingItem.length > 0) {
            return res.status(409).json({ 
                error: 'Item already exists in wishlist' 
            });
        }

        const productCheckQuery = `
            SELECT id FROM products WHERE id = ?
        `;
        const [productExists] = await pool.execute(productCheckQuery, [productId]);

        if (productExists.length === 0) {
            return res.status(404).json({ 
                error: 'Product not found' 
            });
        }

        const insertQuery = `
            INSERT INTO wishlist (user_id, product_id, created_at)
            VALUES (?, ?, NOW())
        `;
        const [result] = await pool.execute(insertQuery, [userId, productId]);

        const fetchQuery = `
            SELECT 
                w.id,
                w.user_id,
                w.product_id,
                w.created_at,
                p.label,
                p.price,
                p.image_url,
                p.description
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.id = ?
        `;
        const [addedItem] = await pool.execute(fetchQuery, [result.insertId]);

        res.status(201).json({
            message: 'Item added to wishlist successfully',
            item: addedItem[0]
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ 
            error: 'Failed to add item to wishlist',
            details: error.message 
        });
    }
});

router.delete('/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;

        const deleteQuery = `
            DELETE FROM wishlist 
            WHERE user_id = ? AND product_id = ?
        `;
        const [result] = await pool.execute(deleteQuery, [userId, productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                error: 'Item not found in wishlist' 
            });
        }

        res.status(200).json({
            message: 'Item removed from wishlist successfully'
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ 
            error: 'Failed to remove item from wishlist',
            details: error.message 
        });
    }
});

router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const deleteQuery = `
            DELETE FROM wishlist WHERE user_id = ?
        `;
        const [result] = await pool.execute(deleteQuery, [userId]);

        res.status(200).json({
            message: 'Wishlist cleared successfully',
            itemsRemoved: result.affectedRows
        });
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        res.status(500).json({ 
            error: 'Failed to clear wishlist',
            details: error.message 
        });
    }
});

router.get('/:userId/check/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;

        const checkQuery = `
            SELECT id FROM wishlist 
            WHERE user_id = ? AND product_id = ?
        `;
        const [result] = await pool.execute(checkQuery, [userId, productId]);

        res.status(200).json({
            inWishlist: result.length > 0,
            wishlistId: result.length > 0 ? result[0].id : null
        });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({ 
            error: 'Failed to check wishlist status',
            details: error.message 
        });
    }
});

router.get('/:userId/count', async (req, res) => {
    try {
        const { userId } = req.params;

        const countQuery = `
            SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?
        `;
        const [result] = await pool.execute(countQuery, [userId]);

        res.status(200).json({
            count: result[0].count
        });
    } catch (error) {
        console.error('Error getting wishlist count:', error);
        res.status(500).json({ 
            error: 'Failed to get wishlist count',
            details: error.message 
        });
    }
});

router.post('/:userId/batch-remove', async (req, res) => {
    try {
        const { userId } = req.params;
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                error: 'Product IDs array is required' 
            });
        }

        const placeholders = productIds.map(() => '?').join(',');
        const deleteQuery = `
            DELETE FROM wishlist 
            WHERE user_id = ? AND product_id IN (${placeholders})
        `;
        const [result] = await pool.execute(deleteQuery, [userId, ...productIds]);

        res.status(200).json({
            message: 'Items removed from wishlist successfully',
            itemsRemoved: result.affectedRows
        });
    } catch (error) {
        console.error('Error batch removing from wishlist:', error);
        res.status(500).json({ 
            error: 'Failed to remove items from wishlist',
            details: error.message 
        });
    }
});

export default router;