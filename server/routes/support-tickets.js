import pool from "../apis/db.js";
import express from 'express';
import { pingUser } from "../utils/sse.js";

const router = express.Router();

// Get all tickets (admin)
router.get('/tickets', async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT 
                st.*,
                a.name as agent_name,
                COUNT(DISTINCT stm.id) as message_count,
                SUM(CASE WHEN stm.is_read = 0 AND stm.sender_type = 'customer' THEN 1 ELSE 0 END) as unread_count
            FROM support_tickets st
            LEFT JOIN accounts a ON st.agent_id = a.id
            LEFT JOIN support_ticket_messages stm ON st.id = stm.ticket_id
        `;
        
        const params = [];
        
        if (status && status !== 'all') {
            query += ` WHERE st.status = ?`;
            params.push(status);
        }
        
        query += `
            GROUP BY st.id
            ORDER BY 
                CASE st.status
                    WHEN 'open' THEN 1
                    WHEN 'in_progress' THEN 2
                    WHEN 'waiting_customer' THEN 3
                    WHEN 'resolved' THEN 4
                    WHEN 'closed' THEN 5
                END,
                st.priority DESC,
                st.updated_at DESC
        `;
        
        const [tickets] = await pool.query(query, params);
        
        console.log(`[Server] Fetched ${tickets.length} support tickets`);
        
        res.status(200).json({
            success: true,
            data: tickets
        });
        
    } catch (err) {
        console.error('[Server] Support tickets fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch support tickets'
        });
    }
});

router.get('/tickets/customer/:customer_id', async (req, res) => {
    try {
        const { customer_id } = req.params;

        const [customerData] = await pool.query(
            `SELECT email FROM accounts WHERE id = ?`,
            [customer_id]
        );
        
        const customerEmail = customerData[0]?.email;

        const [tickets] = await pool.query(`
            SELECT 
                st.*,
                a.name as agent_name,
                COUNT(DISTINCT stm.id) as message_count,
                SUM(CASE WHEN stm.is_read = 0 AND stm.sender_type = 'agent' THEN 1 ELSE 0 END) as unread_count
            FROM support_tickets st
            LEFT JOIN accounts a ON st.agent_id = a.id
            LEFT JOIN support_ticket_messages stm ON st.id = stm.ticket_id
            WHERE (st.customer_id = ? OR (st.customer_email = ? AND ? IS NOT NULL))
            AND st.status != 'closed'
            GROUP BY st.id
            ORDER BY st.updated_at DESC
        `, [customer_id, customerEmail, customerEmail]);
        
        res.status(200).json({
            success: true,
            data: tickets
        });
        
    } catch (err) {
        console.error('[Server] Customer tickets fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
});

// Create new ticket
router.post('/tickets/create', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { customer_id, customer_name, customer_email, subject, message, priority, category } = req.body;
        
        // Create ticket
        const [ticketResult] = await connection.query(`
            INSERT INTO support_tickets 
            (customer_id, customer_name, customer_email, subject, priority, category, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'open')
        `, [customer_id || null, customer_name, customer_email, subject, priority || 'normal', category || 'general']);
        
        const ticketId = ticketResult.insertId;
        
        // Add initial message
        const [messageResult] = await connection.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_type, message) 
            VALUES (?, ?, 'customer', ?)
        `, [ticketId, customer_id || null, message]);
        
        // Add welcome system message
        await connection.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_type, message) 
            VALUES (?, NULL, 'system', ?)
        `, [ticketId, 'Thank you for contacting Seraphim Luxe support. A support agent will be with you shortly.']);
        
        const messageData = {
            id: messageResult.insertId,
            ticket_id: ticketId,
            sender_id: customer_id || null,
            sender_type: 'customer',
            message: message,
            is_read: false,
            created_at: new Date().toISOString()
        };
        
        await connection.commit();
        
        console.log('[Server] New support ticket created:', ticketId);
        
        // Notify all admins
        const [admins] = await pool.query(
            `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
        );
        
        admins.forEach(admin => {
            pingUser(admin.id, {
                type: 'new_support_ticket',
                ticket_id: ticketId,
                customer_name: customer_name,
                subject: subject,
                priority: priority || 'normal'
            });
        });
        
        res.status(201).json({
            success: true,
            data: {
                ticket_id: ticketId,
                message: messageData
            }
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('[Server] Support ticket creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create support ticket'
        });
    } finally {
        connection.release();
    }
});

