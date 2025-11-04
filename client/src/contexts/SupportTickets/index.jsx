import { useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth, useToast, useSSE } from '@contexts';
import { fetchWithTimeout } from "@utils";
import SupportTicketsContext from "./context";

export const SupportTicketsProvider = ({ children }) => {

    const { user } = useAuth();
    const { showToast } = useToast();
    const { subscribe, isConnected } = useSSE();
    
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const selectedTicketIdRef = useRef(null);

    // Fetch tickets based on user role
    const fetchTickets = useCallback(async (silent = false) => {
        if (!user) return [];

        try {
            const endpoint = user.role === 'admin' 
                ? '/api/support-tickets/tickets'
                : `/api/support-tickets/tickets/customer/${user.id}`;

            const response = await fetchWithTimeout(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch tickets');

            const result = await response.json();
            
            if (!silent) {
                console.log('[SupportTickets] Fetched tickets:', result.data?.length || 0);
            }
            
            setTickets(result.data || []);
            return result.data || [];

        } catch (err) {
            console.error('[SupportTickets] fetchTickets error:', err);
            if (!silent) {
                showToast('Failed to load support tickets', 'error');
            }
            return [];
        }
    }, [user, showToast]);

    // Fetch messages for a ticket
    const fetchMessages = useCallback(async (ticketId) => {
        try {
            const response = await fetchWithTimeout(`/api/support-tickets/tickets/${ticketId}/messages`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch messages');

            const result = await response.json();
            setMessages(result.data || []);

        } catch (err) {
            console.error('[SupportTickets] fetchMessages error:', err);
            showToast('Failed to load messages', 'error');
        }
    }, [showToast]);

    // Create new ticket
    const createTicket = useCallback(async (ticketData) => {
        if (!ticketData.customer_name || !ticketData.customer_email || !ticketData.subject || !ticketData.message) {
            return { success: false, message: 'Missing required fields' };
        }

        try {
            setIsLoading(true);

            const response = await fetchWithTimeout('/api/support-tickets/tickets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: user?.id || null,
                    customer_name: ticketData.customer_name,
                    customer_email: ticketData.customer_email,
                    subject: ticketData.subject,
                    message: ticketData.message,
                    priority: ticketData.priority || 'normal',
                    category: ticketData.category || 'general'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create ticket');
            }

            const result = await response.json();
            
            console.log('[SupportTickets] Ticket created:', result.data.ticket_id);
            
            showToast('Support ticket created successfully', 'success');
            
            // Refresh tickets
            await fetchTickets(true);
            
            return { success: true, data: result.data };

        } catch (err) {
            console.error('[SupportTickets] createTicket error:', err);
            showToast(err.message || 'Failed to create ticket', 'error');
            return { success: false, message: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [user, showToast, fetchTickets]);

    // Send message to ticket
    const sendMessage = useCallback(async (ticketId, messageText) => {
        if (!user || !ticketId || !messageText.trim()) {
            return { success: false, message: 'Invalid parameters' };
        }

        try {
            setIsLoading(true);

            const response = await fetchWithTimeout(`/api/support-tickets/tickets/${ticketId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: user.id,
                    sender_type: user.role === 'admin' ? 'agent' : 'customer',
                    message: messageText.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }

            const result = await response.json();
            
            console.log('[SupportTickets] Message sent:', result.data);
            
            // Add message to current view if viewing this ticket
            if (selectedTicket?.id === ticketId) {
                setMessages(prev => {
                    const exists = prev.find(msg => msg.id === result.data.id);
                    if (exists) return prev;
                    return [...prev, result.data];
                });
            }

            return { success: true, data: result.data };

        } catch (err) {
            console.error('[SupportTickets] sendMessage error:', err);
            showToast(err.message || 'Failed to send message', 'error');
            return { success: false, message: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedTicket, showToast]);

    // Claim ticket (admin only)
    const claimTicket = useCallback(async (ticketId) => {
        if (!user || user.role !== 'admin') {
            return { success: false, message: 'Unauthorized' };
        }

        try {
            const response = await fetchWithTimeout(`/api/support-tickets/tickets/${ticketId}/claim`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: user.id })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to claim ticket');
            }

            showToast('Ticket claimed successfully', 'success');
            
            // Refresh tickets
            await fetchTickets(true);
            
            // Select the claimed ticket
            const updatedTickets = await fetchTickets(true);
            const claimedTicket = updatedTickets.find(t => t.id === ticketId);
            if (claimedTicket) {
                setSelectedTicket(claimedTicket);
                await fetchMessages(ticketId);
            }

            return { success: true };

        } catch (err) {
            console.error('[SupportTickets] claimTicket error:', err);
            showToast(err.message || 'Failed to claim ticket', 'error');
            return { success: false, message: err.message };
        }
    }, [user, showToast, fetchTickets, fetchMessages]);

    // Update ticket status (admin only)
    const updateTicketStatus = useCallback(async (ticketId, newStatus) => {
        if (!user || user.role !== 'admin') {
            return { success: false, message: 'Unauthorized' };
        }

        try {
            const response = await fetchWithTimeout(`/api/support-tickets/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus,
                    agent_id: user.id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update ticket status');
            }

            showToast('Ticket status updated', 'success');
            
            // Update local state
            setTickets(prevTickets => 
                prevTickets.map(ticket => 
                    ticket.id === ticketId 
                        ? { ...ticket, status: newStatus }
                        : ticket
                )
            );
            
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            }

            return { success: true };

        } catch (err) {
            console.error('[SupportTickets] updateTicketStatus error:', err);
            showToast(err.message || 'Failed to update ticket status', 'error');
            return { success: false, message: err.message };
        }
    }, [user, selectedTicket, showToast]);

    // Update ref when selectedTicket changes
    useEffect(() => {
        selectedTicketIdRef.current = selectedTicket?.id || null;
    }, [selectedTicket]);

    // SSE subscription for real-time updates
    useEffect(() => {
        if (!user?.id) {
            console.log('[SupportTickets] No user, skipping SSE subscription');
            return;
        }
    
        console.log('[SupportTickets] Subscribing to SSE contacts events');
        
        // Initial fetch
        fetchTickets();
    
        const unsubscribe = subscribe('contacts', (data) => {
            console.log('[SupportTickets] Received SSE event:', data.type, data);
        
            if (data.type === 'new_support_ticket') {
                console.log('[SupportTickets] New support ticket:', data.ticket_id);
                
                if (user.role === 'admin') {
                    showToast(`New support ticket: ${data.subject}`, 'info');
                }
                
                fetchTickets(true);
            
            } else if (data.type === 'support_ticket_message') {
                console.log('[SupportTickets] New ticket message');
                
                // Add message if viewing this ticket
                if (selectedTicketIdRef.current && data.ticket_id === selectedTicketIdRef.current) {
                    setMessages(prev => {
                        const exists = prev.find(msg => msg.id === data.data.id);
                        if (exists) return prev;
                        return [...prev, data.data];
                    });
                }
                
                // Update unread count
                fetchTickets(true);
            
            } else if (data.type === 'ticket_agent_assigned') {
                console.log('[SupportTickets] Agent assigned to ticket:', data.ticket_id);
                
                if (user.role === 'customer') {
                    showToast(`${data.agent_name} has been assigned to your ticket`, 'info');
                }
                
                fetchTickets(true);
                
                // Reload messages if viewing this ticket
                if (selectedTicketIdRef.current === data.ticket_id) {
                    fetchMessages(data.ticket_id);
                }
            
            } else if (data.type === 'ticket_status_updated') {
                console.log('[SupportTickets] Ticket status updated:', data.ticket_id, data.status);
                
                setTickets(prevTickets => 
                    prevTickets.map(ticket => 
                        ticket.id === data.ticket_id 
                            ? { ...ticket, status: data.status }
                            : ticket
                    )
                );
                
                if (selectedTicketIdRef.current === data.ticket_id) {
                    setSelectedTicket(prev => ({ ...prev, status: data.status }));
                    showToast(`Ticket status changed to ${data.status}`, 'info');
                }
            }
        });
    
        return () => {
            console.log('[SupportTickets] Unsubscribing from SSE contacts events');
            unsubscribe();
        };
    }, [user?.id, user?.role]);

    // Ticket categorization (for admin view)
    const { openTickets, inProgressTickets, waitingCustomerTickets, resolvedTickets, closedTickets } = useMemo(() => {
        if (!user || user.role !== 'admin') {
            return { 
                openTickets: [], 
                inProgressTickets: [], 
                waitingCustomerTickets: [],
                resolvedTickets: [],
                closedTickets: []
            };
        }

        const open = tickets.filter(t => t.status === 'open');
        const inProgress = tickets.filter(t => t.status === 'in_progress' && Number(t.agent_id) === Number(user.id));
        const waitingCustomer = tickets.filter(t => t.status === 'waiting_customer' && Number(t.agent_id) === Number(user.id));
        const resolved = tickets.filter(t => t.status === 'resolved');
        const closed = tickets.filter(t => t.status === 'closed');

        return { 
            openTickets: open, 
            inProgressTickets: inProgress, 
            waitingCustomerTickets: waitingCustomer,
            resolvedTickets: resolved,
            closedTickets: closed
        };
    }, [tickets, user]);

    return (
        <SupportTicketsContext.Provider value={{
            tickets,
            openTickets,
            inProgressTickets,
            waitingCustomerTickets,
            resolvedTickets,
            closedTickets,
            selectedTicket,
            messages,
            isLoading,
            fetchTickets,
            fetchMessages,
            createTicket,
            sendMessage,
            claimTicket,
            updateTicketStatus,
            setSelectedTicket,
            setMessages
        }}>
            {children}
        </SupportTicketsContext.Provider>
    );
};

export const useSupportTickets = () => useContext(SupportTicketsContext);
