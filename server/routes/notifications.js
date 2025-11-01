import pool from "../apis/db.js";
import express from 'express';

const router = express.Router();

router.get('/:account_id', async (req, res) => {

    try {

        const { account_id } = req.params;

        const [ notificationsRows ] = await pool.query(
            `
                SELECT *
                FROM notifications
                WHERE account_id = ?
                ORDER BY created_at DESC
            `,
            [ account_id ]
        );

        res.status(200).json(notificationsRows || []);

    } catch (err) {

        console.error("notifications router GET /:account_id endpoint error: ", err);
        res.status(500).json(err);
        
    }

});

router.post('/:account_id', async (req, res) => {

    try {

        const { account_id } = req.params;
        const { type, action, title, message, metadata } = req.body;

        // Check if user has this notification type enabled
        const [ prefs ] = await pool.query(
            'SELECT * FROM notification_preferences WHERE account_id = ?',
            [ account_id ]
        );

        if (prefs.length > 0) {
            const preferences = prefs[0];

            if (action === 'add_to_cart' || action === 'remove_from_cart') {
                if (!preferences.cart_updates) return res.status(200).json({ skipped: true });
            }
            if (action === 'add_to_wishlist' || action === 'remove_from_wishlist') {
                if (!preferences.wishlist_updates) return res.status(200).json({ skipped: true });
            }
            if (action.startsWith('order_')) {
                if (!preferences.order_updates) return res.status(200).json({ skipped: true });
            }
            if (action === 'email_changed' || action === 'password_changed') {
                if (!preferences.account_security) return res.status(200).json({ skipped: true });
            }

            // Check admin preferences
            if (action === 'new_order') {
                if (!preferences.admin_new_orders) return res.status(200).json({ skipped: true });
            }
            if (action === 'new_message') {
                if (!preferences.admin_customer_messages) return res.status(200).json({ skipped: true });
            }
            if (action === 'low_stock') {
                if (!preferences.admin_low_stock_alerts) return res.status(200).json({ skipped: true });
            }
        }

        const [ result ] = await pool.query(
            `
                INSERT INTO notifications
                (account_id, type, action, title, message, metadata)
                VALUES
                (?, ?, ?, ?, ?, ?)
            `,
            [ account_id, type, action, title, message, metadata ? JSON.stringify(metadata) : null ]
        );

        if (result.affectedRows === 0)
            throw new Error('Failed to insert the notification!');

        res.status(200).json({ success: true });

    } catch (err) {

        console.error("notifications router POST /:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.put('/mark-as-read/:notification_id/:account_id', async (req, res) => {

    try {

        const { notification_id, account_id } = req.params;

        const [ result ] = await pool.query(
            `
                UPDATE notifications
                SET is_read = 1
                WHERE account_id = ? AND id = ?
            `,
            [ account_id, notification_id ]
        );

        if (result.affectedRows === 0)
            throw new Error('Failed to mark notification as read!');

        res.status(200).send();

    } catch (err) {

        console.error("notifications router PUT /mark-as-read/:notification_id/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.put('/mark-all-as-read/:account_id', async (req, res) => {

    try {

        const { account_id } = req.params;

        const [ result ] = await pool.query(
            `
                UPDATE notifications
                SET is_read = 1
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        res.status(200).send();

    } catch (err) {

        console.error("notifications router PUT /mark-all-as-read/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.delete('/clear/:notification_id/:account_id', async (req, res) => {
    
    try {

        const { notification_id, account_id } = req.params;

        const [ result ] = await pool.query(
            `
                DELETE FROM notifications
                WHERE id = ? AND account_id = ?
            `,
            [ notification_id, account_id ]
        );

        if (result.affectedRows === 0)
            throw new Error('Failed to clear the notification!');

        res.status(200).send();

    } catch (err) {

        console.error("notifications router DELETE /clear/:notification_id/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.delete('/clear-all/:account_id', async (req, res) => {
    
    try {

        const { account_id } = req.params;

        await pool.query(
            `
                DELETE FROM notifications
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        res.status(200).send();

    } catch (err) {

        console.error("notifications router DELETE /clear-all/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.get('/preferences/:account_id', async (req, res) => {
    
    try {

        const { account_id } = req.params;

        const [ user ] = await pool.query(
            'SELECT role FROM accounts WHERE id = ?',
            [ account_id ]
        );

        const isAdmin = user[0]?.role === 'admin';

        let [ preferences ] = await pool.query(
            `
                SELECT * 
                FROM notification_preferences
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        if (preferences.length === 0) {
            await pool.query(
                `
                    INSERT INTO notification_preferences
                    (
                        account_id, cart_updates, wishlist_updates, order_updates, account_security, admin_new_orders, admin_customer_messages,
                        admin_low_stock_alerts
                    )
                    VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1)
                `,
                [ account_id ]
            );

            [ preferences ] = await pool.query(
                `
                    SELECT * 
                    FROM notification_preferences
                    WHERE account_id = ?
                `,
                [ account_id ]
            );
        }

        const prefs = preferences[0];

        const formattedPrefs = {
            cart_updates: !!prefs.cart_updates,
            wishlist_updates: !!prefs.wishlist_updates,
            order_updates: !!prefs.order_updates,
            account_security: !!prefs.account_security,
            ...(isAdmin && {
                admin_new_orders: !!prefs.admin_new_orders,
                admin_customer_messages: !!prefs.admin_customer_messages,
                admin_low_stock_alerts: !!prefs.admin_low_stock_alerts
            })
        };

        res.status(200).json({ preferences: formattedPrefs });

    } catch (err) {

        console.error("notifications router GET /preferences/:account_id endpoint error: ", err);
        res.status(500).json({ error: err.message });

    }

});

router.put('/preferences/:account_id', async (req, res) => {
    
    try {

        const { account_id } = req.params;
        const preferences = req.body;

        preferences.account_security = true;

        const [ result ] = await pool.query(
            `
                UPDATE notification_preferences
                SET 
                    cart_updates = ?,
                    wishlist_updates = ?,
                    order_updates = ?,
                    account_security = ?,
                    admin_new_orders = ?,
                    admin_customer_messages = ?,
                    admin_low_stock_alerts = ?
                WHERE account_id = ?
            `,
            [
                preferences.cart_updates ?? true,
                preferences.wishlist_updates ?? true,
                preferences.order_updates ?? true,
                preferences.account_security ?? true,
                preferences.admin_new_orders ?? true,
                preferences.admin_customer_messages ?? true,
                preferences.admin_low_stock_alerts ?? true,
                account_id
            ]
        );

        if (result.affectedRows === 0) {
            await pool.query(
                `
                    INSERT INTO notification_preferences
                    (account_id, cart_updates, wishlist_updates, order_updates, account_security, admin_new_orders, 
                     admin_customer_messages, admin_low_stock_alerts)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    account_id,
                    preferences.cart_updates ?? true,
                    preferences.wishlist_updates ?? true,
                    preferences.order_updates ?? true,
                    preferences.account_security ?? true,
                    preferences.admin_new_orders ?? true,
                    preferences.admin_customer_messages ?? true,
                    preferences.admin_low_stock_alerts ?? true
                ]
            );
        }

        res.status(200).json({ 
            success: true,
            preferences: preferences 
        });

    } catch (err) {

        console.error("notifications router PUT /preferences/:account_id endpoint error: ", err);
        res.status(500).json({ error: err.message });

    }

});

export default router;
