import express from 'express';
import pool from '../apis/db.js';

const router = express.Router();

router.get('/admin', async (req, res) => {
    try {
        const [pages] = await pool.query(`
            SELECT id, page_slug, title, content, created_at, updated_at, last_updated_by 
            FROM static_pages 
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
        const [pages] = await pool.query('SELECT page_slug, content FROM static_pages');
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

router.get('/:page_slug', async (req, res) => {
    try {
        const { page_slug } = req.params;
        const [pages] = await pool.query(
            'SELECT page_slug, title, content FROM static_pages WHERE page_slug = ?',
            [page_slug]
        );
        
        if (pages.length === 0)
            return res.status(404).json({ error: 'Page not found' });
        
        res.json({ success: true, data: pages[0] });

    } catch (error) {
        console.error('Error fetching static page:', error);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

router.put('/:page_slug', async (req, res) => {
    
    try {
        const { page_slug } = req.params;
        const { content, title } = req.body;

        console.log(page_slug, content, title);
        
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }

        const last_updated_by = req.user?.id || null;
        
        const [result] = await pool.query(
            'UPDATE static_pages SET content = ?, title = ?, last_updated_by = ?, updated_at = NOW() WHERE page_slug = ?',
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

// Banner management routes
router.get('/banners', async (req, res) => {
    try {
        const [banners] = await pool.query(`
            SELECT id, title, subtitle, image_url, link_url, button_text, 
                   position, is_active, created_at, updated_at 
            FROM banners 
            ORDER BY position`
        );
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch banners' });
    }
});

router.post('/banners', async (req, res) => {
    try {
        const { title, subtitle, image_url, link_url, button_text, position, is_active } = req.body;
        const [result] = await pool.query(
            `INSERT INTO banners (title, subtitle, image_url, link_url, 
                                button_text, position, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, subtitle, image_url, link_url, button_text, position, is_active]
        );
        res.json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ success: false, error: 'Failed to create banner' });
    }
});

// Add DELETE route for banners
router.delete('/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM banners WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Banner not found' });
        }
        
        res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ success: false, error: 'Failed to delete banner' });
    }
});

// Add PUT route for updating banners
router.put('/banners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image_url, link_url, button_text, position, is_active } = req.body;
        
        if (!title || !image_url) {
            return res.status(400).json({ success: false, error: 'Title and image URL are required' });
        }

        const [result] = await pool.query(
            `UPDATE banners 
             SET title = ?, subtitle = ?, image_url = ?, link_url = ?,
                 button_text = ?, position = ?, is_active = ?
             WHERE id = ?`,
            [title, subtitle, image_url, link_url, button_text, position, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Banner not found' });
        }

        res.json({ success: true, message: 'Banner updated successfully' });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ success: false, error: 'Failed to update banner' });
    }
});

// Promotion management routes
router.get('/promotions', async (req, res) => {
    try {
        const [promotions] = await pool.query(`
            SELECT * FROM promotions ORDER BY created_at DESC`
        );
        res.json({ success: true, data: promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
    }
});

router.post('/promotions', async (req, res) => {
    try {
        const { title, description, discount, code, start_date, end_date, is_active } = req.body;
        const [result] = await pool.query(
            `INSERT INTO promotions (title, description, discount, code, 
                                   start_date, end_date, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, discount, code, start_date, end_date, is_active]
        );
        res.json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ success: false, error: 'Failed to create promotion' });
    }
});

// Add DELETE route for promotions
router.delete('/promotions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM promotions WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Promotion not found' });
        }
        
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, error: 'Failed to delete promotion' });
    }
});

// Add PUT route for updating promotions
router.put('/promotions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, discount, code, start_date, end_date, is_active } = req.body;
        
        if (!title || !code || !start_date || !end_date) {
            return res.status(400).json({ 
                success: false, 
                error: 'Title, code, start date, and end date are required' 
            });
        }

        const [result] = await pool.query(
            `UPDATE promotions 
             SET title = ?, description = ?, discount = ?, code = ?,
                 start_date = ?, end_date = ?, is_active = ?
             WHERE id = ?`,
            [title, description, discount, code, start_date, end_date, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Promotion not found' });
        }

        res.json({ success: true, message: 'Promotion updated successfully' });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ success: false, error: 'Failed to update promotion' });
    }
});

// Homepage section management routes
router.get('/homepage', async (req, res) => {
    try {
        const [sections] = await pool.query(`
            SELECT * FROM homepage_content ORDER BY id`
        );
        res.json({ success: true, data: sections });
    } catch (error) {
        console.error('Error fetching homepage content:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch homepage content' });
    }
});

router.put('/homepage/:section', async (req, res) => {
    try {
        const { section } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content is required' });
        }

        await pool.query(
            `INSERT INTO homepage_content (section_name, content) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE content = ?`,
            [section, JSON.stringify(content), JSON.stringify(content)]
        );
        
        res.json({ success: true, message: 'Homepage content updated successfully' });
    } catch (error) {
        console.error('Error updating homepage content:', error);
        res.status(500).json({ success: false, error: 'Failed to update homepage content' });
    }
});

export default router;
