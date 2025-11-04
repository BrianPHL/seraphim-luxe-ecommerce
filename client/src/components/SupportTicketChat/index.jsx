import { useState, useEffect, useRef } from 'react';
import styles from './SupportTicketChat.module.css';
import { Button } from '@components';
import { useSupportTickets } from '@contexts';

const SupportTicketChat = ({ ticketId }) => {

    const [message, setMessage] = useState('');
    const chatContainerRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const {
        tickets,
        messages,
        isLoading,
        sendMessage: sendMessageContext,
        fetchMessages,
        fetchTickets,
        setSelectedTicket
    } = useSupportTickets();

    const currentTicket = tickets.find(t => t.id === ticketId);

    // Initial load - fetch tickets if not found
    useEffect(() => {
        const loadTicket = async () => {
            if (!currentTicket && isInitialLoad) {
                console.log('[SupportTicketChat] Ticket not found, fetching tickets...');
                await fetchTickets();
                setIsInitialLoad(false);
            }
        };
        
        loadTicket();
    }, [ticketId, currentTicket, isInitialLoad, fetchTickets]);

    // Load messages when ticket is available
    useEffect(() => {
        if (ticketId && currentTicket) {
            console.log('[SupportTicketChat] Loading ticket:', ticketId);
            setSelectedTicket(currentTicket);
            fetchMessages(ticketId);
        }
    }, [ticketId, currentTicket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');

        const result = await sendMessageContext(ticketId, userMessage);
        
        if (!result.success) {
            setMessage(userMessage);
        }
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: '2-digit',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    if (!currentTicket) {
        return (
            <div className={styles['wrapper']}>
                <div className={styles['loading']}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                    <p>Loading your support ticket...</p>
                </div>
            </div>
        );
    }

    const isTicketActive = currentTicket.status === 'open' || 
                           currentTicket.status === 'in_progress' || 
                           currentTicket.status === 'waiting_customer';

    return (
        <div className={styles['wrapper']}>
            <div className={styles['header']}>
                <div>
                    <h3>Support Ticket #{ticketId}</h3>
                    <p>{currentTicket.subject}</p>
                </div>
                <span className={styles['status']}>{currentTicket.status.replace('_', ' ')}</span>
            </div>

            <div className={styles['messages']} ref={chatContainerRef}>
                {messages.length === 0 ? (
                    <div className={styles['empty-state']}>
                        <i className="fa-solid fa-message" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '0.5rem' }}></i>
                        <p>Your message has been received! An agent will respond shortly.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div 
                            key={msg.id} 
                            className={`${styles['message']} ${
                                msg.sender_type === 'agent' ? styles['agent'] : 
                                msg.sender_type === 'system' ? styles['system'] : 
                                styles['customer']
                            }`}
                        >
                            <div className={styles['message-content']}>
                                {msg.sender_type === 'agent' && (
                                    <strong className={styles['sender']}>Support Agent</strong>
                                )}
                                {msg.sender_type === 'system' && (
                                    <strong className={styles['sender']}>System</strong>
                                )}
                                {msg.sender_type === 'customer' && (
                                    <strong className={styles['sender']}>You</strong>
                                )}
                                <p>{msg.message}</p>
                                <span className={styles['time']}>
                                    {formatDate(msg.created_at)}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isTicketActive ? (
                <div className={styles['input-area']}>
                    <textarea
                        className={styles['input']}
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={2}
                    />
                    <Button 
                        type='icon-outlined'
                        icon='fa-solid fa-paper-plane'
                        disabled={!message.trim() || isLoading}
                        action={sendMessage}
                    />
                </div>
            ) : (
                <div className={styles['closed-message']}>
                    <i className="fa-solid fa-lock"></i>
                    <p>This ticket has been {currentTicket.status}. Create a new ticket if you need further assistance.</p>
                </div>
            )}
        </div>
    );
};

export default SupportTicketChat;
