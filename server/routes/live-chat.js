import pool from "../apis/db.js";
import express from 'express';
import { pingUser } from "../utils/sse.js";

const router = express.Router();

router.get('/rooms', async (req, res) => {
    try {
        const query = `
            SELECT id, customer_id, agent_id, status, priority, created_at, closed_at, modified_at 
            FROM live_chat_rooms 
            WHERE 
                status IN ('waiting', 'active', 'concluded')
            ORDER BY 
                CASE 
                    WHEN status = 'waiting' THEN 1
                    WHEN status = 'active' THEN 2
                    WHEN status = 'concluded' THEN 3
                    ELSE 4
                END,
                priority DESC,
                modified_at DESC
        `;

        const [rooms] = await pool.query(query);
        
        console.log(`[Server] Fetched ${rooms.length} rooms`);

        res.status(200).json({
            success: true,
            data: rooms
        });

    } catch (err) {
        console.error('[Server] Live chat rooms fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat rooms'
        });
    }
});

router.get('/room/active/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;

        const [rooms] = await pool.query(
            `SELECT lcr.id, lcr.customer_id, lcr.agent_id, lcr.status, lcr.created_at, a.name as agent_name
             FROM live_chat_rooms lcr
             LEFT JOIN accounts a ON lcr.agent_id = a.id
             WHERE lcr.customer_id = ? AND lcr.status IN ('waiting', 'active') 
             ORDER BY lcr.created_at DESC 
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

router.get('/room/:room_id/messages', async (req, res) => {
    try {
        const { room_id } = req.params;
        const { user_id } = req.query;

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

        // UPDATED: Include sender names
        const [messages] = await pool.query(
            `SELECT 
                lcm.id, 
                lcm.room_id, 
                lcm.sender_id, 
                lcm.sender_type, 
                lcm.message, 
                lcm.is_read, 
                lcm.created_at,
                a.name as sender_name
            FROM live_chat_messages lcm
            LEFT JOIN accounts a ON lcm.sender_id = a.id
            WHERE lcm.room_id = ? 
            ORDER BY lcm.created_at ASC`,
            [room_id]
        );

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

router.get('/room/:room_id/unified-messages', async (req, res) => {
    try {
        const { room_id } = req.params;
        const { user_id } = req.query;

        if (!room_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and User ID are required'
            });
        }

        const [rooms] = await pool.query(
            'SELECT customer_id FROM live_chat_rooms WHERE id = ?',
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Chat room not found'
            });
        }

        const customer_id = rooms[0].customer_id;

        const [aiMessages] = await pool.query(
            `SELECT id, message_type, message, created_at
            FROM chatbot_sessions
            WHERE user_id = ?
            ORDER BY created_at ASC`,
            [customer_id]
        );

        // UPDATED: Include sender names in live messages
        const [liveMessages] = await pool.query(
            `SELECT 
                lcm.id, 
                lcm.sender_type, 
                lcm.message, 
                lcm.sender_id, 
                lcm.is_read, 
                lcm.created_at,
                a.name as sender_name
            FROM live_chat_messages lcm
            LEFT JOIN accounts a ON lcm.sender_id = a.id
            WHERE lcm.room_id = ?
            ORDER BY lcm.created_at ASC`,
            [room_id]
        );

        res.json({
            success: true,
            data: {
                aiMessages: aiMessages,
                liveMessages: liveMessages
            }
        });

    } catch (error) {
        console.error('Get unified messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve unified chat history'
        });
    }
});

router.post('/room/create', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { customer_id, priority = 'low' } = req.body;

        console.log(`[Server] Creating room for customer ${customer_id}`);

        // Check if customer already has a non-concluded room
        const [existingRooms] = await connection.query(
            `SELECT id, status, agent_id FROM live_chat_rooms 
             WHERE customer_id = ? AND status IN ('waiting', 'active') 
             ORDER BY created_at DESC LIMIT 1`,
            [customer_id]
        );

        if (existingRooms.length > 0) {
            console.log(`[Server] Existing active room found: ${existingRooms[0].id}`);
            await connection.commit();
            return res.status(200).json({
                success: true,
                data: existingRooms[0],
                message: 'Existing room found'
            });
        }

        // Check for concluded room (for perpetual chat)
        const [concludedRooms] = await connection.query(
            `SELECT id, status, agent_id FROM live_chat_rooms 
             WHERE customer_id = ? AND status = 'concluded' 
             ORDER BY created_at DESC LIMIT 1`,
            [customer_id]
        );

        if (concludedRooms.length > 0) {
            // Reactivate concluded room
            await connection.query(
                `UPDATE live_chat_rooms 
                 SET status = 'waiting', agent_id = NULL, modified_at = NOW() 
                 WHERE id = ?`,
                [concludedRooms[0].id]
            );
        
            console.log(`[Server] Reactivated concluded room: ${concludedRooms[0].id}`);
        
            // Send system message
            const [messageResult] = await connection.query(
                `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
                 VALUES (?, ?, ?, ?)`,
                [concludedRooms[0].id, customer_id, 'system', 'Reconnected. An agent will be with you shortly...']
            );

            const messageData = {
                id: messageResult.insertId,
                room_id: concludedRooms[0].id,
                sender_id: customer_id,
                sender_type: 'system',
                message: 'Reconnected. An agent will be with you shortly...',
                is_read: false,
                created_at: new Date().toISOString()
            };
        
            // Notify customer that room was reactivated
            pingUser(customer_id, {
                type: 'room_reactivated',
                room_id: concludedRooms[0].id,
                status: 'waiting',
                message: messageData
            });
        
            // Notify agents
            const [agents] = await connection.query(
                `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
            );
            
            agents.forEach(agent => {
                pingUser(agent.id, {
                    type: 'room_reactivated',  // Changed from 'new_chat_room'
                    room_id: concludedRooms[0].id,
                    customer_id: customer_id,
                    priority: priority,
                    message: messageData  // Include message data
                });
            });
        
            await connection.commit();
        
            return res.status(200).json({
                success: true,
                data: { id: concludedRooms[0].id, status: 'waiting', agent_id: null },
                message: 'Reactivated existing room'
            });
        }

        // Create new room (first time customer)
        const [result] = await connection.query(
            `INSERT INTO live_chat_rooms (customer_id, status, priority) 
             VALUES (?, 'waiting', ?)`,
            [customer_id, priority]
        );

        const roomId = result.insertId;
        console.log(`[Server] New room created: ${roomId}`);

        await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, ?, ?)`,
            [roomId, customer_id, 'system', 'You are now connected. An agent will be with you shortly...']
        );

        const [agents] = await connection.query(
            `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
        );

        agents.forEach(agent => {
            pingUser(agent.id, {
                type: 'new_chat_room',
                room_id: roomId,
                customer_id: customer_id,
                priority: priority,
                status: 'waiting'
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
        console.error('[Server] Live chat room creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create chat room'
        });
    } finally {
        connection.release();
    }
});

