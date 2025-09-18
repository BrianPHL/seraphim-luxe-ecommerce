import cloudinary from "../apis/cloudinary.js";
import pool from "../apis/db.js";
import express from 'express';
import multer from "multer";
import fs from "fs";
import { AuditLogger } from '../utils/audit-trail.js';
import { requireAdmin } from '../middleware/auth.js';


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

        // Log address addition
        await AuditLogger.log({
            user_id: account_id,
            action_type: 'profile_update',
            resource_type: 'address',
            resource_id: newAddressId,
            new_values: { full_name, phone_number, province, city, barangay, postal_code, street_address },
            details: 'New address added to account',
            req
        });

        res.json(user[0]);

    } catch (err) {
        console.error('Accounts route POST /:account_id/address endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/:address_id/address', async (req, res) => {

    try {

        const { account_id, address_id } = req.params;
        const { full_name, phone_number, province, city, barangay, postal_code, street_address, is_default_billing, is_default_shipping } = req.body;

        const [ result ] = await pool.query(
            `
                UPDATE account_addresses
                SET account_id = ?, full_name = ?, phone_number = ?, province = ?, city = ?, barangay = ?, postal_code = ?, street_address = ?
                WHERE id = ?
            `,
            [ account_id, full_name, phone_number, province, city, barangay, postal_code, street_address, address_id ]
        );


        if (is_default_billing === true) {
            await pool.query(
                `
                    UPDATE accounts
                    SET default_billing_address = ?
                    WHERE id = ?
                `,
                [address_id, account_id]
            );
        } else if (is_default_billing === false) {
            await pool.query(
                `
                    UPDATE accounts
                    SET default_billing_address = NULL
                    WHERE id = ? AND default_billing_address = ?
                `,
                [account_id, address_id]
            );
        }

        if (is_default_shipping === true) {
            await pool.query(
                `
                    UPDATE accounts
                    SET default_shipping_address = ?
                    WHERE id = ?
                `,
                [address_id, account_id]
            );
        } else if (is_default_shipping === false) {
            await pool.query(
                `
                    UPDATE accounts
                    SET default_shipping_address = NULL
                    WHERE id = ? AND default_shipping_address = ?
                `,
                [account_id, address_id]
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
        console.error('Accounts route PUT /:account_id/address endpoint error: ', err);
        res.status(500).json({ error: err.message });
    }

});

router.put('/:account_id/personal-info', async (req, res) => {
    try {
        const { account_id } = req.params;
        const { first_name, last_name, email, phone_number } = req.body;
        const name = `${ first_name } ${ last_name }`;

        // Get old values first
        const [oldData] = await pool.query(
            'SELECT first_name, last_name, email, phone_number FROM accounts WHERE id = ?',
            [account_id]
        );

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
                SET name = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?
                WHERE id = ?
            `,
            [name, first_name, last_name, email, phone_number, account_id]
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

        // Log personal info update
        await AuditLogger.logProfileUpdate(
            account_id,
            oldData[0],
            { first_name, last_name, email, phone_number },
            req
        );
        
        res.json(user[0]);
    } catch (err) {
        console.error('Error updating personal info:', err);
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

        // Log password change
        await AuditLogger.logPasswordChange(account_id, req, 'Password updated via profile settings');
        
        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:account_id/suspend', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { account_id } = req.params;
        const { is_suspended } = req.body;
        const admin_id = req.user?.id; 

        // Get current account data for audit logging
        const [currentAccount] = await connection.query(
            'SELECT id, email, first_name, last_name, role, is_suspended FROM accounts WHERE id = ?',
            [account_id]
        );

        if (currentAccount.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found' });
        }

        const accountData = currentAccount[0];

        const [result] = await connection.query(
            'UPDATE accounts SET is_suspended = ? WHERE id = ?',
            [is_suspended, account_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found' });
        }

        await connection.commit();

        // Log the suspension/reactivation
        try {
            await AuditLogger.logAccountSuspension(
                admin_id,
                account_id,
                is_suspended,
                req,
                accountData
            );
        } catch (auditError) {
            console.error('Error logging account suspension audit trail:', auditError);
        }

        res.json({ message: 'Account suspension updated successfully' });

    } catch (err) {
        await connection.rollback();
        console.error("Accounts route PUT /:account_id/suspend endpoint error: ", err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.put('/:account_id/admin-update', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { account_id } = req.params;
        const { first_name, last_name, email, phone_number, role } = req.body;
        
        // More explicit admin ID retrieval with debugging
        const admin_id = req.user?.id;
        console.log('🔍 Admin performing update:', {
            admin_id: admin_id,
            admin_email: req.user?.email,
            admin_role: req.user?.role,
            target_account_id: account_id
        });

        if (!admin_id) {
            await connection.rollback();
            return res.status(401).json({ error: 'Admin authentication required' });
        }

        // Get current account data for audit logging
        const [currentAccount] = await connection.query(
            'SELECT id, email, first_name, last_name, phone_number, role FROM accounts WHERE id = ?',
            [account_id]
        );

        if (currentAccount.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found' });
        }

        const oldValues = currentAccount[0];

        // Check if email is already in use by another account
        if (email && email !== oldValues.email) {
            const [existingEmail] = await connection.query(
                'SELECT id FROM accounts WHERE email = ? AND id != ?',
                [email, account_id]
            );
            
            if (existingEmail.length > 0) {
                await connection.rollback();
                return res.status(409).json({ 
                    error: 'Email already in use by another account' 
                });
            }
        }

        const name = `${first_name} ${last_name}`;
        const [result] = await connection.query(
            'UPDATE accounts SET name = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?, role = ?, modified_at = NOW() WHERE id = ?',
            [name, first_name, last_name, email, phone_number, role, account_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Failed to update account' });
        }

        await connection.commit();

        const newValues = { first_name, last_name, email, phone_number, role };

        // Log the account edit with explicit admin information
        try {
            console.log('🔍 Logging audit trail:', {
                performing_admin_id: admin_id,
                target_account_id: account_id,
                old_values: oldValues,
                new_values: newValues
            });

            await AuditLogger.logAccountEdit(
                admin_id,
                account_id,
                oldValues,
                newValues,
                req
            );
        } catch (auditError) {
            console.error('Error logging account edit audit trail:', auditError);
        }

        // Get updated account data to return
        const [updatedAccount] = await connection.query(
            'SELECT * FROM accounts WHERE id = ?',
            [account_id]
        );

        res.json({ 
            message: 'Account updated successfully',
            account: updatedAccount[0]
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error updating account:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
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

router.delete('/:account_id', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        const { account_id } = req.params;
        const admin_id = req.user?.id;

        // Get account data before deletion for audit logging
        const [accountData] = await connection.query(
            'SELECT id, email, first_name, last_name, role, image_url FROM accounts WHERE id = ?',
            [account_id]
        );

        if (accountData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found' });
        }

        const userData = accountData[0];
        
        // Delete related data first
        await connection.query(
            'DELETE FROM carts WHERE account_id = ?',
            [account_id]
        );

        await connection.query(
            'DELETE FROM orders WHERE account_id = ?',
            [account_id]
        );
        
        // Delete the account
        const [result] = await connection.query(
            'DELETE FROM accounts WHERE id = ?',
            [account_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Account not found' });
        }
        
        // Delete cloudinary image if exists
        if (userData.image_url) {
            await cloudinary.uploader.destroy(userData.image_url);
        }
        
        await connection.commit();

        // Log the account deletion
        try {
            await AuditLogger.logAccountDeletion(
                admin_id,
                account_id,
                userData,
                req
            );
        } catch (auditError) {
            console.error('Error logging account deletion audit trail:', auditError);
        }
        
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Error deleting account:', err);
        res.status(500).json({ error: err.message });
    } finally { 
        connection.release(); 
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { first_name, last_name, email, phone_number, role, password } = req.body;
        const admin_id = req.user?.id;

        // Check if email already exists
        const [existingEmail] = await connection.query(
            'SELECT id FROM accounts WHERE email = ?',
            [email]
        );
        
        if (existingEmail.length > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                error: 'Email already in use' 
            });
        }

        const name = `${first_name} ${last_name}`;

        // Create the account
        const [result] = await connection.query(
            'INSERT INTO accounts (name, first_name, last_name, email, phone_number, role, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [name, first_name, last_name, email, phone_number, role, password]
        );

        const newUserId = result.insertId;

        await connection.commit();

        // Log the account creation
        try {
            await AuditLogger.logAccountCreation(
                admin_id,
                newUserId,
                { first_name, last_name, email, role },
                req
            );
        } catch (auditError) {
            console.error('Error logging account creation audit trail:', auditError);
        }

        res.status(201).json({ 
            message: 'Account created successfully',
            account_id: newUserId 
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error creating account:', err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/:account_id/avatar', upload.single('avatar'), async (req, res) => {

    try {

        const { account_id } = req.params;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded!' });

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'Avatars',
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
