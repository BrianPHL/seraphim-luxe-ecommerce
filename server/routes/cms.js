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

        console.log(page_slug, content, title);
        
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

export default router;
