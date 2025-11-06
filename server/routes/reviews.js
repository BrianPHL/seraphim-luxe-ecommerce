import express from 'express';
import pool from '../apis/db.js';
const router = express.Router();

router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.query.user_id;

        const [reviews] = await pool.query(
            `SELECT 
                r.*, 
                a.first_name AS reviewer_name, 
                a.image_url AS reviewer_image_url 
             FROM product_reviews r 
             JOIN accounts a ON r.user_id = a.id 
             WHERE r.product_id = ? 
             ORDER BY r.created_at DESC 
             LIMIT 10`,
            [productId]
        );

        let userHelpfulVotes = [];
        if (userId) {
            const [votes] = await pool.query(
                'SELECT review_id FROM product_review_helpful WHERE user_id = ?',
                [userId]
            );
            userHelpfulVotes = votes.map(v => v.review_id);
        }

        const [[{ avg }]] = await pool.query(
            'SELECT AVG(rating) as avg FROM product_reviews WHERE product_id = ?',
            [productId]
        );

        res.json({
            reviews: reviews || [],
            average: avg || 0,
            userHelpfulVotes
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { product_id, user_id, rating, review_text, review_title } = req.body;

        if (!product_id || !user_id || !rating) {
            return res.status(400).json({ 
                error: 'Missing required fields: product_id, user_id, and rating are required' 
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: 'Rating must be between 1 and 5' 
            });
        }
        const [result] = await pool.query(
            'INSERT INTO product_reviews (product_id, user_id, rating, review_text, review_title) VALUES (?, ?, ?, ?, ?)',
            [product_id, user_id, rating, review_text || null, review_title || null]
        );

        res.json({ 
            success: true, 
            reviewId: result.insertId,
            message: 'Review submitted successfully!' 
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ 
            error: 'Failed to submit review. Please try again later.' 
        });
    }
});

router.post('/helpful', async (req, res) => {
    try {
        const { review_id, user_id } = req.body;
        if (!review_id || !user_id) return res.status(400).json({ error: 'Missing review_id or user_id' });

        const [rows] = await pool.query(
            'SELECT id FROM product_review_helpful WHERE review_id = ? AND user_id = ?',
            [review_id, user_id]
        );
        if (rows.length > 0) {
            return res.json({ success: false, alreadyVoted: true });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.query(
                'INSERT INTO product_review_helpful (review_id, user_id) VALUES (?, ?)',
                [review_id, user_id]
            );
            
            await connection.query(
                'UPDATE product_reviews SET helpful_count = IFNULL(helpful_count, 0) + 1 WHERE id = ?',
                [review_id]
            );
            
            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking review as helpful:', error);
        res.status(500).json({ error: 'Failed to mark review as helpful' });
    }
});

router.put('/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    const { user_id, rating, review_text } = req.body;
    if (!user_id || !rating || !review_text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating' });
    }
    if (typeof review_text !== 'string' || review_text.length < 10 || review_text.length > 2000) {
        return res.status(400).json({ error: 'Review text must be 10-2000 characters' });
    }

    const [rows] = await pool.query(
        'SELECT user_id FROM product_reviews WHERE id = ?',
        [reviewId]
    );
    if (!rows.length || rows[0].user_id !== user_id) {
        return res.status(403).json({ error: 'Not allowed' });
    }

    await pool.query(
        'UPDATE product_reviews SET rating = ?, review_text = ? WHERE id = ?',
        [rating, review_text, reviewId]
    );
    res.json({ success: true });
});

router.delete('/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

    const [rows] = await pool.query(
        'SELECT user_id FROM product_reviews WHERE id = ?',
        [reviewId]
    );
    if (!rows.length || rows[0].user_id !== user_id) {
        return res.status(403).json({ error: 'Not allowed' });
    }

    await pool.query(
        'DELETE FROM product_reviews WHERE id = ?',
        [reviewId]
    );
    res.json({ success: true });
});

export default router;