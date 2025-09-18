import express from 'express';
import pool from '../apis/db.js';
import { createWishlistActivity } from '../utils/inbox.js';

const router = express.Router();

const detectAccountColumn = async (tableName) => {
  const candidates = ['account_id','user_id','accountId','userId','account'];
  const placeholders = candidates.map(() => '?').join(',');
  const sql = `
    SELECT column_name
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name IN (${placeholders})
    LIMIT 1
  `;
  const params = [tableName, ...candidates];
  const [rows] = await pool.query(sql, params);
  return rows && rows.length ? rows[0].column_name : null;
};

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

/* POST add to wishlist */
router.post('/', async (req, res) => {
  try {
    const product_id = req.body.product_id || req.body.productId;
    const suppliedAccount = req.body.account_id || req.body.userId || req.body.user_id || req.body.accountId || req.body.account;
    if (!product_id || !suppliedAccount) {
      return res.status(400).json({ error: 'Missing account_id/userId or product_id' });
    }

    const accountCol = await detectAccountColumn('wishlist') || (req.body.userId ? 'user_id' : 'account_id');

    // check duplicate
    const checkSql = `SELECT id FROM wishlist WHERE ${accountCol} = ? AND product_id = ? LIMIT 1`;
    const [existsRows] = await pool.query(checkSql, [suppliedAccount, product_id]);

    if (Array.isArray(existsRows) && existsRows.length > 0) {
      return res.status(409).json({ error: 'Product already in wishlist' });
    }

    // insert (use detected column name)
    const insertSql = `INSERT INTO wishlist (${accountCol}, product_id, created_at) VALUES (?, ?, NOW())`;
    const [insertResult] = await pool.query(insertSql, [suppliedAccount, product_id]);

    if (!insertResult || !insertResult.insertId) {
      console.error('[WISHLIST] insert failed:', insertResult);
      return res.status(500).json({ error: 'Failed to insert wishlist item' });
    }

    // fetch product label for activity (best-effort)
    let productLabel = 'Item';
    try {
      const [productRows] = await pool.query('SELECT label FROM products WHERE id = ? LIMIT 1', [product_id]);
      if (Array.isArray(productRows) && productRows.length > 0) productLabel = productRows[0].label || productLabel;
    } catch (err) {
      console.warn('[WISHLIST] product lookup failed:', err.message);
    }

    // create inbox activity (best-effort)
    try {
      await createWishlistActivity(suppliedAccount, productLabel, 'added');
    } catch (err) {
      console.warn('[WISHLIST] createWishlistActivity failed:', err.message);
    }

    return res.status(201).json({ success: true, insertId: insertResult.insertId });
  } catch (err) {
    console.error('[WISHLIST] POST error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
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