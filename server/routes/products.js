import pool from "../apis/db.js";
import express from 'express';
import cloudinary from "../apis/cloudinary.js";
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const upload = multer({
    dest: 'temp/',
    limits: { fileSize: 5 * 1024 * 1024 }
})

router.get('/', async (req, res) => {
    
    try {
        const [ rows ] = await pool.query(`
            SELECT 
                p.*,
                pc.name as category,
                ps.name as subcategory
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_subcategories ps ON p.subcategory_id = ps.id
            ORDER BY p.created_at DESC
        `);

        for (let product of rows) {
            const [images] = await pool.query(`
                SELECT id, image_url, display_order, is_primary 
                FROM product_images 
                WHERE product_id = ? 
                ORDER BY display_order ASC
            `, [product.id]);
            product.product_images = images;
        }

        res.json(rows);
    
    } catch (err) {
    
        res.status(500).json({ error: err.message });
    
    }

});

router.get('/:id/images', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [images] = await pool.query(`
            SELECT id, image_url, display_order, is_primary, created_at
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY display_order ASC, created_at ASC
        `, [id]);
        
        res.json(images);
    } catch (err) {
        console.error('Error fetching product images:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { label, price, category_id, subcategory_id, description, image_url, stock_quantity, stock_threshold } = req.body;
        
        const [ result ] = await pool.query(
            `
                INSERT INTO products (label, price, category_id, subcategory_id, description, image_url, stock_quantity, stock_threshold)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [ label, price, category_id, subcategory_id, description || null, image_url || null, stock_quantity, stock_threshold ]
        );
        
        const newProductId = result['insertId'];
        
        res.status(201).json({
            message: 'Product added successfully!', 
            newProductId
        });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/images', upload.single('image'), async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { display_order = 0, is_primary = false } = req.body;

        const [productCheck] = await connection.query(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );
        
        if (productCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (!req.file) {
            await connection.rollback();
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',
            public_id: `product_${id}_${Date.now()}`
        });

        fs.unlinkSync(req.file.path);

        if (is_primary) {
            await connection.query(
                'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
                [id]
            );
        }

        const [insertResult] = await connection.query(`
            INSERT INTO product_images (product_id, image_url, display_order, is_primary)
            VALUES (?, ?, ?, ?)
        `, [id, result.public_id, display_order, is_primary]);
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Image added successfully',
            image: {
                id: insertResult.insertId,
                product_id: id,
                image_url: result.public_id,
                display_order: parseInt(display_order),
                is_primary: Boolean(is_primary)
            }
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('Error adding product image:', err);

        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Failed to delete temporary file:', cleanupError);
            }
        }
        
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.put('/:product_id', async (req, res) => {

    try {

        const { product_id } = req.params;
        const { label, price, category_id, subcategory_id, description, image_url, stock_quantity, stock_threshold } = req.body;

        const [ result ] = await pool.query(
            `
                UPDATE products
                SET label = ?, price = ?, category_id = ?, subcategory_id = ?, description = ?, image_url = ?, stock_quantity = ?, stock_threshold = ?
                WHERE id = ?
            `,
            [ label, price, category_id, subcategory_id, description || null, image_url, stock_quantity, stock_threshold, product_id ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({
            product_id: product_id 
        });

    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ error: err.message });
    }

});

router.put('/:product_id/feature/:is_featured', async (req, res) => {

    try {

        const { product_id, is_featured } = req.params;
        const parsedIsFeatured = is_featured === 'true' ? 1 : 0;

        const [ affectedRows ] = await pool.query(
            `
                UPDATE products
                SET is_featured = ?
                WHERE id = ?
            `,
            [ parsedIsFeatured, product_id ]
        );

        if (affectedRows.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        };

        res.status(200).json({ message: 'Product successfully updated!' });

    } catch (err) {

        console.error('Products route PUT /:product_id/feature/:is_featured endpoint error: ', err);
        res.status(500).json({ error: err.message });

    }

});

router.post('/upload-image', upload.single('image'), async (req, res) => {

    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',
            public_id: `product_${Date.now()}`
        });
        
        fs.unlinkSync(req.file.path);
        
        res.json({ 
            message: 'Image uploaded successfully',
            image_url: result.public_id
        });
        
    } catch (err) {
        console.error('Error uploading image:', err);
        if (req.file?.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error('Failed to delete temporary file:', error);
            }
        }
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:product_id', async (req, res) => {
    try {
        const { product_id } = req.params;
        
        const [product] = await pool.query(
            `
                SELECT image_url
                FROM products
                WHERE id = ?
            `,
            [product_id]
        );
        
        if (product.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product[0].image_url && product[0].image_url !== 'none for now') {
            try {
                await cloudinary.uploader.destroy(product[0].image_url);
            } catch (imageError) {
                console.error('Error deleting image from Cloudinary:', imageError);
            }
        }

        await pool.query(
            `
                DELETE
                FROM products
                WHERE id = ?
            `,
            [product_id]
        );
        
        res.status(200).json({ message: 'Product and associated image deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:productId/view', async (req, res) => {
    try {
        const { productId } = req.params;
        
        const query = `
            UPDATE products 
            SET views_count = views_count + 1, 
                last_viewed = NOW() 
            WHERE id = ?
        `;
        
        await pool.execute(query, [productId]);
        res.json({ message: 'Product view tracked' });
    } catch (error) {
        console.error('Error tracking product view:', error);
        res.status(500).json({ error: 'Failed to track product view' });
    }
})

router.delete('/:id/images/:imageId', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id, imageId } = req.params;

        const [imageDetails] = await connection.query(
            'SELECT image_url FROM product_images WHERE id = ? AND product_id = ?',
            [imageId, id]
        );
        
        if (imageDetails.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Image not found for this product' });
        }

        try {
            await cloudinary.uploader.destroy(imageDetails[0].image_url);
        } catch (cloudinaryError) {
            console.error('Error deleting image from Cloudinary:', cloudinaryError);
        }

        await connection.query(
            'DELETE FROM product_images WHERE id = ? AND product_id = ?',
            [imageId, id]
        );
        
        await connection.commit();
        
        res.json({ message: 'Image deleted successfully' });
        
    } catch (err) {
        await connection.rollback();
        console.error('Error deleting product image:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

export default router;
