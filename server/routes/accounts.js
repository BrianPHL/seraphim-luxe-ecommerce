import cloudinary from "../apis/cloudinary.js";
import pool from "../apis/db.js";
import express from 'express';
import multer from "multer";
import fs from "fs";

const router = express.Router();
const upload = multer({
    dest: 'temp/',
    limits: { fileSize: 5 * 1024 * 1024 }
})

router.get('/', async (req, res) => {
    
	try {

        const [ rows ] = await pool.query('SELECT * FROM accounts');
        res.json(rows);
    
	} catch (err) {
    
		res.status(500).json({ error: err.message });
    
	}

});

router.get('/count', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) as count FROM accounts');
        res.json({ count: result[0].count });
    } catch (err) {
        console.error('Error counting accounts:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/personal-info', async (req, res) => {
    try {
        const { account_id } = req.params;
        const { first_name, last_name, email, contact_number } = req.body;
        
        if (email) {
            const [ existingEmail ] = await pool.query(
                `
                    SELECT id
                    FROM accounts 
                    WHERE email = ? AND id != ?
                `,
                [email, account_id]
            );
            
            if (existingEmail.length > 0) {
                return res.status(409).json({ 
                    error: 'Email already in use by another account' 
                });
            }
        }
        
        const [ result ] = await pool.query(
            `
                UPDATE accounts 
                SET first_name = ?, last_name = ?, email = ?, contact_number = ?
                WHERE id = ?
            `,
            [first_name, last_name, email, contact_number, account_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        const [user] = await pool.query(
            `
                SELECT *
                FROM accounts
                WHERE id = ?
            `,
            [account_id]
        );
        
        res.json(user[0]);
    } catch (err) {
        console.error('Error updating personal info:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/address', async (req, res) => {
    try {
        const { account_id } = req.params;
        const { address } = req.body;
        
        const [result] = await pool.query(
            `
                UPDATE accounts 
                SET address = ?, modified_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
            [address, account_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const [user] = await pool.query(
            `
                SELECT *
                FROM accounts
                WHERE id = ?
            `,
            [account_id]
        );
        
        res.json(user[0]);

    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/password', async (req, res) => {
    try {
        const { account_id } = req.params;
        const { password } = req.body;
        
        const [result] = await pool.query(
            `
                UPDATE accounts 
                SET password = ?
                WHERE id = ?
            `,
            [password, account_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        
        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:account_id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { account_id } = req.params;

        await connection.query(
            `
                DELETE rp FROM reservation_products rp
                JOIN reservations r ON rp.id = r.id
                WHERE r.id = ?
            `,
            [account_id]
        );
        
        await connection.query(
            `
                DELETE
                FROM reservations
                WHERE id = ?
            `,
            [account_id]
        );
        
        await connection.query(
            `
                DELETE
                FROM carts
                WHERE id = ?
            `
            [account_id]
        );

        const [accounts] = await connection.query(
            `
                SELECT image_url 
                FROM accounts
                WHERE id = ?
            `,
            [account_id]
        );
        
        await connection.query(
            `
                DELETE
                FROM accounts
                WHERE id = ?
            `,
            [account_id]
        );
        
        if (accounts.length > 0 && accounts[0].image_url) {
            await cloudinary.uploader.destroy(accounts[0].image_url);
        }
        
        await connection.commit();
        
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Error deleting account:', err);
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

router.post('/:account_id/avatar', upload.single('avatar'), async (req, res) => {

    try {

        const { account_id } = req.params;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded!' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars',
            public_id: `avatar_${ account_id }_${ Date.now() }`
        });

        fs.unlinkSync(req.file.path);

        await pool.query(
            `
                UPDATE accounts SET image_url = ?
                WHERE id = ?
            `,
            [ result['public_id'], account_id ]
        );

        res.json({
            message: 'Avatar uploaded successfully',
            image_url: result['public_id']
        })

    } catch (err) {

        console.error('Error uploading avatar:', err);
        if (req.file?.path) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });

    }

});

router.delete('/:account_id/avatar', async (req, res) => {

    try {

        const { account_id } = req.params;

        const [ accounts ] = await pool.query(
            `
                SELECT image_url FROM accounts
                WHERE id = ?
            `,
            [ account_id ]
        );

        if (accounts.length === 0) {
            return res.status(404).json({ error: 'Account not found!' });
        }

        const image_url = accounts[0]['image_url'];

        if (image_url) {
            await cloudinary.uploader.destroy(image_url);
        }

        await pool.query(
            `
                UPDATE accounts SET image_url = NULL
                WHERE id = ?
            `,
            [ account_id ]
        );

        res.json({ message: 'Avatar removed successfully!' });

    } catch (err) {

        console.error('Error removing avatar:', err);
        res.status(500).json({ error: err.message });
    
    }

});

export default router;
