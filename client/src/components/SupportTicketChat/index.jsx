import { useState, useEffect, useRef } from 'react';
import styles from './SupportTicketChat.module.css';
import { Button, InputField } from '@components';
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
                    <h3>Ticket #{ticketId}</h3>
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
                    messages.map(msg => {
                        const isSystem = msg.sender_type === 'system';
                        
                        if (isSystem) {
                            return (
                                <div key={msg.id} className={styles['system-message']}>
                                    {msg.message}
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={msg.id} 
                                className={`${styles['message']} ${
                                    msg.sender_type === 'agent' ? styles['agent'] : styles['customer']
                                }`}
                            >
                                <span className={styles['sender']}>
                                    {msg.sender_type === 'agent' ? 'Support Agent' : 'You'}
                                </span>
                                {msg.message}
                            </div>
                        );
                    })
                )}
            </div>

            {isTicketActive ? (
                <div className={styles['input-area']}>
                    <InputField
                        value={message}
                        onChange={event => setMessage(event.target.value)}
                        onKeyDown={handleKeyDown}
                        hint={currentTicket.status === 'closed' || currentTicket.status === 'resolved' ? 'Ticket is closed - read only' : 'Type your message...'}
                        type='text'
                        isSubmittable={false}
                        disabled={!isTicketActive}
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
