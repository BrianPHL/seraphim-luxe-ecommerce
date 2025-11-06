import { useState, useEffect, useRef } from 'react';
import styles from './LiveChat.module.css';
import { Button, InputField, Accordion } from '@components';
import { useLiveChat, useAuth } from '@contexts';

const LiveChat = () => {

    const [ message, setMessage ] = useState('');
    
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

    const handleCloseRoom = async () => {
        if (!selectedRoom) return;
        await closeRoom(selectedRoom.id);
    };

    const handleExitChat = () => {
        setSelectedRoom(null);
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

    const getLastMessage = (roomId) => {
        const roomMessages = messages.filter(m => m.room_id === roomId);
        return roomMessages[roomMessages.length - 1]?.message || 'No messages yet';
    };

    const handleSelectRoom = async (room) => {
        setSelectedRoom(room);
        await fetchMessages(room.id);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const totalChats = activeRooms.length + waitingRooms.length + closedRooms.length;
    const shouldShowChat = selectedRoom;
    const shouldShowDefaultPlaceholder = !selectedRoom;

    return (
        <div className={ styles['wrapper'] }>
            <div className={ styles['list'] }>
                <h3 className={ styles['list-header'] }>
                    Chats ({totalChats})
                </h3>
                <div className={ styles['list-container'] }>
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
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No active chats</p>
                            </div>
                        )}
                    </Accordion>

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
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles['list-item']}>
                                <p className={styles['list-item-message']}>No waiting chats</p>
                            </div>
                        )}
                    </Accordion>

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
