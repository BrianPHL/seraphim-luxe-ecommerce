import { useState, useEffect, useRef } from 'react';
import styles from './SupportTickets.module.css';
import { Button, InputField, Accordion } from '@components';
import { useSupportTickets } from '@contexts';

const SupportTickets = () => {

    const [ message, setMessage ] = useState('');
    const chatContainerRef = useRef(null);

    const {
        openTickets,
        inProgressTickets,
        waitingCustomerTickets,
        resolvedTickets,
        closedTickets,
        selectedTicket,
        messages,
        isLoading,
        claimTicket,
        sendMessage: sendMessageContext,
        updateTicketStatus,
        setSelectedTicket,
        fetchMessages
    } = useSupportTickets();

    // Send message
    const sendMessage = async () => {
        if (!selectedTicket || !message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');

        const result = await sendMessageContext(selectedTicket.id, userMessage);
        
        if (!result.success) {
            setMessage(userMessage);
        }

        setTimeout(scrollToBottom, 100);
    };

    // Update ticket status
    const handleStatusChange = async (newStatus) => {
        if (!selectedTicket) return;
        await updateTicketStatus(selectedTicket.id, newStatus);
    };

    // Exit current ticket view
    const handleExitTicket = () => {
        setSelectedTicket(null);
    };

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Handle key press
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Select ticket
    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        await fetchMessages(ticket.id);
    };

    // Get priority badge color
    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f97316';
            case 'normal': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#3b82f6';
        }
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const totalTickets = openTickets.length + inProgressTickets.length + waitingCustomerTickets.length + resolvedTickets.length + closedTickets.length;
    const shouldShowChat = selectedTicket;

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['list'] }>
                <h3 className={ styles['list-header'] }>
                    Support Tickets ({totalTickets})
                </h3>
                <div className={ styles['list-container'] }>
                    {/* Open Tickets */}
                    <Accordion
                        label={`Open (${openTickets.length})`}
                        isOpenByDefault={true}
                    >
                        {openTickets.length > 0 ? (
                            openTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    className={`${styles['list-item']} ${selectedTicket?.id === ticket.id ? styles['active'] : ''}`}
                                    onClick={() => claimTicket(ticket.id)}
                                >
                                    <div className={styles['list-item-header']}>
                                        <h4 className={styles['list-item-name']}>
                                            {ticket.customer_name}
                                        </h4>
                                        <div 
                                            className={styles['priority-badge']}
                                            style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                                        >
                                            {ticket.priority}
                                        </div>
                                    </div>
                                    <p className={styles['list-item-message']}>
                                        {ticket.subject}
                                    </p>
                                    <div className={styles['list-item-footer']}>
                                        <label className={styles['list-item-category']}>
                                            {ticket.category}
                                        </label>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No open tickets</p>
                            </div>
                        )}
                    </Accordion>

                    {/* In Progress */}
                    <Accordion
                        label={`In Progress (${inProgressTickets.length})`}
                        isOpenByDefault={true}
                    >
                        {inProgressTickets.length > 0 ? (
                            inProgressTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    className={`${styles['list-item']} ${selectedTicket?.id === ticket.id ? styles['active'] : ''}`}
                                    onClick={() => handleSelectTicket(ticket)}
                                >
                                    <div className={styles['list-item-header']}>
                                        <h4 className={styles['list-item-name']}>
                                            {ticket.customer_name}
                                        </h4>
                                        <div className={`${styles['list-item-status']} ${styles['active']}`}></div>
                                    </div>
                                    <p className={styles['list-item-message']}>
                                        {ticket.subject}
                                    </p>
                                    <div className={styles['list-item-footer']}>
                                        <label className={styles['list-item-category']}>
                                            {ticket.category}
                                        </label>
                                        {ticket.unread_count > 0 && (
                                            <span className={styles['unread-badge']}>
                                                {ticket.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No tickets in progress</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Waiting Customer */}
                    <Accordion
                        label={`Waiting Customer (${waitingCustomerTickets.length})`}
                        isOpenByDefault={true}
                    >
                        {waitingCustomerTickets.length > 0 ? (
                            waitingCustomerTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    className={`${styles['list-item']} ${selectedTicket?.id === ticket.id ? styles['active'] : ''}`}
                                    onClick={() => handleSelectTicket(ticket)}
                                >
                                    <div className={styles['list-item-header']}>
                                        <h4 className={styles['list-item-name']}>
                                            {ticket.customer_name}
                                        </h4>
                                        <div className={`${styles['list-item-status']} ${styles['idle']}`}></div>
                                    </div>
                                    <p className={styles['list-item-message']}>
                                        {ticket.subject}
                                    </p>
                                    <div className={styles['list-item-footer']}>
                                        <label className={styles['list-item-category']}>
                                            {ticket.category}
                                        </label>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No tickets waiting</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Resolved */}
                    <Accordion
                        label={`Resolved (${resolvedTickets.length})`}
                        isOpenByDefault={false}
                    >
                        {resolvedTickets.length > 0 ? (
                            resolvedTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    className={`${styles['list-item']} ${selectedTicket?.id === ticket.id ? styles['active'] : ''}`}
                                    onClick={() => handleSelectTicket(ticket)}
                                >
                                    <div className={styles['list-item-header']}>
                                        <h4 className={styles['list-item-name']}>
                                            {ticket.customer_name}
                                        </h4>
                                    </div>
                                    <p className={styles['list-item-message']}>
                                        {ticket.subject}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No resolved tickets</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Closed */}
                    <Accordion
                        label={`Closed (${closedTickets.length})`}
                        isOpenByDefault={false}
                        externalStyles={styles['last-accordion']}
                    >
                        {closedTickets.length > 0 ? (
                            closedTickets.map(ticket => (
                                <div 
                                    key={ticket.id}
                                    className={`${styles['list-item']} ${selectedTicket?.id === ticket.id ? styles['active'] : ''}`}
                                    onClick={() => handleSelectTicket(ticket)}
                                >
                                    <div className={styles['list-item-header']}>
                                        <h4 className={styles['list-item-name']}>
                                            {ticket.customer_name}
                                        </h4>
                                    </div>
                                    <p className={styles['list-item-message']}>
                                        {ticket.subject}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No closed tickets</p>
                            </div>
                        )}
                    </Accordion>
                </div>
            </div>

            <div className={ styles['chat'] }>
                {shouldShowChat ? (
                    <>
                        <div className={ styles['chat-header'] }>
                            <div className={ styles['chat-header-info'] }>
                                <h2 className={ styles['chat-header-info-name'] }>
                                    {selectedTicket.customer_name}
                                </h2>
                                <div className={`${styles['chat-header-info-status']} ${
                                    selectedTicket.status === 'in_progress' ? styles['active'] : 
                                    selectedTicket.status === 'waiting_customer' ? styles['idle'] : 
                                    styles['concluded']
                                }`}>
                                    {selectedTicket.status.replace('_', ' ')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {selectedTicket.status === 'in_progress' && (
                                    <>
                                        <Button 
                                            type='secondary'
                                            icon='fa-solid fa-clock'
                                            iconPosition='left'
                                            label='Waiting Customer'
                                            action={() => handleStatusChange('waiting_customer')}
                                            disabled={isLoading}
                                        />
                                        <Button 
                                            type='secondary'
                                            icon='fa-solid fa-check'
                                            iconPosition='left'
                                            label='Mark Resolved'
                                            action={() => handleStatusChange('resolved')}
                                            disabled={isLoading}
                                        />
                                    </>
                                )}
                                {selectedTicket.status === 'waiting_customer' && (
                                    <Button 
                                        type='secondary'
                                        icon='fa-solid fa-play'
                                        iconPosition='left'
                                        label='Resume'
                                        action={() => handleStatusChange('in_progress')}
                                        disabled={isLoading}
                                    />
                                )}
                                {selectedTicket.status === 'resolved' && (
                                    <Button 
                                        type='secondary'
                                        icon='fa-solid fa-lock'
                                        iconPosition='left'
                                        label='Close Ticket'
                                        action={() => handleStatusChange('closed')}
                                        disabled={isLoading}
                                    />
                                )}
                                <Button 
                                    type='secondary'
                                    icon='fa-solid fa-times'
                                    iconPosition='left'
                                    label='Exit'
                                    action={handleExitTicket}
                                />
                            </div>
                        </div>

                        <div className={ styles['chat-container'] } ref={chatContainerRef}>
                            {messages.map(msg => {
                                const isSystem = msg.sender_type === 'system';
                                const isCustomer = msg.sender_type === 'customer';
                                
                                return (
                                    <p 
                                        key={msg.id} 
                                        className={styles['chat-item']} 
                                        data-role={isSystem ? 'system' : (isCustomer ? 'customer' : 'agent')}
                                    >
                                        <span className={styles['chat-item-label']}>
                                            {isSystem ? 'System' : (isCustomer ? 'Customer' : 'You')}
                                        </span>
                                        {msg.message}
                                    </p>
                                );
                            })}
                        </div>

                        <div className={ styles['chat-controls'] }>
                            <InputField
                                value={message}
                                onChange={event => setMessage(event.target.value)}
                                onKeyDown={handleKeyDown}
                                hint={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? 'Ticket is closed - read only' : 'Type your message here...'}
                                type='text'
                                isSubmittable={false}
                                disabled={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' || isLoading}
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-paper-plane'
                                disabled={!message.trim() || isLoading || selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                                action={sendMessage}
                            />
                        </div>
                    </>
                ) : (
                    <div className={ styles['chat-placeholder'] }>
                        <i className="fa-solid fa-ticket" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <h2>Select a ticket to view conversation</h2>
                        <p>Choose a ticket from the list or claim an open ticket</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTickets;
