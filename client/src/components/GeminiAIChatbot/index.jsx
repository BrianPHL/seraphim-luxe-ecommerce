import { useState, useEffect, useRef } from 'react';
import { Button, InputField } from '@components';
import { useAuth, useToast, useGeminiAI } from '@contexts';
import styles from './GeminiAIChatbot.module.css';

const GeminiAIChatbot = () => {

    const [ isOpen, setIsOpen ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ localChatHistory, setLocalChatHistory ] = useState([]);
    const [ isTyping, setIsTyping ] = useState(false);
    const [ chatbotState, setChatbotState ] = useState('seraphim-ai'); // 'seraphim-ai' or 'live-agent'
    const [ liveChatRoom, setLiveChatRoom ] = useState(null);
    const [ liveChatMessages, setLiveChatMessages ] = useState([]);
    const [ agentStatus, setAgentStatus ] = useState('waiting'); // 'waiting', 'connected', 'disconnected'

    const chatBodyRef = useRef(null);
    const eventSourceRef = useRef(null);
    const { user, setIsPopupOpen } = useAuth();
    const { showToast } = useToast();
    const { isLoading, chatHistory, fetchPredefinedQuestions, predefinedQuestions, fetchChatHistory, sendGeminiAICustomerChat, sendGeminiAIAdminChat } = useGeminiAI();

    const requireAuth = (action) => {
        
        if (!user) {
            setIsPopupOpen(true);
            return;
        }

        action();

    };

    const switchChatbotState = async () => {

        const newState = chatbotState === 'seraphim-ai' ? 'live-agent' : 'seraphim-ai';
        setChatbotState(newState);

        if (newState === 'live-agent') {
            // Initialize live chat
            await initializeLiveChat();
        } else {
            // Close live chat if active
            if (liveChatRoom) {
                await closeLiveChat();
            }
            // Reload Seraphim AI history
            fetchChatHistory();
            fetchPredefinedQuestions();
        }

    };

    const initializeLiveChat = async () => {
        try {
            // Check if there's an existing active room
            const existingRoomResponse = await fetch(`/api/live-chat/room/active/${user.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (existingRoomResponse.ok) {
                const existingRoomData = await existingRoomResponse.json();
                setLiveChatRoom(existingRoomData.data);
                await loadLiveChatMessages(existingRoomData.data.id);
                setAgentStatus(existingRoomData.data.agent_id ? 'connected' : 'waiting');
                setupSSEConnection();
                return;
            }

            // Create new room
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
            setLiveChatRoom(result.data);
            setAgentStatus('waiting');
            
            // Load initial messages
            await loadLiveChatMessages(result.data.id);
            
            // Setup SSE for real-time updates
            setupSSEConnection();

            showToast('Connecting you with an agent...', 'info');

        } catch (err) {
            console.error('Live chat initialization error:', err);
            showToast('Failed to connect to live chat. Please try again.', 'error');
            setChatbotState('seraphim-ai');
        }
    };

    const setupSSEConnection = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/sse/${user.id}`);
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_message') {
                // Add new message to chat
                setLiveChatMessages(prev => [...prev, data.data]);
                setTimeout(scrollToBottom, 100);
            } else if (data.type === 'agent_joined') {
                setAgentStatus('connected');
                showToast(`${data.agent_name} has joined the chat`, 'success');
            } else if (data.type === 'chat_closed') {
                setAgentStatus('disconnected');
                showToast('Chat has been closed', 'info');
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            eventSource.close();
        };

        eventSourceRef.current = eventSource;
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
            console.error('Load live chat messages error:', err);
            showToast('Failed to load chat history', 'error');
        }
    };

    const sendLiveChatMessage = async () => {
        if (!liveChatRoom || !message.trim()) return;

        try {
            const userMessage = message.trim();
            setMessage('');

            // Optimistically add message to UI
            const tempMessage = {
                id: Date.now(),
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
            
            // Replace temp message with actual message from server
            setLiveChatMessages(prev => 
                prev.map(msg => msg.id === tempMessage.id ? result.data : msg)
            );

        } catch (err) {
            console.error('Send live chat message error:', err);
            showToast('Failed to send message. Please try again.', 'error');
            
            // Remove failed message
            setLiveChatMessages(prev => 
                prev.filter(msg => msg.id !== tempMessage.id)
            );
        }
    };

    const closeLiveChat = async () => {
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

            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

        } catch (err) {
            console.error('Close live chat error:', err);
        }
    };

    const handleWrapperClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
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
        if (chatbotState === 'live-agent') {
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

            const result = user.role === 'customer'
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

            console.error('GeminiAIChatbot component handleSubmitChatToGeminiAI function error: ', err);
            showToast('An error occured when processing your Chatbot request. Please try again later.', 'error');

            setIsTyping(false);
            setLocalChatHistory(prev => prev.slice(0, -1));

        }

    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
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
        scrollToBottom();
    }, [localChatHistory, liveChatMessages, isTyping]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, message, isLoading, isTyping, chatbotState]);

    useEffect(() => {
        // Cleanup SSE connection when component unmounts
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const currentMessages = chatbotState === 'seraphim-ai' ? localChatHistory : liveChatMessages;
    const hasMessages = currentMessages.length > 0;

    return (
        <>
            <div className={ styles['wrapper'] } data-open={ isOpen } onClick={ handleWrapperClick }>
                <div className={ styles['chat'] }>
                    <div className={ styles['chat-header'] }>
                        <h3>
                            {chatbotState === 'seraphim-ai' ? 'Seraphim Luxe AI' : 'Live Agent Chat'}
                            {chatbotState === 'live-agent' && (
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
                            action={ () => setIsOpen(false) }
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
                                                    : chat.sender_type === 'customer' && chat.sender_id === user.id;
                                                
                                                return (
                                                    <p key={ chat.id } className={ styles['message'] } data-role={ isUser ? 'user' : 'ai' }>
                                                        <span className={ styles['message-label'] }>
                                                            { isUser ? 'You' : 'Agent'}
                                                        </span>
                                                        { chat.message }
                                                    </p>
                                                );
                                            })}
                                            {
                                                (isLoading || isTyping) && chatbotState === 'seraphim-ai' && (
                                                    <p className={ styles['message'] } data-role="ai">
                                                        <span className={ styles['message-label'] }>Agent</span>
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
                                                        user && user.role === 'customer'
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
                                        <Button
                                            type='primary'
                                            icon='fa solid fa-headset' 
                                            label='Switch to Live Agent'
                                            iconPosition='left'
                                            action={ () => switchChatbotState() }
                                            externalStyles={ styles['chat-options-switch_btn'] }
                                        />
                                    </div>
                                )}
                                {chatbotState === 'live-agent' && (
                                    <div className={ styles['chat-options'] }>
                                        <Button
                                            type='primary'
                                            icon='fa solid fa-robot' 
                                            label='Switch to Seraphim AI'
                                            iconPosition='left'
                                            action={ () => switchChatbotState() }
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
                                hint={ chatbotState === 'seraphim-ai' ? 'Ask our personalized Seraphim Luxe AI...' : 'Message the live agent...' }
                                type='text'
                                isSubmittable={ false }
                            />
                            <Button
                                type='icon-outlined'
                                icon='fa-solid fa-paper-plane'
                                disabled={ !message || isLoading || isTyping || (chatbotState === 'live-agent' && agentStatus !== 'connected') }
                                action={ handleSubmitChat }
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Button
                type='secondary'
                label='Ask our AI'
                iconPosition='left'
                icon='fa-solid fa-headset'
                action={ () => requireAuth(() => setIsOpen(true)) }
                externalStyles={ styles['button'] }
            />
        </>
    );
};

export default GeminiAIChatbot;
