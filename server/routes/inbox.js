import express from 'express';
import pool from '../apis/db.js';

const router = express.Router();

// GET activities (returns plain array)
router.get('/:account_id', async (req, res) => {
  try {
    const { account_id } = req.params;
    const { limit = 50, offset = 0, unread_only } = req.query;

    let sql = `
      SELECT
        id,
        type,
        title,
        message,
        icon,
        read_status AS \`read\`,
        created_at
      FROM inbox_activities
      WHERE account_id = ?
    `;
    const params = [account_id];
    if (unread_only === 'true') {
      sql += ' AND read_status = 0';
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('[INBOX] GET error', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET unread count
router.get('/:account_id/count', async (req, res) => {
  try {
    const { account_id } = req.params;
    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM inbox_activities WHERE account_id = ? AND read_status = 0', [account_id]);
    return res.json({ count: rows[0].cnt });
  } catch (err) {
    console.error('[INBOX] COUNT error', err);
    return res.status(500).json({ error: err.message });
  }
});

// mark single activity as read
router.put('/:account_id/activities/:activity_id/read', async (req, res) => {
  try {
    const { account_id, activity_id } = req.params;
    const [result] = await pool.query('UPDATE inbox_activities SET read_status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ?', [activity_id, account_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[INBOX] mark read error', err);
    return res.status(500).json({ error: err.message });
  }
});

// mark all as read
router.put('/:account_id/mark-all-read', async (req, res) => {
  try {
    const { account_id } = req.params;
    const [result] = await pool.query('UPDATE inbox_activities SET read_status = 1, updated_at = CURRENT_TIMESTAMP WHERE account_id = ? AND read_status = 0', [account_id]);
    return res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error('[INBOX] mark-all error', err);
    return res.status(500).json({ error: err.message });
  }
});

// create activity
router.post('/', async (req, res) => {
  try {
    const { account_id, type, title, message, icon } = req.body;
    if (!account_id || !type || !title || !message) return res.status(400).json({ error: 'Missing fields' });
    const [result] = await pool.query('INSERT INTO inbox_activities (account_id,type,title,message,icon) VALUES (?,?,?,?,?)', [account_id, type, title, message, icon || 'fa-bell']);
    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('[INBOX] POST error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a single activity
router.delete('/:account_id/activities/:activity_id', async (req, res) => {
  try {
    const { account_id, activity_id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM inbox_activities WHERE id = ? AND account_id = ?',
      [activity_id, account_id]
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    return res.json({ success: true, deletedId: activity_id });
  } catch (err) {
    console.error('[INBOX] DELETE activity error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete all activities for a user (clear inbox)
router.delete('/:account_id/clear', async (req, res) => {
  try {
    const { account_id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM inbox_activities WHERE account_id = ?',
      [account_id]
    );

    return res.json({ success: true, deletedCount: result.affectedRows });
  } catch (err) {
    console.error('[INBOX] CLEAR inbox error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;