import pool from "../apis/db.js";
import express from 'express';
import { AuditLogger } from "../utils/audit-trail.js";

const router = express.Router();

router.get("/check-password-exists/:email", async (req, res) => {

    try {

        const { email } = req.params;

        const [ accountRows ] = await pool.query(
            `
                SELECT id
                FROM accounts
                WHERE email = ?
            `,
            [ email ]
        );
        const accountId = accountRows[0]?.id || null;

        if (!accountId)
            throw new Error("Account does not exist!");

        const [ oauthAccountRows ] = await pool.query(
            `
                SELECT
                    MAX(password IS NOT NULL AND password != "") AS has_password
                FROM oauth_accounts
                WHERE user_id = ?
            `,
            [ accountId, accountId ]
        );

        const doesPasswordExist = Boolean(oauthAccountRows[0]?.has_password);

        res.status(200).json({ accountId, doesPasswordExist });

    } catch (err) {

        console.error('OAuth /check-password-exists/:email route error:', err);
        res.status(500).json({ doesPasswordExist: false, error: err.message });
    
    }

});

router.get("/check-role-matches/:type/:email", async (req, res) => {

    try {

        const { type, email } = req.params;

        const [ accountRows ] = await pool.query(
            `
                SELECT role = ? AS does_role_match_type
                FROM accounts
                WHERE email = ?
            `,
            [ type, email ]
        );

        if (accountRows.length <= 0)
            throw new Error("Account does not exist!");
    
        const doesRoleMatchType = Boolean(accountRows[0]?.does_role_match_type);

        res.status(200).json({ doesRoleMatchType });

    } catch (err) {

        console.error('OAuth /check-role-matches/:type/:email route error:', err);
        res.status(500).json({ doesRoleMatchType: false, error: err.message });
        
    }

});

router.get('/check-suspension-status/:email/', async (req, res) => {

    const { email } = req.params;

    try {

        const [ accountRows ] = await pool.query(
            `
                SELECT is_suspended
                FROM accounts
                WHERE email = ?
            `,
            [ email ]
        )

        if (accountRows.length <= 0)
            throw new Error('Account does not exist!');

        const isAccountSuspended = Boolean(accountRows[0]?.is_suspended);

        res.status(200).json({ isAccountSuspended });

    } catch (err) {
        console.error("Accounts route GET /check-suspension-status/:email/ endpoint error: ", err);
        res.status(500).json({ error: err.message });
    }

});

router.post('/audit/signout', async (req, res) => {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const result = await AuditLogger.logSignOut(user_id, req, 'User signed out');
        
        res.json({ success: true, logged: result });
    } catch (error) {

        res.status(500).json({ error: 'Failed to log audit event', details: error.message });
    }
});

export default router;
