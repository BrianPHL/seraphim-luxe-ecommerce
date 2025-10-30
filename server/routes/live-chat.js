import pool from "../apis/db.js";
import express from 'express';
import { pingUser } from "../utils/sse.js";

const router = express.Router();

// Create or get existing chat room for customer
router.post('/room/create', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { customer_id, priority = 'low' } = req.body;

        // Check if customer already has an active room
        const [existingRooms] = await connection.query(
            `SELECT id, status, agent_id FROM live_chat_rooms 
             WHERE customer_id = ? AND status IN ('waiting', 'active') 
             ORDER BY created_at DESC LIMIT 1`,
            [customer_id]
        );

        if (existingRooms.length > 0) {
            await connection.commit();
            return res.status(200).json({
                success: true,
                data: existingRooms[0],
                message: 'Existing room found'
            });
        }

        // Create new room
        const [result] = await connection.query(
            `INSERT INTO live_chat_rooms (customer_id, status, priority) 
             VALUES (?, 'waiting', ?)`,
            [customer_id, priority]
        );

        const roomId = result.insertId;

        // Send system message
        await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, 'agent', ?)`,
            [roomId, customer_id, 'You are now connected. An agent will be with you shortly...']
        );

        // Notify all available agents via SSE
        const [agents] = await connection.query(
            `SELECT id FROM accounts WHERE role = 'admin' AND NOT is_suspended`
        );
        
        agents.forEach(agent => {
            pingUser(agent.id, {
                type: 'new_chat_room',
                room_id: roomId,
                customer_id: customer_id,
                priority: priority
            });
        });

        await connection.commit();

        res.status(201).json({
            success: true,
            data: { id: roomId, status: 'waiting', agent_id: null },
            message: 'Chat room created successfully'
        });

    } catch (err) {
        await connection.rollback();
        console.error('Live chat room creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create chat room'
        });
    } finally {
        connection.release();
    }
});

// Agent claims a chat room
router.post('/room/:room_id/claim', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { agent_id } = req.body;

        // Check if room is still available
        const [rooms] = await connection.query(
            `SELECT id, customer_id, status FROM live_chat_rooms 
             WHERE id = ? AND status = 'waiting' FOR UPDATE`,
            [room_id]
        );

        if (rooms.length === 0) {
            await connection.commit();
            return res.status(409).json({
                success: false,
                message: 'Room is no longer available'
            });
        }

        // Claim the room
        await connection.query(
            `UPDATE live_chat_rooms 
             SET agent_id = ?, status = 'active' 
             WHERE id = ?`,
            [agent_id, room_id]
        );

        // Send system message
        const [agent] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [agent_id]
        );

        await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, 'agent', ?)`,
            [room_id, agent_id, `Agent ${agent[0]?.name || 'Support'} has joined the chat.`]
        );

        // Notify customer
        pingUser(rooms[0].customer_id, {
            type: 'agent_joined',
            room_id: room_id,
            agent_id: agent_id,
            agent_name: agent[0]?.name || 'Support'
        });

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Room claimed successfully'
        });

    } catch (err) {
        await connection.rollback();
        console.error('Live chat room claim error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to claim chat room'
        });
    } finally {
        connection.release();
    }
});

// Send message in live chat
router.post('/room/:room_id/message', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { sender_id, sender_type, message } = req.body;

        // Verify room exists and user has access
        const [rooms] = await connection.query(
            `SELECT customer_id, agent_id, status FROM live_chat_rooms WHERE id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const room = rooms[0];

        // Verify sender has access to this room
        if (sender_type === 'customer' && room.customer_id !== parseInt(sender_id)) {
            await connection.commit();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (sender_type === 'agent' && room.agent_id !== parseInt(sender_id)) {
            await connection.commit();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Insert message
        const [result] = await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, ?, ?)`,
            [room_id, sender_id, sender_type, message]
        );

        const messageData = {
            id: result.insertId,
            room_id: parseInt(room_id),
            sender_id: parseInt(sender_id),
            sender_type: sender_type,
            message: message,
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Notify the other party via SSE
        const recipientId = sender_type === 'customer' ? room.agent_id : room.customer_id;
        
        if (recipientId) {
            pingUser(recipientId, {
                type: 'new_message',
                data: messageData
            });
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            data: messageData
        });

    } catch (err) {
        await connection.rollback();
        console.error('Live chat message send error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    } finally {
        connection.release();
    }
});

// Get chat history for a room
router.get('/room/:room_id/messages', async (req, res) => {
    try {
        const { room_id } = req.params;
        const { user_id } = req.query;

        // Verify user has access to this room
        const [rooms] = await pool.query(
            `SELECT customer_id, agent_id FROM live_chat_rooms WHERE id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const room = rooms[0];
        if (room.customer_id !== parseInt(user_id) && room.agent_id !== parseInt(user_id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get messages
        const [messages] = await pool.query(
            `SELECT id, room_id, sender_id, sender_type, message, is_read, created_at 
             FROM live_chat_messages 
             WHERE room_id = ? 
             ORDER BY created_at ASC`,
            [room_id]
        );

        // Mark messages as read
        await pool.query(
            `UPDATE live_chat_messages 
             SET is_read = 1 
             WHERE room_id = ? AND sender_id != ? AND is_read = 0`,
            [room_id, user_id]
        );

        res.status(200).json({
            success: true,
            data: messages
        });

    } catch (err) {
        console.error('Live chat messages fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Get active room for customer
router.get('/room/active/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;

        const [rooms] = await pool.query(
            `SELECT id, customer_id, agent_id, status, created_at 
             FROM live_chat_rooms 
             WHERE customer_id = ? AND status IN ('waiting', 'active') 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [customer_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active room found'
            });
        }

        res.status(200).json({
            success: true,
            data: rooms[0]
        });

    } catch (err) {
        console.error('Live chat active room fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active room'
        });
    }
});

// Close chat room
router.post('/room/:room_id/close', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { user_id } = req.body;

        // Get room details
        const [rooms] = await connection.query(
            `SELECT customer_id, agent_id FROM live_chat_rooms WHERE id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const room = rooms[0];

        // Close the room
        await connection.query(
            `UPDATE live_chat_rooms 
             SET status = 'closed', closed_at = NOW() 
             WHERE id = ?`,
            [room_id]
        );

        // Notify the other party
        const otherUserId = room.customer_id === parseInt(user_id) ? room.agent_id : room.customer_id;
        
        if (otherUserId) {
            pingUser(otherUserId, {
                type: 'chat_closed',
                room_id: room_id
            });
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Chat room closed successfully'
        });

    } catch (err) {
        await connection.rollback();
        console.error('Live chat room close error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to close chat room'
        });
    } finally {
        connection.release();
    }
});

export default router;