router.post('/room/:room_id/claim', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { agent_id } = req.body;

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

        // Get agent name
        const [agent] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [agent_id]
        );

        const agentName = agent[0]?.name || 'Agent';

        await connection.query(
            `UPDATE live_chat_rooms 
             SET agent_id = ?, agent_name = ?, status = 'active' 
             WHERE id = ?`,
            [agent_id, agentName, room_id]
        );

        // Insert system message
        const [messageResult] = await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, 'system', ?)`,
            [room_id, agent_id, `Agent ${agentName} has joined the chat.`]
        );

        pingUser(rooms[0].customer_id, {
            type: 'agent_joined',
            room_id: room_id,
            agent_id: agent_id,
            agent_name: agentName,
            message: {
                id: messageResult.insertId,
                room_id: parseInt(room_id),
                sender_id: agent_id,
                sender_type: 'system',
                message: `Agent ${agentName} has joined the chat.`,
                is_read: false,
                created_at: new Date().toISOString(),
                sender_name: agentName
            }
        });

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Room claimed successfully',
            agent_name: agentName
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

router.post('/room/:room_id/message', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { sender_id, sender_type, message } = req.body;

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

        const [result] = await connection.query(
            `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, ?, ?)`,
            [room_id, sender_id, sender_type, message]
        );

        const [sender] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [sender_id]
        );

        const messageData = {
            id: result.insertId,
            room_id: parseInt(room_id),
            sender_id: parseInt(sender_id),
            sender_type: sender_type,
            message: message,
            is_read: false,
            created_at: new Date().toISOString(),
            sender_name: sender[0]?.name || null
        };

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
        console.error('[Server] Live chat message send error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    } finally {
        connection.release();
    }
});

router.post('/room/:room_id/close', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { user_id } = req.body;

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
        const isAgent = room.agent_id === parseInt(user_id);
        const isCustomer = room.customer_id === parseInt(user_id);

        // Prevent actions on already concluded chats
        if (room.status === 'concluded') {
            await connection.commit();
            return res.status(400).json({
                success: false,
                message: 'Chat session has already ended'
            });
        }

        if (isAgent) {
            // Admin can only conclude active chats
            if (room.status !== 'active') {
                await connection.commit();
                return res.status(400).json({
                    success: false,
                    message: 'Can only conclude active chats'
                });
            }
        
            // Agent concluding - return chat to waiting for another agent
            await connection.query(
                `UPDATE live_chat_rooms 
                 SET status = 'waiting', agent_id = NULL, modified_at = NOW() 
                 WHERE id = ?`,
                [room_id]
            );

            const systemMessage = 'Agent has concluded the session. Waiting for another agent...';

            const [messageResult] = await connection.query(
                `INSERT INTO live_chat_messages (room_id, sender_id, sender_type, message) 
                 VALUES (?, ?, ?, ?)`,
                [room_id, user_id, 'system', systemMessage]
            );

            const messageData = {
                id: messageResult.insertId,
                room_id: parseInt(room_id),
                sender_id: user_id,
                sender_type: 'system',
                message: systemMessage,
                is_read: false,
                created_at: new Date().toISOString()
            };
        
            pingUser(room.customer_id, {
                type: 'agent_concluded',
                room_id: room_id,
                message: messageData
            });

            const [agents] = await connection.query(
                `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
            );

            agents.forEach(agent => {
                pingUser(agent.id, {
                    type: 'room_returned_to_waiting',
                    room_id: parseInt(room_id),
                    customer_id: room.customer_id,
                    message: messageData
                });
            });
        
            await connection.commit();
        
            res.status(200).json({
                success: true,
                message: 'Chat returned to waiting queue'
            });

        } else if (isCustomer) {
            // Customer ending session - set to concluded for perpetual chat
            await connection.query(
                `UPDATE live_chat_rooms 
                 SET status = 'concluded', modified_at = NOW() 
                 WHERE id = ?`,
                [room_id]
            );

            // Notify agent if present
            if (room.agent_id) {
                pingUser(room.agent_id, {
                    type: 'customer_disconnected',
                    room_id: room_id,
                    customer_id: room.customer_id,
                    agent_id: room.agent_id
                });
            }

            const [agents] = await connection.query(
                `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
            );
            
            agents.forEach(agent => {
                pingUser(agent.id, {
                    type: 'customer_disconnected',
                    room_id: parseInt(room_id),
                    customer_id: room.customer_id,
                    agent_id: room.agent_id  // Will be null if unclaimed
                });
            });

            await connection.commit();

            res.status(200).json({
                success: true,
                message: 'Chat session ended'
            });
        } else {
            await connection.commit();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

    } catch (err) {
        await connection.rollback();
        console.error('[Server] Live chat room close error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to close chat room'
        });
    } finally {
        connection.release();
    }
});

router.post('/room/:room_id/disconnect', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { room_id } = req.params;
        const { customer_id } = req.body;

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

        if (room.customer_id !== parseInt(customer_id)) {
            await connection.commit();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only disconnect if not already concluded
        if (room.status !== 'concluded') {
            await connection.query(
                `UPDATE live_chat_rooms 
                 SET status = 'concluded', modified_at = NOW() 
                 WHERE id = ?`,
                [room_id]
            );

            // Notify agent if present
            if (room.agent_id) {
                pingUser(room.agent_id, {
                    type: 'customer_disconnected',
                    room_id: room_id,
                    customer_id: customer_id,
                    agent_id: room.agent_id  // Add this so frontend knows
                });
            }
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Customer disconnected'
        });

    } catch (err) {
        await connection.rollback();
        console.error('[Server] Live chat room disconnect error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect from chat room'
        });
    } finally {
        connection.release();
    }
});

export default router;
