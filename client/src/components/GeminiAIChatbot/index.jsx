import { useState, useEffect, useRef } from 'react';
import { Button, InputField } from '@components';
import { useAuth, useToast, useGeminiAI, useSSE } from '@contexts';
import styles from './GeminiAIChatbot.module.css';

const GeminiAIChatbot = () => {

    const [ isOpen, setIsOpen ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ localChatHistory, setLocalChatHistory ] = useState([]);
    const [ isTyping, setIsTyping ] = useState(false);
    const [ chatbotState, setChatbotState ] = useState('seraphim-ai');
    const [ liveChatRoom, setLiveChatRoom ] = useState(null);
    const [ liveChatMessages, setLiveChatMessages ] = useState([]);
    const [ agentStatus, setAgentStatus ] = useState('waiting');

    const chatBodyRef = useRef(null);
    const disconnectCalledRef = useRef(false);
    
    const { user, setIsPopupOpen } = useAuth();
    const { showToast } = useToast();
    const { subscribe } = useSSE();
    const { isLoading, chatHistory, fetchPredefinedQuestions, predefinedQuestions, fetchChatHistory, sendGeminiAICustomerChat, sendGeminiAIAdminChat } = useGeminiAI();

    const isCustomer = user?.role === 'customer';
    const isAdmin = user?.role === 'admin';

    const requireAuth = (action) => {
        if (!user) {
            setIsPopupOpen(true);
            return;
        }
        action();
    };

    const disconnectFromLiveChat = async (roomId) => {
        if (!roomId || !user || disconnectCalledRef.current) return;
        
        disconnectCalledRef.current = true;
        console.log('[GeminiChatbot] Disconnecting from room:', roomId);
        
        try {
            const response = await fetch(`/api/live-chat/room/${roomId}/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: user.id })
            });
            
            if (response.ok) {
                console.log('[GeminiChatbot] Successfully disconnected from room:', roomId);
            }
        } catch (err) {
            console.error('[GeminiChatbot] Disconnect error:', err);
        }
    };

    const switchChatbotState = async () => {
        if (!isCustomer) return;

        const newState = chatbotState === 'seraphim-ai' ? 'live-agent' : 'seraphim-ai';

        if (chatbotState === 'live-agent' && newState === 'seraphim-ai' && liveChatRoom) {
            await disconnectFromLiveChat(liveChatRoom.id);
            disconnectCalledRef.current = false;
        }

        setChatbotState(newState);

        if (newState === 'live-agent') {
            await initializeLiveChat();
        } else {
            fetchChatHistory();
            fetchPredefinedQuestions();
        }
    };

    const initializeLiveChat = async () => {
        try {
            disconnectCalledRef.current = false;
            
            const existingRoomResponse = await fetch(`/api/live-chat/room/active/${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
        
            if (existingRoomResponse.ok) {
                const existingRoomData = await existingRoomResponse.json();
                console.log('[GeminiChatbot] Found existing room:', existingRoomData.data);
                
                const room = existingRoomData.data;
                
                // If room is concluded, reactivate it by calling create endpoint
                if (room.status === 'concluded') {
                    console.log('[GeminiChatbot] Room is concluded, reactivating...');
                    
                    const reactivateResponse = await fetch('/api/live-chat/room/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customer_id: user.id,
                            priority: 'low'
                        })
                    });
                    
                    if (reactivateResponse.ok) {
                        const reactivatedData = await reactivateResponse.json();
                        console.log('[GeminiChatbot] Room reactivated:', reactivatedData.data);
                        setLiveChatRoom(reactivatedData.data);
                        setAgentStatus('waiting');
                        await loadLiveChatMessages(reactivatedData.data.id);
                        showToast('Reconnecting to chat. Waiting for an agent...', 'info');
                        return;
                    }
                }
                
                // Room is active or waiting
                setLiveChatRoom(room);
                
                if (room.agent_id && room.status === 'active') {
                    setAgentStatus('connected');
                    showToast('Reconnected to your chat session', 'success');
                } else {
                    setAgentStatus('waiting');
                    showToast('Waiting for an agent...', 'info');
                }
                
                await loadLiveChatMessages(room.id);
                return;
            }
        
            // No existing room found, create new one
            console.log('[GeminiChatbot] No existing room found, creating new one...');
        
            const response = await fetch('/api/live-chat/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: user.id,
                    priority: 'low'
                })
            });
        
            if (!response.ok) {
                throw new Error('Failed to create chat room');
            }
        
            const result = await response.json();
            console.log('[GeminiChatbot] Created new room:', result.data);
            setLiveChatRoom(result.data);
            setAgentStatus('waiting');
            
            await loadLiveChatMessages(result.data.id);
        
            showToast('Connecting you with an agent...', 'info');
        
        } catch (err) {
            console.error('[GeminiChatbot] Live chat initialization error:', err);
            showToast('Failed to connect to live chat. Please try again.', 'error');
            setChatbotState('seraphim-ai');
        }
    };

    const loadLiveChatMessages = async (roomId) => {
        try {
            const response = await fetch(`/api/live-chat/room/${roomId}/messages?user_id=${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const result = await response.json();
            setLiveChatMessages(result.data || []);
            setTimeout(scrollToBottom, 100);

        } catch (err) {
            console.error('[GeminiChatbot] Load live chat messages error:', err);
            showToast('Failed to load chat history', 'error');
        }
    };

    const sendLiveChatMessage = async () => {
        if (!liveChatRoom || !message.trim()) return;

        const userMessage = message.trim();
        setMessage('');

        try {
            const tempMessage = {
                id: `temp-${Date.now()}`,
                room_id: liveChatRoom.id,
                sender_id: user.id,
                sender_type: 'customer',
                message: userMessage,
                is_read: false,
                created_at: new Date().toISOString()
            };

            setLiveChatMessages(prev => [...prev, tempMessage]);
            setTimeout(scrollToBottom, 100);

            const response = await fetch(`/api/live-chat/room/${liveChatRoom.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: user.id,
                    sender_type: 'customer',
                    message: userMessage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();
            
            setLiveChatMessages(prev => 
                prev.map(msg => msg.id === tempMessage.id ? result.data : msg)
            );

        } catch (err) {
            console.error('[GeminiChatbot] Send live chat message error:', err);
            showToast('Failed to send message. Please try again.', 'error');

            setLiveChatMessages(prev => 
                prev.filter(msg => !msg.id.toString().startsWith('temp-'))
            );
            setMessage(userMessage);
        }
    };

    const endLiveChat = async () => {
        if (!liveChatRoom) return;

        try {
            await fetch(`/api/live-chat/room/${liveChatRoom.id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });

            setLiveChatRoom(null);
            setLiveChatMessages([]);
            setAgentStatus('waiting');
            setChatbotState('seraphim-ai');
            disconnectCalledRef.current = false;
            
            showToast('Chat session ended', 'info');

        } catch (err) {
            console.error('[GeminiChatbot] End live chat error:', err);
        }
    };

    const handleModalClose = async () => {
        if (chatbotState === 'live-agent' && liveChatRoom && isCustomer) {
            await disconnectFromLiveChat(liveChatRoom.id);
        }
        setIsOpen(false);
    };

    const handleWrapperClick = (e) => {
        if (e.target === e.currentTarget) {
            handleModalClose();
        }
    };

    const scrollToBottom = () => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    };

    const addUserMessageToChat = (userMessage) => {
        const userChatEntry = {
            id: Date.now(),
            message_type: 'user',
            message: userMessage,
            created_at: new Date().toISOString()
        };
        
        setLocalChatHistory(prev => [...prev, userChatEntry]);
        setTimeout(scrollToBottom, 100);
    };

    const addAIResponseToChat = (aiResponse) => {
        const aiChatEntry = {
            id: Date.now(),
            message_type: 'ai',
            message: aiResponse,
            created_at: new Date().toISOString()
        };
        
        setLocalChatHistory(prev => [...prev, aiChatEntry]);
        setTimeout(scrollToBottom, 100);
    };

    const handleSubmitChat = async () => {
        if (chatbotState === 'live-agent' && isCustomer) {
            await sendLiveChatMessage();
        } else {
            await handleSubmitChatToGeminiAI();
        }
    };

    const handleSubmitChatToGeminiAI = async () => {
        try {
            if (!user) return;

            const userMessage = message.trim();
            setMessage('');

            addUserMessageToChat(userMessage);

            setIsTyping(true);

            const result = isCustomer
                ? await sendGeminiAICustomerChat(userMessage)
                : await sendGeminiAIAdminChat(userMessage);

            setIsTyping(false);

            if (result?.data) {
                addAIResponseToChat(result.data);
            }

            setTimeout(() => {
                fetchChatHistory();
            }, 500);

        } catch(err) {
            console.error('[GeminiChatbot] handleSubmitChatToGeminiAI error:', err);
            showToast('An error occured when processing your Chatbot request. Please try again later.', 'error');

            setIsTyping(false);
            setLocalChatHistory(prev => prev.slice(0, -1));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleModalClose();
        } else if (e.key === 'Enter' && !e.shiftKey && message) {
            e.preventDefault();
            handleSubmitChat();
        }
    };

    const handlePredefinedQuestionClick = (questionText) => {
        setMessage(questionText);
        setTimeout(() => handleSubmitChatToGeminiAI(), 100);
    };

    useEffect(() => {
        if (chatbotState === 'seraphim-ai') {
            setLocalChatHistory(chatHistory);
        }
    }, [chatHistory, chatbotState]);

    useEffect(() => {
        if (isOpen && user && chatbotState === 'seraphim-ai') {
            fetchChatHistory();
            fetchPredefinedQuestions();
        }
    }, [ isOpen, user, chatbotState, fetchChatHistory, fetchPredefinedQuestions ]);

    useEffect(() => {
        if (isOpen && user && isCustomer && !liveChatRoom && chatbotState === 'live-agent') {
            fetch(`/api/live-chat/room/active/${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('No active room');
            })
            .then(data => {
                if (data && data.success) {
                    console.log('[GeminiChatbot] Found existing room on modal open:', data.data);
                    const room = data.data;
                    setLiveChatRoom(room);
                    
                    if (room.status === 'concluded') {
                        setAgentStatus('waiting');
                    } else if (room.agent_id) {
                        setAgentStatus('connected');
                    } else {
                        setAgentStatus('waiting');
                    }
                    
                    loadLiveChatMessages(room.id);
                }
            })
            .catch(err => {
                console.log('[GeminiChatbot] No active live chat session found');
            });
        }
    }, [isOpen, user, isCustomer, chatbotState]);

    useEffect(() => {
        scrollToBottom();
    }, [localChatHistory, liveChatMessages, isTyping]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, message, isLoading, isTyping, chatbotState]);

    useEffect(() => {
        if (!user?.id || !isCustomer) return;

        console.log('[GeminiChatbot] Subscribing to SSE livechat events');

        const unsubscribe = subscribe('livechat', (data) => {
            console.log('[GeminiChatbot] Received SSE event:', data.type, data);
        
            if (data.type === 'new_message') {
                console.log('🔔 New message received:', data.data);
                setLiveChatMessages(prev => {
                    const exists = prev.some(msg => msg.id === data.data.id);
                    if (exists) {
                        console.log('⚠️ Message already exists, skipping');
                        return prev;
                    }
                    console.log('✅ Adding message to chat');
                    return [...prev, data.data];
                });
                setTimeout(scrollToBottom, 100);
            } else if (data.type === 'room_reactivated') {
                // Handle room reactivation when customer switches back to live agent
                console.log('Room reactivated:', data);
                setLiveChatRoom(prev => {
                    if (!prev || prev.id !== data.room_id) return prev;
                    return { ...prev, status: 'waiting', agent_id: null };
                });
                setAgentStatus('waiting');
                
                // Add the system message to the chat
                if (data.message) {
                    setLiveChatMessages(prev => {
                        const exists = prev.some(msg => msg.id === data.message.id);
                        if (exists) return prev;
                        return [...prev, data.message];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            } else if (data.type === 'agent_joined') {
                console.log('Agent joined event received:', data);
                setAgentStatus('connected');
                setLiveChatRoom(prev => {
                    if (!prev) return prev;
                    return { ...prev, agent_id: data.agent_id, status: 'active' };
                });
                showToast(`${data.agent_name} has joined the chat`, 'success');
                
                // Add the system message to the chat
                if (data.message) {
                    setLiveChatMessages(prev => {
                        const exists = prev.some(msg => msg.id === data.message.id);
                        if (exists) return prev;
                        return [...prev, data.message];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            } else if (data.type === 'agent_concluded') {
                console.log('Agent concluded session');
                setAgentStatus('waiting');
                setLiveChatRoom(prev => {
                    if (!prev) return prev;
                    return { ...prev, agent_id: null, status: 'waiting' };
                });
                showToast('Agent has concluded the session. Waiting for another agent...', 'info');
            
                // Add the system message to the chat
                if (data.message) {
                    setLiveChatMessages(prev => {
                        const exists = prev.some(msg => msg.id === data.message.id);
                        if (exists) return prev;
                        return [...prev, data.message];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            } else if (data.type === 'chat_closed') {
                console.log('Chat closed by admin');
                setAgentStatus('disconnected');
                setLiveChatRoom(null);
                setLiveChatMessages([]);
                showToast('Chat session has ended', 'info');
                setChatbotState('seraphim-ai');
            }
        });

        return () => {
            console.log('[GeminiChatbot] Unsubscribing from SSE livechat events');
            unsubscribe();
        };
    }, [user?.id, isCustomer, subscribe, showToast]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (chatbotState === 'live-agent' && liveChatRoom && isCustomer && !disconnectCalledRef.current) {
                disconnectCalledRef.current = true;
                fetch(`/api/live-chat/room/${liveChatRoom.id}/disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer_id: user.id }),
                    keepalive: true
                }).catch(err => console.error('[GeminiChatbot] Disconnect on unload failed:', err));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [chatbotState, liveChatRoom, isCustomer, user]);

    const currentMessages = chatbotState === 'seraphim-ai' ? localChatHistory : liveChatMessages;
    const hasMessages = currentMessages.length > 0;

    return (
        <>
            <div className={ styles['wrapper'] } data-open={ isOpen } onClick={ handleWrapperClick }>
                <div className={ styles['chat'] }>
                    <div className={ styles['chat-header'] }>
                        <h3>
                            {chatbotState === 'seraphim-ai' ? 'Seraphim Luxe AI' : 'Live Agent Chat'}
                            {chatbotState === 'live-agent' && isCustomer && liveChatRoom && (
                                <span className={ styles['agent-status'] } data-status={ agentStatus }>
                                    {agentStatus === 'waiting' && ' (Waiting for agent...)'}
                                    {agentStatus === 'connected' && ' (Connected)'}
                                    {agentStatus === 'disconnected' && ' (Disconnected)'}
                                </span>
                            )}
                        </h3>
                        <Button
                            type='icon'
                            icon='fa solid fa-times'
                            action={handleModalClose}
                        />
                    </div>
                    <div className={ styles['chat-body'] }>
                        <div className={ styles['chat-body-upper'] } ref={ chatBodyRef }>
                            <>
                                {
                                    hasMessages ? (
                                        <div className={ styles['messages'] }>
                                            { currentMessages.map((chat) => {
                                                
                                                const isUser = chatbotState === 'seraphim-ai' 
                                                    ? chat.message_type === 'user'
                                                    : chat.sender_type === 'customer';

                                                return (
                                                    <p key={ chat.id } className={ styles['message'] } data-role={ isUser ? 'user' : 'ai' }>
                                                        <span className={ styles['message-label'] }>
                                                            { isUser ? 'You' : (chatbotState === 'live-agent' ? 'Agent' : 'AI')}
                                                        </span>
                                                        { chat.message }
                                                    </p>
                                                );
                                            })}
                                            {
                                                (isLoading || isTyping) && chatbotState === 'seraphim-ai' && (
                                                    <p className={ styles['message'] } data-role="ai">
                                                        <span className={ styles['message-label'] }>AI</span>
                                                        <em>Typing...</em>
                                                    </p>
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <div className={ styles['placeholder'] }>
                                            <h2 className={ styles['placeholder-title'] }>
                                                {chatbotState === 'seraphim-ai' ? 'Seraphim Luxe AI' : 'Live Agent Support'}
                                            </h2>
                                            <p className={ styles['placeholder-body'] }>
                                                {
                                                    chatbotState === 'seraphim-ai' ? (
                                                        isCustomer
                                                        ? 'Unlock exclusive shopping tips, get instant answers, and discover the perfect products just for you!'
                                                        : 'Streamline your workflow, access business insights, and manage store operations faster!'
                                                    ) : (
                                                        agentStatus === 'waiting'
                                                        ? 'Please wait while we connect you with an available agent...'
                                                        : 'Start chatting with our support team!'
                                                    )
                                                }
                                            </p>
                                        </div>
                                    )
                                }
                                {chatbotState === 'seraphim-ai' && (
                                    <div className={ styles['chat-options'] }>
                                        <div className={ styles['chat-options-predefined_questions'] }>
                                            { predefinedQuestions.length > 0 ? (
                                                <>
                                                    { predefinedQuestions.map((question) => {
                                                        return (
                                                            <Button
                                                                key={ question.id }
                                                                type='secondary'
                                                                label={ question.question }
                                                                action={ () => handlePredefinedQuestionClick(question.question) }
                                                                externalStyles={ styles['chat-options-predefined_question'] }
                                                            />
                                                        );
                                                    })}
                                                </>
                                            ) : (
                                                <Button
                                                    type='secondary'
                                                    label='Unable to load predefined questions.'
                                                    action={ () => {} }
                                                    disabled={ true }
                                                    externalStyles={ styles['chat-options-predefined_question-placeholder'] }
                                                />
                                            )}
                                        </div>
                                        {isCustomer && (
                                            <Button
                                                type='primary'
                                                icon='fa solid fa-headset' 
                                                label={liveChatRoom ? 'Return to Live Agent' : 'Switch to Live Agent'}
                                                iconPosition='left'
                                                action={ () => switchChatbotState() }
                                                externalStyles={ styles['chat-options-switch_btn'] }
                                            />
                                        )}
                                    </div>
                                )}
                                {chatbotState === 'live-agent' && isCustomer && (
                                    <div className={ styles['chat-options'] }>
                                        <Button
                                            type='primary'
                                            icon='fa solid fa-robot' 
                                            label='Switch to Seraphim AI'
                                            iconPosition='left'
                                            action={ () => switchChatbotState() }
                                            externalStyles={ styles['chat-options-switch_btn'] }
                                        />
                                        <Button
                                            type='secondary'
                                            icon='fa solid fa-power-off' 
                                            label='End Chat Session'
                                            iconPosition='left'
                                            action={ endLiveChat }
                                            externalStyles={ styles['chat-options-switch_btn'] }
                                        />
                                    </div>
                                )}
                            </>
                        </div>
                        <div className={ styles['chat-body-lower'] }>
                            <InputField
                                value={ message }
                                onChange={event => setMessage(event.target.value)}
                                hint={ 
                                    chatbotState === 'seraphim-ai' 
                                        ? `Ask our personalized Seraphim Luxe AI...`
                                        : 'Message the live agent...' 
                                }
                                type='text'
                                isSubmittable={ false }
                                disabled={ chatbotState === 'live-agent' && (!liveChatRoom || liveChatRoom.status === 'closed') }
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-paper-plane'
                                disabled={ 
                                    !message || 
                                    isLoading || 
                                    isTyping || 
                                    (chatbotState === 'live-agent' && (!liveChatRoom || (agentStatus === 'waiting' && liveChatRoom.status === 'waiting')))
                                }
                                action={ handleSubmitChat }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Button
                type='secondary'
                label={isAdmin ? 'Ask AI Assistant' : (liveChatRoom ? 'Chat Active' : 'Ask our AI')}
                iconPosition='left'
                icon={liveChatRoom ? 'fa-solid fa-circle-dot' : 'fa-solid fa-headset'}
                action={ () => requireAuth(() => setIsOpen(true)) }
                externalStyles={ styles['button'] }
            />
        </>
    );
};

export default GeminiAIChatbot;
