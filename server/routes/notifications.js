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
        const { type, title, message } = req.body;

        const [ result ] = await pool.query(
            `
                INSERT INTO notifications
                (account_id, type, title, message)
                VALUES
                (?, ?, ?, ?)
            `,
            [ account_id, type, title, message ]
        );

        if (result.affectedRows === 0)
            throw new Error('Failed to insert the notification!');

        res.status(200).send();

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

        if (result.affectedRows === 0)
            throw new Error('Failed to mark all notifications as read!');

        res.status(200).send();

    } catch (err) {

        console.error("notifications router PUT /mark-all-as-read/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

router.delete('/clear-all/:account_id', async (req, res) => {
    
    try {

        const { account_id } = req.params;

        const [ result ] = await pool.query(
            `
                DELETE FROM notifications
                WHERE account_id = ?
            `,
            [ account_id ]
        );

        if (result.affectedRows === 0)
            throw new Error('Failed to clear all notifications!');

        res.status(200).send();

    } catch (err) {

        console.error("notifications router DELETE /clear-all/:account_id endpoint error: ", err);
        res.status(500).json(err);

    }

});

export default router;