// Get ticket messages
router.get('/tickets/:ticket_id/messages', async (req, res) => {
    try {
        const { ticket_id } = req.params;
        
        const [messages] = await pool.query(`
            SELECT 
                stm.*,
                a.name as sender_name
            FROM support_ticket_messages stm
            LEFT JOIN accounts a ON stm.sender_id = a.id
            WHERE stm.ticket_id = ?
            AND stm.is_internal_note = FALSE
            ORDER BY stm.created_at ASC
        `, [ticket_id]);
        
        res.status(200).json({
            success: true,
            data: messages
        });
        
    } catch (err) {
        console.error('[Server] Ticket messages fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// Send message
router.post('/tickets/:ticket_id/message', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { ticket_id } = req.params;
        const { sender_id, sender_type, message, is_internal_note } = req.body;
        
        // Get ticket info
        const [tickets] = await connection.query(
            `SELECT customer_id, customer_email, agent_id, status FROM support_tickets WHERE id = ?`,
            [ticket_id]
        );
        
        if (tickets.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        const ticket = tickets[0];
        
        // Insert message
        const [result] = await connection.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_type, message, is_internal_note) 
            VALUES (?, ?, ?, ?, ?)
        `, [ticket_id, sender_id, sender_type, message, is_internal_note || false]);
        
        const messageData = {
            id: result.insertId,
            ticket_id: parseInt(ticket_id),
            sender_id: parseInt(sender_id),
            sender_type: sender_type,
            message: message,
            is_internal_note: is_internal_note || false,
            is_read: false,
            created_at: new Date().toISOString()
        };
        
        // Update ticket status if needed and add system messages
        if (sender_type === 'customer' && ticket.status === 'waiting_customer') {
            await connection.query(
                `UPDATE support_tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [ticket_id]
            );
            
            // Add system message for status change
            await connection.query(`
                INSERT INTO support_ticket_messages 
                (ticket_id, sender_id, sender_type, message) 
                VALUES (?, NULL, 'system', ?)
            `, [ticket_id, 'Customer has responded. Ticket status changed to In Progress.']);
            
            // Notify agent
            if (ticket.agent_id) {
                pingUser(ticket.agent_id, {
                    type: 'ticket_status_updated',
                    ticket_id: parseInt(ticket_id),
                    status: 'in_progress'
                });
            }
        } else if (sender_type === 'agent' && ticket.status === 'open') {
            await connection.query(
                `UPDATE support_tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [ticket_id]
            );
        } else {
            await connection.query(
                `UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [ticket_id]
            );
        }
        
        await connection.commit();
        
        // Send SSE notifications
        if (!is_internal_note) {
            const recipientId = sender_type === 'customer' ? ticket.agent_id : ticket.customer_id;
            
            if (recipientId) {
                console.log(`[Server] Sending support_ticket_message to user ${recipientId}`);
                const sent = pingUser(recipientId, {
                    type: 'support_ticket_message',
                    ticket_id: parseInt(ticket_id),
                    data: messageData
                });
                console.log(`[Server] support_ticket_message sent: ${sent}`);
            }
        }
        
        res.status(201).json({
            success: true,
            data: messageData
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('[Server] Ticket message send error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    } finally {
        connection.release();
    }
});

// Claim ticket (assign to agent)
router.put('/tickets/:ticket_id/claim', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { ticket_id } = req.params;
        const { agent_id } = req.body;
        
        const [tickets] = await connection.query(
            `SELECT customer_id, status FROM support_tickets WHERE id = ?`,
            [ticket_id]
        );
        
        if (tickets.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        await connection.query(
            `UPDATE support_tickets 
             SET agent_id = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [agent_id, ticket_id]
        );
        
        const [agent] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [agent_id]
        );
        
        const agentName = agent[0]?.name || 'Support agent';
        
        // System message for customer
        const systemMessage = `${agentName} has been assigned to your ticket and will assist you shortly.`;
        
        await connection.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_type, message) 
            VALUES (?, ?, 'system', ?)
        `, [ticket_id, agent_id, systemMessage]);
        
        await connection.commit();
        
        // Notify customer
        if (tickets[0].customer_id) {
            pingUser(tickets[0].customer_id, {
                type: 'ticket_agent_assigned',
                ticket_id: parseInt(ticket_id),
                agent_id: parseInt(agent_id),
                agent_name: agentName
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Ticket claimed successfully'
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('[Server] Ticket claim error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to claim ticket'
        });
    } finally {
        connection.release();
    }
});

router.put('/tickets/:ticket_id/status', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { ticket_id } = req.params;
        const { status, agent_id } = req.body;
        
        console.log(`[Server] Updating ticket ${ticket_id} status to ${status} by agent ${agent_id}`);
        
        const [tickets] = await connection.query(
            `SELECT customer_id, agent_id FROM support_tickets WHERE id = ?`,
            [ticket_id]
        );
        
        if (tickets.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        const ticket = tickets[0];
        console.log(`[Server] Ticket info - customer_id: ${ticket.customer_id}, agent_id: ${ticket.agent_id}`);
        
        const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
        const updateValues = [status];
        
        if (status === 'resolved') {
            updateFields.push('resolved_at = CURRENT_TIMESTAMP');
        } else if (status === 'closed') {
            updateFields.push('closed_at = CURRENT_TIMESTAMP');
        }
        
        await connection.query(
            `UPDATE support_tickets SET ${updateFields.join(', ')} WHERE id = ?`,
            [...updateValues, ticket_id]
        );
        
        // Get agent name for system messages
        const [agent] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [agent_id || ticket.agent_id]
        );
        const agentName = agent[0]?.name || 'Support agent';
        
        // Add appropriate system messages
        const statusMessages = {
            'in_progress': `${agentName} has resumed working on your ticket.`,
            'waiting_customer': `${agentName} is waiting for your response. Please reply to continue.`,
            'resolved': `${agentName} has marked this ticket as resolved. If you need further assistance, please reply to reopen the ticket.`,
            'closed': `This ticket has been closed. Thank you for contacting Seraphim Luxe support. If you need further assistance, please create a new ticket.`
        };
        
        if (statusMessages[status]) {
            const [messageResult] = await connection.query(`
                INSERT INTO support_ticket_messages 
                (ticket_id, sender_id, sender_type, message) 
                VALUES (?, ?, 'system', ?)
            `, [ticket_id, agent_id, statusMessages[status]]);
            
            const systemMessageData = {
                id: messageResult.insertId,
                ticket_id: parseInt(ticket_id),
                sender_id: agent_id,
                sender_type: 'system',
                message: statusMessages[status],
                is_read: false,
                created_at: new Date().toISOString()
            };
            
            // Send the system message via SSE to customer
            if (ticket.customer_id) {
                console.log(`[Server] Sending system message SSE to customer ${ticket.customer_id}`);
                const sent = pingUser(ticket.customer_id, {
                    type: 'support_ticket_message',
                    ticket_id: parseInt(ticket_id),
                    data: systemMessageData
                });
                console.log(`[Server] System message SSE sent to customer: ${sent}`);
            }
        }
        
        await connection.commit();
        
        // Collect all users to notify
        const usersToNotify = new Set();
        
        // Always notify customer
        if (ticket.customer_id) {
            usersToNotify.add(ticket.customer_id);
        }
        
        // Notify the assigned agent (if different from the one making the change)
        if (ticket.agent_id && ticket.agent_id !== agent_id) {
            usersToNotify.add(ticket.agent_id);
        }
        
        // Get all admins and notify them too
        const [admins] = await pool.query(
            `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
        );
        
        admins.forEach(admin => {
            usersToNotify.add(admin.id);
        });
        
        console.log(`[Server] Notifying users about status change:`, Array.from(usersToNotify));
        
        // Send SSE notifications to all users
        usersToNotify.forEach(userId => {
            console.log(`[Server] Sending ticket_status_updated SSE to user ${userId}`);
            const sent = pingUser(userId, {
                type: 'ticket_status_updated',
                ticket_id: parseInt(ticket_id),
                status: status
            });
            console.log(`[Server] SSE sent to user ${userId}: ${sent}`);
        });
        
        res.status(200).json({
            success: true,
            message: 'Ticket status updated'
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('[Server] Ticket status update error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket status'
        });
    } finally {
        connection.release();
    }
});

// Reopen ticket (customer only)
router.put('/tickets/:ticket_id/reopen', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { ticket_id } = req.params;
        const { customer_id } = req.body;
        
        console.log(`[Server] Customer ${customer_id} attempting to reopen ticket ${ticket_id}`);
        
        const [tickets] = await connection.query(
            `SELECT customer_id, agent_id, status FROM support_tickets WHERE id = ?`,
            [ticket_id]
        );
        
        if (tickets.length === 0) {
            await connection.commit();
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        const ticket = tickets[0];
        
        // Only allow reopening if ticket is resolved and customer owns it
        if (ticket.customer_id !== parseInt(customer_id)) {
            await connection.commit();
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (ticket.status !== 'resolved') {
            await connection.commit();
            return res.status(400).json({
                success: false,
                message: 'Only resolved tickets can be reopened'
            });
        }
        
        // Reopen ticket
        await connection.query(
            `UPDATE support_tickets 
             SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [ticket_id]
        );
        
        // Add system message
        const [customerData] = await connection.query(
            `SELECT name FROM accounts WHERE id = ?`,
            [customer_id]
        );
        const customerName = customerData[0]?.name || 'Customer';
        
        const systemMessage = `${customerName} has reopened this ticket. An agent will assist you shortly.`;
        
        await connection.query(`
            INSERT INTO support_ticket_messages 
            (ticket_id, sender_id, sender_type, message) 
            VALUES (?, ?, 'system', ?)
        `, [ticket_id, customer_id, systemMessage]);
        
        await connection.commit();
        
        console.log(`[Server] Ticket ${ticket_id} reopened by customer ${customer_id}`);
        
        // Notify the assigned agent if exists
        if (ticket.agent_id) {
            pingUser(ticket.agent_id, {
                type: 'ticket_status_updated',
                ticket_id: parseInt(ticket_id),
                status: 'in_progress'
            });
        }
        
        // Notify all admins
        const [admins] = await pool.query(
            `SELECT id FROM accounts WHERE role = 'admin' AND is_suspended = 0`
        );
        
        admins.forEach(admin => {
            pingUser(admin.id, {
                type: 'ticket_status_updated',
                ticket_id: parseInt(ticket_id),
                status: 'in_progress'
            });
        });
        
        res.status(200).json({
            success: true,
            message: 'Ticket reopened successfully'
        });
        
    } catch (err) {
        await connection.rollback();
        console.error('[Server] Ticket reopen error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to reopen ticket'
        });
    } finally {
        connection.release();
    }
});

export default router;
