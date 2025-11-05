import { useState, useEffect, useRef } from 'react';
import { Button, InputField } from '@components';
import { useAuth, useToast, useGeminiAI, useSSE } from '@contexts';
import styles from './GeminiAIChatbot.module.css';

const GeminiAIChatbot = () => {

    const [ isOpen, setIsOpen ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ unifiedChatHistory, setUnifiedChatHistory ] = useState([]);
    const [ isTyping, setIsTyping ] = useState(false);
    const [ chatbotState, setChatbotState ] = useState('seraphim-ai');
    const [ liveChatRoom, setLiveChatRoom ] = useState(null);
    const [ agentStatus, setAgentStatus ] = useState('waiting');
    const [ agentName, setAgentName ] = useState(null);
    const [ isSwitching, setIsSwitching ] = useState(false);

    const messagesContainerRef = useRef(null); // CHANGED: More specific ref name
    const disconnectCalledRef = useRef(false);
    
    const { user, setIsPopupOpen } = useAuth();
    const { showToast } = useToast();
    const { subscribe } = useSSE();
    const { isLoading, chatHistory, fetchPredefinedQuestions, predefinedQuestions, fetchChatHistory, sendGeminiAICustomerChat, sendGeminiAIAdminChat } = useGeminiAI();

    const isCustomer = user?.role === 'customer';
    const isAdmin = user?.role === 'admin';

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    const normalizeMessage = (msg, source) => {
        if (source === 'ai') {
            return {
                id: `ai-${msg.id}`,
                originalId: msg.id,
                source: 'seraphim-ai',
                role: msg.message_type === 'user' ? 'user' : 'agent',
                senderLabel: msg.message_type === 'user' ? 'You' : 'AI',
                message: msg.message,
                timestamp: new Date(msg.created_at).getTime(),
                created_at: msg.created_at
            };
        } else if (source === 'live-agent') {
            const isSystem = msg.sender_type === 'system';

            return {
                id: `live-${msg.id}`,
                originalId: msg.id,
                source: 'live-agent',
                role: isSystem ? 'system' : (msg.sender_type === 'customer' ? 'user' : 'agent'),
                senderLabel: isSystem ? 'System' : (msg.sender_type === 'customer' ? 'You' : 'Agent'),
                senderName: msg.sender_name || null,
                sender_type: msg.sender_type,
                message: msg.message,
                timestamp: new Date(msg.created_at).getTime(),
                created_at: msg.created_at,
                is_read: msg.is_read
            };
        }
    };

    const mergeAndSortMessages = (aiMessages, liveMessages) => {
        const normalizedAI = aiMessages.map(msg => normalizeMessage(msg, 'ai'));
        const normalizedLive = liveMessages.map(msg => normalizeMessage(msg, 'live-agent'));
        
        const combined = [...normalizedAI, ...normalizedLive];
        
        return combined.sort((a, b) => a.timestamp - b.timestamp);
    };

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
        if (!isCustomer || isSwitching) return; // Prevent rapid switching

        setIsSwitching(true);

        const newState = chatbotState === 'seraphim-ai' ? 'live-agent' : 'seraphim-ai';

        if (chatbotState === 'live-agent' && newState === 'seraphim-ai' && liveChatRoom) {
            // Send TWO system messages: one for customer, one for admin
            try {
                // Customer message: "You switched to Seraphim Luxe AI Chatbot"
                const customerMessageResponse = await fetch(`/api/live-chat/room/${liveChatRoom.id}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: user.id,
                        sender_type: 'system',
                        target_audience: 'customer',
                        message: 'You switched to Seraphim Luxe AI Chatbot.'
                    })
                });
            
                if (customerMessageResponse.ok) {
                    const customerResult = await customerMessageResponse.json();
                
                    // Immediately add the customer message to customer's chat
                    const normalizedCustomer = normalizeMessage(customerResult.data, 'live-agent');
                    setUnifiedChatHistory(prev => {
                        const exists = prev.some(msg => msg.id === normalizedCustomer.id);
                        if (exists) return prev;
                        return [...prev, normalizedCustomer];
                    });
                }

                // Admin message: "Customer switched to Seraphim Luxe AI Chatbot"
                const adminMessageResponse = await fetch(`/api/live-chat/room/${liveChatRoom.id}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: user.id,
                        sender_type: 'system',
                        target_audience: 'admin',
                        message: 'Customer switched to Seraphim Luxe AI Chatbot.'
                    })
                });

                // Wait to ensure SSE message is delivered to admin
                await new Promise(resolve => setTimeout(resolve, 300));
            
            } catch (err) {
                console.error('[GeminiChatbot] Failed to send switch message:', err);
            }

            // Disconnect and send disconnect message
            try {
                const disconnectResponse = await fetch(`/api/live-chat/room/${liveChatRoom.id}/disconnect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customer_id: user.id })
                });

                if (disconnectResponse.ok) {
                    const disconnectResult = await disconnectResponse.json();

                    // Add disconnect message to customer's chat immediately
                    if (disconnectResult.data) {
                        const normalizedDisconnect = normalizeMessage(disconnectResult.data, 'live-agent');
                        setUnifiedChatHistory(prev => {
                            const exists = prev.some(msg => msg.id === normalizedDisconnect.id);
                            if (exists) return prev;
                            return [...prev, normalizedDisconnect];
                        });
                        setTimeout(scrollToBottom, 100);
                    }
                }
            } catch (err) {
                console.error('[GeminiChatbot] Disconnect error:', err);
            }

            disconnectCalledRef.current = false;
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        setChatbotState(newState);

        if (newState === 'live-agent') {
            await initializeLiveChat();
        } else {
            await fetchChatHistory();
            await fetchPredefinedQuestions();
            setTimeout(scrollToBottom, 100);
        }

        setTimeout(() => {
            setIsSwitching(false);
        }, 500);
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
                setLiveChatRoom(room);
            
                if (room.agent_name) {
                    setAgentName(room.agent_name);
                }
            
                if (room.agent_id && room.status === 'active') {
                    setAgentStatus('connected');
                    showToast('Reconnected to your chat session', 'success');
                } else {
                    setAgentStatus('waiting');
                    showToast('Waiting for an agent...', 'info');
                }
            
                // Send system messages when returning to existing room
                try {
                    // Customer message: "You switched to Live Agent mode"
                    const customerMessageResponse = await fetch(`/api/live-chat/room/${room.id}/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sender_id: user.id,
                            sender_type: 'system',
                            target_audience: 'customer',
                            message: 'You switched to Live Agent mode.'
                        })
                    });
                
                    if (customerMessageResponse.ok) {
                        const customerResult = await customerMessageResponse.json();
                        const normalizedCustomer = normalizeMessage(customerResult.data, 'live-agent');
                        setUnifiedChatHistory(prev => {
                            const exists = prev.some(msg => msg.id === normalizedCustomer.id);
                            if (exists) return prev;
                            return [...prev, normalizedCustomer];
                        });
                    }
                
                    // Admin message: "Customer switched to Live Agent mode"
                    await fetch(`/api/live-chat/room/${room.id}/message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sender_id: user.id,
                            sender_type: 'system',
                            target_audience: 'admin',
                            message: 'Customer switched to Live Agent mode.'
                        })
                    });
                } catch (err) {
                    console.error('[GeminiChatbot] Failed to send switch message:', err);
                }
            
                return;
            }
        
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
            const liveMessages = result.data || [];
        
            console.log('🔍 Live messages from backend:', liveMessages);
            liveMessages.forEach(msg => {
                console.log(`Message: "${msg.message}" | sender_type: "${msg.sender_type}"`);
            });
        
            const agentMessage = liveMessages.find(msg => msg.sender_type === 'agent' || msg.sender_type === 'system');
            if (agentMessage && agentMessage.sender_name) {
                setAgentName(agentMessage.sender_name);
            }
        
            const merged = mergeAndSortMessages(chatHistory, liveMessages);
            
            console.log('🔍 Normalized merged messages:', merged);
            merged.forEach(msg => {
                console.log(`Message: "${msg.message}" | role: "${msg.role}" | sender_type: "${msg.sender_type}"`);
            });
            
            setUnifiedChatHistory(merged);
        
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

            const normalizedTemp = normalizeMessage(tempMessage, 'live-agent');
            setUnifiedChatHistory(prev => [...prev, normalizedTemp]);
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
            const normalizedResult = normalizeMessage(result.data, 'live-agent');
            
            setUnifiedChatHistory(prev => 
                prev.map(msg => 
                    msg.id === normalizedTemp.id ? normalizedResult : msg
                )
            );

        } catch (err) {
            console.error('[GeminiChatbot] Send live chat message error:', err);
            showToast('Failed to send message. Please try again.', 'error');

            setUnifiedChatHistory(prev => 
                prev.filter(msg => !msg.id.toString().startsWith('temp-'))
            );
            setMessage(userMessage);
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

    // UPDATED: Scroll to bottom function - now targets the messages container
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const addUserMessageToChat = (userMessage) => {
        const userChatEntry = {
            id: Date.now(),
            message_type: 'user',
            message: userMessage,
            created_at: new Date().toISOString()
        };
        
        const normalized = normalizeMessage(userChatEntry, 'ai');
        setUnifiedChatHistory(prev => [...prev, normalized]);
        setTimeout(scrollToBottom, 100);
    };

    const addAIResponseToChat = (aiResponse) => {
        const aiChatEntry = {
            id: Date.now(),
            message_type: 'ai',
            message: aiResponse,
            created_at: new Date().toISOString()
        };
        
        const normalized = normalizeMessage(aiChatEntry, 'ai');
        setUnifiedChatHistory(prev => [...prev, normalized]);
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
            setUnifiedChatHistory(prev => prev.slice(0, -1));
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
        
        if (chatbotState === 'live-agent') {
            setTimeout(() => sendLiveChatMessage(), 100);
        } else {
            setTimeout(() => handleSubmitChatToGeminiAI(), 100);
        }
    };

    useEffect(() => {
        if (chatHistory.length > 0 && chatbotState === 'seraphim-ai') {
            if (liveChatRoom) {
                loadLiveChatMessages(liveChatRoom.id);
            } else {
                const normalized = chatHistory.map(msg => normalizeMessage(msg, 'ai'));
                setUnifiedChatHistory(normalized);
            }
        }
    }, [chatHistory]);

    useEffect(() => {
        if (isOpen && user) {
            fetchChatHistory();
            fetchPredefinedQuestions();
            
            if (isCustomer) {
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
                        const room = data.data;
                        setLiveChatRoom(room);
                        
                        if (room.status === 'concluded') {
                            setAgentStatus('waiting');
                        } else if (room.agent_id) {
                            setAgentStatus('connected');
                        } else {
                            setAgentStatus('waiting');
                        }
                        
                        fetch(`/api/live-chat/room/${room.id}/messages?user_id=${user.id}`)
                            .then(res => res.json())
                            .then(result => {
                                const merged = mergeAndSortMessages(chatHistory, result.data || []);
                                setUnifiedChatHistory(merged);
                            });
                    }
                })
                .catch(err => {
                    console.log('[GeminiChatbot] No active live chat session found');
                });
            }
        }
    }, [isOpen, user]);

    // UPDATED: Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [unifiedChatHistory]);

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

                const normalized = normalizeMessage(data.data, 'live-agent');

                setUnifiedChatHistory(prev => {
                    const exists = prev.some(msg => msg.id === normalized.id);
                    if (exists) {
                        console.log('⚠️ Message already exists, skipping');
                        return prev;
                    }
                    console.log('✅ Adding message to unified history');
                    return [...prev, normalized];
                });
                setTimeout(scrollToBottom, 100);

            } else if (data.type === 'agent_joined') {
                console.log('Agent joined event received:', data);
                setAgentStatus('connected');
                setAgentName(data.agent_name);
                setLiveChatRoom(prev => {
                    if (!prev) return prev;
                    return { ...prev, agent_id: data.agent_id, agent_name: data.agent_name, status: 'active' };
                });
                showToast(`${data.agent_name} has joined the chat`, 'success');

                if (data.message) {
                    const normalized = normalizeMessage(data.message, 'live-agent');
                    setUnifiedChatHistory(prev => {
                        const exists = prev.some(msg => msg.id === normalized.id);
                        if (exists) return prev;
                        return [...prev, normalized];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            } else if (data.type === 'agent_concluded') {
                console.log('Agent concluded chat, room returned to waiting');
                setAgentStatus('disconnected');
                setAgentName('');
                setLiveChatRoom(prev => {
                    if (!prev) return prev;
                    return { ...prev, agent_id: null, status: 'waiting' };
                });
                showToast('Agent has concluded the session. Waiting for another agent...', 'info');

                if (data.message) {
                    const normalized = normalizeMessage(data.message, 'live-agent');
                    setUnifiedChatHistory(prev => {
                        const exists = prev.some(msg => msg.id === normalized.id);
                        if (exists) return prev;
                        return [...prev, normalized];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            } else if (data.type === 'customer_disconnected') {
                console.log('Customer disconnected event received');
                if (data.message) {
                    const normalized = normalizeMessage(data.message, 'live-agent');
                    setUnifiedChatHistory(prev => {
                        const exists = prev.some(msg => msg.id === normalized.id);
                        if (exists) return prev;
                        return [...prev, normalized];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            }
        });

        return () => {
            console.log('[GeminiChatbot] Unsubscribing from SSE livechat events');
            unsubscribe();
        };
    }, [user?.id, isCustomer]);

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

    const hasMessages = unifiedChatHistory.length > 0;

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
                        <div className={ styles['chat-body-upper'] }>
                            <>
                                {
                                    hasMessages ? (
                                        <div className={ styles['messages'] } ref={ messagesContainerRef }>
                                                {unifiedChatHistory.map((chat) => {
                                                    const isSystemMessage = chat.sender_type === 'system';
                                                
                                                    if (isSystemMessage) {
                                                        return (
                                                            <div 
                                                                key={chat.id} 
                                                                className={styles['system-message']}
                                                            >
                                                                {chat.message}
                                                            </div>
                                                        );
                                                    }
                                                
                                                    let senderLabel = chat.senderLabel;
                                                
                                                    if (chat.source === 'seraphim-ai') {
                                                        senderLabel = chat.role === 'user' ? (user?.name || 'You') : 'Seraphim Luxe AI';
                                                    } else if (chat.source === 'live-agent') {
                                                        if (chat.role === 'user') {
                                                            senderLabel = 'You (Customer)';
                                                        } else if (chat.role === 'agent') {
                                                            senderLabel = `${chat.senderName} (Agent)` || `${agentName} (Agent)` || 'Agent';
                                                        }
                                                    }
                                                
                                                    return (
                                                        <p 
                                                            key={chat.id} 
                                                            className={styles['message']} 
                                                            data-role={chat.role}
                                                            data-source={chat.source}
                                                        >
                                                            <span className={styles['message-label']}>
                                                                {senderLabel}
                                                            </span>
                                                            {chat.source === 'seraphim-ai' && chat.role === 'agent' ? (
                                                                <span dangerouslySetInnerHTML={{ __html: chat.message }} />
                                                            ) : (
                                                                chat.message
                                                            )}
                                                        </p>
                                                    );
                                                })}
                                            {
                                                (isLoading || isTyping) && chatbotState === 'seraphim-ai' && (
                                                    <p className={ styles['message'] } data-role="agent" data-source="seraphim-ai">
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
                                {isCustomer && (
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
                                                                disabled={ chatbotState === 'live-agent' && (!liveChatRoom || agentStatus === 'waiting') }
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
                                        <Button
                                            type='primary'
                                            icon={chatbotState === 'seraphim-ai' ? 'fa solid fa-headset' : 'fa solid fa-robot'}
                                            label={chatbotState === 'seraphim-ai' ? (liveChatRoom ? 'Return to Live Agent' : 'Switch to Live Agent') : 'Switch to Seraphim AI'}
                                            iconPosition='left'
                                            action={switchChatbotState}
                                            disabled={isSwitching} // Add this
                                            externalStyles={styles['chat-options-switch_btn']}
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
