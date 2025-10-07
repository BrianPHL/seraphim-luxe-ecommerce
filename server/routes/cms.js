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
        res.status(500).json({ success: false, error: 'Failed to fetc h banners' });
    
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

router.put('/banners/modify/:page/:image_url', async (req, res) => {

    try {

        const { page, image_url } = req.params;

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

router.put('/banners/reset/:page', async (req, res) => {

    try {

        const { page } = req.params;
        const imagePlaceholder = 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp';

        const [ result ] = await pool.query(
            `
                UPDATE
                    cms_banners
                SET
                    image_url = ${ imagePlaceholder }, modified_at = NOW() 
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



export default router;
