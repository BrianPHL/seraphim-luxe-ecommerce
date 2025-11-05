import pool from "../apis/db.js";
import express from 'express';
import geminiAI from "../apis/gemini-ai.js";

const router = express.Router();

router.get('/predefined-questions', async (req, res) => {
    
    try {

        const { scope } = req.query;

        if (!scope || !['customer', 'admin'].includes(scope)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scope parameter. Must be "customer" or "admin".'
            });
        }

        const query = `
            SELECT id, question, scope, priority_level, created_at
            FROM chatbot_predefined_questions
            WHERE scope = ?
            ORDER BY priority_level ASC, created_at DESC
        `;

        const [questions] = await pool.query(query, [scope]);

        return res.status(200).json({
            success: true,
            data: questions
        });

    } catch (err) {
        console.error('Gemini AI predefined questions fetch error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch predefined questions'
        });
    }

});

router.get('/history/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { session_id, limit = 50 } = req.query;

        let query = `
            SELECT id, session_id, user_type, message_type, message, created_at 
            FROM chatbot_sessions 
            WHERE user_id = ?
        `;
        let params = [ user_id ];

        if (session_id) {
            query += ` AND session_id = ?`;
            params.push(session_id);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [chatHistory] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: chatHistory.reverse()
        });

    } catch (err) {
        console.error('gemini-ai route GET /history/:user_id endpoint error:', err);
        res.status(500).json({ error: err });
    }

});

router.post('/:user_id/:user_type', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { user_id, user_type } = req.params;
        const { context, message, session_id } = req.body;

        await connection.query(
            `INSERT INTO chatbot_sessions (user_id, session_id, user_type, message_type, message, context_blob)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, session_id, user_type, 'user', message, context.contextBlob]
        );

        const AIResponse = await geminiAI(context, message, user_type);

        await connection.query(
            `INSERT INTO chatbot_sessions (user_id, session_id, user_type, message_type, message, context_blob)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, session_id, user_type, 'chatbot', AIResponse, context.contextBlob]
        );

        await connection.commit();

        res.status(200).json({ data: AIResponse });

    } catch (err) {
        await connection.rollback();
        console.error('Gemini AI route error:', err);

        res.status(err.status === 429 ? 429 : 500).json({ 
            error: {
                message: err.message || 'Failed to process your request',
                code: err.status || 500
            }
        });

    } finally {
        connection.release();
    }
});

export default router;
