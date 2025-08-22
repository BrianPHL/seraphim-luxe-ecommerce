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

        const [ rows ] = await pool.query('SELECT * FROM products');
        res.json(rows);
    
	} catch (err) {
    
		res.status(500).json({ error: err.message });
    
	}

});

router.post('/', async (req, res) => {
    try {
        const { label, price, category, subcategory, description, image_url } = req.body;
        
        const [ result ] = await pool.query(
            `
                INSERT INTO products (label, price, category, subcategory, description, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [ label, price, category, subcategory, description || null, image_url || null ]
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

router.put('/:product_id', async (req, res) => {

    try {

        const { product_id } = req.params;
        const { label, price, category, subcategory, description, image_url } = req.body;

        const [ result ] = await pool.query(
            `
                UPDATE products
                SET label = ?, price = ?, category = ?, subcategory = ?, description = ?, image_url = ?
                WHERE id = ?
            `,
            [ label, price, category, subcategory, description || null, image_url, product_id ]
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

export default router;
