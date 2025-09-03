import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [ categories ] = await pool.query(`
            SELECT c.*, 
                   COUNT(DISTINCT p.id) as product_count
            FROM product_categories c
            LEFT JOIN products p ON c.id = p.category_id
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY c.sort_order, c.name
        `);
        
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:category_id/subcategories', async (req, res) => {
    try {
        const [ subcategories ] = await pool.query(`
            SELECT sc.*, 
                   COUNT(DISTINCT p.id) as product_count
            FROM product_subcategories sc
            LEFT JOIN products p ON sc.id = p.subcategory_id
            WHERE sc.category_id = ? AND sc.is_active = 1
            GROUP BY sc.id
            ORDER BY sc.sort_order, sc.name
        `, [req.params.category_id]);
        
        res.json(subcategories);
    } catch (err) {
        console.error('Error fetching subcategories:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/hierarchy', async (req, res) => {
    try {

        const [ categories ] = await pool.query(`
            SELECT c.*, 
                   COUNT(DISTINCT p.id) as product_count
            FROM product_categories c
            LEFT JOIN products p ON c.id = p.category_id
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY c.sort_order, c.name
        `);

        for (let category of categories) {
            const [subcategories] = await pool.query(`
                SELECT sc.*, 
                       COUNT(DISTINCT p.id) as product_count
                FROM product_subcategories sc
                LEFT JOIN products p ON sc.id = p.subcategory_id
                WHERE sc.category_id = ? AND sc.is_active = 1
                GROUP BY sc.id
                ORDER BY sc.sort_order, sc.name
            `, [category.id]);
            
            category.subcategories = subcategories;
        }
        
        res.json(categories);
    } catch (err) {
        console.error('Error fetching category hierarchy:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description = null, sort_order = 0 } = req.body;
        
        const [ result ] = await pool.query(
            'INSERT INTO product_categories (name, description, sort_order) VALUES (?, ?, ?)',
            [name, description, sort_order]
        );
        
        res.status(201).json({
            message: 'Category created successfully',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:category_id/subcategories', async (req, res) => {
    try {
        const { category_id } = req.params;
        const { name, description = null, sort_order = 0 } = req.body;
        
        const [ result ] = await pool.query(
            'INSERT INTO product_subcategories (category_id, name, description, sort_order) VALUES (?, ?, ?, ?)',
            [category_id, name, description, sort_order]
        );
        
        res.status(201).json({
            message: 'Subcategory created successfully',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error creating subcategory:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sort_order, is_active } = req.body;
        
        const [ result ] = await pool.query(
            'UPDATE product_categories SET name = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, description, sort_order, is_active, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/subcategories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sort_order, is_active } = req.body;
        
        const [ result ] = await pool.query(
            'UPDATE product_subcategories SET name = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [name, description, sort_order, is_active, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }
        
        res.json({ message: 'Subcategory updated successfully' });
    } catch (err) {
        console.error('Error updating subcategory:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        const [ productCheck ] = await connection.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [id]
        );
        
        if (productCheck[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Cannot delete category with existing products. Please reassign or remove products first.' 
            });
        }

        const [ subcategoryProductCheck ] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM products p 
            JOIN product_subcategories sc ON p.subcategory_id = sc.id 
            WHERE sc.category_id = ?
        `, [id]);
        
        if (subcategoryProductCheck[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Cannot delete category with subcategories that have products. Please reassign or remove products first.' 
            });
        }

        await connection.query('DELETE FROM product_subcategories WHERE category_id = ?', [id]);

        const [ result ] = await connection.query('DELETE FROM product_categories WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Category not found' });
        }
        
        await connection.commit();
        res.json({ message: 'Category and its subcategories deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Error deleting category:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.delete('/subcategories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [ productCheck ] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE subcategory_id = ?',
            [id]
        );
        
        if (productCheck[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete subcategory with existing products. Please reassign or remove products first.' 
            });
        }
        
        const [ result ] = await pool.query('DELETE FROM product_subcategories WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }
        
        res.json({ message: 'Subcategory deleted successfully' });
    } catch (err) {
        console.error('Error deleting subcategory:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
