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

router.get('/:account_id/address', async (req, res) => {

    const { account_id } = req.params;

    try {

        const [ addressRows ] = await pool.query(
            `
                SELECT *
                FROM account_addresses
                WHERE account_id = ?
            `,
            [ account_id ]
        )

        if (addressRows.length === 0)
            res.json([]);

        const [ accountRows ] = await pool.query(
            `
                SELECT default_billing_address, default_shipping_address
                FROM accounts
                WHERE id = ?
            `,
            [ account_id ]
        )

        res.json({ addresses: addressRows, defaults: accountRows[0] || {} });

    } catch (err) {
        console.error('Accounts route GET /:account_id/address endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }

});

router.post('/:account_id/address', async (req, res) => {
    
    try {

        const { account_id } = req.params;
        const { full_name, phone_number, province, city, barangay, postal_code, street_address, is_default_billing, is_default_shipping } = req.body;

        const [ result ] = await pool.query(
            `
                INSERT INTO account_addresses
                (account_id, full_name, phone_number, province, city, barangay, postal_code, street_address)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [ account_id, full_name, phone_number, province, city, barangay, postal_code, street_address ]
        );

        const newAddressId = result.insertId;
        const updates = [];
        const params = [];

        if (is_default_billing === true) {
            updates.push('default_billing_address = ?');
            params.push(newAddressId);
        }

        if (is_default_shipping === true) {
            updates.push('default_shipping_address = ?');
            params.push(newAddressId);
        }

        if (updates.length > 0) {
            params.push(account_id);
            await pool.query(
                `
                    UPDATE accounts
                    SET ${updates.join(', ')}
                    WHERE id = ?`
                ,
                params
            );
        }

        const [ user ] = await pool.query(
            `
                SELECT *
                FROM accounts
                WHERE id = ?
            `,
            [ account_id ]
        );

        if (user.length === 0)
            throw new Error('Account does not exist!');

        res.json(user[0]);

    } catch (err) {
        console.error('Accounts route POST /:account_id/address endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }
});
router.put('/:account_id/personal-info', async (req, res) => {
    try {
        const { account_id } = req.params;
        const { first_name, last_name, email, phone_number } = req.body;
        
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
                SET first_name = ?, last_name = ?, email = ?, phone_number = ?
                WHERE id = ?
            `,
            [first_name, last_name, email, phone_number, account_id]
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

                SET address = ?, modified_at = CURRENT_TIMESTAMP
        );
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

router.delete('/:address_id/address', async (req, res) => {

    try {

        const { address_id } = req.params;

        const [ result ] = await pool.query(
            `
                DELETE FROM
                account_addresses
                WHERE id = ?
            `,
            [ address_id ]
        )

        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Address not found!' });

        res.json({ message: 'Address successfully deleted!' });

    } catch (err) {
        console.error('Accounts route DELETE /:address_id/address endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }

});

router.delete('/:account_id', async (req, res) => {
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        const { account_id } = req.params;

        console.log("ACCOUNT ID: ", account_id);
        
        await connection.query(
            `
                DELETE
                FROM carts
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        const [ accounts ] = await connection.query(
            `
                SELECT image_url 
                FROM accounts
                WHERE id = ?
            `,
            [ account_id ]
        );
        
        await connection.query(
            `
                DELETE
                FROM accounts
                WHERE id = ?
            `,
            [ account_id ]
        );

        await connection.query(
            `
                DELETE
                FROM orders
                WHERE account_id = ?
            `,
            [ account_id ]
        )
        
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
