import { useState, useEffect, useRef } from 'react';
import styles from './LiveChat.module.css';
import { Button, InputField, Accordion } from '@components';
import { useLiveChat, useAuth } from '@contexts';

const LiveChat = () => {

    const [ message, setMessage ] = useState('');
    const [ showTransitionPlaceholder, setShowTransitionPlaceholder ] = useState(false);
    
    const chatContainerRef = useRef(null);

    const { user } = useAuth();

    const {
        activeRooms,
        waitingRooms,
        closedRooms,
        selectedRoom,
        messages,
        customers,
        isLoading,
        claimRoom,
        sendMessage: sendMessageContext,
        closeRoom,
        setSelectedRoom,
        fetchMessages
    } = useLiveChat();

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    // Send message
    const sendMessage = async () => {
        if (!selectedRoom || !message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');

        const result = await sendMessageContext(selectedRoom.id, userMessage);
        
        if (!result.success) {
            setMessage(userMessage);
        }

        setTimeout(scrollToBottom, 100);
    };

    // Close chat room
    const handleCloseRoom = async () => {
        if (!selectedRoom) return;
        await closeRoom(selectedRoom.id);
    };

    // Exit current chat view
    const handleExitChat = () => {
        setSelectedRoom(null);
        setShowTransitionPlaceholder(false);
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

    // Format date
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

    // Get last message for room
    const getLastMessage = (roomId) => {
        const roomMessages = messages.filter(m => m.room_id === roomId);
        return roomMessages[roomMessages.length - 1]?.message || 'No messages yet';
    };

    // Select room
    const handleSelectRoom = async (room) => {
        setShowTransitionPlaceholder(false);
        setSelectedRoom(room);
        await fetchMessages(room.id);
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const totalChats = activeRooms.length + waitingRooms.length + closedRooms.length;
    const shouldShowChat = selectedRoom && !showTransitionPlaceholder;
    const shouldShowDefaultPlaceholder = !selectedRoom;

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['list'] }>
                <h3 className={ styles['list-header'] }>
                    Chats ({totalChats})
                </h3>
                <div className={ styles['list-container'] }>
                    {/* Active Rooms */}
                    <Accordion
                        label={`Active (${activeRooms.length})`}
                        isOpenByDefault={true}
                    >
                        {activeRooms.length > 0 ? (
                            activeRooms.map(room => {
                                const customer = customers[room.customer_id];
                                return (
                                    <div 
                                        key={room.id}
                                        className={`${styles['list-item']} ${selectedRoom?.id === room.id ? styles['active'] : ''}`}
                                        onClick={() => handleSelectRoom(room)}
                                    >
                                        <div className={styles['list-item-header']}>
                                            <h4 className={styles['list-item-name']}>
                                                {customer?.name || `Customer #${room.customer_id}`}
                                            </h4>
                                            <div className={`${styles['list-item-status']} ${styles['active']}`}></div>
                                        </div>
                                        <p className={styles['list-item-message']}>
                                            {getLastMessage(room.id)}
                                        </p>
                                        <label className={styles['list-item-date']}>
                                            {formatDate(room.modified_at)}
                                        </label>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No active chats</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Waiting Rooms */}
                    <Accordion
                        label={`Waiting (${waitingRooms.length})`}
                        isOpenByDefault={true}
                    >
                        {waitingRooms.length > 0 ? (
                            waitingRooms.map(room => {
                                const customer = customers[room.customer_id];
                                return (
                                    <div 
                                        key={room.id}
                                        className={styles['list-item']}
                                        onClick={() => claimRoom(room.id)}
                                    >
                                        <div className={styles['list-item-header']}>
                                            <h4 className={styles['list-item-name']}>
                                                {customer?.name || `Customer #${room.customer_id}`}
                                            </h4>
                                            <div className={`${styles['list-item-status']} ${styles['idle']}`}></div>
                                        </div>
                                        <p className={styles['list-item-message']}>
                                            Waiting for agent...
                                        </p>
                                        <label className={styles['list-item-date']}>
                                            {formatDate(room.created_at)}
                                        </label>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No waiting chats</p>
                            </div>
                        )}
                    </Accordion>

                    {/* Closed Rooms */}
                    <Accordion
                        label={`Concluded (${closedRooms.length})`}
                        isOpenByDefault={false}
                        externalStyles={styles['last-accordion']}
                    >
                        {closedRooms.length > 0 ? (
                            closedRooms.map(room => {
                                const customer = customers[room.customer_id];
                                return (
                                    <div 
                                        key={room.id}
                                        className={`${styles['list-item']} ${selectedRoom?.id === room.id ? styles['active'] : ''}`}
                                        onClick={() => handleSelectRoom(room)}
                                    >
                                        <div className={styles['list-item-header']}>
                                            <h4 className={styles['list-item-name']}>
                                                {customer?.name || `Customer #${room.customer_id}`}
                                            </h4>
                                            <div className={`${styles['list-item-status']} ${styles['concluded']}`}></div>
                                        </div>
                                        <p className={styles['list-item-message']}>
                                            {getLastMessage(room.id)}
                                        </p>
                                        <label className={styles['list-item-date']}>
                                            {formatDate(room.closed_at || room.modified_at)}
                                        </label>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No concluded chats</p>
                            </div>
                        )}
                    </Accordion>
                </div>
            </div>

            <div className={styles['chat']}>
                {/* Transition Placeholder - Shows when status changes */}
                {showTransitionPlaceholder && (
                    <div className={styles['chat-placeholder']}>
                        <i className="fa-solid fa-hourglass-half" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <h2>Chat Status Changed</h2>
                        <p>This chat session has been concluded. Please select it again from the Concluded category to view history.</p>
                        <Button
                            type='primary'
                            label='Exit Chat View'
                            icon='fa-solid fa-times'
                            iconPosition='left'
                            action={handleExitChat}
                            externalStyles={{ marginTop: '1rem' }}
                        />
                    </div>
                )}

                {/* Active Chat Interface */}
                {shouldShowChat && (
                    <>
                        <div className={styles['chat-header']}>
                            <div className={styles['chat-header-info']}>
                                <h2 className={styles['chat-header-info-name']}>
                                    {customers[selectedRoom.customer_id]?.name || `Customer #${selectedRoom.customer_id}`}
                                </h2>
                                <div className={`${styles['chat-header-info-status']} ${styles[selectedRoom.status === 'active' ? 'active' : selectedRoom.status === 'waiting' ? 'idle' : 'concluded']}`}>
                                    {selectedRoom.status}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {selectedRoom.status === 'active' && (
                                    <Button
                                        type='secondary'
                                        icon='fa-solid fa-plug-circle-xmark'
                                        iconPosition='left'
                                        label='Return to Queue'
                                        action={handleCloseRoom}
                                    />
                                )}
                                <Button
                                    type='icon-outlined'
                                    icon='fa-solid fa-times'
                                    action={handleExitChat}
                                />
                            </div>
                        </div>
                                                    
                        <div className={styles['chat-container']} ref={chatContainerRef}>
                                {messages.map(msg => {
                                    const isSystemMessage = msg.sender_type === 'system';
                                    
                                    // Render system messages differently
                                    if (isSystemMessage) {
                                        return (
                                            <div 
                                                key={`${msg.source || 'live'}-${msg.id}`}
                                                className={styles['system-message']}
                                            >
                                                {msg.message}
                                            </div>
                                        );
                                    }
                                    
                                    // Regular chat messages
                                    const isAI = msg.source === 'ai';
                                    const isCustomer = isAI ? msg.message_type === 'user' : msg.sender_type === 'customer';
                                    
                                    let senderLabel;
                                    if (isCustomer) {
                                        const customer = customers[selectedRoom?.customer_id];
                                        senderLabel = `${ customer?.name } (Customer)` || 'Customer';
                                    } else if (isAI) {
                                        senderLabel = 'Seraphim Luxe AI';
                                    } else {
                                        senderLabel = 'You (Agent)'
                                    }
                                    
                                    return (
                                        <p 
                                            key={`${msg.source || 'live'}-${msg.id}`}
                                            className={styles['chat-item']} 
                                            data-role={isCustomer ? 'customer' : 'agent'}
                                            data-source={msg.source || 'live'}
                                        >
                                            <span className={styles['chat-item-label']}>
                                                {senderLabel}
                                            </span>
                                            {msg.message}
                                        </p>
                                    );
                                })}
                        </div>

                        <div className={styles['chat-controls']}>
                            <InputField
                                value={message}
                                onChange={event => setMessage(event.target.value)}
                                onKeyDown={handleKeyDown}
                                hint={selectedRoom.status === 'concluded' ? 'Chat is concluded - read only' : 'Type your message here...'}
                                type='text'
                                isSubmittable={false}
                                disabled={selectedRoom.status !== 'active'}
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-paper-plane'
                                disabled={!message || isLoading || selectedRoom.status !== 'active'}
                                action={sendMessage}
                            />
                        </div>
                    </>
                )}

                {/* Default Placeholder - No chat selected */}
                {shouldShowDefaultPlaceholder && (
                    <div className={styles['chat-placeholder']}>
                        <i className="fa-solid fa-comments" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <h2>Select a chat to start</h2>
                        <p>Choose a chat from the list or claim a waiting customer</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChat;
