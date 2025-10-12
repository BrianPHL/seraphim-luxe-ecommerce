import pool from '../apis/db.js'; 
import express from 'express';

const router = express.Router();

router.get('/admin', async (req, res) => {
    try {
        const [pages] = await pool.query(`
            SELECT id, page_slug, title, content, created_at, updated_at, last_updated_by 
            FROM cms
            ORDER BY page_slug
        `);
        
        res.json({ success: true, data: pages });
    } catch (error) {
        console.error('Error fetching static pages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pages' });
    }
});

router.get('/', async (req, res) => {
    try {
        const [pages] = await pool.query('SELECT page_slug, content FROM cms');
        const result = {};
        pages.forEach(page => {
            result[page.page_slug] = page.content;
        });
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching static pages:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pages' });
    }
});

router.get('/banners', async (req, res) => {

    try {

        const [ banners ] = await pool.query(
            `
                SELECT
                    id, type, page, image_url, modified_at
                FROM
                    cms_banners
                ORDER BY id ASC
            `
        );

        if (banners.length === 0)
            return res.status(404).json({ error: 'Banners not found' });

        res.json({ success: true, banners: banners || [] });

    } catch (err) {

        console.error('cms route GET /banners endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to fetch banners' });
    
    }

});

router.get('/promotions', async (req, res) => {

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const now = new Date();
        const localDateTime = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + ' ' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0') + ':' + 
            String(now.getSeconds()).padStart(2, '0');

        await connection.query(`
            UPDATE cms_promotions 
            SET is_active = 0, modified_at = NOW() 
            WHERE is_active = 1 AND end_date < ?
        `, [localDateTime]);

        const [promotions] = await connection.query(`
            SELECT
                p.id, p.title, p.discount, p.start_date, p.end_date, p.is_active, p.created_at, p.modified_at,
                GROUP_CONCAT(
                    CASE 
                        WHEN pr.id IS NOT NULL 
                        THEN CONCAT(pr.id, '|', pr.label, '|', pr.price, '|', pr.image_url)
                        ELSE NULL
                    END
                    SEPARATOR ';;'
                ) as product_data
            FROM
                cms_promotions p
            LEFT JOIN products_promotions pp ON p.id = pp.promotion_id
            LEFT JOIN products pr ON pp.product_id = pr.id
            GROUP BY p.id, p.title, p.discount, p.start_date, p.end_date, p.is_active, p.created_at, p.modified_at
            ORDER BY p.id ASC
        `);

        await connection.commit();

        const formattedPromotions = promotions.map(promotion => {
            let products = [];
            if (promotion.product_data) {
                const productEntries = promotion.product_data.split(';;');
                products = productEntries
                    .filter(entry => entry && entry !== 'NULL')
                    .map(entry => {
                        const [id, label, price, image_url] = entry.split('|');
                        return { id: parseInt(id), label, price: parseFloat(price), image_url };
                    });
            }
            
            const { product_data, ...promotionWithoutProductData } = promotion;
            return {
                ...promotionWithoutProductData,
                products
            };
        });

        res.json({ success: true, promotions: formattedPromotions });

    } catch (err) {
        await connection.rollback();
        console.error('cms route GET /promotions endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
    } finally {
        connection.release();
    }
});

router.get('/:page_slug', async (req, res) => {
    try {
        const { page_slug } = req.params;
        const [pages] = await pool.query(
            'SELECT page_slug, title, content FROM cms WHERE page_slug = ?',
            [page_slug]
        );
        
        if (pages.length === 0)
            return res.status(404).json({ error: 'Page not found' });

        res.json({ success: true, content: pages[0] });

    } catch (error) {
        console.error('Error fetching static page:', error);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

router.post('/promotions/create', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { title, discount, start_date, end_date, is_active, product_ids = [] } = req.body; 

        const [result] = await connection.query(`
            INSERT INTO
                cms_promotions (title, discount, start_date, end_date, is_active)
            VALUES
                (?, ?, ?, ?, ?)
        `, [title, discount, start_date, end_date, is_active]);

        if (result.affectedRows === 0) {
            throw new Error('Promotion failed to be added');
        }

        const promotionId = result.insertId;

        if (product_ids && product_ids.length > 0) {
            const productValues = product_ids.map(productId => [promotionId, productId]);
            await connection.query(`
                INSERT INTO products_promotions (promotion_id, product_id)
                VALUES ?
            `, [productValues]);
        }

        await connection.commit();
        res.json({ success: true });

    } catch (err) {
        await connection.rollback();
        console.error('cms route POST /promotions/create/ endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to add promotion' });
    } finally {
        connection.release();
    }
});

router.put('/:page_slug', async (req, res) => {
    
    try {
        const { page_slug } = req.params;
        const { content, title } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }

        const last_updated_by = req.user?.id || null;
        
        const [result] = await pool.query(
            'UPDATE cms SET content = ?, title = ?, last_updated_by = ?, updated_at = NOW() WHERE page_slug = ?',
            [content, title, last_updated_by, page_slug]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Page not found' });
        }
        
        res.json({ success: true, message: 'Content updated successfully' });
    } catch (error) {
        console.error('Error updating static page:', error);
        res.status(500).json({ success: false, error: 'Failed to update content' });
    }
});

router.put('/banners/modify/:page', async (req, res) => {

    try {

        const { page } = req.params;
        const { image_url } = req.body; 

        const [ result ] = await pool.query(
            `
                UPDATE
                    cms_banners
                SET
                    image_url = ?, modified_at = NOW() 
                WHERE
                    page = ?
            `,
            [ image_url, page ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, error: 'Banner to modify not found' });

        res.json({ success: true });

    } catch (err) {

        console.error('cms route PUT /banners/modify/:page/:image_url endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to modify banner' });
    
    }

});

router.put('/promotions/modify/:id', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { title, discount, start_date, end_date, is_active, product_ids = [] } = req.body; 

        const [result] = await connection.query(`
            UPDATE
                cms_promotions
            SET
                title = ?, discount = ?, start_date = ?, end_date = ?, is_active = ?, modified_at = NOW()
            WHERE
                id = ?
        `, [title, discount, start_date, end_date, is_active, id]);

        if (result.affectedRows === 0) {
            throw new Error('Promotion to modify not found');
        }

        await connection.query('DELETE FROM products_promotions WHERE promotion_id = ?', [id]);

        if (product_ids && product_ids.length > 0) {
            const productValues = product_ids.map(productId => [id, productId]);
            await connection.query(`
                INSERT INTO products_promotions (promotion_id, product_id)
                VALUES ?
            `, [productValues]);
        }

        await connection.commit();
        res.json({ success: true });

    } catch (err) {
        await connection.rollback();
        console.error('cms route PUT /promotions/modify/:id endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to modify promotion' });
    } finally {
        connection.release();
    }
});

router.put('/promotions/:id/toggle-availability/:state', async (req, res) => {

    try {

        const { id, state } = req.params;

        const [ result ] = await pool.query(
            `
                UPDATE
                    cms_promotions
                SET
                    is_active = ?, modified_at = NOW()
                WHERE
                    id = ?
            `,
            [ state, id ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, error: 'Promotion to toggle availability not found' });

        res.json({ success: true });

    } catch (err) {

        console.error('cms route PUT /promotions/:id/toggle-availability/:state endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to toggle promotion\'s availability' });
    
    }

});

router.put('/banners/reset/:page', async (req, res) => {

    try {

        const { page } = req.params;
        const imagePlaceholder = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';

        const [ result ] = await pool.query(
            `
                UPDATE
                    cms_banners
                SET
                    image_url = "${ imagePlaceholder }", modified_at = NOW() 
                WHERE
                    page = ?
            `,
            [ page ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, error: 'Banner to reset not found' });

        res.json({ success: true });

    } catch (err) {

        console.error('cms route PUT /banners/reset/:page endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to reset banner' });
    
    }

});

router.delete('/promotions/remove/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [ result ] = await pool.query(
            `
                DELETE FROM
                    cms_promotions
                WHERE
                    id = ?
            `,
            [ id ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, error: 'Promotion to remove not found' });

        res.json({ success: true });

    } catch (err) {

        console.error('cms route PUT /promotions/remove/:id endpoint error: ', err);
        res.status(500).json({ success: false, error: 'Failed to remove promotion' });
    
    }

});

export default router;
